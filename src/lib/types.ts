/** Shared client/server types for KAVANA storefront */

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  image: string | null;
  categoryName?: string;
  categorySlug?: string;
  avgRating?: number | null;
  reviewCount?: number;
  soldCount?: number;
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  address: string | null;
  city: string | null;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  categoryName: string;
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "COMPLETED",
];
