# 0001 · Deleting a quack wipes its content and keeps the row

Status: Accepted · 2026-11-15

## Context

Quacks get replies (see `story.md`). Two requirements from the product owner pull against each other:

- Replies belong to the people who wrote them: deleting a quack must not delete the replies under it.
- When someone deletes their quack, its content has to really disappear from the app.

Until now `DELETE /api/quacks/:id` was a real SQL `DELETE` that cascaded to the poll and its votes. With replies pointing at their parent (`quack.parentId`), that either takes the replies with it or leaves them pointing at nothing.

This applies to every way content is deleted — by the author, an admin or a moderator, a quack or a reply — so it is a rule for the whole app, not for this feature.

## Decision

Deleting a quack turns it into a tombstone: in one transaction `deletedAt` is set, `text` becomes `''`, `mood` becomes `NULL`, and the poll options are deleted (their votes cascade). The row and its `id`, `parentId` and `createdAt` stay so that replies keep their place. The same rule applies to every quack, whether it has replies or not.

The database backs this up: `parentId` is `ON DELETE RESTRICT`, so a quack with replies can never be removed for real, and `CHECK ("deletedAt" IS NULL OR "text" = '')` makes a deleted quack with text impossible.

## Options considered

- **Real `DELETE`, replies cascade** — rejected: replies would disappear with their parent, which the product owner explicitly ruled out.
- **Real `DELETE`, `parentId` set to `NULL`** — rejected: replies survive but lose their context and turn into stand-alone quacks in the feed that answer nothing.
- **Soft delete: set `deletedAt`, keep the text** — rejected: the content stays in the database, and one query that forgets `deletedAt IS NULL` (feed, search, stats, a future export) puts it back on screen. The product owner wants the content gone, not hidden.
- **Real `DELETE` when there are no replies, tombstone otherwise** — rejected: two code paths for one action, and a reply arriving between the check and the delete races past it. One rule is easier to reason about; tombstones without replies are simply filtered out of reads.

## Consequences

- Every read of quacks has to decide what to do with tombstones: the feed shows one only while it has live replies, as "This quack was deleted." with no text, author, date or poll; Mine, search, threads and stats skip them. New reads must do the same.
- The API sends a tombstone with `isDeleted: true` and `text: ""`, and `mood`, `poll`, `user` and `userId` as `null` — who wrote it is content too.
- Deleting an already deleted quack, replying to it or voting in its poll is 404, as if it were gone.
- Rows are never removed by the app, so the `quack` table only grows. Fine at our size; a cleanup job for tombstones without replies can come later if it matters.
- Deleting a user still cascades to their quacks; if someone replied to one of them, `RESTRICT` stops it. The app has no account deletion yet — when it gets one, it has to tombstone the user's quacks first (a new ADR).
- Restoring deleted content is impossible by design.
