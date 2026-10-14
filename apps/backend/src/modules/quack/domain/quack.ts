export type QuackAuthor = {
  id: string;
  name: string;
  username: string;
};

export const MOODS = ['happy', 'sad', 'angry', 'silly'] as const;
export type Mood = (typeof MOODS)[number];

export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 4;
// Matches the width of the poll_option.text column.
export const POLL_OPTION_MAX_LENGTH = 80;

export type PollOption = {
  id: string;
  text: string;
  // Always counted from the stored votes, never kept as a number of its own.
  voteCount: number;
};

export type Poll = {
  options: PollOption[];
  // The option the viewer picked, null when they haven't voted.
  myOptionId: string | null;
};

export type Quack = {
  id: string;
  text: string;
  mood: Mood | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // null = a plain quack without a poll
  poll: Poll | null;
  user?: QuackAuthor;
};
