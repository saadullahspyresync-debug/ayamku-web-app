import React from "react";
import { Category } from "./types";

type CategoryCardProps = {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
};

export const CategoryCard = ({
  category,
  onEdit,
  onDelete,
}: CategoryCardProps) => {
  return (
    <div className="bg-white p-4 rounded shadow hover:shadow-md transition">
      {category.image && (
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-40 object-cover rounded mb-2"
        />
      )}
      <h4 className="text-lg font-semibold">{category.name}</h4>
      <p className="text-sm text-gray-600">{category.description}</p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onEdit(category)}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
        >
          Edit
        </button>
        <button
          onClick={() =>
            onDelete(category._id || category.categoryId)
          }
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
};