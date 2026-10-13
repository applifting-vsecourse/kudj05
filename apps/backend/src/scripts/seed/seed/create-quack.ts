import { PrismaService } from '@/core/prisma/prisma.service';
import { Quack } from '@/modules/quack/domain/quack';

type CreateQuackParams = {
  text: string;
  userId: string;
  // Optional so the seed can spread posts over time. Without it every seeded
  // quack shares one timestamp and the feed reads like a single burst.
  createdAt?: Date;
  // Makes the quack a poll; the array order is the order the options show in.
  pollOptions?: string[];
};

export async function createQuack(
  prisma: PrismaService,
  params: CreateQuackParams,
): Promise<Quack> {
  const { text, userId, createdAt, pollOptions } = params;

  return await prisma.quack.create({
    data: {
      text,
      createdAt,
      pollOptions: pollOptions
        ? {
            create: pollOptions.map((optionText, position) => ({
              text: optionText,
              position,
            })),
          }
        : undefined,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}
