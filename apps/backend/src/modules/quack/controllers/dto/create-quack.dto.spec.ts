import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQuackDto } from './create-quack.dto';

// Same options as the ValidationPipe on the controller.
const check = async (
  body: unknown,
): Promise<{ dto: CreateQuackDto; isValid: boolean }> => {
  const dto = plainToInstance(CreateQuackDto, body);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, isValid: errors.length === 0 };
};

const aPoll = (options: unknown): unknown => ({
  text: 'Where do we go for lunch?',
  poll: { options },
});

describe('CreateQuackDto', () => {
  it('accepts a quack without a poll', async () => {
    const { isValid } = await check({ text: 'quack' });
    expect(isValid).toBe(true);
  });

  it('accepts two to four options and trims them', async () => {
    const { dto, isValid } = await check(aPoll([' Pizza ', 'Sushi']));
    expect(isValid).toBe(true);
    expect(dto.poll?.options).toEqual(['Pizza', 'Sushi']);

    expect((await check(aPoll(['a', 'b', 'c', 'd']))).isValid).toBe(true);
  });

  it.each([
    ['one option', ['Pizza']],
    ['five options', ['a', 'b', 'c', 'd', 'e']],
    ['an empty option', ['Pizza', '']],
    ['an option of only spaces', ['Pizza', '   ']],
    ['an option over 80 characters', ['Pizza', 'x'.repeat(81)]],
    ['the same option twice', ['Pizza', 'Pizza']],
    ['options that differ only in case and spaces', ['Pizza', ' pizza ']],
    ['an option that is not text', ['Pizza', 7]],
    ['options that are not a list', 'Pizza'],
  ])('rejects %s', async (_label, options) => {
    const { isValid } = await check(aPoll(options));
    expect(isValid).toBe(false);
  });

  it('accepts an option of exactly 80 characters', async () => {
    const { isValid } = await check(aPoll(['Pizza', 'x'.repeat(80)]));
    expect(isValid).toBe(true);
  });

  it('rejects a poll with no options field and unknown poll fields', async () => {
    expect((await check({ text: 'q', poll: {} })).isValid).toBe(false);
    expect(
      (await check({ text: 'q', poll: { options: ['a', 'b'], closed: true } }))
        .isValid,
    ).toBe(false);
  });
});
