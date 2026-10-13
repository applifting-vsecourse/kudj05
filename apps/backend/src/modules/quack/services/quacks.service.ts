import { Mood, Quack } from '@/modules/quack/domain/quack';
import {
  QuackPage,
  QuackRepository,
} from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable } from '@nestjs/common';

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
}
