// Orders are now persisted on the backend (see lib/api/orderApi.ts).
// This module keeps the shared types that screens consume.

export type DeliveryMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'card';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  drugId: string;
  drugName: string;
  drugImage: string;
  formulation: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyLogo: string;
  items: OrderItem[];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  deliveryFee: number;
  deliveryDate?: string;
  comment?: string;
  recipientPhone?: string;
  promoCode?: string;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

/** Payload sent to POST /orders. Prices/totals are computed server-side. */
export interface CreateOrderPayload {
  pharmacyId: number;
  items: {drugId: number; quantity: number}[];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  addressId?: number;
  deliveryDate?: string;
  comment?: string;
  recipientPhone?: string;
}
