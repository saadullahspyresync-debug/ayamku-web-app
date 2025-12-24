import React, { useState, useEffect } from "react";
import { Branch } from "../../components/highlights/types";
import { SliderSection } from "../../components/highlights/SliderSection";
import { HighlightSection } from "../../components/highlights/HighlightSection";
import { getAllBranches } from "../../api/branch";
import { getAllSliders } from "../../api/slider";
import { getAllSeasonalHighlights } from "../../api/seasonalHighlight";
export default function HighlightsTab() {
  const [sliders, setSliders] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBranches();
    fetchSliders();
    fetchHighlights();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const { data } = await getAllBranches();
      setBranches(data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch branches.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const { data } = await getAllSliders();
      setSliders(data.data || []);
    } catch (err) {
      console.error("Failed to load sliders", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighlights = async () => {
    try {
      setLoading(true);
      const { data } = await getAllSeasonalHighlights();
      setHighlights(data.data || []);
    } catch (err) {
      console.error("Failed to load highlights", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <SliderSection
        sliders={sliders}
        branches={branches}
        loading={loading}
        onRefresh={fetchSliders}
      />

      <HighlightSection
        highlights={highlights}
        branches={branches}
        loading={loading}
        onRefresh={fetchHighlights}
      />
    </div>
  );
}
