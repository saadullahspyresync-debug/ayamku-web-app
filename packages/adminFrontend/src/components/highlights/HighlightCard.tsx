import React from "react";
import { Highlight } from "./types";

type HighlightCardProps = {
  highlight: Highlight;
  onEdit: (highlight: Highlight) => void;
  onDelete: (id: string) => void;
};

export const HighlightCard = ({
  highlight,
  onEdit,
  onDelete,
}: HighlightCardProps) => {
  return (
    <div className="bg-white p-4 rounded shadow flex flex-col gap-2 border">
      <img
        src={highlight.image && highlight.image.url}
        alt={highlight.title}
        className="w-full h-32 object-cover rounded"
      />
      <h4 className="font-semibold">{highlight.title}</h4>
      <p className="text-sm text-gray-600">{highlight.description}</p>
      <p className="text-xs text-gray-500">
        {highlight.startDate?.slice(0, 10)} → {highlight.endDate?.slice(0, 10)}
      </p>
      <div className="flex justify-between mt-2">
        <button
          onClick={() => onEdit(highlight)}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(highlight.highlightId)}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Delete
        </button>
      </div>
    </div>
  );
};