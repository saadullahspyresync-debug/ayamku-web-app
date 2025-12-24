import React, { useState } from "react";
import slidersApi from "../../api/slider";
import { uploadImagesToS3 } from "../../api/uploadApi";
import { Slider, SliderForm, Branch } from "./types";
import { SliderCard } from "./SliderCard";
import { SliderModal } from "./SliderModal";
import { Loader } from "../Loader";

type SliderSectionProps = {
  sliders: Slider[];
  branches: Branch[];
  loading: boolean;
  onRefresh: () => void;
};

const emptySlider: SliderForm = {
  title: "",
  imageUrl: "",
  externalUrl: "",
  branchIds: [],
  order: 0,
  status: "active",
};

export const SliderSection = ({
  sliders,
  branches,
  loading,
  onRefresh,
}: SliderSectionProps) => {
  const [sliderOpen, setSliderOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<string | null>(null);
  const [sliderForm, setSliderForm] = useState<SliderForm>(emptySlider);
  const [saving, setSaving] = useState(false);

  const openAddSlider = () => {
    setEditingSlider(null);
    setSliderForm(emptySlider);
    setSliderOpen(true);
  };

  const openEditSlider = (slider: Slider) => {
    setEditingSlider(slider.sliderId);
    // Ensure imageUrl is always an object
    const imageObject =
      typeof slider.imageUrl === "string"
        ? { url: slider.imageUrl }
        : slider.imageUrl;
    setSliderForm({
      ...slider,
      branchIds:
        slider.branchIds?.map((b: any) => (b.branchId ? b.branchId : b)) || [],
      preview: slider.imageUrl.url || "",
      imageUrl: imageObject,
    });
    setSliderOpen(true);
  };

  const handleSaveSlider = async () => {
    if (!sliderForm.title) {
      alert("Title is required");
      return;
    }

    try {
      setSaving(true);
      let imageUrl = sliderForm.imageUrl;

      if (sliderForm.imageUrl instanceof File) {
        const uploaded = await uploadImagesToS3([sliderForm.imageUrl]);
        imageUrl = uploaded[0];
      }

      const payload = {
        title: sliderForm.title,
        imageUrl,
        externalUrl: sliderForm.externalUrl,
        order: sliderForm.order,
        status: sliderForm.status,
        branchIds: sliderForm.branchIds,
      };

      if (editingSlider) {
        await slidersApi.updateSlider(editingSlider, payload);
      } else {
        await slidersApi.createSlider(payload);
      }

      await onRefresh();
      setSliderOpen(false);
    } catch (err) {
      console.error("Failed to save slider", err);
      alert("Failed to save slider");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlider = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    try {
      await slidersApi.deleteSlider(id);
      await onRefresh();
    } catch (err) {
      console.error("Failed to delete slider", err);
    }
  };

  const toggleBranchForSlider = (branchId: string) => {
    setSliderForm((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId],
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Homepage Slider</h3>
        <button
          onClick={openAddSlider}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Add Slider
        </button>
      </div>

      {loading ? (
        <Loader tab="slider"/>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sliders.map((s) => (
            <SliderCard
              key={s._id}
              slider={s}
              onEdit={openEditSlider}
              onDelete={handleDeleteSlider}
            />
          ))}
        </div>
      )}

      <SliderModal
        isOpen={sliderOpen}
        onClose={() => setSliderOpen(false)}
        sliderForm={sliderForm}
        setSliderForm={setSliderForm}
        branches={branches}
        toggleBranch={toggleBranchForSlider}
        onSave={handleSaveSlider}
        isEditing={!!editingSlider}
        saving={saving}
      />
    </div>
  );
};
