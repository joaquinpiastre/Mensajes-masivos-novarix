-- Ejecutar solo si migrate deploy falla (Postgres).
-- Uso: npx prisma db execute --file prisma/sql/add_user_b2b_columns.sql --schema prisma/schema.prisma

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyName" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'client';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
