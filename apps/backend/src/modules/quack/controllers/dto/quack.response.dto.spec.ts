import { Quack } from '@/modules/quack/domain/quack';
import { QuackResponseDto } from './quack.response.dto';

const aQuack = (overrides: Partial<Quack> = {}): Quack => ({
  id: 'q1',
  text: 'Where do we go for lunch?',
  mood: null,
  userId: 'u1',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  poll: null,
  parentId: null,
  deletedAt: null,
  replyCount: 0,
  user: { id: 'u1', name: 'Caffeinated Duck', username: 'caffeinatedduck' },
  ...overrides,
});

describe('QuackResponseDto', () => {
  it('sends null for a quack without a poll', () => {
    expect(QuackResponseDto.fromDomain(aQuack()).poll).toBeNull();
  });

  it('sends the options in order with their counts and the viewer’s vote', () => {
    const quack = aQuack({
      poll: {
        options: [
          { id: 'o1', text: 'Pizza', voteCount: 2 },
          { id: 'o2', text: 'Sushi', voteCount: 0 },
        ],
        myOptionId: 'o2',
      },
    });

    expect(QuackResponseDto.fromDomain(quack).poll).toEqual({
      options: [
        { id: 'o1', text: 'Pizza', voteCount: 2 },
        { id: 'o2', text: 'Sushi', voteCount: 0 },
      ],
      myOptionId: 'o2',
    });
  });

  it('sends nothing the author wrote for a deleted quack, not even who they are', () => {
    const quack = aQuack({
      // what a tombstone row looks like: the text is already wiped in the database
      text: '',
      deletedAt: new Date('2026-01-02T12:00:00Z'),
      mood: null,
      replyCount: 2,
    });

    expect(QuackResponseDto.fromDomain(quack)).toEqual({
      id: 'q1',
      text: '',
      mood: null,
      userId: null,
      createdAt: quack.createdAt,
      poll: null,
      user: null,
      parentId: null,
      isDeleted: true,
      replyCount: 2,
    });
  });

  it('sends the reply count and parent of a live quack', () => {
    const dto = QuackResponseDto.fromDomain(
      aQuack({ parentId: 'q0', replyCount: 0 }),
    );
    expect(dto).toMatchObject({
      parentId: 'q0',
      isDeleted: false,
      replyCount: 0,
    });
  });
});
