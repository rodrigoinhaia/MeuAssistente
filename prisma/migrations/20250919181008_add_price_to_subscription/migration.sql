/*
  Warnings:

  - Added the required column `price` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "price" DECIMAL(10,2) NOT NULL;
