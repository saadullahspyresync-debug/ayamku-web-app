import React from "react";
import { Slider } from "./types";

type SliderCardProps = {
  slider: Slider;
  onEdit: (slider: Slider) => void;
  onDelete: (id: string) => void;
};

export const SliderCard = ({ slider, onEdit, onDelete }: SliderCardProps) => {
  return (
    <div className="bg-white p-4 rounded shadow flex flex-col gap-2 relative border">
      <img
        src={slider.imageUrl.url}
        alt={slider.title}
        className="w-full h-32 object-cover rounded"
      />
      <h4 className="font-semibold">{slider.title}</h4>
      <p className="text-sm text-gray-600">
        {slider.externalUrl || "No external link"}
      </p>
      <p className="text-xs text-gray-500">
        Status: <b>{slider.status}</b> | Order: {slider.order}
      </p>

      <div className="flex justify-between mt-2">
        <button
          onClick={() => onEdit(slider)}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(slider.sliderId)}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
};