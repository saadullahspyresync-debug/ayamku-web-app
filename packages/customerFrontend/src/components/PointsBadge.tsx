// src/components/PointsBadge.tsx
import React, { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPointsBalance } from "@/services/api";

const PointsBadge: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPoints();
    }
  }, [isAuthenticated]);

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const response = await fetchPointsBalance();
      setPoints(response?.totalPoints || 0);
    } catch (error) {
      console.error("Failed to fetch points:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={() => navigate("/rewards")}
      className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all shadow-md hover:shadow-lg"
    >
      <Award size={20} className="animate-pulse" />
      {loading ? (
        <span className="text-sm font-semibold">...</span>
      ) : (
        <>
          <span className="text-sm font-semibold">{points.toLocaleString()}</span>
          <span className="text-xs opacity-90">pts</span>
        </>
      )}
    </button>
  );
};

export default PointsBadge;

// ============================================
// How to integrate into your Header component
// ============================================

/*
// In your Header.tsx, add this import:
import PointsBadge from "./PointsBadge";

// Then add it in the right side section, after the branch selector:

<div className="flex items-center space-x-4">
  // ... cart button
  
  // ... branch selector
  
  // 👇 ADD THIS
  <PointsBadge />
  
  // ... language selector
  
  // ... user button
</div>
*/