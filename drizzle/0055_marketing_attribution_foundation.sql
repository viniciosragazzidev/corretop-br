CREATE TYPE "marketing_connection_status" AS ENUM ('active', 'inactive', 'error');

CREATE TABLE IF NOT EXISTS "marketing_connections" (
  "id" text PRIMARY KEY,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "branch_id" text REFERENCES "branches"("id") ON DELETE SET NULL,
  "provider" text NOT NULL,
  "platform" text NOT NULL,
  "external_account_id" text,
  "external_page_id" text,
  "external_form_id" text,
  "name" text NOT NULL,
  "status" "marketing_connection_status" NOT NULL DEFAULT 'inactive',
  "access_token_ciphertext" text,
  "last_webhook_at" timestamptz,
  "last_sync_at" timestamptz,
  "last_error" text,
  "created_by" text NOT NULL REFERENCES "user"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "marketing_connections_tenant_idx" ON "marketing_connections" ("tenant_id");
CREATE INDEX IF NOT EXISTS "marketing_connections_page_idx" ON "marketing_connections" ("external_page_id");
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_connections_tenant_platform_account_unique" ON "marketing_connections" ("tenant_id", "platform", "external_account_id");

CREATE TABLE IF NOT EXISTS "marketing_webhook_events" (
  "id" text PRIMARY KEY,
  "connection_id" text REFERENCES "marketing_connections"("id") ON DELETE SET NULL,
  "provider" text NOT NULL,
  "event_type" text NOT NULL,
  "external_event_id" text,
  "payload_hash" text NOT NULL,
  "payload" jsonb,
  "status" text NOT NULL DEFAULT 'received',
  "error_message" text,
  "received_at" timestamptz NOT NULL DEFAULT now(),
  "processed_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "marketing_webhook_events_connection_idx" ON "marketing_webhook_events" ("connection_id", "received_at");
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_webhook_events_provider_external_unique" ON "marketing_webhook_events" ("provider", "external_event_id") WHERE "external_event_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "marketing_daily_metrics" (
  "id" text PRIMARY KEY,
  "connection_id" text NOT NULL REFERENCES "marketing_connections"("id") ON DELETE CASCADE,
  "metric_date" date NOT NULL,
  "campaign_id" text,
  "adset_id" text,
  "ad_id" text,
  "impressions" integer NOT NULL DEFAULT 0,
  "clicks" integer NOT NULL DEFAULT 0,
  "reach" integer NOT NULL DEFAULT 0,
  "spend" numeric(12,2) NOT NULL DEFAULT 0,
  "raw" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_daily_metrics_unique" ON "marketing_daily_metrics" ("connection_id", "metric_date", "campaign_id", "adset_id", "ad_id");
