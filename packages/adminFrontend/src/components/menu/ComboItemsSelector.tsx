import React from "react";
import { MenuItem, Category } from "./types";

type ComboItemSelectorProps = {
  menuItems: MenuItem[];
  categories: Category[];
  comboItems: Array<{ itemId: string; name: string; quantity: number }>;
  onComboItemsChange: (
    comboItems: Array<{ itemId: string; name: string; quantity: number }>
  ) => void;
};

export const ComboItemSelector = ({
  menuItems,
  categories,
  comboItems,
  onComboItemsChange,
}: ComboItemSelectorProps) => {
  const handleQuantityChange = (itemId: string, newQuantity: number, itemName: string) => {
    if (newQuantity <= 0) {
      onComboItemsChange(comboItems.filter((ci) => ci.itemId !== itemId));
    } else {
      onComboItemsChange(
        comboItems.map((ci) =>
          ci.itemId === itemId ? { ...ci, quantity: newQuantity, name: itemName } : ci
        )
      );
    }
  };

  const handleAddItem = (itemId: string, itemName: string) => {
    onComboItemsChange([...comboItems, { itemId, name: itemName, quantity: 1 }]);
  };

  return (
    <div className="mb-3">
      <label className="block font-medium text-sm mb-1">Select Items for Combo</label>
      <div className="max-h-60 overflow-y-auto space-y-2">
        {menuItems
          .filter((item) => item.stockStatus === "in-stock")
          .map((item) => {
            const existing = comboItems.find((ci) => ci.itemId === item.itemId);
            const categoryId =
              typeof item.categoryId === "object" ? item.categoryId._id : item.categoryId;
            const categoryName = categories.find((c) => c._id === categoryId)?.name;

            return (
              <div
                key={item.itemId}
                className="flex justify-between items-center p-2 border rounded hover:bg-gray-50"
              >
                <span>
                  {item.name} —{" "}
                  <span className="text-xs text-gray-500">{categoryName}</span>
                </span>
                {existing ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded"
                      onClick={() =>
                        handleQuantityChange(item.itemId, existing.quantity - 1, item.name)
                      }
                    >
                      -
                    </button>
                    <span>{existing.quantity}</span>
                    <button
                      type="button"
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded"
                      onClick={() =>
                        handleQuantityChange(item.itemId, existing.quantity + 1, item.name)
                      }
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                    onClick={() => handleAddItem(item.itemId, item.name)}
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
      </div>
      {comboItems.length === 0 && (
        <p className="text-xs text-red-500 mt-1">
          Please add at least one item to the deal
        </p>
      )}
    </div>
  );
};