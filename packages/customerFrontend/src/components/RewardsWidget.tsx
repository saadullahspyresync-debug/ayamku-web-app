// src/components/RewardsWidget.tsx
import React, { useEffect, useState } from "react";
import { Award, Gift, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRedeemables, fetchPointsBalance } from "@/services/api";

const RewardsWidget: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [redeemables, setRedeemables] = useState<any[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [rewardsRes, balanceRes] = await Promise.all([
        fetchRedeemables(),
        fetchPointsBalance(),
      ]);

      setRedeemables(rewardsRes?.slice(0, 3) || []);
      setPoints(balanceRes?.totalPoints || 0);
    } catch (error) {
      console.error("Failed to load rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto" />
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="py-16 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Gift className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-3xl font-bold mb-4">Earn Rewards with Every Order</h2>
            <p className="text-gray-600 mb-8">
              Sign in to start earning points and redeem them for free items!
            </p>
            <button
              onClick={() => navigate("/auth/login")}
              className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
            >
              Sign In to Earn Points
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (redeemables.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-r from-orange-50 to-red-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Rewards</h2>
            <p className="text-gray-600">Redeem your points for amazing items</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Your Points</p>
            <div className="flex items-center gap-2">
              <Award className="text-yellow-500" size={24} />
              <p className="text-3xl font-bold text-red-500">{points.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {redeemables.map((item) => (
            <div
              key={item.redeemableId}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => navigate("/rewards")}
            >
              <div className="h-40 relative">
                <img
                  src={item.image.url || "/assets/images/placeholder.png"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {points < item.pointsCost && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="text-white text-center">
                      <p className="text-sm font-semibold">Need {item.pointsCost - points} more</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2">{item.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Award className="text-yellow-500" size={18} />
                    <span className="font-bold text-red-500">{item.pointsCost}</span>
                  </div>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      points >= item.pointsCost
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {points >= item.pointsCost ? "Available" : "Locked"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button
            onClick={() => navigate("/rewards")}
            className="inline-flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
          >
            View All Rewards
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default RewardsWidget;