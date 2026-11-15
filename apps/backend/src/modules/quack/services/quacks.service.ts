import { Mood, Poll, Quack, QuackRef } from '@/modules/quack/domain/quack';
import {
  QuackPage,
  QuackRepository,
} from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { hasRole, MODERATION_ROLES } from '@/shared/auth/domain/roles';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class QuacksService {
  constructor(private readonly quackRepository: QuackRepository) {}

  async getQuacks(
    user: Identity,
    options?: {
      search?: string;
      mine?: boolean;
      offset?: number;
      limit?: number;
    },
  ): Promise<QuackPage> {
    // the viewer decides which vote counts as "mine" in each poll
    return this.quackRepository.getQuacks(user.id, options);
  }

  async createQuack(
    user: Identity,
    quackData: { text: string; mood?: Mood; pollOptions?: string[] },
  ): Promise<Quack> {
    return this.quackRepository.createQuack({
      text: quackData.text,
      mood: quackData.mood,
      pollOptions: quackData.pollOptions,
      // the author is taken from the session, never from the request body
      userId: user.id,
    });
  }

  /** Live replies to a quack, oldest first. A deleted quack still shows the replies under it. */
  async getReplies(user: Identity, quackId: string): Promise<Quack[]> {
    const parent = await this.quackRepository.getQuackRef(quackId);
    if (!parent) throw new NotFoundException('Quack not found');
    return this.quackRepository.getReplies(quackId, user.id);
  }

  /** Replies to a quack in the feed. Replies are one level deep: a reply can't be replied to. */
  async createReply(
    user: Identity,
    quackId: string,
    replyData: { text: string },
  ): Promise<Quack> {
    const parent = await this.getLiveQuackOrThrow(quackId);
    if (parent.parentId !== null) {
      throw new BadRequestException(
        'You can only reply to a quack, not to a reply',
      );
    }
    return this.quackRepository.createQuack({
      text: replyData.text,
      parentId: quackId,
      // the author is taken from the session, never from the request body
      userId: user.id,
    });
  }

  /**
   * Deletes a quack: its text, mood, poll and votes are wiped, the row stays so
   * replies keep their parent (docs/adr/0001). Its author may, and so may an admin or a moderator.
   */
  async deleteQuack(user: Identity, quackId: string): Promise<void> {
    const { userId: authorId } = await this.getLiveQuackOrThrow(quackId);

    const isOwner = authorId === user.id;
    const isModerator = hasRole(user, MODERATION_ROLES);
    if (!isOwner && !isModerator) {
      throw new ForbiddenException('You can only delete your own quacks');
    }

    if (isModerator) {
      await this.quackRepository.deleteAnyQuack(quackId);
    } else {
      // The author is part of the delete itself, so the check above can't be raced past.
      await this.quackRepository.deleteQuack(quackId, user.id);
    }
  }

  /** Casts the user's vote in a poll, or moves it when they have already voted. */
  async vote(user: Identity, quackId: string, optionId: string): Promise<Poll> {
    const poll = await this.getPollOrThrow(user, quackId);
    if (!poll.options.some((option) => option.id === optionId)) {
      throw new BadRequestException('That option is not part of this poll');
    }
    await this.quackRepository.saveVote({
      quackId,
      // the voter is taken from the session, never from the request body
      userId: user.id,
      optionId,
    });
    // read again so the caller gets the counts as they are now, other people's votes included
    return this.getPollOrThrow(user, quackId);
  }

  async removeVote(user: Identity, quackId: string): Promise<Poll> {
    await this.getPollOrThrow(user, quackId);
    await this.quackRepository.deleteVote(quackId, user.id);
    return this.getPollOrThrow(user, quackId);
  }

  /** A deleted quack counts as gone: deleting it again or replying to it is 404. */
  private async getLiveQuackOrThrow(quackId: string): Promise<QuackRef> {
    const quack = await this.quackRepository.getQuackRef(quackId);
    if (!quack || quack.deletedAt)
      throw new NotFoundException('Quack not found');
    return quack;
  }

  private async getPollOrThrow(user: Identity, quackId: string): Promise<Poll> {
    const poll = await this.quackRepository.getPoll(quackId, user.id);
    if (!poll) throw new NotFoundException('Poll not found');
    return poll;
  }
}
