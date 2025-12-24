import React, { useState } from "react";
import seasonalHighlightsApi from "../../api/seasonalHighlight";
import { uploadImagesToS3 } from "../../api/uploadApi";
import { Highlight, HighlightForm, Branch } from "./types";
import { HighlightCard } from "./HighlightCard";
import { HighlightModal } from "./HighlightModal";
import { Loader } from "../Loader";

type HighlightSectionProps = {
  highlights: Highlight[];
  branches: Branch[];
  loading: boolean;
  onRefresh: () => void;
};

const emptyHighlight: HighlightForm = {
  title: "",
  description: "",
  image: "",
  link: "",
  startDate: "",
  endDate: "",
  branchIds: [],
  priority: 0,
  status: "active",
  preview: "",
};

export const HighlightSection = ({
  highlights,
  branches,
  loading,
  onRefresh,
}: HighlightSectionProps) => {
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<string | null>(null);
  const [highlightForm, setHighlightForm] = useState<HighlightForm>(emptyHighlight);
  const [saving, setSaving] = useState(false);

  const openAddHighlight = () => {
    setEditingHighlight(null);
    setHighlightForm(emptyHighlight);
    setHighlightOpen(true);
  };

  const openEditHighlight = (highlight: Highlight) => {
    setEditingHighlight(highlight.highlightId);
    // Ensure imageUrl is always an object
    const imageObject =
      typeof highlight.image === "string"
        ? { url: highlight.image.url }
        : highlight.image;
    setHighlightForm({
      ...highlight,
      branchIds: highlight.branchIds?.map((b: any) => (b.branchId ? b.branchId : b)) || [],
      preview: highlight.image?.url || "",
      image: imageObject,
    });
    setHighlightOpen(true);
  };

  const handleSaveHighlight = async () => {
    if (!highlightForm.title) {
      alert("Title is required");
      return;
    }

    try {
      setSaving(true);
      let image = highlightForm.image;

      if (highlightForm.image instanceof File) {
        const uploaded = await uploadImagesToS3([highlightForm.image]);
        image = uploaded[0];
      }

      const payload = {
        title: highlightForm.title,
        description: highlightForm.description,
        image,
        link: highlightForm.link,
        startDate: highlightForm.startDate,
        endDate: highlightForm.endDate,
        priority: highlightForm.priority,
        status: highlightForm.status,
        branchIds: highlightForm.branchIds,
      };

      if (editingHighlight) {
        await seasonalHighlightsApi.updateSeasonalHighlight(
          editingHighlight,
          payload
        );
      } else {
        await seasonalHighlightsApi.createSeasonalHighlight(payload);
      }

      await onRefresh();
      setHighlightOpen(false);
    } catch (err) {
      console.error("Failed to save highlight", err);
      alert("Failed to save highlight");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this highlight?"))
      return;
    try {
      await seasonalHighlightsApi.deleteSeasonalHighlight(id);
      await onRefresh();
    } catch (err) {
      console.error("Failed to delete highlight", err);
    }
  };

  const toggleBranchForHighlight = (branchId: string) => {
    setHighlightForm((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId],
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Seasonal Highlights</h3>
        <button
          onClick={openAddHighlight}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Add Highlights
        </button>
      </div>

      {loading ? (
        <Loader tab="highlights"/>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {highlights.map((h) => (
            <HighlightCard
              key={h._id}
              highlight={h}
              onEdit={openEditHighlight}
              onDelete={handleDeleteHighlight}
            />
          ))}
        </div>
      )}

      <HighlightModal
        isOpen={highlightOpen}
        onClose={() => setHighlightOpen(false)}
        highlightForm={highlightForm}
        setHighlightForm={setHighlightForm}
        branches={branches}
        toggleBranch={toggleBranchForHighlight}
        onSave={handleSaveHighlight}
        isEditing={!!editingHighlight}
        saving={saving}
      />
    </div>
  );
};