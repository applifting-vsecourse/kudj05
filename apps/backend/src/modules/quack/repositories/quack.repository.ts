import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { Mood, Poll, Quack } from '@/modules/quack/domain/quack';
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

// Everything a quack needs to be shown to one viewer: its author, its poll
// options with their vote counts, and that viewer's own vote.
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
      offset?: number;
      limit?: number;
    } = {},
  ): Promise<QuackPage> {
    const offset = options.offset ?? 0;
    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    const search = options.search?.trim();
    const quacks = await this.prisma.quack.findMany({
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

  async createQuack(createQuackData: {
    text: string;
    mood?: Mood;
    userId: string;
  }): Promise<Quack> {
    const quack = await this.prisma.quack.create({
      data: {
        text: createQuackData.text,
        mood: createQuackData.mood,
        user: { connect: { id: createQuackData.userId } },
      },
      include: quackInclude(createQuackData.userId),
    });
    return mapPrismaQuackToDomain(quack);
  }
}
