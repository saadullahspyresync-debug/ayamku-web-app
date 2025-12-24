// src/components/orders/OrderDetailsModal.tsx
import React, { useState } from "react";
import { X, Edit2, Save, MapPin, Phone, Mail, CreditCard, Calendar } from "lucide-react";
import { Order } from "../../api/order";

interface OrderDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: Order['status']) => void;
  onUpdateOrder: (orderId: string, updates: any) => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  onUpdateOrder,
  onDeleteOrder,
}: OrderDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState(order);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateOrder(order.orderId, {
      customerName: editedOrder.customerName,
      customerEmail: editedOrder.customerEmail,
      customerPhone: editedOrder.customerPhone,
      deliveryAddress: editedOrder.deliveryAddress,
      notes: editedOrder.notes,
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: "text-yellow-600 bg-yellow-50",
      completed: "text-blue-600 bg-blue-50",
      cancelled: "text-red-600 bg-red-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-50"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Order Details
                </h3>
                <p className="text-red-100 text-sm mt-1">
                  Order ID: #{order.orderId}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-500 rounded-xl hover:bg-red-50 transition-colors shadow-md"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedOrder(order);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors shadow-md"
                    >
                      Cancel
                    </button>
                </>
                )}
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Status and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Order Status
                </label>
                <select
                  value={order.status}
                  onChange={(e) =>
                    onStatusUpdate(order.orderId, e.target.value as Order['status'])
                  }
                  className={`w-full px-4 py-2 rounded-xl font-semibold ${getStatusColor(
                    order.status
                  )} border-2 border-transparent focus:border-red-500 focus:outline-none`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  Order Date
                </div>
                <p className="text-gray-900 font-semibold">
                  {new Date(order.orderDate).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Customer Info</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedOrder.customerName}
                      onChange={(e) =>
                        setEditedOrder({ ...editedOrder, customerName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="text-gray-900">{order.customerName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedOrder.customerEmail}
                      onChange={(e) =>
                        setEditedOrder({ ...editedOrder, customerEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="text-gray-900">{order.customerEmail}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedOrder.customerPhone}
                      onChange={(e) =>
                        setEditedOrder({ ...editedOrder, customerPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="text-gray-900">{order.customerPhone}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedOrder.deliveryAddress || ""}
                      onChange={(e) =>
                        setEditedOrder({ ...editedOrder, deliveryAddress: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="text-gray-900">{order.deliveryAddress || "N/A"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Item
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-center text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-2 text-right text-gray-900">${item.price}</td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900">${item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="text-gray-900 font-medium">${order.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax:</span>
                  <span className="text-gray-900 font-medium">${order.tax}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span>Total:</span>
                  <span className="text-red-500">${order.totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                  <CreditCard className="w-4 h-4" />
                  Payment Method
                </label>
                <p className="text-gray-900">{order.paymentMethod}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Payment Status</label>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : order.paymentStatus === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {/* {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} */}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Order Notes</h4>
              {isEditing ? (
                <textarea
                  value={editedOrder.notes || ""}
                  onChange={(e) => setEditedOrder({ ...editedOrder, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Add notes..."
                />
              ) : (
                <p className="text-gray-900">{order.notes || "No notes available"}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this order?")) {
                  onDeleteOrder(order.orderId);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-md"
            >
              Delete Order
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
