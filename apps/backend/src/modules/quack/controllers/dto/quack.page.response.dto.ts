import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuackResponseDto } from './quack.response.dto';

export class QuackPageResponseDto {
  @ApiProperty({ type: [QuackResponseDto] })
  items!: QuackResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  nextOffset!: number | null;
}
