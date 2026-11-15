# Architecture decision records

One decision per file, numbered, never rewritten: a changed mind is a new ADR that supersedes the old one. Read the line, open the file only when the topic matches your change.

| #                                       | Title                                                | Status   | In one sentence                                                                                                                                   |
| --------------------------------------- | ---------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [0001](0001-delete-content-keep-row.md) | Deleting a quack wipes its content and keeps the row | Accepted | `DELETE` turns a quack into a tombstone (text, mood and poll wiped, `deletedAt` set) so replies keep their parent and the content is really gone. |
