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
});
