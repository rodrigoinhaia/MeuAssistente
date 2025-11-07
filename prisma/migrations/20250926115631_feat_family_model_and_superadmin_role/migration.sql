-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'SUPER_ADMIN';

-- Rename main table and its constraints
ALTER TABLE "public"."tenants" RENAME TO "families";
ALTER TABLE "public"."families" RENAME CONSTRAINT "tenants_pkey" TO "families_pkey";
ALTER INDEX "public"."tenants_phone_number_key" RENAME TO "families_phone_number_key";

-- Drop old foreign keys before renaming columns
ALTER TABLE "public"."categories" DROP CONSTRAINT "categories_tenant_id_fkey";
ALTER TABLE "public"."commitments" DROP CONSTRAINT "commitments_tenant_id_fkey";
ALTER TABLE "public"."integrations" DROP CONSTRAINT "integrations_tenant_id_fkey";
ALTER TABLE "public"."n8n_workflows" DROP CONSTRAINT "n8n_workflows_tenant_id_fkey";
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_tenant_id_fkey";
ALTER TABLE "public"."subscriptions" DROP CONSTRAINT "subscriptions_tenant_id_fkey";
ALTER TABLE "public"."sync_logs" DROP CONSTRAINT "sync_logs_tenant_id_fkey";
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_tenant_id_fkey";
ALTER TABLE "public"."transactions" DROP CONSTRAINT "transactions_tenant_id_fkey";
ALTER TABLE "public"."users" DROP CONSTRAINT "users_tenantId_fkey";

-- Rename columns in dependent tables
ALTER TABLE "public"."users" RENAME COLUMN "tenantId" TO "familyId";
ALTER TABLE "public"."categories" RENAME COLUMN "tenant_id" TO "family_id";
ALTER TABLE "public"."commitments" RENAME COLUMN "tenant_id" TO "family_id";
ALTER TABLE "public"."integrations" RENAME COLUMN "tenant_id" TO "family_id";
ALTER TABLE "public"."n8n_workflows" RENAME COLUMN "tenant_id" TO "family_id";
ALTER TABLE "public"."payments" RENAME COLUMN "tenant_id" TO "family_id";
ALTER TABLE "public"."processing_logs" RENAME COLUMN "tenant_id" TO "family_id";
ALTER TABLE "public"."subscriptions" RENAME COLUMN "tenant_id" TO "family_id";
ALTER TABLE "public"."sync_logs" RENAME COLUMN "tenant_id" TO "family_id";
ALTER TABLE "public"."tasks" RENAME COLUMN "tenant_id" TO "family_id";
ALTER TABLE "public"."transactions" RENAME COLUMN "tenant_id" TO "family_id";

-- Rename indexes
ALTER INDEX "public"."categories_name_tenant_id_type_key" RENAME TO "categories_name_family_id_type_key";
ALTER INDEX "public"."integrations_tenant_id_user_id_provider_key" RENAME TO "integrations_family_id_user_id_provider_key";
ALTER INDEX "public"."sync_logs_tenant_id_idx" RENAME TO "sync_logs_family_id_idx";
ALTER INDEX "public"."users_email_tenantId_key" RENAME TO "users_email_familyId_key";

-- Add new foreign keys
ALTER TABLE "public"."users" ADD CONSTRAINT "users_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."commitments" ADD CONSTRAINT "commitments_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."n8n_workflows" ADD CONSTRAINT "n8n_workflows_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."integrations" ADD CONSTRAINT "integrations_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."sync_logs" ADD CONSTRAINT "sync_logs_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;