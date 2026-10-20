import { PrismaService } from '@/core/prisma/prisma.service';
import { Stats } from '@/modules/stats/domain/stats';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<Stats> {
    const [users, quacks, polls, votes] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.quack.count(),
      // A quack is a poll when it has options; there is no poll table of its own.
      this.prisma.quack.count({ where: { pollOptions: { some: {} } } }),
      this.prisma.pollVote.count(),
    ]);
    return { users, quacks, polls, votes };
  }
}
