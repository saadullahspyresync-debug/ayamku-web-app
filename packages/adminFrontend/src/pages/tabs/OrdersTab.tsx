import React, { useState, useEffect } from "react";
import {
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrderStats,
  Order,
  updateOrder,
  updateOrderStatus,
} from "../../api/order";
import OrderTable from "../../components/orders/OrderTable";
import OrderDetailsModal from "../../components/orders/OrderDetailsModal";
import { toast } from "sonner";
import OrderStats from "../../components/orders/OrderStats";
import OrderFilters from "../../components/orders/OrderFilters";
import { getAllBranches } from "../../api/branch";
import { useAuth } from "../../contexts/AuthContext";

export default function OrdersTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [branches, setBranches] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 10;

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });

  const fetchBranches = async () => {
    try {
      const { data } = await getAllBranches();
      setBranches(data.data);
    } catch (err) {
      // console.log(err);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        pageSize,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (isAdmin && branchFilter !== "all") {
        params.branchId = branchFilter;
      }


      const response = await getAllOrders(params);

      setOrders(response.orders);
      setTotalOrders(response.total);
    } catch (error) {
      // console.log("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
    const fetchStats = async () => {
      try {
        const params: any = {};

        if (isAdmin && branchFilter !== "all") {
          params.branchId = branchFilter;
        }

        const statsData = await getOrderStats(params);
        setStats(statsData);
      } catch (err) {
        console.error(err);
      }
    };

  useEffect(() => {
    fetchOrders();
    fetchStats();

    if (isAdmin) {
      fetchBranches();
    }
  }, [currentPage, statusFilter, branchFilter, isAdmin]);


  // Handle view order details
  const handleViewOrder = async (orderId: string) => {
    try {
      const order = await getOrderById(orderId);
      
      setSelectedOrder(order);
      setIsDetailsModalOpen(true);
    } catch (error) {
      // console.log("Error fetching order details:", error);
      toast.error("Failed to load order details");
    }
  };

  // Handle status update
  const handleStatusUpdate = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      toast.success("Order status updated successfully");
      fetchOrders();
      fetchStats();

      // Update selected order if modal is open
      if (selectedOrder?.orderId === orderId) {
        const updatedOrder = await getOrderById(orderId);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      // console.log("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  // Handle delete order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      await deleteOrder(orderId);
      toast.success("Order deleted successfully");
      fetchOrders();
      fetchStats();
      setIsDetailsModalOpen(false);
    } catch (error) {
      // console.log("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  // Handle update order
  const handleUpdateOrder = async (orderId: string, updates: any) => {
    try {
      await updateOrder(orderId, updates);
      toast.success("Order updated successfully");
      fetchOrders();

      // Refresh order details
      const updatedOrder = await getOrderById(orderId);
      setSelectedOrder(updatedOrder);
    } catch (error) {
      // console.log("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <OrderStats stats={stats} />

      {/* Filters Section */}
      <OrderFilters
        branches={isAdmin ? branches : []}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        hideBranchFilter={!isAdmin}
      />


      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Order Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Total Orders: {totalOrders}
          </p>
        </div>

        <OrderTable
          orders={orders}
          loading={loading}
          onViewOrder={handleViewOrder}
          onStatusUpdate={handleStatusUpdate}
          onDeleteOrder={handleDeleteOrder}
        />

        {/* Pagination */}
        {totalOrders > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalOrders)} of {totalOrders}{" "}
              orders
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage * pageSize >= totalOrders}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onStatusUpdate={handleStatusUpdate}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      )}
    </div>
  );
}
