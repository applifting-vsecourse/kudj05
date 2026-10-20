import { ApiProperty } from '@nestjs/swagger';

export class StatsResponseDto {
  @ApiProperty({ example: 6 })
  users!: number;

  @ApiProperty({ example: 42 })
  quacks!: number;

  @ApiProperty({ example: 5, description: 'Quacks that have a poll' })
  polls!: number;

  @ApiProperty({ example: 17 })
  votes!: number;
}
