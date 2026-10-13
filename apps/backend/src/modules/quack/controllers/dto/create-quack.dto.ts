import {
  Mood,
  MOODS,
  POLL_MAX_OPTIONS,
  POLL_MIN_OPTIONS,
  POLL_OPTION_MAX_LENGTH,
} from '@/modules/quack/domain/quack';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const trimEach = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map((item: unknown) =>
        typeof item === 'string' ? item.trim() : item,
      )
    : value;

export class CreatePollDto {
  @ApiProperty({
    description:
      'Answers to choose from, in the order they are shown. Compared without case, so "Pizza" and "pizza" count as the same answer.',
    example: ['Pizza', 'Sushi'],
    minItems: POLL_MIN_OPTIONS,
    maxItems: POLL_MAX_OPTIONS,
  })
  // Trimmed first, so the checks below see what will actually be stored.
  @Transform(({ value }) => trimEach(value))
  @IsArray()
  @ArrayMinSize(POLL_MIN_OPTIONS)
  @ArrayMaxSize(POLL_MAX_OPTIONS)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(POLL_OPTION_MAX_LENGTH, { each: true })
  @ArrayUnique((option: unknown) =>
    typeof option === 'string' ? option.toLocaleLowerCase() : option,
  )
  options!: string[];
}

export class CreateQuackDto {
  @ApiProperty({
    description: 'Body of the quack',
    example: 'Hello, world!',
    maxLength: 280,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  text!: string;

  @ApiProperty({
    description: 'Optional mood of the quack',
    enum: MOODS,
    required: false,
  })
  @IsOptional()
  @IsIn(MOODS)
  mood?: Mood;

  @ApiProperty({
    description: 'Turns the quack into a poll; the text is the question',
    type: CreatePollDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto;
}
