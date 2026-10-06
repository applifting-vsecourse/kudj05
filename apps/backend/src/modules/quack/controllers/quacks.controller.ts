import { QuacksService } from '@/modules/quack/services/quacks.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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
import { QuackResponseDto } from './dto/quack.response.dto';

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
  async list(@Query() query: ListQuacksDto): Promise<QuackPageResponseDto> {
    const quacks = await this.quacksService.getQuacks({
      search: query.search,
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
    });
    return QuackResponseDto.fromDomain(quack);
  }
}
