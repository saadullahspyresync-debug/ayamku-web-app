import React, { useState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/category";
import { uploadImagesToS3 } from "../../api/uploadApi";
import { Category, CategoryForm } from "./types";
import { CategoryCard } from "./CategoryCard";
import { CategoryModal } from "./CategoryModal";

type CategoriesSectionProps = {
  categories: Category[];
  onRefresh: () => void;
};

const emptyCategory: CategoryForm = {
  name: "",
  description: "",
  status: "active",
  image: null,
  existingImage: null,
};

export const CategoriesSection = ({
  categories,
  onRefresh,
}: CategoriesSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyCategory);
  const [isSave, setIsSave] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyCategory);
    setIsOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat.categoryId || cat._id);
    setForm({
      name: cat.name || "",
      description: cat.description || "",
      status: cat.status || "active",
      existingImage: cat.image || null,
      image: null,
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsSave(true);

      let uploadedImageUrl = null;      
      if (form.image && form.image instanceof File) {
        const [fileData] :any = await uploadImagesToS3([form.image] );
        uploadedImageUrl = fileData.url;
      }
      
      const payload = {
        name: form.name,
        description: form.description,
        status: form.status || "active",
        image: uploadedImageUrl || form.existingImage || null,
      };

      if(!payload.name || !payload.status || !payload.image) {
        alert("Please fill in all required fields!");
        setIsSave(false);
        return;
      }

      if (editing) await updateCategory(editing, payload);
      else await createCategory(payload);

      await onRefresh();
      setIsSave(false);
      setIsOpen(false);
    } catch (err) {
      alert("Save error, please try again.");
    }
    finally {
      setIsSave(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      onRefresh();
    } catch (err) {
      alert("Save error, please try again.");
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Menu Categories</h3>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
        >
          + Add Category
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.categoryId}
            category={cat}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <CategoryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        isEditing={!!editing}
        isSave={isSave}
      />
    </>
  );
};