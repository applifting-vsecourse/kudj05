import { Mood, MOODS, Poll, Quack } from '@/modules/quack/domain/quack';
import { ApiProperty } from '@nestjs/swagger';

class QuackUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;
}

class PollOptionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty({ description: 'Number of people who picked this option' })
  voteCount!: number;
}

export class PollResponseDto {
  @ApiProperty({ type: [PollOptionDto] })
  options!: PollOptionDto[];

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'The option the signed-in user picked, null if they have not voted',
  })
  myOptionId!: string | null;

  static fromDomain(poll: Poll): PollResponseDto {
    return {
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        voteCount: option.voteCount,
      })),
      myOptionId: poll.myOptionId,
    };
  }
}

export class QuackResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Empty for a deleted quack' })
  text!: string;

  @ApiProperty({ enum: MOODS, nullable: true })
  mood!: Mood | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'null for a deleted quack',
  })
  userId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({
    type: PollResponseDto,
    nullable: true,
    description: 'null for a quack without a poll',
  })
  poll!: PollResponseDto | null;

  @ApiProperty({
    type: QuackUserDto,
    nullable: true,
    description:
      'null for a deleted quack: who wrote it is gone with the content',
  })
  user!: QuackUserDto | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The quack this one replies to; null for a quack in the feed',
  })
  parentId!: string | null;

  @ApiProperty({
    description:
      'A deleted quack stays only to hold its replies; its text, author, mood and poll are gone',
  })
  isDeleted!: boolean;

  @ApiProperty({ description: 'Number of replies that are not deleted' })
  replyCount!: number;

  static fromDomain(quack: Quack): QuackResponseDto {
    if (quack.deletedAt) {
      // Built from scratch rather than by blanking fields, so nothing the author
      // wrote can slip through when a field is added later.
      return {
        id: quack.id,
        text: '',
        mood: null,
        userId: null,
        createdAt: quack.createdAt,
        poll: null,
        user: null,
        parentId: quack.parentId,
        isDeleted: true,
        replyCount: quack.replyCount,
      };
    }
    if (!quack.user) {
      throw new Error(
        `QuackResponseDto.fromDomain expected quack.user to be loaded for quack ${quack.id}`,
      );
    }
    return {
      id: quack.id,
      text: quack.text,
      mood: quack.mood,
      userId: quack.userId,
      createdAt: quack.createdAt,
      poll: quack.poll ? PollResponseDto.fromDomain(quack.poll) : null,
      user: {
        id: quack.user.id,
        name: quack.user.name,
        username: quack.user.username,
      },
      parentId: quack.parentId,
      isDeleted: false,
      replyCount: quack.replyCount,
    };
  }
}
