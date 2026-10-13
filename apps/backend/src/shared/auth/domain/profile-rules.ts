import { MOODS } from '@/modules/quack/domain/quack';

export const BIO_MAX_LENGTH = 160;

export type ProfileRuleViolation = {
  // Stable code the frontend maps back onto the field that caused it.
  code: 'INVALID_NAME' | 'INVALID_BIO' | 'INVALID_DEFAULT_MOOD';
  message: string;
};

/**
 * The profile fields BetterAuth's `update-user` does not check on its own
 * (the username plugin validates the username). Only fields present in `data`
 * are checked, so partial updates — and BetterAuth's own internal user
 * updates — pass through untouched.
 */
export const findProfileRuleViolation = (data: {
  name?: unknown;
  bio?: unknown;
  defaultMood?: unknown;
}): ProfileRuleViolation | null => {
  if (
    data.name !== undefined &&
    (typeof data.name !== 'string' || data.name.trim() === '')
  ) {
    return { code: 'INVALID_NAME', message: 'Display name is required' };
  }

  if (
    data.bio !== undefined &&
    data.bio !== null &&
    (typeof data.bio !== 'string' || data.bio.length > BIO_MAX_LENGTH)
  ) {
    return {
      code: 'INVALID_BIO',
      message: `Bio must be at most ${BIO_MAX_LENGTH} characters`,
    };
  }

  if (
    data.defaultMood !== undefined &&
    data.defaultMood !== null &&
    !(MOODS as readonly unknown[]).includes(data.defaultMood)
  ) {
    return {
      code: 'INVALID_DEFAULT_MOOD',
      message: `Default mood must be one of: ${MOODS.join(', ')}`,
    };
  }

  return null;
};
