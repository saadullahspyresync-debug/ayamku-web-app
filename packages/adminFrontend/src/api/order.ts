// src/services/orderService.ts
import api from "./api";
import { Branch } from "./branch";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  branch: Branch;
  branchId: string;
  branchName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalPrice: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderDate: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: any;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpdateStatusPayload {
  status: Order['status'];
  notes?: string;
}

export interface UpdateOrderPayload {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  status?: Order['status'];
}

// Fetch all orders
export const getAllOrders = async (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  branchId?: string;
}): Promise<OrdersResponse> => {
  const response = await api.get('/admin/orders', { params });
  return response.data.data;
};

// Fetch single order by ID
export const getOrderById = async (id: string): Promise<Order> => {
  const response = await api.get(`/admin/orders/${id}`);
  return response.data.data;
};

// Update order status
export const updateOrderStatus = async (id: string, payload: UpdateStatusPayload): Promise<Order> => {
  const response = await api.patch(`/admin/orders/${id}/status`, payload);
  return response.data;
};

// Update order details
export const updateOrder = async (id: string, payload: UpdateOrderPayload): Promise<Order> => {
  const response = await api.put(`/admin/orders/${id}`, payload);
  return response.data;
};

// Delete order
export const deleteOrder = async (id: string): Promise<void> => {
  await api.delete(`/admin/orders/${id}`);
};

// Get order statistics
export const getOrderStats = async (): Promise<{
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}> => {
  const response = await api.get('/admin/orders-stats');
  return response.data;
};
