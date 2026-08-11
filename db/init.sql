CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "role" text NOT NULL DEFAULT 'Sales',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope" text,
  "password" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "mobile" text NOT NULL,
  "email" text,
  "businessName" text,
  "gstNumber" text,
  "customerType" text NOT NULL DEFAULT 'Retail',
  "address" text,
  "status" text NOT NULL DEFAULT 'Lead',
  "followUpDate" date,
  "notes" text,
  "createdBy" text NOT NULL,
  "createdByName" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "customer_notes" (
  "id" serial PRIMARY KEY,
  "customerId" integer NOT NULL,
  "note" text NOT NULL,
  "followUpDate" date,
  "createdBy" text NOT NULL,
  "createdByName" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "sku" text NOT NULL UNIQUE,
  "category" text,
  "unitPrice" numeric(12,2) NOT NULL DEFAULT 0,
  "currentStock" integer NOT NULL DEFAULT 0,
  "minStockAlert" integer NOT NULL DEFAULT 0,
  "location" text,
  "createdBy" text NOT NULL,
  "createdByName" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" serial PRIMARY KEY,
  "productId" integer NOT NULL,
  "productName" text,
  "quantity" integer NOT NULL,
  "movementType" text NOT NULL,
  "reason" text,
  "createdBy" text NOT NULL,
  "createdByName" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "challans" (
  "id" serial PRIMARY KEY,
  "challanNumber" text NOT NULL UNIQUE,
  "customerId" integer NOT NULL,
  "customerName" text NOT NULL,
  "customerSnapshot" jsonb,
  "totalQuantity" integer NOT NULL DEFAULT 0,
  "totalAmount" numeric(12,2) NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'Draft',
  "createdBy" text NOT NULL,
  "createdByName" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "challan_items" (
  "id" serial PRIMARY KEY,
  "challanId" integer NOT NULL,
  "productId" integer NOT NULL,
  "productName" text NOT NULL,
  "productSku" text NOT NULL,
  "unitPrice" numeric(12,2) NOT NULL DEFAULT 0,
  "quantity" integer NOT NULL
);
