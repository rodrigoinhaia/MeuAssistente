-- CreateTable
CREATE TABLE "bank_connections" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "account_id" TEXT,
    "account_type" TEXT,
    "account_number" TEXT,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "consent_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_sync_at" TIMESTAMP(3),
    "auto_sync" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "bank_connection_id" TEXT,
ADD COLUMN "bank_transaction_id" TEXT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_connection_id_fkey" FOREIGN KEY ("bank_connection_id") REFERENCES "bank_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bank_connection_id_bank_transaction_id_key" ON "transactions"("bank_connection_id", "bank_transaction_id");

