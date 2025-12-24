import React, { useState } from "react";
import { createDeal, updateDeal, deleteDeal } from "../../api/deals";
import { uploadImagesToS3 } from "../../api/uploadApi";
import { Deal, MenuItem, Category, Branch, DealForm } from "./types";
import { DealCard } from "./DealCard";
import { DealModal } from "./DealModal";

type DealsSectionProps = {
  deals: Deal[];
  menuItems: MenuItem[];
  categories: Category[];
  branches: Branch[];
  onRefresh: () => void;
};

const emptyDeal: DealForm = {
  name: "",
  category: "",
  price: "",
  description: "",
  comboItems: [],
  availableBranches: [],
  active: true,
  images: [],
  existingImages: [],
};

export const DealsSection = ({
  deals,
  menuItems,
  categories,
  branches,
  onRefresh,
}: DealsSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<DealForm>(emptyDeal);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyDeal);
    setIsOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditing(deal._id || deal.itemId);

    const existingComboItems = (deal.comboItems || []).map((ci : any) => {
      const itemId = ci.itemId?.itemId || ci.itemId?._id || ci.itemId;
      const name = ci.name || ci.itemId?.name || "";
      return {
        itemId,
        name,
        quantity: ci.quantity || 1,
      };
    });

    setForm({
      name: deal.name || "",
      description: deal.description || "",
      price: String(deal.price) || "",
      category:
        typeof deal.categoryId === "object"
          ? deal.categoryId._id
          : deal.categoryId || "",
      comboItems: existingComboItems,
      availableBranches:
        deal.availableBranches?.map((b: any) => b._id || b) || [],
      active: deal.status === "active" || deal.active || true,
      images: [],
      existingImages: deal.images || [],
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      let uploadedImageUrls: string[] = [];
      if (form.images.length > 0) {
        uploadedImageUrls = await uploadImagesToS3(form.images);
      }

      const finalImages = [...form.existingImages, ...uploadedImageUrls];

      const payload = {
        name: form.name,
        categoryId: form.category,
        price: parseFloat(form.price) || 0,
        description: form.description,
        isCombo: true,
        status: form.active ? "active" : "inactive",
        images: finalImages,
        comboItems: form.comboItems.map((ci) => ({
          itemId: ci.itemId,
          name: ci.name,
          quantity: parseInt(String(ci.quantity)) || 1,
        })),
        availableBranches: form.availableBranches || [],
      };

      if (editing) await updateDeal(editing, payload);
      else await createDeal(payload);

      await onRefresh();
      setIsOpen(false);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteDeal(id);
      onRefresh();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Deals Management</h3>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
        >
          Add Deal
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {deals.map((deal) => (
          <DealCard
            key={deal._id}
            deal={deal}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <DealModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        form={form}
        setForm={setForm}
        menuItems={menuItems}
        categories={categories}
        branches={branches}
        onSave={handleSave}
        isEditing={!!editing}
      />
    </>
  );
};