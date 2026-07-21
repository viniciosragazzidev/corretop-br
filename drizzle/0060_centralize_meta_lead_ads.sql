-- Meta Lead Ads is temporarily a matrix-only intake channel. Preserve the
-- historical connection rows, but prevent any branch-bound configuration from
-- receiving new events until the plug-and-play branch flow is explicitly enabled.
UPDATE "marketing_connections"
SET "status" = 'inactive', "updated_at" = now()
WHERE "branch_id" IS NOT NULL
  AND "status" = 'active';
