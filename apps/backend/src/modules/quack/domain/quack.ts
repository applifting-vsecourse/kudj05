export type QuackAuthor = {
  id: string;
  name: string;
  username: string;
};

export const MOODS = ['happy', 'sad', 'angry', 'silly'] as const;
export type Mood = (typeof MOODS)[number];

// Same limit for a quack and a reply.
export const QUACK_MAX_LENGTH = 280;

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
  // '' once the quack is deleted
  text: string;
  mood: Mood | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // null = a plain quack without a poll
  poll: Poll | null;
  user?: QuackAuthor;
  // The quack this one replies to; null for a quack in the feed.
  parentId: string | null;
  // Set when the quack was deleted. The row stays as a tombstone so its replies
  // keep their parent; text, mood and poll are already gone. See docs/adr/0001.
  deletedAt: Date | null;
  // Replies that aren't deleted, counted from rows on every read.
  replyCount: number;
};

/** Who may delete a quack, and whether it is still there to delete or reply to. */
export type QuackRef = {
  userId: string;
  parentId: string | null;
  deletedAt: Date | null;
};
