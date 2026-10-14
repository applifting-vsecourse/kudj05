// Example unit test — the pattern to copy for your own services.
// The repository is mocked, so the test exercises the service in isolation.
import { Poll, Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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

  it('creates a poll with the options in the order they were given', async () => {
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(aQuack());

    const service = new QuacksService(repository);
    const user = { id: 'u1' } as Identity;

    await service.createQuack(user, {
      text: 'Lunch?',
      pollOptions: ['Pizza', 'Sushi'],
    });

    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'Lunch?',
      userId: 'u1',
      pollOptions: ['Pizza', 'Sushi'],
    });
  });

  describe('voting', () => {
    const user = { id: 'u1' } as Identity;
    const aPoll = (overrides: Partial<Poll> = {}): Poll => ({
      options: [
        { id: 'o1', text: 'Pizza', voteCount: 0 },
        { id: 'o2', text: 'Sushi', voteCount: 0 },
      ],
      myOptionId: null,
      ...overrides,
    });

    it('saves the vote for the signed-in user and returns the fresh counts', async () => {
      const afterVote = aPoll({
        options: [
          { id: 'o1', text: 'Pizza', voteCount: 0 },
          { id: 'o2', text: 'Sushi', voteCount: 1 },
        ],
        myOptionId: 'o2',
      });
      const repository = mock<QuackRepository>();
      repository.getPoll
        .mockResolvedValueOnce(aPoll())
        .mockResolvedValueOnce(afterVote);

      const service = new QuacksService(repository);

      await expect(service.vote(user, 'q1', 'o2')).resolves.toEqual(afterVote);
      expect(repository.saveVote).toHaveBeenCalledWith({
        quackId: 'q1',
        userId: 'u1',
        optionId: 'o2',
      });
    });

    it('rejects an option that belongs to another poll', async () => {
      const repository = mock<QuackRepository>();
      repository.getPoll.mockResolvedValue(aPoll());

      const service = new QuacksService(repository);

      await expect(service.vote(user, 'q1', 'other')).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.saveVote).not.toHaveBeenCalled();
    });

    it('rejects a vote on a quack without a poll', async () => {
      const repository = mock<QuackRepository>();
      repository.getPoll.mockResolvedValue(null);

      const service = new QuacksService(repository);

      await expect(service.vote(user, 'q1', 'o1')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.saveVote).not.toHaveBeenCalled();
    });

    it('takes the vote of the signed-in user back', async () => {
      const repository = mock<QuackRepository>();
      repository.getPoll
        .mockResolvedValueOnce(aPoll({ myOptionId: 'o1' }))
        .mockResolvedValueOnce(aPoll());

      const service = new QuacksService(repository);

      await expect(service.removeVote(user, 'q1')).resolves.toEqual(aPoll());
      expect(repository.deleteVote).toHaveBeenCalledWith('q1', 'u1');
    });

    it('rejects taking a vote back on a quack without a poll', async () => {
      const repository = mock<QuackRepository>();
      repository.getPoll.mockResolvedValue(null);

      const service = new QuacksService(repository);

      await expect(service.removeVote(user, 'q1')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.deleteVote).not.toHaveBeenCalled();
    });
  });
});
