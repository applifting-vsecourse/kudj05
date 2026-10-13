import { findProfileRuleViolation } from '@/shared/auth/domain/profile-rules';
import { APIError } from 'better-auth/api';
import { openAPI, username } from 'better-auth/plugins';
import { BetterAuthOptions } from 'better-auth/types';

export const betterAuthCoreConfig: BetterAuthOptions = {
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'user',
        input: false,
      },
      // Editable on the settings page through BetterAuth's `update-user`.
      bio: {
        type: 'string',
        required: false,
      },
      defaultMood: {
        type: 'string',
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      update: {
        before: (user) => {
          const violation = findProfileRuleViolation(user);
          if (violation) {
            throw new APIError('BAD_REQUEST', {
              code: violation.code,
              message: violation.message,
            });
          }
          return Promise.resolve({ data: user });
        },
      },
    },
  },
  plugins: [openAPI(), username()],
};
