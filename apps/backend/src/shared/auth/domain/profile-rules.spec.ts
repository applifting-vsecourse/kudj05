import { findProfileRuleViolation } from './profile-rules';

describe('findProfileRuleViolation', () => {
  it('accepts an update that touches none of the checked fields', () => {
    expect(findProfileRuleViolation({})).toBeNull();
  });

  it('accepts a complete valid profile', () => {
    expect(
      findProfileRuleViolation({
        name: 'Caffeinated Duck',
        bio: 'x'.repeat(160),
        defaultMood: 'silly',
      }),
    ).toBeNull();
  });

  it('accepts clearing the bio and the default mood', () => {
    expect(
      findProfileRuleViolation({ bio: null, defaultMood: null }),
    ).toBeNull();
  });

  it.each(['', '   ', 42, null])('rejects the display name %p', (name) => {
    expect(findProfileRuleViolation({ name })?.code).toBe('INVALID_NAME');
  });

  it('rejects a bio over 160 characters', () => {
    expect(findProfileRuleViolation({ bio: 'x'.repeat(161) })?.code).toBe(
      'INVALID_BIO',
    );
  });

  it.each(['grumpy', '', 7])('rejects the default mood %p', (defaultMood) => {
    expect(findProfileRuleViolation({ defaultMood })?.code).toBe(
      'INVALID_DEFAULT_MOOD',
    );
  });
});
