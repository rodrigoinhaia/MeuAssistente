-- Migration: Adicionar campo isVerified e tabela OTPVerification
-- Execute: psql $DATABASE_URL < prisma/migrations/add_otp_verification.sql

-- Adicionar campo isVerified na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Criar tabela otp_verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  phone TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone_code ON otp_verifications(phone, code);

-- Atualizar usuários existentes para isVerified = true (para não bloquear usuários já cadastrados)
UPDATE users SET is_verified = true WHERE is_verified IS NULL OR is_verified = false;

