import { Mood, Poll, Quack } from '@/modules/quack/domain/quack';
import {
  QuackPage,
  QuackRepository,
} from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
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
      offset?: number;
      limit?: number;
    },
  ): Promise<QuackPage> {
    // the viewer decides which vote counts as "mine" in each poll
    return this.quackRepository.getQuacks(user.id, options);
  }

  async createQuack(
    user: Identity,
    quackData: { text: string; mood?: Mood },
  ): Promise<Quack> {
    return this.quackRepository.createQuack({
      text: quackData.text,
      mood: quackData.mood,
      // the author is taken from the session, never from the request body
      userId: user.id,
    });
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

  private async getPollOrThrow(user: Identity, quackId: string): Promise<Poll> {
    const poll = await this.quackRepository.getPoll(quackId, user.id);
    if (!poll) throw new NotFoundException('Poll not found');
    return poll;
  }
}
