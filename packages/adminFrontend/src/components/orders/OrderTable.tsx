// src/components/orders/OrderTable.tsx

import React from "react";
import { Eye, Trash2, MoreVertical, ShoppingBag } from "lucide-react";
import { Order } from "../../api/order";
import item from "../../api/item";

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  onViewOrder: (orderId: string) => void;
  onStatusUpdate: (orderId: string, status: Order['status']) => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function OrderTable({
  orders,
  loading,
  onViewOrder,
  onStatusUpdate,
  onDeleteOrder,
}: OrderTableProps) {
  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          statusConfig[status]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

//   const getPaymentStatusBadge = (status: string) => {
//     const statusConfig = {
//       paid: "bg-green-100 text-green-800",
//       pending: "bg-yellow-100 text-yellow-800",
//       failed: "bg-red-100 text-red-800",
//     };

//     return (
//       <span
//         className={`px-2 py-1 rounded text-xs font-medium ${
//           statusConfig[status as keyof typeof statusConfig]
//         }`}
//       >
//         {status.charAt(0).toUpperCase() + status.slice(1)}
//       </span>
//     );
//   };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No orders found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }


  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Branch
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.orderId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  #{order.orderId.slice(6, 19)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {order.user?.fullName}
                </div>
                <div className="text-sm text-gray-500">
                  {order?.customerEmail}
                </div>
                <div className="text-sm text-gray-500">
                  {order?.customerPhone}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {order?.branch?.name || "N/A"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {order.items.length} items
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                  ${order?.totalPrice}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {getStatusBadge(order?.status)}
                  <select
                    value={order?.status}
                    onChange={(e) =>
                      onStatusUpdate(order?.orderId, e.target.value as Order['status'])
                    }
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </td>
              {/* <td className="px-6 py-4 whitespace-nowrap">
                {getPaymentStatusBadge(order.paymentStatus)}
              </td> */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDate(order?.createdAt)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewOrder(order?.orderId)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDeleteOrder(order?.orderId)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Order"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}