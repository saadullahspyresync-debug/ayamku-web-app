import React from "react";
import { Deal } from "./types";

type DealCardProps = {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
};

export const DealCard = ({ deal, onEdit, onDelete }: DealCardProps) => {
  return (
    <div className="bg-white p-4 rounded shadow hover:shadow-md transition">
      <h4 className="text-lg font-semibold">{deal.name}</h4>
      <p className="text-sm text-gray-600">${deal.price}</p>
      <p className="text-sm">{deal.description}</p>

      <div className="flex gap-2 mt-2 flex-wrap">
        {deal.images?.map((img, idx) => (
          <img
            key={idx}
            src={typeof img === "string" ? img : img.url}
            alt="deal"
            className="w-20 h-20 object-cover rounded"
          />
        ))}
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Items:{" "}
        {deal.comboItems && deal.comboItems.length > 0
          ? deal.comboItems
              .map((ci) => `${ci?.name || "Unknown Item"} (x${ci.quantity || 1})`)
              .join(", ")
          : "No items"}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onEdit(deal)}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(deal._id || deal.itemId)}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
};