import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

export const tenantStatusValues = ["active", "inactive", "delinquent"] as const;
export const branchStatusValues = ["active", "inactive"] as const;
export const membershipStatusValues = ["active", "inactive"] as const;
export const availabilityStatusValues = ["available", "paused"] as const;
export const tenantRoleValues = ["director", "manager", "broker"] as const;
export const teamJobTitleValues = ["director", "manager", "broker", "marketing", "finance", "operations", "support"] as const;
export const userStatusValues = ["pending", "active", "disabled"] as const;
export const leadStatusValues = ["new", "distributed", "in_contact", "quote_sent", "negotiation", "documentation_pending", "under_analysis", "converted", "lost"] as const;
export const leadOriginValues = ["manual", "webhook"] as const;
export const leadDistributionStatusValues = ["unassigned", "awaiting_unit", "queued", "assigning", "assigned", "distribution_failed", "returned_to_queue"] as const;
export const assignmentSourceValues = ["manual_director", "manual_manager", "automatic", "duty_schedule", "redistribution", "system_recovery"] as const;
export const leadInteractionTypeValues = [
  "status_change",
  "note",
  "system_alert",
  "document_upload",
  "document_review",
  "quote_generated",
  "whatsapp_msg",
] as const;
export const webhookCredentialStatusValues = ["active", "revoked"] as const;
export const webhookDeliveryStatusValues = ["received", "processed", "rejected", "failed"] as const;

export const tenantStatus = pgEnum("tenant_status", tenantStatusValues);
export const branchStatus = pgEnum("branch_status", branchStatusValues);
export const membershipStatus = pgEnum(
  "membership_status",
  membershipStatusValues,
);
export const availabilityStatus = pgEnum("availability_status", availabilityStatusValues);
export const tenantRole = pgEnum("tenant_role", tenantRoleValues);
export const userStatus = pgEnum("user_status", userStatusValues);
export const leadStatus = pgEnum("lead_status", leadStatusValues);
export const leadOrigin = pgEnum("lead_origin", leadOriginValues);
export const leadInteractionType = pgEnum("lead_interaction_type", leadInteractionTypeValues);
export const webhookCredentialStatus = pgEnum("webhook_credential_status", webhookCredentialStatusValues);
export const webhookDeliveryStatus = pgEnum("webhook_delivery_status", webhookDeliveryStatusValues);

export const quoteStatusValues = ["draft", "shared", "sent", "accepted", "expired"] as const;
export const quoteStatus = pgEnum("quote_status", quoteStatusValues);
export const taskPriorityValues = ["low", "normal", "urgent"] as const;
export const taskPriority = pgEnum("task_priority", taskPriorityValues);

const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

// BetterAuth canonical identity tables. Tenant authorization intentionally lives
// in tenantMemberships rather than in this global identity record.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  active: boolean("active").notNull().default(true),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  status: userStatus("status").notNull().default("active"),
  createdAt,
  updatedAt,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt,
    updatedAt,
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const twoFactor = pgTable(
  "twoFactor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    verified: boolean("verified").notNull().default(true),
    failedVerificationCount: integer("failed_verification_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
  },
  (table) => [index("two_factor_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  legalName: text("legal_name"),
  cnpj: text("cnpj").unique(),
  logoUrl: text("logo_url"),
  brandColor: text("brand_color"),
  subscriptionPlan: text("subscription_plan").notNull().default("Essencial"),
  slaFirstContactMinutes: text("sla_first_contact_minutes").notNull().default("15"),
  slaStagnantDays: text("sla_stagnant_days").notNull().default("3"),
  status: tenantStatus("status").notNull().default("active"),
  createdAt,
  updatedAt,
});

export const branches = pgTable(
  "branches",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    externalId: text("external_id"),
    status: branchStatus("status").notNull().default("active"),
    acceptingLeads: boolean("accepting_leads").notNull().default(true),
    autoDistribute: boolean("auto_distribute").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("branches_tenant_id_idx").on(table.tenantId),
    unique("branches_id_tenant_id_unique").on(table.id, table.tenantId),
    uniqueIndex("branches_tenant_external_id_unique").on(table.tenantId, table.externalId).where(sql`${table.externalId} IS NOT NULL`),
  ],
);

export const planType = pgEnum("plan_type", ["individual", "empresarial", "familiar", "pme"]);

export const carriers = pgTable(
  "carriers",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    ansCode: text("ans_code"),
    contact: text("contact"),
    phone: text("phone"),
    email: text("email"),
    status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("carriers_tenant_id_idx").on(table.tenantId),
    uniqueIndex("carriers_tenant_name_unique").on(table.tenantId, table.name),
  ],
);

export const carrierPlans = pgTable(
  "carrier_plans",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    carrierId: text("carrier_id")
      .notNull()
      .references(() => carriers.id),
    name: text("name").notNull(),
    type: planType("type").notNull().default("individual"),
      description: text("description"),
    coverage: text("coverage"),
    ansRegistration: text("ans_registration"),
    maxEntryAge: integer("max_entry_age"),
    details: jsonb("details"),
    active: boolean("active").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("carrier_plans_tenant_id_idx").on(table.tenantId),
    index("carrier_plans_carrier_id_idx").on(table.carrierId),
  ],
);

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt,
});

export const leadWebhookCredentials = pgTable(
  "lead_webhook_credentials",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    branchId: text("branch_id").references(() => branches.id),
    name: text("name").notNull(),
    source: text("source").notNull().default("webhook"),
    tokenPrefix: text("token_prefix").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    status: webhookCredentialStatus("status").notNull().default("active"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("lead_webhook_credentials_tenant_id_idx").on(table.tenantId),
    index("lead_webhook_credentials_branch_id_idx").on(table.branchId),
    index("lead_webhook_credentials_created_by_idx").on(table.createdBy),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id),
    branchId: text("branch_id").references(() => branches.id),
    corretorId: text("corretor_id").references(() => user.id),
    planId: text("plan_id").references(() => carrierPlans.id),
    nome: text("nome").notNull(),
    telefone: text("telefone").notNull(),
    email: text("email"),
    origem: leadOrigin("origem").notNull().default("manual"),
    status: leadStatus("status").notNull().default("new"),
    distributionStatus: text("distribution_status").notNull().default("unassigned"),
    queueId: text("queue_id"),
    unitAssignedAt: timestamp("unit_assigned_at", { withTimezone: true }),
    assignmentSource: text("assignment_source"),
    assignmentStrategy: text("assignment_strategy"),
    distributionUpdatedAt: timestamp("distribution_updated_at", { withTimezone: true }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    firstContactAt: timestamp("first_contact_at", { withTimezone: true }),
    serviceStartedAt: timestamp("service_started_at", { withTimezone: true }),
    serviceStartedBy: text("service_started_by").references(() => user.id),
    stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true }).notNull().defaultNow(),
    consentimentoLgpd: boolean("consentimento_lgpd").notNull().default(false),
    motivoPerda: text("motivo_perda"),
    externalId: text("external_id"),
    webhookCredentialId: text("webhook_credential_id").references(() => leadWebhookCredentials.id),
    createdAt,
  },
  (table) => [
    index("leads_tenant_branch_status_idx").on(table.tenantId, table.branchId, table.status),
    index("leads_tenant_distribution_status_idx").on(table.tenantId, table.distributionStatus),
    index("leads_branch_queue_distribution_idx").on(table.branchId, table.queueId, table.distributionStatus),
    index("leads_corretor_status_idx").on(table.corretorId, table.status),
    index("leads_webhook_credential_idx").on(table.webhookCredentialId),
    uniqueIndex("leads_credential_external_id_unique").on(table.webhookCredentialId, table.externalId).where(sql`${table.externalId} IS NOT NULL`),
  ],
);

export const leadQueues = pgTable(
  "lead_queues",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("active"),
    assignmentMode: text("assignment_mode").notNull().default("automatic"),
    assignmentStrategy: text("assignment_strategy").notNull().default("capacity"),
    capacityEnabled: boolean("capacity_enabled").notNull().default(false),
    capacityPerBroker: integer("capacity_per_broker"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt,
    updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("lead_queues_tenant_branch_idx").on(table.tenantId, table.branchId),
    uniqueIndex("lead_queues_tenant_branch_slug_unique").on(table.tenantId, table.branchId, table.slug),
  ],
);

export const leadDistributionEvents = pgTable(
  "lead_distribution_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    fromBranchId: text("from_branch_id"),
    toBranchId: text("to_branch_id"),
    fromQueueId: text("from_queue_id"),
    toQueueId: text("to_queue_id"),
    previousOwnerId: text("previous_owner_id"),
    newOwnerId: text("new_owner_id"),
    action: text("action").notNull(),
    source: text("source").notNull(),
    strategy: text("strategy"),
    reason: text("reason"),
    actorId: text("actor_id").notNull().references(() => user.id),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt,
  },
  (table) => [index("lead_distribution_events_tenant_lead_idx").on(table.tenantId, table.leadId, table.createdAt)],
);

export const leadDistributionSettings = pgTable(
  "lead_distribution_settings",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => branches.id, { onDelete: "cascade" }),
    queueId: text("queue_id").references(() => leadQueues.id, { onDelete: "cascade" }),
    automaticRoutingEnabled: boolean("automatic_routing_enabled").notNull().default(true),
    automaticAssignmentEnabled: boolean("automatic_assignment_enabled").notNull().default(true),
    defaultQueueId: text("default_queue_id"),
    fallbackQueueId: text("fallback_queue_id"),
    allowManagerManualAssignment: boolean("allow_manager_manual_assignment").notNull().default(true),
    allowDirectorManualAssignment: boolean("allow_director_manual_assignment").notNull().default(true),
    dutyScheduleEnabled: boolean("duty_schedule_enabled").notNull().default(false),
    active: boolean("active").notNull().default(true),
    updatedBy: text("updated_by").references(() => user.id),
    createdAt,
    updatedAt,
  },
  (table) => [index("lead_distribution_settings_tenant_idx").on(table.tenantId, table.branchId, table.queueId)],
);

export const unitDutySchedules = pgTable(
  "unit_duty_schedules",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    queueId: text("queue_id").notNull().references(() => leadQueues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    priority: integer("priority").notNull().default(100),
    status: text("status").notNull().default("active"),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    createdBy: text("created_by").notNull().references(() => user.id),
    createdAt,
    updatedAt,
  },
  (table) => [index("unit_duty_schedules_tenant_status_idx").on(table.tenantId, table.status, table.dayOfWeek, table.startsAt)],
);

export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => branches.id),
    corretorId: text("corretor_id").references(() => user.id),
    nome: text("nome").notNull(),
    telefone: text("telefone").notNull(),
    email: text("email"),
    convertedAt: timestamp("converted_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt,
  },
  (table) => [
    uniqueIndex("clients_lead_unique").on(table.leadId),
    index("clients_tenant_idx").on(table.tenantId),
    index("clients_corretor_idx").on(table.corretorId),
  ],
);

export const leadInteractions = pgTable(
  "lead_interactions",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id),
    tipo: leadInteractionType("tipo").notNull(),
    conteudo: text("conteudo").notNull(),
    metadata: jsonb("metadata"),
    createdAt,
  },
  (table) => [index("lead_interactions_lead_created_idx").on(table.leadId, table.createdAt)],
);

export const leadTaskAssignees = pgTable(
  "lead_task_assignees",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    taskId: text("task_id").notNull().references(() => leadTasks.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [
    unique("lead_task_assignees_task_user_unique").on(table.taskId, table.userId),
    index("lead_task_assignees_tenant_user_idx").on(table.tenantId, table.userId),
  ],
);

export const leadTasks = pgTable(
  "lead_tasks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    assignedTo: text("assigned_to").references(() => user.id, { onDelete: "set null" }),
    createdBy: text("created_by").notNull().references(() => user.id),
    title: text("title").notNull(),
    description: text("description"),
    priority: taskPriority("priority").notNull().default("normal"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("lead_tasks_tenant_lead_idx").on(table.tenantId, table.leadId),
    index("lead_tasks_assigned_due_idx").on(table.assignedTo, table.dueAt),
  ],
);

export const quotes = pgTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    createdBy: text("created_by").notNull().references(() => user.id),
    status: quoteStatus("status").notNull().default("draft"),
    lives: jsonb("lives").notNull().default([]),
    notes: text("notes"),
    publicToken: text("public_token").notNull().unique(),
    sharedAt: timestamp("shared_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("quotes_tenant_lead_idx").on(table.tenantId, table.leadId),
    index("quotes_public_token_idx").on(table.publicToken),
  ],
);

export const quoteItems = pgTable(
  "quote_items",
  {
    id: text("id").primaryKey(),
    quoteId: text("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull().references(() => carrierPlans.id),
    monthlyPrice: numeric("monthly_price", { precision: 12, scale: 2 }).notNull(),
    recommended: boolean("recommended").notNull().default(false),
    snapshot: jsonb("snapshot").notNull().default({}),
    createdAt,
  },
  (table) => [index("quote_items_quote_idx").on(table.quoteId)],
);

export const carrierPlanPrices = pgTable(
  "carrier_plan_prices",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull().references(() => carrierPlans.id, { onDelete: "cascade" }),
    ageBand: text("age_band").notNull(),
    monthlyPrice: numeric("monthly_price", { precision: 12, scale: 2 }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("carrier_plan_prices_plan_age_unique").on(table.planId, table.ageBand)],
);

export const carrierPlanNetworks = pgTable(
  "carrier_plan_networks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull().references(() => carrierPlans.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    city: text("city").notNull(),
    specialty: text("specialty"),
    createdAt,
  },
  (table) => [index("carrier_plan_networks_plan_city_idx").on(table.planId, table.city)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    entidade: text("entidade").notNull(),
    entidadeId: text("entidade_id").notNull(),
    acao: text("acao").notNull(),
    createdAt,
  },
  (table) => [index("audit_logs_user_created_idx").on(table.userId, table.createdAt)],
);

export const systemSettings = pgTable(
  "system_settings",
  {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    recipientUserId: text("recipient_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    leadId: text("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [index("notifications_recipient_created_idx").on(table.recipientUserId, table.createdAt), index("notifications_tenant_idx").on(table.tenantId)],
);

export const whatsappConnections = pgTable(
  "whatsapp_connections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sessionId: text("session_id"),
    sessionName: text("session_name"),
    status: text("status").notNull().default("disconnected"),
    qrCode: text("qr_code"),
    webhookSecret: text("webhook_secret"),
    chatInternoAtivo: boolean("chat_interno_ativo").notNull().default(true),
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("whatsapp_connections_user_idx").on(table.tenantId, table.userId), index("whatsapp_connections_session_idx").on(table.sessionId), uniqueIndex("whatsapp_connections_tenant_user_unique").on(table.tenantId, table.userId).where(sql`${table.userId} IS NOT NULL`)],
);

export const whatsappMessages = pgTable(
  "whatsapp_messages",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    leadId: text("lead_id").references(() => leads.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "cascade" }),
    messageId: text("message_id"),
    phone: text("phone").notNull(),
    direction: text("direction").notNull(),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt,
  },
  (table) => [index("whatsapp_messages_tenant_lead_idx").on(table.tenantId, table.leadId, table.createdAt), uniqueIndex("whatsapp_messages_message_unique").on(table.tenantId, table.messageId)],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    credentialId: text("credential_id")
      .notNull()
      .references(() => leadWebhookCredentials.id),
    requestId: text("request_id").notNull(),
    idempotencyKey: text("idempotency_key"),
    externalId: text("external_id"),
    payloadHash: text("payload_hash").notNull(),
    status: webhookDeliveryStatus("status").notNull().default("received"),
    leadId: text("lead_id").references(() => leads.id),
    errorCode: text("error_code"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("webhook_deliveries_tenant_id_idx").on(table.tenantId),
    index("webhook_deliveries_credential_id_idx").on(table.credentialId),
    uniqueIndex("webhook_deliveries_credential_idempotency_unique").on(table.credentialId, table.idempotencyKey).where(sql`${table.idempotencyKey} IS NOT NULL`),
  ],
);

export const platformAuditLogs = pgTable(
  "platform_audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt,
  },
  (table) => [index("platform_audit_logs_actor_idx").on(table.actorUserId)],
);

export const tenantMemberships = pgTable(
  "tenant_memberships",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    branchId: text("branch_id"),
    role: tenantRole("role").notNull(),
    jobTitle: text("job_title").notNull().default("broker"),
    status: membershipStatus("status").notNull().default("active"),
    availabilityStatus: availabilityStatus("availability_status").notNull().default("available"),
    onboardingDismissedAt: timestamp("onboarding_dismissed_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("tenant_memberships_tenant_id_idx").on(table.tenantId),
    index("tenant_memberships_user_id_idx").on(table.userId),
    index("tenant_memberships_branch_id_idx").on(table.branchId),
    unique("tenant_memberships_tenant_user_unique").on(
      table.tenantId,
      table.userId,
    ),
    foreignKey({
      columns: [table.branchId, table.tenantId],
      foreignColumns: [branches.id, branches.tenantId],
      name: "tenant_memberships_branch_tenant_fk",
    }),
  ],
);

export const invites = pgTable(
  "invites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    invitedBy: text("invited_by").notNull().references(() => user.id),
    createdAt,
  },
  (table) => [
    index("invites_user_id_idx").on(table.userId),
    index("invites_token_hash_idx").on(table.tokenHash),
  ],
);

export const leadWebhookCredentialRelations = relations(leadWebhookCredentials, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [leadWebhookCredentials.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(user, {
    fields: [leadWebhookCredentials.createdBy],
    references: [user.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveryRelations = relations(webhookDeliveries, ({ one }) => ({
  tenant: one(tenants, {
    fields: [webhookDeliveries.tenantId],
    references: [tenants.id],
  }),
  credential: one(leadWebhookCredentials, {
    fields: [webhookDeliveries.credentialId],
    references: [leadWebhookCredentials.id],
  }),
  lead: one(leads, {
    fields: [webhookDeliveries.leadId],
    references: [leads.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  tenantMemberships: many(tenantMemberships),
  platformAuditLogs: many(platformAuditLogs),
  sentInvites: many(invites, { relationName: "invitedBy" }),
  receivedInvites: many(invites, { relationName: "invitee" }),
}));

export const platformAuditLogRelations = relations(platformAuditLogs, ({ one }) => ({
  actor: one(user, {
    fields: [platformAuditLogs.actorUserId],
    references: [user.id],
  }),
}));

export const inviteRelations = relations(invites, ({ one }) => ({
  invitee: one(user, { fields: [invites.userId], references: [user.id], relationName: "invitee" }),
  invitedBy: one(user, { fields: [invites.invitedBy], references: [user.id], relationName: "invitedBy" }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const tenantRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  memberships: many(tenantMemberships),
}));

export const branchRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [branches.tenantId],
    references: [tenants.id],
  }),
  memberships: many(tenantMemberships),
}));

export const tenantMembershipRelations = relations(
  tenantMemberships,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [tenantMemberships.tenantId],
      references: [tenants.id],
    }),
    user: one(user, {
      fields: [tenantMemberships.userId],
      references: [user.id],
    }),
    branch: one(branches, {
      fields: [tenantMemberships.branchId],
      references: [branches.id],
    }),
  }),
);

export const commissionRuleTypeValues = ["unica", "escalonada"] as const;
export const commissionScheduleStatusValues = ["pending", "paid", "cancelled"] as const;
export const goalScopeValues = ["broker", "team", "branch", "tenant"] as const;
export const goalTargetTypeValues = ["sales_count", "revenue", "conversion_rate", "leads_contacted"] as const;
export const saleStatusValues = ["active", "cancelled"] as const;

export const commissionRuleType = pgEnum("commission_rule_type", commissionRuleTypeValues);
export const commissionScheduleStatus = pgEnum("commission_schedule_status", commissionScheduleStatusValues);
export const goalScope = pgEnum("goal_scope", goalScopeValues);
export const goalTargetType = pgEnum("goal_target_type", goalTargetTypeValues);
export const saleStatus = pgEnum("sale_status", saleStatusValues);

export const documentStatusValues = ["pending", "approved", "rejected"] as const;
export const documentStatus = pgEnum("document_status", documentStatusValues);

export const documentRequirements = pgTable(
  "document_requirements",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    carrierId: text("carrier_id").references(() => carriers.id, { onDelete: "set null" }),
    planId: text("plan_id").references(() => carrierPlans.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    required: boolean("required").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("document_requirements_tenant_idx").on(table.tenantId),
  ]
);

export const leadDocuments = pgTable(
  "lead_documents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    requirementId: text("requirement_id").references(() => documentRequirements.id, { onDelete: "set null" }),
    filename: text("filename").notNull(),
    fileUrl: text("file_url").notNull(),
    status: documentStatus("status").notNull().default("pending"),
    uploadedBy: text("uploaded_by").notNull().references(() => user.id),
    reviewedBy: text("reviewed_by").references(() => user.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("lead_documents_tenant_lead_idx").on(table.tenantId, table.leadId),
  ]
);

/* ─── Sales / Commission ─── */

export const commissionRules = pgTable(
  "commission_rules",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    carrierId: text("carrier_id").references(() => carriers.id, { onDelete: "cascade" }),
    planId: text("plan_id").references(() => carrierPlans.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: commissionRuleType("type").notNull().default("escalonada"),
    percentages: jsonb("percentages").notNull().default([100]),
    appliesToAll: boolean("applies_to_all").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("commission_rules_tenant_idx").on(table.tenantId),
    index("commission_rules_carrier_idx").on(table.carrierId),
    index("commission_rules_plan_idx").on(table.planId),
  ],
);

export const sales = pgTable(
  "sales",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    brokerId: text("broker_id")
      .notNull()
      .references(() => user.id),
    carrierPlanId: text("carrier_plan_id").references(() => carrierPlans.id),
    commissionRuleId: text("commission_rule_id").references(() => commissionRules.id),
    saleDate: timestamp("sale_date", { withTimezone: true }).notNull(),
    saleValue: numeric("sale_value", { precision: 12, scale: 2 }).notNull(),
    status: saleStatus("status").notNull().default("active"),
    notes: text("notes"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("sales_tenant_idx").on(table.tenantId),
    index("sales_lead_idx").on(table.leadId),
    index("sales_broker_idx").on(table.brokerId),
  ],
);

export const commissionSchedule = pgTable(
  "commission_schedule",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    saleId: text("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    monthNumber: integer("month_number").notNull(),
    referenceMonth: text("reference_month").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: commissionScheduleStatus("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidBy: text("paid_by").references(() => user.id),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("commission_schedule_tenant_idx").on(table.tenantId),
    index("commission_schedule_sale_idx").on(table.saleId),
    index("commission_schedule_ref_month_idx").on(table.referenceMonth),
    index("commission_schedule_status_idx").on(table.status),
  ],
);

/* ─── Goals ─── */

export const goals = pgTable(
  "goals",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    scope: goalScope("scope").notNull(),
    scopeId: text("scope_id"),
    name: text("name").notNull(),
    targetType: goalTargetType("target_type").notNull().default("sales_count"),
    targetValue: numeric("target_value", { precision: 12, scale: 2 }).notNull(),
    period: text("period").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("goals_tenant_scope_idx").on(table.tenantId, table.scope),
    index("goals_period_idx").on(table.tenantId, table.period),
  ],
);

export const goalProgress = pgTable(
  "goal_progress",
  {
    id: text("id").primaryKey(),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    currentValue: numeric("current_value", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    percentage: numeric("percentage", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("goal_progress_goal_unique").on(table.goalId),
  ],
);

/* ─── Relations ─── */

export const commissionRuleRelations = relations(commissionRules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [commissionRules.tenantId],
    references: [tenants.id],
  }),
  carrier: one(carriers, {
    fields: [commissionRules.carrierId],
    references: [carriers.id],
  }),
  plan: one(carrierPlans, {
    fields: [commissionRules.planId],
    references: [carrierPlans.id],
  }),
  createdByUser: one(user, {
    fields: [commissionRules.createdBy],
    references: [user.id],
  }),
}));

export const saleRelations = relations(sales, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sales.tenantId],
    references: [tenants.id],
  }),
  lead: one(leads, {
    fields: [sales.leadId],
    references: [leads.id],
  }),
  client: one(clients, {
    fields: [sales.clientId],
    references: [clients.id],
  }),
  broker: one(user, {
    fields: [sales.brokerId],
    references: [user.id],
  }),
  carrierPlan: one(carrierPlans, {
    fields: [sales.carrierPlanId],
    references: [carrierPlans.id],
  }),
  commissionRule: one(commissionRules, {
    fields: [sales.commissionRuleId],
    references: [commissionRules.id],
  }),
  createdByUser: one(user, {
    fields: [sales.createdBy],
    references: [user.id],
  }),
  scheduleItems: many(commissionSchedule),
}));

export const commissionScheduleRelations = relations(commissionSchedule, ({ one }) => ({
  tenant: one(tenants, {
    fields: [commissionSchedule.tenantId],
    references: [tenants.id],
  }),
  sale: one(sales, {
    fields: [commissionSchedule.saleId],
    references: [sales.id],
  }),
  paidByUser: one(user, {
    fields: [commissionSchedule.paidBy],
    references: [user.id],
  }),
}));

export const goalRelations = relations(goals, ({ one }) => ({
  tenant: one(tenants, {
    fields: [goals.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(user, {
    fields: [goals.createdBy],
    references: [user.id],
  }),
  progress: one(goalProgress, {
    fields: [goals.id],
    references: [goalProgress.goalId],
  }),
}));

export const goalProgressRelations = relations(goalProgress, ({ one }) => ({
  goal: one(goals, {
    fields: [goalProgress.goalId],
    references: [goals.id],
  }),
}));

/* ─── Push Subscriptions ─── */

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("push_subscriptions_user_idx").on(table.userId),
    index("push_subscriptions_tenant_idx").on(table.tenantId),
  ]
);

export const pushSubscriptionRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(user, {
    fields: [pushSubscriptions.userId],
    references: [user.id],
  }),
  tenant: one(tenants, {
    fields: [pushSubscriptions.tenantId],
    references: [tenants.id],
  }),
}));

export type TenantRole = (typeof tenantRoleValues)[number];
export type TenantStatus = (typeof tenantStatusValues)[number];
