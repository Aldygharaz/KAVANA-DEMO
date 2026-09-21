/** Shared types for KAVANA admin panel (client-safe) */

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  image: string | null;
  categoryName?: string;
  categorySlug?: string;
  avgRating?: number | null;
  reviewCount?: number;
  featured?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AdminOrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: import("@/lib/types").OrderStatus;
  customerName: string;
  userEmail: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string | null;
  notes: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  promoCode: string | null;
  total: number;
  paymentMethod: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminStats {
  revenue: number;
  ordersCount: number;
  customersCount: number;
  productsCount: number;
  lowStockProducts: { id: string; name: string; stock: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; qtySold: number; revenue: number }[];
  statusDistribution: { status: import("@/lib/types").OrderStatus; count: number }[];
  revenueByCategory: { name: string; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: import("@/lib/types").OrderStatus;
    createdAt: string;
  }[];
}
