import { Stats } from '@/modules/stats/domain/stats';
import { StatsRepository } from '@/modules/stats/repositories/stats.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsService {
  constructor(private readonly statsRepository: StatsRepository) {}

  async getStats(): Promise<Stats> {
    return this.statsRepository.getStats();
  }
}
