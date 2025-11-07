-- Remove ADMIN role from UserRole enum
-- First, update any users with ADMIN role to OWNER
UPDATE "users" SET "role" = 'OWNER' WHERE "role" = 'ADMIN';

-- Remove ADMIN from enum
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM('SUPER_ADMIN', 'OWNER', 'USER');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";
DROP TYPE "UserRole_old";

