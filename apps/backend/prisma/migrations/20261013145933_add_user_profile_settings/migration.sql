-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bio" VARCHAR(160),
ADD COLUMN     "defaultMood" "mood";

-- BetterAuth stores the username lower-cased (and the original spelling in
-- displayUsername) and looks it up lower-cased, so a mixed-case username written
-- directly (the old seed did) is invisible to its "already taken" check.
UPDATE "user"
SET "displayUsername" = COALESCE("displayUsername", "username"),
    "username" = lower("username")
WHERE "username" <> lower("username");
