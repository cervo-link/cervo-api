ALTER TABLE "memberships" ADD COLUMN "role" text DEFAULT 'viewer' NOT NULL;

-- Backfill: promote workspace creators to owner role
UPDATE "memberships" m
SET "role" = 'owner'
FROM "workspaces" w
WHERE m.workspace_id = w.id
  AND m.member_id = w.owner_id;