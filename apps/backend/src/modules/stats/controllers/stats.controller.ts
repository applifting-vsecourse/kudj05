import { StatsService } from '@/modules/stats/services/stats.service';
import { Roles } from '@/shared/auth/decorators/roles.decorator';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { RolesGuard } from '@/shared/auth/guards/roles.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StatsResponseDto } from './dto/stats.response.dto';

@ApiTags('stats')
@Controller('stats')
// Order matters: who you are (401) is checked before what you may do (403).
@UseGuards(AuthenticatedUserGuard, RolesGuard)
@Roles('admin')
@ApiCookieAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: 'Totals for the admin' })
  @ApiResponse({ status: 200, type: StatsResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 403, description: 'Not an admin' })
  async get(): Promise<StatsResponseDto> {
    return this.statsService.getStats();
  }
}
