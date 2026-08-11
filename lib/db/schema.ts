import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  numeric,
  date,
  jsonb,
} from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Better Auth tables (column names must stay camelCase to match Better Auth)
// ---------------------------------------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("Sales"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// ---------------------------------------------------------------------------
// Application tables (CRM + ERP)
// ---------------------------------------------------------------------------
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  businessName: text("businessName"),
  gstNumber: text("gstNumber"),
  customerType: text("customerType").notNull().default("Retail"),
  address: text("address"),
  status: text("status").notNull().default("Lead"),
  followUpDate: date("followUpDate"),
  notes: text("notes"),
  createdBy: text("createdBy").notNull(),
  createdByName: text("createdByName"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const customerNotes = pgTable("customer_notes", {
  id: serial("id").primaryKey(),
  customerId: integer("customerId").notNull(),
  note: text("note").notNull(),
  followUpDate: date("followUpDate"),
  createdBy: text("createdBy").notNull(),
  createdByName: text("createdByName"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category"),
  unitPrice: numeric("unitPrice", { precision: 12, scale: 2 }).notNull().default("0"),
  currentStock: integer("currentStock").notNull().default(0),
  minStockAlert: integer("minStockAlert").notNull().default(0),
  location: text("location"),
  createdBy: text("createdBy").notNull(),
  createdByName: text("createdByName"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  productName: text("productName"),
  quantity: integer("quantity").notNull(),
  movementType: text("movementType").notNull(), // 'IN' | 'OUT'
  reason: text("reason"),
  createdBy: text("createdBy").notNull(),
  createdByName: text("createdByName"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const challans = pgTable("challans", {
  id: serial("id").primaryKey(),
  challanNumber: text("challanNumber").notNull().unique(),
  customerId: integer("customerId").notNull(),
  customerName: text("customerName").notNull(),
  customerSnapshot: jsonb("customerSnapshot"),
  totalQuantity: integer("totalQuantity").notNull().default(0),
  totalAmount: numeric("totalAmount", { precision: 12, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("Draft"),
  createdBy: text("createdBy").notNull(),
  createdByName: text("createdByName"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const challanItems = pgTable("challan_items", {
  id: serial("id").primaryKey(),
  challanId: integer("challanId").notNull(),
  productId: integer("productId").notNull(),
  productName: text("productName").notNull(),
  productSku: text("productSku").notNull(),
  unitPrice: numeric("unitPrice", { precision: 12, scale: 2 }).notNull().default("0"),
  quantity: integer("quantity").notNull(),
})
