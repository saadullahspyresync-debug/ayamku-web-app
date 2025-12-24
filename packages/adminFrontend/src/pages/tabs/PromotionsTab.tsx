import React, { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import promotionsApi from "../../api/promotions";
import { getAllBranches } from "../../api/branch";
import { getAllItems } from "../../api/item"; // 👈 import item API
import { uploadImagesToS3 } from "../../api/uploadApi";
import { Loader } from "../../components/Loader";

export default function PromotionsTab() {
  interface PromotionForm {
    name: string;
    description: string;
    type: string;
    startDate: string;
    endDate: string;
    items: string[];
    toys: string[];
    branchIds: string[];
    status: string;
    image: string | File;
    preview?: string;
  }

  const [promotions, setPromotions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]); // 👈 for menu items
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PromotionForm>({
    name: "",
    description: "",
    type: "",
    startDate: "",
    endDate: "",
    items: [], // 👈 item IDs
    toys: [],
    branchIds: [],
    status: "active",
    image: "",
  });
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ────────────── FETCH ──────────────
  useEffect(() => {
    fetchPromotions();
    fetchBranches();
    fetchItems();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const { data } = await promotionsApi.getAllPromotions();
      setPromotions(data.data || []);
    } catch (err) {
      console.error("Failed to load promotions", err);
    } finally {
      setLoading(false);
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
      setItems(data.data || []);
    } catch (err) {
      console.error("Failed to fetch items", err);
    }
  };

  // ────────────── SAVE / UPDATE ──────────────
  const handleSave = async () => {
    if (!form.name || !form.type) {
      alert("Please fill in all required fields.");
      return;
    }

    // ✅ Upload to S3 if new image file selected
    if (form.image instanceof File) {
      const uploaded = await uploadImagesToS3([form.image]);
      form.image = uploaded[0]; // backend returns array of URLs
    }

    try {
      if (editing) {
        await promotionsApi.updatePromotion(editing, form);
      } else {
        await promotionsApi.createPromotion(form);
      }
      await fetchPromotions();
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to save promotion", err);
      alert("Failed to save promotion");
    }
  };

  // ────────────── DELETE ──────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotion?"))
      return;
    try {
      await promotionsApi.deletePromotion(id);
      await fetchPromotions();
    } catch (err) {
      console.error("Failed to delete promotion", err);
    }
  };

  // ────────────── OPEN MODALS ──────────────
  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      type: "",
      startDate: "",
      endDate: "",
      items: [],
      toys: [],
      branchIds: [],
      status: "active",
      image: "",
    });
    setModalOpen(true);
  };

  const openEdit = (promo: any) => {
    setEditing(promo.promotionId);
    setForm({
      ...promo,
      startDate: promo.startDate?.split("T")[0] || "",
      endDate: promo.endDate?.split("T")[0] || "",
      items:
        promo.items?.map((i: any) => (typeof i === "object" ? i.itemId : i)) ||
        [],
      image: promo.image || "",
    });
    setModalOpen(true);
  };

  // ────────────── TOGGLES ──────────────
  const toggleBranch = (branchId: string) => {
    setForm((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId],
    }));
  };

  const toggleItem = (itemId: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.includes(itemId)
        ? prev.items.filter((id) => id !== itemId)
        : [...prev.items, itemId],
    }));
  };

  // ────────────── RENDER ──────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Promotions</h3>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          {loading ? "Loading..." : "Add Promotion"}
        </button>
      </div>

      {/* Loader */}
      {loading && (
        < Loader tab="promotions" />
      )}

      {/* Promotions List */}
      {!loading && (
        <div className="grid md:grid-cols-2 gap-4">
          {promotions.map((p: any) => (
            <div
              key={p._id || p.promotionId}
              className="bg-white p-4 rounded shadow relative border"
            >
              {p.image && (
                <img
                  src={p.image.url}
                  alt={p.name}
                  className="w-full h-40 object-cover rounded mb-2"
                />
              )}
              <div className="flex justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{p.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">{p.type}</p>
                  <p className="text-xs text-gray-500">
                    {p.startDate && p.endDate
                      ? `${p.startDate.split("T")[0]} → ${
                          p.endDate.split("T")[0]
                        }`
                      : "No schedule set"}
                  </p>

                  {p.type === "kids" && (
                    <div className="text-sm mt-1 text-gray-600">
                      {p.toys?.length
                        ? `Toys: ${p.toys.join(", ")}`
                        : "No toys listed"}
                    </div>
                  )}

                  {p.items?.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Items: {p.items.map((i: any) => i.name || i).join(", ")}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.promotionId)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div
                className={`absolute -top-3 left-2 text-xs px-2 py-1 rounded ${
                  p.status === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {p.status}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Promotion Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-3">
          {editing ? "Edit Promotion" : "Add Promotion"}
        </h3>

        {/* Image Upload */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Promotion Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (file) {
                setForm((prev) => ({
                  ...prev,
                  image: file,
                  preview: URL.createObjectURL(file),
                }));
              }
            }}
          />
          {form.preview ? (
            <img
              src={form.preview}
              alt="preview"
              className="w-full h-40 object-cover mt-2 rounded"
            />
          ) : form.image && typeof form.image === "string" ? (
            <img
              src={form.image}
              alt="existing"
              className="w-full h-40 object-cover mt-2 rounded"
            />
          ) : null}
        </div>

        {/* Promotion Name */}
        <div className="mb-3">
          <label
            htmlFor="promotionName"
            className="block text-sm font-medium mb-1"
          >
            Promotion Name
          </label>
          <input
            id="promotionName"
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Promotion Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label
            htmlFor="promotionDescription"
            className="block text-sm font-medium mb-1"
          >
            Description
          </label>
          <textarea
            id="promotionDescription"
            className="w-full border p-2 rounded"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>

        {/* Type */}
        <div className="mb-3">
          <label
            htmlFor="promotionType"
            className="block text-sm font-medium mb-1"
          >
            Promotion Type
          </label>
          <select
            id="promotionType"
            className="w-full border p-2 rounded"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="">Select Type</option>
            <option value="seasonal">Seasonal</option>
            <option value="kids">Kids</option>
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium mb-1"
            >
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              className="border p-2 rounded w-full"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              className="border p-2 rounded w-full"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Kids Toys */}
        {form.type === "kids" && (
          <div className="mb-3">
            <label htmlFor="toys" className="block text-sm font-medium mb-1">
              Toys (comma-separated)
            </label>
            <input
              id="toys"
              type="text"
              className="w-full border p-2 rounded"
              placeholder="Toys"
              value={form.toys.join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  toys: e.target.value.split(",").map((t) => t.trim()),
                })
              }
            />
          </div>
        )}

        {/* Items Multi-select */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Select Items</label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border p-2 rounded">
            {items
              .filter((item: any) => item.stockStatus === "in-stock")
              .map((item: any) => (
                <button
                  key={item.itemId}
                  type="button"
                  onClick={() => toggleItem(item.itemId)}
                  className={`px-3 py-1 border rounded ${
                    form.items.includes(item.itemId)
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {item.name}
                </button>
              ))}
          </div>
        </div>

        {/* Branch Selection */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Available Branches
          </label>
          <div className="flex flex-wrap gap-2">
            {branches.map((b: any) => (
              <button
                key={b.branchId}
                type="button"
                onClick={() => toggleBranch(b.branchId)}
                className={`px-3 py-1 border rounded ${
                  form.branchIds.includes(b.branchId)
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label
            htmlFor="promotionStatus"
            className="block text-sm font-medium mb-1"
          >
            Status
          </label>
          <select
            id="promotionStatus"
            className="w-full border p-2 rounded"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            {editing ? "Save Changes" : "Add Promotion"}
          </button>
          <button
            onClick={() => setModalOpen(false)}
            className="flex-1 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
