export type CustomerRow = {
  id: number
  name: string
  mobile: string
  email: string | null
  businessName: string | null
  gstNumber: string | null
  customerType: string
  address: string | null
  status: string
  followUpDate: string | null
  notes: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type CustomerNoteRow = {
  id: number
  customerId: number
  note: string
  followUpDate: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string | Date
}

export type ProductRow = {
  id: number
  name: string
  sku: string
  category: string | null
  unitPrice: string
  currentStock: number
  minStockAlert: number
  location: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type StockMovementRow = {
  id: number
  productId: number
  productName: string | null
  quantity: number
  movementType: string
  reason: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string | Date
}

export type ChallanRow = {
  id: number
  challanNumber: string
  customerId: number
  customerName: string
  customerSnapshot: {
    name?: string
    mobile?: string
    businessName?: string | null
    gstNumber?: string | null
    address?: string | null
  } | null
  totalQuantity: number
  totalAmount: string
  status: string
  createdBy: string
  createdByName: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type ChallanItemRow = {
  id: number
  challanId: number
  productId: number
  productName: string
  productSku: string
  unitPrice: string
  quantity: number
}

export const CUSTOMER_STATUSES = ["Lead", "Prospect", "Customer", "Inactive"] as const
export const CUSTOMER_TYPES = ["Retail", "Wholesale", "Distributor", "Corporate"] as const
