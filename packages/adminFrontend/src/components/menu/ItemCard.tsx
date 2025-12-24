import React from "react";
import { MenuItem, Category } from "./types";

type ItemCardProps = {
  item: MenuItem;
  categories: Category[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
};

export const ItemCard = ({
  item,
  categories,
  onEdit,
  onDelete,
}: ItemCardProps) => {
  const categoryId =
    typeof item.categoryId === "object"
      ? item.categoryId._id
      : item.categoryId;
  const categoryName = categories.find((c) => c._id === categoryId)?.name;

  return (
    <div className="bg-white p-4 rounded shadow hover:shadow-md transition">
      <h4 className="text-lg font-semibold">{item.name}</h4>
      <p className="text-sm text-gray-600">
        {categoryName} • ${item.price}
      </p>
      <p className="text-sm mt-2">{item.description}</p>

      <div className="flex gap-2 mt-2 flex-wrap">
        {item.images?.map((img, idx) => (
          <img
            key={idx}
            src={img?.url}
            alt="item"
            className="w-20 h-20 object-cover rounded"
          />
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onEdit(item)}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item._id || item.itemId)}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
};