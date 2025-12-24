// src/pages/Rewards.tsx
import React, { useEffect, useState } from "react";
import {
  Gift,
  Award,
  Clock,
  MapPin,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchStore } from "@/store/branchStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  fetchPointsBalance,
  fetchRedeemables,
  getPointsConfig,
  redeemPointsForItem,
} from "@/services/api";
import RedemptionSuccessModal from "@/components/RedemptionSuccessModal";

interface RedeemableItem {
  redeemableId: string;
  name: string;
  description: string;
  pointsCost: number;
  image: Array<{ url: string; alt?: string }>;
  status: string;
  branchId: string;
  branchName?: string;
  availableQuantity?: number;
  redeemedCount: number;
  expiresAt?: number;
}

interface PointsBalance {
  totalPoints: number;
  transactions: any[];
  redemptions: any[];
}

const Rewards: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { selectedBranch } = useBranchStore();
  const navigate = useNavigate();

  const [redeemableItems, setRedeemableItems] = useState([]);
  const [pointsBalance, setPointsBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RedeemableItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redemptionDetails, setRedemptionDetails] = useState<any>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [minRedemptionPoints, setMinRedemptionPoints] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, selectedBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available rewards
      const rewardsResponse = await fetchRedeemables(selectedBranch?.branchId);
      setRedeemableItems(rewardsResponse || []);

      // Fetch user's points balance
      const balanceResponse = await fetchPointsBalance();
      setPointsBalance(balanceResponse || null);

      // Fetch points config
      const configResponse = await getPointsConfig();
      setMinRedemptionPoints(configResponse?.minRedemptionPoints || 400);
    } catch (error) {
      console.error("Failed to load rewards:", error);
      toast.error("Failed to load rewards");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemClick = (item: RedeemableItem) => {
    if (!pointsBalance) return;

    if (pointsBalance.totalPoints < minRedemptionPoints) {
      toast.error(
        `You need at least ${minRedemptionPoints} points to redeem rewards. You currently have ${pointsBalance.totalPoints}.`
      );
      return;
    }

    if (pointsBalance.totalPoints < item.pointsCost) {
      toast.error(
        `You need ${
          item.pointsCost - pointsBalance.totalPoints
        } more points to redeem this item`
      );
      return;
    }

    setSelectedItem(item);
    setShowConfirmModal(true);
  };

  const confirmRedeem = async () => {
    if (!selectedItem) return;

    try {
      setRedeeming(selectedItem.redeemableId);
      const response = await redeemPointsForItem(selectedItem.redeemableId);
      const redemption = response.data.redemptions?.[0];
      // Calculate new balance
      const updatedBalance =
        (pointsBalance?.totalPoints || 0) - selectedItem.pointsCost;

      // Save redemption details
      setRedemptionDetails({
        redemptionId: redemption.redemptionId, // <- make sure your API returns this
        redeemableName: selectedItem.name,
        pointsCost: selectedItem.pointsCost,
        branchId: selectedItem.branchId,
        expiresAt: selectedItem.expiresAt,
      });

      // Show success modal
      setNewBalance(updatedBalance);
      setShowSuccessModal(true);

      // Close confirm modal
      setShowConfirmModal(false);
      setSelectedItem(null);

      // Refresh balance & redemptions after delay
      setTimeout(() => fetchData(), 2000);
    } catch (error: any) {
      console.error("Redemption error:", error);
      toast.error(error.response?.data?.message || "Failed to redeem item");
    } finally {
      setRedeeming(null);
    }
  };

  const canRedeem = (item: RedeemableItem) => {
    if (!pointsBalance) return false;
    return (
      pointsBalance.totalPoints >= minRedemptionPoints &&
      pointsBalance.totalPoints >= item.pointsCost
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Rewards Center</h1>
              <p className="text-red-100">
                Redeem your points for amazing rewards!
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center min-w-[200px]">
              <div className="flex items-center justify-center mb-2">
                <Award size={32} />
              </div>
              <p className="text-sm opacity-90">Your Points</p>
              <p className="text-4xl font-bold">
                {pointsBalance?.totalPoints?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <Gift className="text-blue-600 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900">How it works</h3>
              <p className="text-sm text-blue-700">
                Earn points with every purchase and redeem them for free items.
                Show your redemption code at any branch to claim your reward!
              </p>
            </div>
          </div>
        </div>

        {/* Minimum Points Banner */}
        {pointsBalance?.totalPoints < minRedemptionPoints && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-8">
            <p>
              You need at least <strong>{minRedemptionPoints} points</strong> to
              start redeeming rewards. You currently have{" "}
              <strong>
                {pointsBalance.totalPoints?.toLocaleString() || 0}
              </strong>{" "}
              points.
            </p>
          </div>
        )}

        {/* Available Rewards */}
        {redeemableItems.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No rewards available
            </h3>
            <p className="text-gray-500">Check back soon for new rewards!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {redeemableItems.map((item) => {
              const userCanRedeem = canRedeem(item);
              const isExpiringSoon =
                item.expiresAt &&
                item.expiresAt < Date.now() + 7 * 24 * 60 * 60 * 1000;

              return (
                <div
                  key={item.redeemableId}
                  className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
                    userCanRedeem
                      ? "hover:shadow-xl cursor-pointer"
                      : "opacity-75"
                  }`}
                >
                  {/* Item Image */}
                  <div className="relative h-48">
                    <img
                      src={item.image.url || "/assets/images/placeholder.png"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {isExpiringSoon && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                        Expiring Soon
                      </div>
                    )}
                    {!userCanRedeem && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="text-white text-center">
                          <p className="font-semibold">Need More Points</p>
                          <p className="text-sm">
                            {Math.max(
                              item.pointsCost -
                                (pointsBalance?.totalPoints || 0),
                              minRedemptionPoints -
                                (pointsBalance?.totalPoints || 0)
                            )}{" "}
                            more needed
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Item Info */}
                    <div className="space-y-2 mb-4">
                      {item.branchName && item.branchId !== "all" && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin size={14} className="mr-1" />
                          <span>{item.branchName}</span>
                        </div>
                      )}
                      {item.branchId === "all" && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle size={14} className="mr-1" />
                          <span>Available at all branches</span>
                        </div>
                      )}
                      {item.expiresAt && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={14} className="mr-1" />
                          <span>
                            Expires:{" "}
                            {new Date(item.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {item.availableQuantity !== undefined && (
                        <div className="text-sm text-gray-600">
                          Only {item.availableQuantity} left
                        </div>
                      )}
                    </div>

                    {/* Points Cost & Redeem Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="text-yellow-500" size={20} />
                        <span className="text-2xl font-bold text-red-500">
                          {item.pointsCost}
                        </span>
                        <span className="text-sm text-gray-500">points</span>
                      </div>
                      <button
                        onClick={() => handleRedeemClick(item)}
                        disabled={!userCanRedeem}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                          userCanRedeem
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {userCanRedeem ? "Redeem" : "Locked"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My Redemptions Section */}
        {pointsBalance?.redemptions && pointsBalance.redemptions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">My Redemptions</h2>
            <div className="bg-white rounded-lg shadow-md divide-y">
              {pointsBalance.redemptions.map((redemption: any) => (
                <div
                  key={redemption.redemptionId}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold">
                      {redemption.redeemableName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Redeemed on{" "}
                      {new Date(redemption.redeemedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Code: {redemption.redemptionId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-600">
                      {redemption.pointsCost} pts
                    </p>
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        redemption.status === "claimed"
                          ? "bg-green-100 text-green-700"
                          : redemption.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
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
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Redemption</h3>

            <div className="mb-6">
              <img
                src={selectedItem.image.url || "/assets/images/placeholder.png"}
                alt={selectedItem.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h4 className="font-semibold text-lg">{selectedItem.name}</h4>
              <p className="text-sm text-gray-600 mb-4">
                {selectedItem.description}
              </p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-bold text-red-500">
                    {selectedItem.pointsCost} points
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your balance:</span>
                  <span className="font-semibold">
                    {pointsBalance?.totalPoints} points
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-gray-600">After redemption:</span>
                  <span className="font-bold text-green-600">
                    {(pointsBalance?.totalPoints || 0) -
                      selectedItem.pointsCost}{" "}
                    points
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-900">
                After redeeming, show your redemption code at the branch to
                claim your reward. Valid for 30 days.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedItem(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={redeeming !== null}
              >
                Cancel
              </button>
              <button
                onClick={confirmRedeem}
                disabled={redeeming !== null}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {redeeming ? "Redeeming..." : "Confirm Redeem"}
              </button>
            </div>
          </div>
        </div>
      )}

      <RedemptionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          toast.info("Redemption saved in your profile");
        }}
        redemption={redemptionDetails}
        newBalance={newBalance}
      />
    </div>
  );
};

export default Rewards;
