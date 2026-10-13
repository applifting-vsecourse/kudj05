// Example unit test — the pattern to copy for your own services.
// The repository is mocked, so the test exercises the service in isolation.
import { Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { mock } from 'jest-mock-extended';
import { QuacksService } from './quacks.service';

const aQuack = (overrides: Partial<Quack> = {}): Quack => ({
  id: 'q1',
  text: 'quack quack',
  mood: null,
  userId: 'u1',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  poll: null,
  user: { id: 'u1', name: 'Caffeinated Duck', username: 'CaffeinatedDuck' },
  ...overrides,
});

describe('QuacksService', () => {
  it('returns quacks as seen by the signed-in user', async () => {
    const quacks = [
      aQuack({
        poll: {
          options: [
            { id: 'o1', text: 'Pizza', voteCount: 2 },
            { id: 'o2', text: 'Sushi', voteCount: 0 },
          ],
          myOptionId: 'o1',
        },
      }),
    ];
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue({ items: quacks, nextOffset: null });

    const service = new QuacksService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(service.getQuacks(user, { search: 'lunch' })).resolves.toEqual(
      { items: quacks, nextOffset: null },
    );
    // "my vote" in each poll is resolved for the viewer from the session
    expect(repository.getQuacks).toHaveBeenCalledWith('u1', {
      search: 'lunch',
    });
  });

  it('creates a quack owned by the signed-in user', async () => {
    const created = aQuack({ id: 'q2', text: 'hello' });
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(created);

    const service = new QuacksService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(service.createQuack(user, { text: 'hello' })).resolves.toEqual(
      created,
    );
    // the author comes from the session, not from the caller's payload
    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'hello',
      userId: 'u1',
    });
  });
});
