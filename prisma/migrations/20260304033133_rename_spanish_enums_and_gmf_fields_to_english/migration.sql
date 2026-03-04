/*
  Warnings:

  - The values [CORRESPONSAL,VENTANILLA,OTRO] on the enum `CashWithdrawalChannel` will be removed. If these variants are still used in the database, this will fail.
  - The values [EMPLEADO,CONTRATISTA,PENSIONADO,INDEPENDIENTE] on the enum `ContractType` will be removed. If these variants are still used in the database, this will fail.
  - The values [BANCO,COOPERATIVA,OTRO] on the enum `FinancialEntityType` will be removed. If these variants are still used in the database, this will fail.
  - The values [SALARIO,COMISION,AUXILIO_TRANSPORTE_LEGAL,AUXILIO_CONECTIVIDAD_LEGAL,AUXILIO_CONECTIVIDAD_EXTRALEGAL,HONORARIOS,INCAPACIDAD,VACACIONES,OTRO] on the enum `IncomeType` will be removed. If these variants are still used in the database, this will fail.
  - The values [NOMINAL_MENSUAL,OTRO] on the enum `InterestRateType` will be removed. If these variants are still used in the database, this will fail.
  - The values [BOLSILLO_AHORRO,OTRO] on the enum `InvestmentType` will be removed. If these variants are still used in the database, this will fail.
  - The values [CONSUMO,VIVIENDA,LIBRE_INVERSION,AGROPECUARIO,OTRO] on the enum `LoanType` will be removed. If these variants are still used in the database, this will fail.
  - The values [FOURX1000_ALERT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [NOMINAL_MENSUAL] on the enum `ReferenceRateType` will be removed. If these variants are still used in the database, this will fail.
  - The values [IMPUESTO_4X1000] on the enum `WalletTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `retencion_fuente` on the `income_records` table. All the data in the column will be lost.
  - You are about to drop the column `is_4x1000_exempt` on the `wallets` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CashWithdrawalChannel_new" AS ENUM ('ATM', 'BANKING_AGENT', 'TELLER', 'OTHER');
ALTER TABLE "wallet_transactions" ALTER COLUMN "cash_withdrawal_channel" TYPE "CashWithdrawalChannel_new" USING ("cash_withdrawal_channel"::text::"CashWithdrawalChannel_new");
ALTER TYPE "CashWithdrawalChannel" RENAME TO "CashWithdrawalChannel_old";
ALTER TYPE "CashWithdrawalChannel_new" RENAME TO "CashWithdrawalChannel";
DROP TYPE "public"."CashWithdrawalChannel_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ContractType_new" AS ENUM ('EMPLOYEE', 'CONTRACTOR', 'PENSIONER', 'SELF_EMPLOYED');
ALTER TABLE "user_profiles" ALTER COLUMN "contract_type" TYPE "ContractType_new" USING ("contract_type"::text::"ContractType_new");
ALTER TYPE "ContractType" RENAME TO "ContractType_old";
ALTER TYPE "ContractType_new" RENAME TO "ContractType";
DROP TYPE "public"."ContractType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "FinancialEntityType_new" AS ENUM ('BANK', 'COOPERATIVE', 'FINTECH', 'OTHER');
ALTER TABLE "financial_entities" ALTER COLUMN "entity_type" TYPE "FinancialEntityType_new" USING ("entity_type"::text::"FinancialEntityType_new");
ALTER TYPE "FinancialEntityType" RENAME TO "FinancialEntityType_old";
ALTER TYPE "FinancialEntityType_new" RENAME TO "FinancialEntityType";
DROP TYPE "public"."FinancialEntityType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "IncomeType_new" AS ENUM ('SALARY', 'PRIMA', 'COMMISSION', 'LEGAL_TRANSPORT_AID', 'LEGAL_CONNECTIVITY_AID', 'EXTRALEGAL_CONNECTIVITY_AID', 'PROFESSIONAL_FEES', 'PENSION', 'DISABILITY_LEAVE', 'VACATION_PAY', 'OTHER');
ALTER TABLE "income_records" ALTER COLUMN "income_type" TYPE "IncomeType_new" USING ("income_type"::text::"IncomeType_new");
ALTER TYPE "IncomeType" RENAME TO "IncomeType_old";
ALTER TYPE "IncomeType_new" RENAME TO "IncomeType";
DROP TYPE "public"."IncomeType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "InterestRateType_new" AS ENUM ('EA', 'MV', 'TV', 'NOMINAL_MONTHLY', 'OTHER');
ALTER TABLE "credit_cards" ALTER COLUMN "last_known_rate_type" TYPE "InterestRateType_new" USING ("last_known_rate_type"::text::"InterestRateType_new");
ALTER TABLE "cc_purchases" ALTER COLUMN "interest_rate_type" TYPE "InterestRateType_new" USING ("interest_rate_type"::text::"InterestRateType_new");
ALTER TABLE "loans" ALTER COLUMN "interest_rate_type" TYPE "InterestRateType_new" USING ("interest_rate_type"::text::"InterestRateType_new");
ALTER TABLE "investments" ALTER COLUMN "interest_rate_type" TYPE "InterestRateType_new" USING ("interest_rate_type"::text::"InterestRateType_new");
ALTER TYPE "InterestRateType" RENAME TO "InterestRateType_old";
ALTER TYPE "InterestRateType_new" RENAME TO "InterestRateType";
DROP TYPE "public"."InterestRateType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "InvestmentType_new" AS ENUM ('CDT', 'SAVINGS_POCKET', 'OTHER');
ALTER TABLE "investments" ALTER COLUMN "type" TYPE "InvestmentType_new" USING ("type"::text::"InvestmentType_new");
ALTER TYPE "InvestmentType" RENAME TO "InvestmentType_old";
ALTER TYPE "InvestmentType_new" RENAME TO "InvestmentType";
DROP TYPE "public"."InvestmentType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LoanType_new" AS ENUM ('CONSUMER', 'MORTGAGE', 'PERSONAL', 'AGRICULTURAL', 'OTHER');
ALTER TABLE "loans" ALTER COLUMN "type" TYPE "LoanType_new" USING ("type"::text::"LoanType_new");
ALTER TYPE "LoanType" RENAME TO "LoanType_old";
ALTER TYPE "LoanType_new" RENAME TO "LoanType";
DROP TYPE "public"."LoanType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('TAX_THRESHOLD', 'PAYMENT_DUE', 'RECURRING_EXPENSE_DUE', 'RECURRING_EXPENSE_OVERDUE', 'SS_PAYMENT', 'RECONCILE_REMINDER', 'CDT_MATURITY', 'GMF_ALERT', 'PRIMA_REMINDER', 'ANT_EXPENSE_INSIGHT', 'MONTHLY_SUMMARY_EMAIL', 'REFERENCE_RATE_UPDATED', 'REFERENCE_RATE_PENDING', 'ENGAGEMENT_NUDGE', 'DBM_INFLOW_WARNING', 'DBM_OUTFLOW_WARNING', 'DBM_GMF_THRESHOLD', 'FISCAL_PARAMS_PENDING');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReferenceRateType_new" AS ENUM ('EA', 'MV', 'TV', 'NOMINAL_MONTHLY');
ALTER TABLE "reference_rates" ALTER COLUMN "rate_type" TYPE "ReferenceRateType_new" USING ("rate_type"::text::"ReferenceRateType_new");
ALTER TYPE "ReferenceRateType" RENAME TO "ReferenceRateType_old";
ALTER TYPE "ReferenceRateType_new" RENAME TO "ReferenceRateType";
DROP TYPE "public"."ReferenceRateType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WalletTransactionType_new" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER_OUT', 'TRANSFER_IN', 'CASH_WITHDRAWAL', 'CASH_DEPOSIT', 'GMF_TX', 'INVESTMENT_OUT', 'INVESTMENT_IN', 'ADJUSTMENT');
ALTER TABLE "wallet_transactions" ALTER COLUMN "type" TYPE "WalletTransactionType_new" USING ("type"::text::"WalletTransactionType_new");
ALTER TYPE "WalletTransactionType" RENAME TO "WalletTransactionType_old";
ALTER TYPE "WalletTransactionType_new" RENAME TO "WalletTransactionType";
DROP TYPE "public"."WalletTransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "income_records" DROP COLUMN "retencion_fuente",
ADD COLUMN     "withholding_tax" TEXT;

-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "is_4x1000_exempt",
ADD COLUMN     "is_gmf_exempt" BOOLEAN NOT NULL DEFAULT false;
