import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Quack as PrismaQuack,
  User as PrismaUser,
} from '@/generated/prisma/client';
import { Mood, Quack } from '@/modules/quack/domain/quack';
import { Injectable } from '@nestjs/common';

const DEFAULT_PAGE_SIZE = 20;

const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

export type QuackPage = {
  items: Quack[];
  nextOffset: number | null;
};

const mapPrismaQuackToDomain = (
  quack: PrismaQuack & { user?: PrismaUser },
): Quack => ({
  id: quack.id,
  text: quack.text,
  mood: quack.mood,
  userId: quack.userId,
  createdAt: quack.createdAt,
  updatedAt: quack.updatedAt,
  user: quack.user
    ? {
        id: quack.user.id,
        name: quack.user.name,
        username: quack.user.username ?? '',
      }
    : undefined,
});

/**
 * If you decide to choose a different ORM or database, you should only need to change the repository files methods implementation.
 * Inject what you need instead of PrismaService and re-implement the methods and model mapping.
 */
@Injectable()
export class QuackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getQuacks(
    options: {
      search?: string;
      offset?: number;
      limit?: number;
    } = {},
  ): Promise<QuackPage> {
    const offset = options.offset ?? 0;
    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    const search = options.search?.trim();
    const quacks = await this.prisma.quack.findMany({
      include: { user: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(search ? {} : { skip: offset, take: limit + 1 }),
    });
    const filteredQuacks = search
      ? quacks.filter((quack) => {
          const normalizedSearch = normalizeSearchText(search);
          return [
            quack.text,
            quack.user.name,
            quack.user.username ?? '',
            quack.user.displayUsername ?? '',
          ].some((value) =>
            normalizeSearchText(value).includes(normalizedSearch),
          );
        })
      : quacks;
    const page = filteredQuacks.slice(offset, offset + limit + 1);
    const hasNextPage = page.length > limit;

    return {
      items: page.slice(0, limit).map(mapPrismaQuackToDomain),
      nextOffset: hasNextPage ? offset + limit : null,
    };
  }

  async createQuack(createQuackData: {
    text: string;
    mood?: Mood;
    userId: string;
  }): Promise<Quack> {
    const quack = await this.prisma.quack.create({
      data: {
        text: createQuackData.text,
        mood: createQuackData.mood,
        user: { connect: { id: createQuackData.userId } },
      },
      include: { user: true },
    });
    return mapPrismaQuackToDomain(quack);
  }
}
