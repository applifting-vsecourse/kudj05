import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { Mood, Poll, Quack, QuackRef } from '@/modules/quack/domain/quack';
import { Injectable } from '@nestjs/common';

const DEFAULT_PAGE_SIZE = 20;

const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

export type QuackPage = {
  items: Quack[];
  nextOffset: number | null;
};

// Tombstones are kept only for their replies, so most reads skip them (docs/adr/0001).
const notDeleted = { deletedAt: null } satisfies Prisma.QuackWhereInput;

// Everything a quack needs to be shown to one viewer: its author, its poll
// options with their vote counts, that viewer's own vote, and how many live
// replies it has.
// The return type is left inferred on purpose: PrismaQuackWithRelations is derived from it.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const quackInclude = (viewerId: string) =>
  ({
    user: true,
    pollOptions: {
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { votes: true } },
        votes: { where: { userId: viewerId }, select: { userId: true } },
      },
    },
    _count: { select: { replies: { where: notDeleted } } },
  }) satisfies Prisma.QuackInclude;

type PrismaQuackWithRelations = Prisma.QuackGetPayload<{
  include: ReturnType<typeof quackInclude>;
}>;

const mapPollOptionsToDomain = (
  options: PrismaQuackWithRelations['pollOptions'],
): Poll | null => {
  if (options.length === 0) return null;
  return {
    options: options.map((option) => ({
      id: option.id,
      text: option.text,
      voteCount: option._count.votes,
    })),
    // `votes` is already narrowed to the viewer, so at most one option has a row.
    myOptionId: options.find((option) => option.votes.length > 0)?.id ?? null,
  };
};

const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002';

const mapPrismaQuackToDomain = (quack: PrismaQuackWithRelations): Quack => ({
  id: quack.id,
  text: quack.text,
  mood: quack.mood,
  userId: quack.userId,
  createdAt: quack.createdAt,
  updatedAt: quack.updatedAt,
  poll: mapPollOptionsToDomain(quack.pollOptions),
  user: {
    id: quack.user.id,
    name: quack.user.name,
    username: quack.user.username ?? '',
  },
  parentId: quack.parentId,
  deletedAt: quack.deletedAt,
  replyCount: quack._count.replies,
});

/**
 * If you decide to choose a different ORM or database, you should only need to change the repository files methods implementation.
 * Inject what you need instead of PrismaService and re-implement the methods and model mapping.
 */
@Injectable()
export class QuackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getQuacks(
    viewerId: string,
    options: {
      search?: string;
      // Only the viewer's own quacks.
      mine?: boolean;
      offset?: number;
      limit?: number;
    } = {},
  ): Promise<QuackPage> {
    const offset = options.offset ?? 0;
    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    const search = options.search?.trim();
    // Replies live in their thread, not in the feed. A tombstone stays in the
    // feed only while someone's reply hangs under it; Mine and search never show one,
    // because the author's name would match a search for a quack whose text is gone.
    const where: Prisma.QuackWhereInput =
      options.mine || search
        ? {
            parentId: null,
            ...notDeleted,
            ...(options.mine ? { userId: viewerId } : {}),
          }
        : {
            parentId: null,
            OR: [notDeleted, { replies: { some: notDeleted } }],
          };
    const quacks = await this.prisma.quack.findMany({
      where,
      include: quackInclude(viewerId),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(search ? {} : { skip: offset, take: limit + 1 }),
    });
    const filteredQuacks = search
      ? quacks.filter((quack) => {
          const normalizedSearch = normalizeSearchText(search);
          return [
            quack.text,
            quack.user.name,
            quack.user.username ?? '',
            quack.user.displayUsername ?? '',
          ].some((value) =>
            normalizeSearchText(value).includes(normalizedSearch),
          );
        })
      : quacks;
    const page = filteredQuacks.slice(offset, offset + limit + 1);
    const hasNextPage = page.length > limit;

    return {
      items: page.slice(0, limit).map(mapPrismaQuackToDomain),
      nextOffset: hasNextPage ? offset + limit : null,
    };
  }

  /** Who wrote the quack, what it replies to and whether it was deleted; null when there is no such row. */
  async getQuackRef(quackId: string): Promise<QuackRef | null> {
    return this.prisma.quack.findUnique({
      where: { id: quackId },
      select: { userId: true, parentId: true, deletedAt: true },
    });
  }

  /** Live replies to a quack, oldest first, as one viewer sees them. */
  async getReplies(parentId: string, viewerId: string): Promise<Quack[]> {
    const replies = await this.prisma.quack.findMany({
      where: { parentId, ...notDeleted },
      include: quackInclude(viewerId),
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return replies.map(mapPrismaQuackToDomain);
  }

  /** Deletes the quack only if the user wrote it. See tombstone(). */
  async deleteQuack(quackId: string, userId: string): Promise<void> {
    await this.tombstone({ id: quackId, userId });
  }

  /** Deletes the quack whoever wrote it — for moderation only. See tombstone(). */
  async deleteAnyQuack(quackId: string): Promise<void> {
    await this.tombstone({ id: quackId });
  }

  /**
   * Deleting keeps the row so replies keep their parent, and wipes everything
   * the author wrote: text, mood, poll options (their votes cascade). Both writes
   * are one transaction, so a quack is never half deleted. See docs/adr/0001.
   */
  private async tombstone(where: {
    id: string;
    userId?: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.quack.updateMany({
        where: { ...where, ...notDeleted },
        data: { text: '', mood: null, deletedAt: new Date() },
      });
      if (count === 0) return;
      await tx.pollOption.deleteMany({ where: { quackId: where.id } });
    });
  }

  /** The poll of a quack as one viewer sees it; null when the quack doesn't exist or has no poll. */
  async getPoll(quackId: string, viewerId: string): Promise<Poll | null> {
    const options = await this.prisma.pollOption.findMany({
      where: { quackId },
      ...quackInclude(viewerId).pollOptions,
    });
    return mapPollOptionsToDomain(options);
  }

  /**
   * Casts the user's vote or moves it to another option. The row is keyed by
   * (quackId, userId), so there is never more than one vote per person per poll.
   */
  async saveVote(vote: {
    quackId: string;
    userId: string;
    optionId: string;
  }): Promise<void> {
    const upsertVote = (): Promise<unknown> =>
      this.prisma.pollVote.upsert({
        where: {
          quackId_userId: { quackId: vote.quackId, userId: vote.userId },
        },
        create: vote,
        update: { optionId: vote.optionId },
      });

    try {
      await upsertVote();
    } catch (error) {
      // Two first votes from the same user at the same moment (double click, two tabs):
      // both try to insert, the database lets one through. The row exists now, so the
      // second attempt updates it.
      if (!isUniqueConstraintError(error)) throw error;
      await upsertVote();
    }
  }

  /** Takes the user's vote back. Does nothing when they haven't voted. */
  async deleteVote(quackId: string, userId: string): Promise<void> {
    await this.prisma.pollVote.deleteMany({ where: { quackId, userId } });
  }

  async createQuack(createQuackData: {
    text: string;
    mood?: Mood;
    // Makes the quack a poll; the array order is the order the options show in.
    pollOptions?: string[];
    // Makes the quack a reply to this one.
    parentId?: string;
    userId: string;
  }): Promise<Quack> {
    const quack = await this.prisma.quack.create({
      data: {
        text: createQuackData.text,
        mood: createQuackData.mood,
        parent: createQuackData.parentId
          ? { connect: { id: createQuackData.parentId } }
          : undefined,
        // Created in the same statement as the quack, so a poll never exists half-written.
        pollOptions: createQuackData.pollOptions
          ? {
              create: createQuackData.pollOptions.map((text, position) => ({
                text,
                position,
              })),
            }
          : undefined,
        user: { connect: { id: createQuackData.userId } },
      },
      include: quackInclude(createQuackData.userId),
    });
    return mapPrismaQuackToDomain(quack);
  }
}
