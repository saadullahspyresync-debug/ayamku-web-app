import React, { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  Squares2X2Icon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";

import { getAllBranches } from "../../api/branch";
import { getAllItems } from "../../api/item";
import promotionsApi from "../../api/promotions";
import { getOrderStats } from "../../api/order";

export default function OverviewTab() {
  const [branches, setBranches] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Placeholder analytics
  const [totalOrders, setTotalOrders] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });

  const avgOrder = totalOrders ? (revenue / totalOrders).toFixed(2) : 0;

  // ────────────── FETCH DATA ──────────────
  useEffect(() => {
    fetchAllData();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const statsData = await getOrderStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);

    try {
      const [branchesRes, itemsRes, promosRes] = await Promise.all([
        getAllBranches(),
        getAllItems(),
        promotionsApi.getAllPromotions(),
      ]);

      setBranches(branchesRes.data.data || []);
      setMenuItems(itemsRes.data.data || []);
      setPromotions(promosRes.data.data || []);

      // Placeholder for analytics (optional)
      // You can replace this with a real API later like:
      // const analyticsRes = await analyticsApi.getDashboardStats();
      setTotalOrders(1234);
      setRevenue(45230);
    } catch (err) {
      console.error("Failed to fetch overview data", err);
    } finally {
      setLoading(false);
    }
  };

  // ────────────── LOADER SKELETON ──────────────
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-gray-100 rounded-xl border border-gray-200"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-36 bg-gray-100 rounded-xl border border-gray-200"
            />
          ))}
        </div>
      </div>
    );
  }

  // ────────────── RENDER ──────────────
  return (
    <div className="space-y-8">
      {/* ✅ Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue}`}
          icon={CurrencyDollarIcon}
          iconColor="text-green-500"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={ChartBarIcon}
          iconColor="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Avg Order Value"
          value={`$${stats.totalRevenue / stats.totalOrders || 0}`}
          icon={UsersIcon}
          iconColor="text-purple-500"
          bgColor="bg-purple-50"
        />
      </div>

      {/* ✅ Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <h4 className="text-gray-700 font-semibold">Branches</h4>
            <BuildingStorefrontIcon className="w-6 h-6 text-blue-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-800">
            {branches.length}
          </p>
          <p className="text-sm text-gray-500">Total active branches</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <h4 className="text-gray-700 font-semibold">Menu Items</h4>
            <Squares2X2Icon className="w-6 h-6 text-green-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-800">
            {menuItems.length}
          </p>
          <p className="text-sm text-gray-500">Available menu items</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <h4 className="text-gray-700 font-semibold">Active Promotions</h4>
            <MegaphoneIcon className="w-6 h-6 text-pink-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-800">
            {promotions.filter((p: any) => p.status === "active").length}
          </p>
          <p className="text-sm text-gray-500">Ongoing campaigns</p>
        </div>
      </div>
    </div>
  );
}
