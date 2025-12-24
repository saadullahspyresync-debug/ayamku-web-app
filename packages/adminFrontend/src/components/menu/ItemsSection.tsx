import React, { useState } from "react";
import { createItem, updateItem, deleteItem } from "../../api/item";
import { uploadImagesToS3 } from "../../api/uploadApi";
import { MenuItem, Category, Branch, ItemForm } from "./types";
import { ItemCard } from "./ItemCard";
import { ItemModal } from "./ItemModal";

type ItemsSectionProps = {
  menuItems: MenuItem[];
  categories: Category[];
  branches: Branch[];
  onRefresh: () => void;
};

const emptyItem: ItemForm = {
  name: "",
  category: "",
  price: "",
  description: "",
  stock: "",
  loyaltyPoints: 0,
  stockStatus: "in-stock",
  status: "active",
  images: [],
  existingImages: [],
  branches: [],
};

export const ItemsSection = ({
  menuItems,
  categories,
  branches,
  onRefresh,
}: ItemsSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyItem);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyItem);
    setIsOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item._id || item.itemId);
    setForm({
      name: item.name || "",
      price: String(item.price) || "",
      description: item.description || "",
      category:
        typeof item.categoryId === "object"
          ? item.categoryId._id
          : item.categoryId || "",
      stock: String(item.stock) || "",
      loyaltyPoints: item.loyaltyPoints || 0,
      stockStatus: item.stockStatus || "in-stock",
      status: item.status || "active",
      images: [],
      existingImages: item?.images && item?.images?.map((img) => img?.url) || [],
      branches: item.availableBranches?.map((b: any) => b._id || b) || [],
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      let uploadedImageUrls: string[] = [];
      if (form.images.length > 0) {
        uploadedImageUrls = await uploadImagesToS3(form.images);
      }

      // Normalize existing images: convert strings to { url } objects
    const normalizedExistingImages = form.existingImages.map((img) =>
      typeof img === "string" ? { url: img } : img
    );

      const finalImages = [...normalizedExistingImages, ...uploadedImageUrls];

      const payload = {
        name: form.name,
        categoryId: form.category,
        price: form.price,
        description: form.description,
        stock: form.stock,
        loyaltyPoints: form.loyaltyPoints,
        stockStatus: form.stockStatus,
        status: form.status,
        availableBranches: form.branches,
        images: finalImages,
      };

      if (editing) await updateItem(editing, payload);
      else await createItem(payload);

      await onRefresh();
      setIsOpen(false);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteItem(id);
      onRefresh();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Menu Management</h3>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
        >
          Add Item
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <ItemCard
            key={item._id}
            item={item}
            categories={categories}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <ItemModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        form={form}
        setForm={setForm}
        categories={categories}
        branches={branches}
        onSave={handleSave}
        isEditing={!!editing}
      />
    </>
  );
};