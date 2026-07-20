-- Shared attribution contract for all lead entry points.
-- Existing webhook/landing-page behavior remains unchanged.
ALTER TABLE "leads"
  ADD COLUMN IF NOT EXISTS "source_channel" text NOT NULL DEFAULT 'landing_page',
  ADD COLUMN IF NOT EXISTS "source_campaign" text,
  ADD COLUMN IF NOT EXISTS "source_ad" text,
  ADD COLUMN IF NOT EXISTS "source_form" text,
  ADD COLUMN IF NOT EXISTS "source_metadata" jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS "leads_tenant_source_external_id_unique"
  ON "leads" ("tenant_id", "source_channel", "external_id")
  WHERE "external_id" IS NOT NULL AND "source_channel" <> 'landing_page';
