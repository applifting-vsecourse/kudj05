import { QuacksService } from '@/modules/quack/services/quacks.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateQuackDto } from './dto/create-quack.dto';
import { ListQuacksDto } from './dto/list-quacks.dto';
import { QuackPageResponseDto } from './dto/quack.page.response.dto';
import { PollResponseDto, QuackResponseDto } from './dto/quack.response.dto';
import { VoteDto } from './dto/vote.dto';

@ApiTags('quacks')
@Controller('quacks')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class QuacksController {
  constructor(private readonly quacksService: QuacksService) {}

  @Get()
  @ApiOperation({ summary: 'List and search quacks' })
  @ApiResponse({ status: 200, type: QuackPageResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async list(
    @User() user: Identity,
    @Query() query: ListQuacksDto,
  ): Promise<QuackPageResponseDto> {
    const quacks = await this.quacksService.getQuacks(user, {
      search: query.search,
      mine: query.mine,
      offset: query.offset,
      limit: query.limit,
    });
    return {
      items: quacks.items.map(QuackResponseDto.fromDomain),
      nextOffset: quacks.nextOffset,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a quack' })
  @ApiResponse({ status: 201, type: QuackResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async create(
    @User() user: Identity,
    @Body() body: CreateQuackDto,
  ): Promise<QuackResponseDto> {
    const quack = await this.quacksService.createQuack(user, {
      text: body.text,
      mood: body.mood,
      pollOptions: body.poll?.options,
    });
    return QuackResponseDto.fromDomain(quack);
  }

  @Delete(':quackId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a quack',
    description:
      'Authors delete their own quacks; admins and moderators may delete any quack.',
  })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({
    status: 403,
    description: 'Quack belongs to someone else and you are not a moderator',
  })
  @ApiResponse({ status: 404, description: 'Quack not found' })
  async remove(
    @User() user: Identity,
    @Param('quackId') quackId: string,
  ): Promise<void> {
    await this.quacksService.deleteQuack(user, quackId);
  }

  // PUT, not POST: "my vote in this poll is X" can be repeated safely, and the
  // first vote and a changed vote are the same call.
  @Put(':quackId/vote')
  @ApiOperation({ summary: 'Vote in a poll, or move your vote' })
  @ApiResponse({ status: 200, type: PollResponseDto })
  @ApiResponse({ status: 400, description: 'Option is not part of the poll' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Quack has no poll' })
  async vote(
    @User() user: Identity,
    @Param('quackId') quackId: string,
    @Body() body: VoteDto,
  ): Promise<PollResponseDto> {
    const poll = await this.quacksService.vote(user, quackId, body.optionId);
    return PollResponseDto.fromDomain(poll);
  }

  @Delete(':quackId/vote')
  @ApiOperation({ summary: 'Take your vote back' })
  @ApiResponse({ status: 200, type: PollResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Quack has no poll' })
  async removeVote(
    @User() user: Identity,
    @Param('quackId') quackId: string,
  ): Promise<PollResponseDto> {
    const poll = await this.quacksService.removeVote(user, quackId);
    return PollResponseDto.fromDomain(poll);
  }
}
