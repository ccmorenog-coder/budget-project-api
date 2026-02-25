-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPER_ADMIN', 'STATS_VIEWER');

-- CreateEnum
CREATE TYPE "UserMode" AS ENUM ('BASIC', 'DETAILED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('EMPLEADO', 'CONTRATISTA', 'PENSIONADO', 'INDEPENDIENTE');

-- CreateEnum
CREATE TYPE "SalaryFrequency" AS ENUM ('MONTHLY', 'BIWEEKLY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('BANK', 'CASH', 'DIGITAL', 'LOW_VALUE_DEPOSIT');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER_OUT', 'TRANSFER_IN', 'CASH_WITHDRAWAL', 'CASH_DEPOSIT', 'IMPUESTO_4X1000', 'INVESTMENT_OUT', 'INVESTMENT_IN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CashWithdrawalChannel" AS ENUM ('ATM', 'CORRESPONSAL', 'VENTANILLA', 'OTRO');

-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('SALARIO', 'PRIMA', 'COMISION', 'AUXILIO_TRANSPORTE_LEGAL', 'AUXILIO_CONECTIVIDAD_LEGAL', 'AUXILIO_CONECTIVIDAD_EXTRALEGAL', 'HONORARIOS', 'PENSION', 'INCAPACIDAD', 'VACACIONES', 'OTRO');

-- CreateEnum
CREATE TYPE "RecurrencePeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER');

-- CreateEnum
CREATE TYPE "InterestRateType" AS ENUM ('EA', 'MV', 'TV', 'NOMINAL_MENSUAL', 'OTRO');

-- CreateEnum
CREATE TYPE "RateSource" AS ENUM ('USER_INPUT', 'ADMIN_REFERENCE', 'RECONCILIATION');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('FIXED', 'RATE_ON_BALANCE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('CONSUMO', 'VIVIENDA', 'LIBRE_INVERSION', 'AGROPECUARIO', 'OTRO');

-- CreateEnum
CREATE TYPE "AmortizationType" AS ENUM ('FRENCH', 'GERMAN');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL', 'IRREGULAR');

-- CreateEnum
CREATE TYPE "InvestmentType" AS ENUM ('CDT', 'BOLSILLO_AHORRO', 'OTRO');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "FinancialEntityType" AS ENUM ('BANCO', 'COOPERATIVA', 'FINTECH', 'OTRO');

-- CreateEnum
CREATE TYPE "ReferenceRateType" AS ENUM ('EA', 'MV', 'TV', 'NOMINAL_MENSUAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TAX_THRESHOLD', 'PAYMENT_DUE', 'RECURRING_EXPENSE_DUE', 'RECURRING_EXPENSE_OVERDUE', 'SS_PAYMENT', 'RECONCILE_REMINDER', 'CDT_MATURITY', 'FOURX1000_ALERT', 'PRIMA_REMINDER', 'ANT_EXPENSE_INSIGHT', 'MONTHLY_SUMMARY_EMAIL', 'REFERENCE_RATE_UPDATED', 'REFERENCE_RATE_PENDING', 'ENGAGEMENT_NUDGE', 'DBM_INFLOW_WARNING', 'DBM_OUTFLOW_WARNING', 'DBM_GMF_THRESHOLD', 'FISCAL_PARAMS_PENDING');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('SELECT', 'INSERT', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('CORRECTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ReconciliationDiffType" AS ENUM ('UNREGISTERED_EXPENSE', 'UNREGISTERED_INCOME', 'BANK_COMMISSION', 'GMF_NOT_RECORDED', 'CDT_PENDING', 'ROUNDING_ERROR', 'UNIDENTIFIED_FAVORABLE', 'UNIDENTIFIED_UNFAVORABLE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "user_mode" "UserMode" NOT NULL DEFAULT 'BASIC',
    "encryption_key_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation_tokens" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "contract_type" "ContractType",
    "gross_salary" TEXT,
    "net_salary" TEXT,
    "integral_salary" BOOLEAN NOT NULL DEFAULT false,
    "has_dependents" BOOLEAN NOT NULL DEFAULT false,
    "prepaid_medicine" BOOLEAN NOT NULL DEFAULT false,
    "salary_frequency" "SalaryFrequency" NOT NULL DEFAULT 'MONTHLY',
    "salary_payment_day" INTEGER,
    "salary_payment_day_2" INTEGER,
    "salary_payment_day_last_business" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "profile_level" "UserMode" NOT NULL DEFAULT 'BASIC',
    "active_employment_period_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_periods" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employer_name" TEXT NOT NULL,
    "contract_start_date" DATE NOT NULL,
    "contract_end_date" DATE,
    "gross_salary" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_parameters" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value_pesos" DECIMAL(18,6),
    "value_uvt" DECIMAL(10,4),
    "is_uvt_based" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glossary_terms" (
    "id" UUID NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "context" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glossary_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_entities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "entity_type" "FinancialEntityType" NOT NULL,
    "nit" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_rates" (
    "id" UUID NOT NULL,
    "period_month" DATE NOT NULL,
    "rate_value" DECIMAL(10,6) NOT NULL,
    "rate_type" "ReferenceRateType" NOT NULL,
    "source" TEXT,
    "entity_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reference_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WalletType" NOT NULL,
    "account_number" TEXT,
    "bank_name" TEXT,
    "is_4x1000_exempt" BOOLEAN NOT NULL DEFAULT false,
    "current_balance" TEXT NOT NULL DEFAULT '0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_low_value_deposit" BOOLEAN NOT NULL DEFAULT false,
    "monthly_inflow_limit_uvt" DECIMAL(8,2) NOT NULL DEFAULT 210.5,
    "monthly_outflow_limit_uvt" DECIMAL(8,2) NOT NULL DEFAULT 210.5,
    "gmf_exempt_limit_uvt" DECIMAL(8,2) NOT NULL DEFAULT 65,
    "monthly_inflow_used" TEXT NOT NULL DEFAULT '0',
    "monthly_outflow_used" TEXT NOT NULL DEFAULT '0',
    "gmf_outflow_used" TEXT NOT NULL DEFAULT '0',
    "reset_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pockets" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount" TEXT,
    "current_amount" TEXT NOT NULL DEFAULT '0',
    "goal_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pockets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" DATE NOT NULL,
    "destination_wallet_id" UUID,
    "linked_tx_id" UUID,
    "cash_withdrawal_channel" "CashWithdrawalChannel",
    "gmf_applied" BOOLEAN NOT NULL DEFAULT false,
    "gmf_amount" TEXT,
    "reference_id" UUID,
    "reference_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "level" INTEGER NOT NULL DEFAULT 1,
    "icon" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period_month" DATE NOT NULL,
    "income_type" "IncomeType" NOT NULL,
    "is_transport_aid" BOOLEAN NOT NULL DEFAULT false,
    "is_constitutive_prima" BOOLEAN NOT NULL DEFAULT false,
    "is_variable" BOOLEAN NOT NULL DEFAULT false,
    "gross_amount" TEXT NOT NULL,
    "net_amount" TEXT,
    "ibc" TEXT,
    "health_deduction" TEXT,
    "pension_deduction" TEXT,
    "fsp_deduction" TEXT,
    "retencion_fuente" TEXT,
    "variable_income_notes" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "wallet_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_expenses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "estimated_amount" TEXT NOT NULL,
    "category_id" UUID,
    "recurrence_period" "RecurrencePeriod" NOT NULL DEFAULT 'MONTHLY',
    "estimated_day" INTEGER,
    "wallet_id" UUID NOT NULL,
    "is_ant_expense" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "linked_credit_card_id" UUID,
    "linked_loan_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "category_id" UUID,
    "effective_date" DATE NOT NULL,
    "estimated_date" DATE,
    "recurring_expense_id" UUID,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'TRANSFER',
    "wallet_id" UUID NOT NULL,
    "is_ant_expense" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "last_four_digits" TEXT,
    "financial_entity_id" UUID,
    "bank_name" TEXT,
    "credit_limit" TEXT,
    "last_known_rate" DECIMAL(10,6),
    "last_known_rate_type" "InterestRateType",
    "cut_day" INTEGER NOT NULL,
    "payment_day" INTEGER NOT NULL,
    "has_management_fee" BOOLEAN NOT NULL DEFAULT false,
    "management_fee_amount" TEXT,
    "has_insurance" BOOLEAN NOT NULL DEFAULT false,
    "insurance_monthly_amount" TEXT,
    "insurance_rate" DECIMAL(8,6),
    "insurance_type" "InsuranceType" NOT NULL DEFAULT 'UNKNOWN',
    "current_balance" TEXT NOT NULL DEFAULT '0',
    "estimated_next_payment" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cc_purchases" (
    "id" UUID NOT NULL,
    "credit_card_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "purchase_date" DATE NOT NULL,
    "billing_period" DATE,
    "billing_period_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "near_cutoff" BOOLEAN NOT NULL DEFAULT false,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "installments_paid" INTEGER NOT NULL DEFAULT 0,
    "interest_rate" DECIMAL(10,6),
    "interest_rate_type" "InterestRateType",
    "interest_rate_tem" DECIMAL(10,8),
    "rate_source" "RateSource" NOT NULL DEFAULT 'USER_INPUT',
    "rate_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "interest_assumed" BOOLEAN NOT NULL DEFAULT true,
    "first_payment_date" DATE,
    "first_payment_amount" TEXT,
    "first_payment_prorated" BOOLEAN NOT NULL DEFAULT false,
    "category_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cc_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cc_statements" (
    "id" UUID NOT NULL,
    "credit_card_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "statement_balance" TEXT NOT NULL,
    "payment_made" TEXT,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciled_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cc_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cc_change_history" (
    "id" UUID NOT NULL,
    "credit_card_id" UUID,
    "cc_purchase_id" UUID,
    "changed_by" UUID NOT NULL,
    "change_type" "ChangeType" NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cc_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "LoanType" NOT NULL,
    "financial_entity_id" UUID,
    "entity_name" TEXT,
    "original_amount" TEXT NOT NULL,
    "outstanding_balance" TEXT NOT NULL,
    "installment_amount" TEXT,
    "remaining_term_months" INTEGER,
    "interest_rate" DECIMAL(10,6),
    "interest_rate_type" "InterestRateType",
    "amortization_type" "AmortizationType",
    "payment_frequency" "PaymentFrequency" NOT NULL DEFAULT 'MONTHLY',
    "payment_day" INTEGER,
    "first_payment_date" DATE,
    "first_payment_amount" TEXT,
    "first_payment_prorated" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "start_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_amortization" (
    "id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "period_number" INTEGER NOT NULL,
    "payment_date" DATE NOT NULL,
    "payment" TEXT NOT NULL,
    "principal" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_amortization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "InvestmentType" NOT NULL,
    "financial_entity_id" UUID,
    "entity_name" TEXT,
    "initial_amount" TEXT NOT NULL,
    "open_date" DATE NOT NULL,
    "close_date" DATE,
    "interest_rate" DECIMAL(10,6),
    "interest_rate_type" "InterestRateType",
    "expected_interest" TEXT,
    "actual_interest" TEXT,
    "expected_final_amount" TEXT,
    "actual_final_amount" TEXT,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "wallet_id" UUID NOT NULL,
    "destination_wallet_id" UUID,
    "recurring_expense_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_flows" (
    "id" UUID NOT NULL,
    "investment_id" UUID NOT NULL,
    "flow_date" DATE NOT NULL,
    "amount" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "period_date" DATE NOT NULL,
    "system_balance" TEXT NOT NULL,
    "extract_balance" TEXT NOT NULL,
    "delta" TEXT NOT NULL,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciled_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_items" (
    "id" UUID NOT NULL,
    "reconciliation_id" UUID NOT NULL,
    "difference_amount" TEXT NOT NULL,
    "difference_type" "ReconciliationDiffType" NOT NULL,
    "notes" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "auto_dismiss" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "table_name" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "record_id" UUID,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_tokens_token_key" ON "invitation_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_parameters_year_key_key" ON "fiscal_parameters"("year", "key");

-- CreateIndex
CREATE UNIQUE INDEX "app_config_key_key" ON "app_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "glossary_terms_term_key" ON "glossary_terms"("term");

-- CreateIndex
CREATE UNIQUE INDEX "reference_rates_period_month_rate_type_key" ON "reference_rates"("period_month", "rate_type");

-- AddForeignKey
ALTER TABLE "invitation_tokens" ADD CONSTRAINT "invitation_tokens_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_periods" ADD CONSTRAINT "employment_periods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glossary_terms" ADD CONSTRAINT "glossary_terms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entities" ADD CONSTRAINT "financial_entities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_rates" ADD CONSTRAINT "reference_rates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_rates" ADD CONSTRAINT "reference_rates_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "financial_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pockets" ADD CONSTRAINT "pockets_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_destination_wallet_id_fkey" FOREIGN KEY ("destination_wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_linked_tx_id_fkey" FOREIGN KEY ("linked_tx_id") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_records" ADD CONSTRAINT "income_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_linked_credit_card_id_fkey" FOREIGN KEY ("linked_credit_card_id") REFERENCES "credit_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_linked_loan_id_fkey" FOREIGN KEY ("linked_loan_id") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurring_expense_id_fkey" FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_financial_entity_id_fkey" FOREIGN KEY ("financial_entity_id") REFERENCES "financial_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cc_purchases" ADD CONSTRAINT "cc_purchases_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cc_statements" ADD CONSTRAINT "cc_statements_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cc_change_history" ADD CONSTRAINT "cc_change_history_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cc_change_history" ADD CONSTRAINT "cc_change_history_cc_purchase_id_fkey" FOREIGN KEY ("cc_purchase_id") REFERENCES "cc_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_financial_entity_id_fkey" FOREIGN KEY ("financial_entity_id") REFERENCES "financial_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_amortization" ADD CONSTRAINT "loan_amortization_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_financial_entity_id_fkey" FOREIGN KEY ("financial_entity_id") REFERENCES "financial_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_destination_wallet_id_fkey" FOREIGN KEY ("destination_wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_recurring_expense_id_fkey" FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_flows" ADD CONSTRAINT "investment_flows_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "reconciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
