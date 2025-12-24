// src/pages/admin/PointsTab.tsx
import React, { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import pointsApi from "../../api/pointsApi";
import { getAllBranches } from "../../api/branch";
import { uploadImagesToS3 } from "../../api/uploadApi";
import { toast } from "sonner";
import { getAllItems } from "../../api/item";
import { Loader } from "../../components/Loader";

interface RedeemableForm {
  name: string;
  description: string;
  pointsCost: number;
  branchId: string;
  availableQuantity?: number;
  status: string;
  expiresAt: string;
  image: string | File;
  preview?: string;
  itemId: string;
}

export default function PointsTab() {
  const [activeSubTab, setActiveSubTab] = useState<
    "config" | "redeemables" | "analytics"
  >("config");

  // Config State
  const [config, setConfig] = useState({
    conversionRate: 10,
    minRedemptionPoints: 100,
    pointsExpiryDays: 365,
    enabled: true,
  });
  const [configLoading, setConfigLoading] = useState(false);

  // Redeemables State
  const [redeemables, setRedeemables] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<RedeemableForm>({
    name: "",
    description: "",
    pointsCost: 0,
    branchId: "all",
    availableQuantity: 1,
    status: "active",
    expiresAt: "",
    image: "",
    itemId: "",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  // Analytics State
  const [stats, setStats] = useState<any>(null);
  const [redemptions, setRedemptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ────────────── FETCH DATA ──────────────
  useEffect(() => {
    fetchConfig();
    fetchBranches();
    fetchItems();
    if (activeSubTab === "redeemables") {
      fetchRedeemables();
    } else if (activeSubTab === "analytics") {
      fetchStats();
      fetchRedemptions();
      fetchTransactions();
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (form.branchId === "all") {
      // Show all items if "All Branches" selected
      setFilteredItems(items);
    } else {
      // Only show items available in that specific branch
      const branchItems = items.filter(
        (i: any) =>
          Array.isArray(i.availableBranches) &&
          i.availableBranches.includes(form.branchId)
      );
      setFilteredItems(branchItems);
    }
  }, [form.branchId, items]);

  const fetchConfig = async () => {
    try {
      const { data } = await pointsApi.getPointsConfig();
      if (data.data) {
        setConfig(data.data);
      }
    } catch (err) {
      console.error("Failed to load config", err);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data } = await getAllBranches();
      setBranches(data.data || []);
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  };

  const fetchItems = async () => {
    try {
      const { data } = await getAllItems();
      const nonComboItems = (data.data || []).filter(
        (i: any) => i.isCombo === false
      );
      setItems(nonComboItems);
    } catch (err) {
      console.error("Failed to fetch items", err);
    }
  };

  const fetchRedeemables = async () => {
    try {
      setLoading(true);
      const { data } = await pointsApi.getAllRedeemables();
      setRedeemables(data.data || []);
    } catch (err) {
      console.error("Failed to load redeemables", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setAnalyticsLoading(true);
      const { data } = await pointsApi.getRedemptionStats();
      setStats(data.data || null);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    try {
      const { data } = await pointsApi.getAllRedemptions({ status: "pending" });
      setRedemptions(data.data || []);
    } catch (err) {
      console.error("Failed to load redemptions", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await pointsApi.getPointsTransactions();
      setTransactions(data.data || []);
    } catch (err) {
      console.error("Failed to load transactions", err);
    }
  };

  // ────────────── CONFIG HANDLERS ──────────────
  const handleSaveConfig = async () => {
    try {
      setConfigLoading(true);
      await pointsApi.updatePointsConfig(config);
      toast.success("Points configuration updated successfully!");
      await fetchConfig();
    } catch (err) {
      console.error("Failed to save config", err);
      toast.error("Failed to save configuration");
    } finally {
      setConfigLoading(false);
    }
  };

  // ────────────── REDEEMABLE HANDLERS ──────────────
  const handleSaveRedeemable = async () => {
    if (!form.name || form.pointsCost <= 0) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      // Upload image if new file
      let imageUrl = form.image;
      if (form.image instanceof File) {
        const uploaded = await uploadImagesToS3([form.image]);
        imageUrl = uploaded[0];
      }

      const payload = {
        ...form,
        name: form.name,
        itemId: form.itemId || null, // 👈 add this
        image: imageUrl,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).getTime()
          : undefined,
      };

      if (editing) {
        await pointsApi.updateRedeemable(editing, payload);
        toast.success("Redeemable item updated!");
      } else {
        await pointsApi.createRedeemable(payload);
        toast.success("Redeemable item created!");
      }

      await fetchRedeemables();
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to save redeemable", err);
      toast.error("Failed to save redeemable item");
    }
  };

  const handleDeleteRedeemable = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this redeemable item?")
    )
      return;

    try {
      await pointsApi.deleteRedeemable(id);
      toast.success("Redeemable item deleted");
      await fetchRedeemables();
    } catch (err) {
      console.error("Failed to delete redeemable", err);
      toast.error("Failed to delete redeemable item");
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      pointsCost: 0,
      branchId: "all",
      availableQuantity: undefined,
      status: "active",
      expiresAt: "",
      image: "",
      itemId: "",
    });
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item.redeemableId);
    setForm({
      name: item.name,
      description: item.description,
      pointsCost: item.pointsCost,
      branchId: item.branchId || "all",
      availableQuantity: item.availableQuantity,
      status: item.status,
      expiresAt: item.expiresAt
        ? new Date(item.expiresAt).toISOString().split("T")[0]
        : "",
      image: item.images?.[0]?.url || "",
      itemId: item.itemId || "",
    });
    setModalOpen(true);
  };

  // ────────────── RENDER ──────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Points Management</h3>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveSubTab("config")}
          className={`px-4 py-2 font-medium ${
            activeSubTab === "config"
              ? "border-b-2 border-yellow-500 text-yellow-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveSubTab("redeemables")}
          className={`px-4 py-2 font-medium ${
            activeSubTab === "redeemables"
              ? "border-b-2 border-yellow-500 text-yellow-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Redeemable Items
        </button>
        <button
          onClick={() => setActiveSubTab("analytics")}
          className={`px-4 py-2 font-medium ${
            activeSubTab === "analytics"
              ? "border-b-2 border-yellow-500 text-yellow-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Configuration Tab */}
      {activeSubTab === "config" && (
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h4 className="font-semibold text-lg mb-4">Points Configuration</h4>

          <div>
            <label className="block text-sm font-medium mb-1">
              Points Conversion Rate ($1 = X points)
            </label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={config.conversionRate}
              onChange={(e) =>
                setConfig({ ...config, conversionRate: Number(e.target.value) })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              For every $1 spent, customer earns {config.conversionRate} points
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Minimum Points for Redemption
            </label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={config.minRedemptionPoints}
              onChange={(e) =>
                setConfig({
                  ...config,
                  minRedemptionPoints: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Points Expiry (days)
            </label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={config.pointsExpiryDays}
              onChange={(e) =>
                setConfig({
                  ...config,
                  pointsExpiryDays: Number(e.target.value),
                })
              }
            />
            <p className="text-xs text-gray-500 mt-1">Leave 0 for no expiry</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={config.enabled}
              onChange={(e) =>
                setConfig({ ...config, enabled: e.target.checked })
              }
            />
            <label htmlFor="enabled" className="text-sm font-medium">
              Enable Points System
            </label>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={configLoading}
            className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            {configLoading ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      )}

      {/* Redeemable Items Tab */}
      {activeSubTab === "redeemables" && (
        <>
          <div className="flex justify-end">
            <button
              onClick={openAdd}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              {loading ? "Loading..." : "Add Redeemable Item"}
            </button>
          </div>

          {loading && <Loader tab="redeemables" />}

          {!loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redeemables.map((item: any) => (
                <div
                  key={item.redeemableId}
                  className="bg-white p-4 rounded shadow relative border"
                >
                  {item.image && (
                    <img
                      src={item.image.url}
                      alt={item.name}
                      className="w-full h-40 object-cover rounded mb-3"
                    />
                  )}

                  {item.itemName && (
                    <p className="text-gray-600">
                      Linked Item: {item.itemName}
                    </p>
                  )}

                  <div
                    className={`absolute -top-2 left-2 text-xs px-2 py-1 rounded ${
                      item.status === "active"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {item.status}
                  </div>

                  <h4 className="font-semibold text-lg">{item.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {item.description}
                  </p>

                  <div className="space-y-1 text-sm">
                    <p className="font-bold text-yellow-600">
                      {item.pointsCost} Points
                    </p>
                    <p className="text-gray-600">
                      Branch: {item.branchName || "All Branches"}
                    </p>
                    <p className="text-gray-600">
                      Redeemed: {item.redeemedCount || 0} times
                    </p>
                    {item.availableQuantity && (
                      <p className="text-gray-600">
                        Available: {item.availableQuantity}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openEdit(item)}
                      className="flex-1 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRedeemable(item.redeemableId)}
                      className="flex-1 py-1 bg-red-500 text-white rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Analytics Tab */}
      {activeSubTab === "analytics" && stats && (
        <>
          {analyticsLoading && <Loader tab="analytics" />}

          {!analyticsLoading && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-sm text-gray-600">Total Redemptions</p>
                  <p className="text-2xl font-bold">{stats.totalRedemptions}</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-sm text-gray-600">Points Redeemed</p>
                  <p className="text-2xl font-bold">
                    {stats.totalPointsRedeemed?.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-sm text-gray-600">Active Redemptions</p>
                  <p className="text-2xl font-bold">
                    {stats.activeRedemptions}
                  </p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-sm text-gray-600">Pending Claims</p>
                  <p className="text-2xl font-bold">
                    {stats.redemptionsByStatus?.pending || 0}
                  </p>
                </div>
              </div>

              {/* Top Items */}
              <div className="bg-white p-6 rounded shadow">
                <h4 className="font-semibold text-lg mb-4">
                  Top Redeemable Items
                </h4>
                <div className="space-y-2">
                  {stats.topRedeemableItems?.map((item: any) => (
                    <div
                      key={item.redeemableId}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <span className="font-medium">{item.name}</span>
                      <div className="text-right">
                        <p className="text-sm">
                          {item.redemptionCount} redemptions
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.totalPointsSpent} points
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Redeemable Item Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-4">
          {editing ? "Edit Redeemable Item" : "Add Redeemable Item"}
        </h3>

        <div className="space-y-3">
          {/* Branch Selection */}
          <div>
            <label htmlFor="branch" className="block text-sm font-medium mb-1">
              Branch
            </label>
            <select
              id="branch"
              className="w-full border p-2 rounded"
              value={form.branchId}
              onChange={(e) =>
                setForm({ ...form, branchId: e.target.value, itemId: "" })
              }
            >
              <option value="all">All Branches</option>
              {branches.map((b: any) => (
                <option key={b.branchId} value={b.branchId}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Linked Item */}
          <div>
            <label htmlFor="item" className="block text-sm font-medium mb-1">
              Linked Item (optional)
            </label>
            <select
              id="item"
              className="w-full border p-2 rounded"
              value={form.itemId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedItem = items.find(
                  (i: any) => i.itemId === selectedId
                );

                setForm({
                  ...form,
                  itemId: selectedId,
                  name: selectedItem?.name || "",
                  image: selectedItem?.images?.[0] || "",
                  preview: selectedItem?.images?.[0] || "",
                });
              }}
            >
              <option value="">Select Linked Item</option>
              {filteredItems.map((item: any) => (
                <option key={item.itemId} value={item.itemId}>
                  {item.name} {item.branchName ? `(${item.branchName})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Image */}
          {form.preview && (
            <div>
              <label className="block text-sm font-medium mb-1">Preview</label>
              <img
                src={form.preview.url || form.preview}
                alt={form.name}
                className="w-full h-40 object-cover mt-1 rounded"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              className="w-full border p-2 rounded"
              placeholder="Description"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Points Cost */}
          <div>
            <label
              htmlFor="pointsCost"
              className="block text-sm font-medium mb-1"
            >
              Points Cost *
            </label>
            <input
              id="pointsCost"
              type="number"
              className="w-full border p-2 rounded"
              placeholder="Points Cost *"
              value={form.pointsCost || ""}
              onChange={(e) =>
                setForm({ ...form, pointsCost: Number(e.target.value) })
              }
            />
          </div>

          {/* Available Quantity */}
          <div>
            <label
              htmlFor="availableQuantity"
              className="block text-sm font-medium mb-1"
            >
              Available Quantity (optional)
            </label>
            <input
              id="availableQuantity"
              type="number"
              className="w-full border p-2 rounded"
              placeholder="Available Quantity"
              min={1}
              value={form.availableQuantity || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  availableQuantity: Number(e.target.value) || 1,
                })
              }
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label
              htmlFor="expiresAt"
              className="block text-sm font-medium mb-1"
            >
              Expiry Date (optional)
            </label>
            <input
              id="expiresAt"
              type="date"
              className="w-full border p-2 rounded"
              placeholder="Expiry Date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              id="status"
              className="w-full border p-2 rounded"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveRedeemable}
              className="flex-1 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              {editing ? "Save Changes" : "Add Item"}
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
