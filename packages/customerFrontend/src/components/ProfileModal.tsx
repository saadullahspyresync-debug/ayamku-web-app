import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  User,
  Gift,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchPointsBalance, getMyOrders, fetchBranchById, fetchItemById } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { OrderFilterBar } from "./OrderFilterBar";
import { useCartStore } from "@/store/cartStore";
import { Button } from "./ui/button";

const ProfileModal = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [orderHistory, setOrderHistory] = useState([]);
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [branchName, setBranchName] = useState("")
  const { isAuthenticated, logout } = useAuth();
  const [reOrder, setReOrder] = useState([])
  const [filters, setFilters] = useState({
    status: "all",
    startDate: null as string | null,
    endDate: null as string | null,
  });
  const { addItem } = useCartStore();

  const navigate = useNavigate();

  // Fetch data when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      fetchPointsData();

      if (activeTab === "orders") {
        fetchOrderHistory();
      }
    }
  }, [isOpen, activeTab]);


  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      const response = await fetchPointsBalance();
      setPointsData(response);
    } catch (error) {
      console.error("Failed to fetch points data:", error);
      toast.error("Failed to load points data");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);

      // ✅ Fetch real order data
      const orders = await getMyOrders();
      setReOrder(orders)
        
      // Fetch branch details
      const branchName = await fetchBranchById(orders[0].branchId);
      setBranchName(branchName?.name)

      // Map to UI format
      const formatted = orders.map((o) => ({
        id: o.orderId,
        date: new Date(o.createdAt).toISOString(),
        items: o.items.length,
        quantity: o.items[0].quantity,
        total: o.totalPrice,
        status: o.status,
        // branch: o?.branchId || "N/A",
      }));
      setOrderHistory(formatted);

    } catch (error) {
      console.error("Failed to fetch order history:", error);
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orderHistory.filter((order) => {
      // Status filter
      if (filters.status !== "all" && order.status !== filters.status) {
        return false;
      }

      // Date filter
      const orderDate = new Date(order.date).getTime();

      if (filters.startDate) {
        if (orderDate < new Date(filters.startDate).getTime()) {
          return false;
        }
      }

      if (filters.endDate) {
        if (orderDate > new Date(filters.endDate).getTime()) {
          return false;
        }
      }

      return true;
    });
  }, [orderHistory, filters]);

  const handleBrowseRewards = () => {
    onClose();
    navigate("/rewards");
  };

  if (!isOpen) return null;

  const pointsBalance = pointsData?.totalPoints || user?.points || 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleReorderClick = async(id: string) => {
    setLoading(true)
    const order = reOrder.find((o) => o.orderId === id);

    // fetching item for image
    const itemID = order.items[0].itemId;
    const idItem = await fetchItemById(itemID).then((res) => res)

    // add item into cart
    if(idItem){
      addItem({
      itemId: order.items[0].itemId,
      id: order.items[0].itemId,
      name: order.items[0].name,
      price: order.items[0].price,
      images: idItem?.images.length > 0
        ? [idItem?.images[0]]
        : ["/assets/images/placeholder.png"], 
      // description: order.description,
      _id: order?.items[0]?.itemId || Math.random().toString(),
      stock: order?.stock,
      isCombo: false,
      // comboItems: [],
      loyaltyPoints: order?.items[0]?.loyaltyPoints || 0,
      stockStatus: order?.items[0]?.stockStatus,
      status: order?.items[0]?.status,
      categoryId: order?.items[0]?.categoryId,
      availableBranches: order?.items[0]?.availableBranches,
    })
    }
    navigate('/cart')
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-10 mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <User className="text-red-500" size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {user?.name || user?.username || "User"}
              </h2>
              <p className="text-red-100">{user?.email}</p>
            </div>
          </div>

          {/* Points Card */}
          <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Gift className="text-red-500" size={24} />
              </div>
              <div>
                <p className="text-red-100 text-sm">Points Balance</p>
                <p className="text-2xl font-bold">
                  {pointsBalance.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleBrowseRewards}
              className="px-4 py-2 bg-white text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Redeem
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === "profile"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("points")}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === "points"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Points
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === "orders"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Orders
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === "profile" ? (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <User className="text-gray-400 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-semibold text-gray-900">
                      {user?.name || user?.username || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="text-gray-400 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">
                      {user?.email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="text-gray-400 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-900">
                      {user?.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="text-gray-400 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-semibold text-gray-900">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div> */}
              </div>

              <button onClick={handleLogout} className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors">
                Logout
              </button>
            </div>
          ) : activeTab === "points" ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Your Points Balance</p>
                    <p className="text-4xl font-bold mt-1">
                      {pointsBalance.toLocaleString()}
                    </p>
                  </div>
                  <Award size={48} className="opacity-80" />
                </div>
                <p className="text-sm mt-4 opacity-90">
                  Redeem your points for amazing rewards!
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
                </div>
              ) : (
                <>
                  {pointsData?.transactions &&
                    pointsData.transactions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Recent Transactions
                        </h4>
                        <div className="space-y-2">
                          {pointsData.transactions
                            .slice(0, 10)
                            .map((transaction) => (
                              <div
                                key={transaction.transactionId}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  {transaction.type === "earn" ? (
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                      <span className="text-green-600 text-sm font-bold">
                                        +
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                      <span className="text-red-600 text-sm font-bold">
                                        -
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {transaction.description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(
                                        transaction.createdAt
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`font-bold ${
                                    transaction.points > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {transaction.points > 0 ? "+" : ""}
                                  {transaction.points}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {pointsData?.redemptions &&
                    pointsData.redemptions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Redemption History
                        </h4>
                        <div className="space-y-2">
                          {pointsData.redemptions.map((redemption) => (
                            <div
                              key={redemption.redemptionId}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {redemption.redeemableName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    redemption.redeemedAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-orange-600">
                                  {redemption.pointsCost} pts
                                </p>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    redemption.status === "claimed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {redemption.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <button
                    onClick={handleBrowseRewards}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Browse Rewards
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div>
                <OrderFilterBar
                  filters={filters}
                  onChange={setFilters}
                />
              </div>
              <div className="space-y-4 mt-4">              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No order history yet</p>
                </div>
              ) : (                
                filteredOrders.map((order) => (  
                                                
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-900">
                          Order # {order.id.slice(6, 19)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>                      
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <MapPin size={16} />
                        <span>{branchName}</span>
                      </div>  
                      <div>                        
                        <Button
                          onClick={() => handleReorderClick(order.id)}
                          disabled={loading}
                          className=" bg-ayamku-primary text-white border-ayamku-primary px-3 py-1 rounded"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Re-ordering...</span>
                            </>
                          ) : (
                            <>                              
                              <span>Re-order</span>
                            </>
                          )}
                        </Button>                        
                      </div> 
                    </div>                

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        {order.quantity} items
                      </p>
                      <p className="font-bold text-red-500">
                        {/* {formatCurrency(order.total)} */}
                        ${order.total}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            </>
            
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
