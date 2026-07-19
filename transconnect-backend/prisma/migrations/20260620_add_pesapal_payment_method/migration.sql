-- Add PESAPAL to PaymentMethod enum
-- PostgreSQL requires ALTER TYPE to add a new enum value
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'PESAPAL';
