import { useEffect, useState, useRef } from "react";
import Modal from "../../components/Modal";
import MapPicker from "../../components/MapPicker";
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../../api/branch";
import { Loader } from "../../components/Loader";
import { useAuth } from "../../contexts/AuthContext";

export default function BranchesTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const managerBranchId = user?.branchId;

  const emptyBranch = {
    name: "",
    address: "",
    contactNumber: "",
    businessHours: {
      open: "",
      close: "",
      friday: { open: "", close: "", isClosed: false },
    },
    services: { dineIn: true, pickup: true },
    status: "active",
    coordinates: { lat: 3.139, lng: 101.6869 }, // Kuala Lumpur
  };

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSave, setIsSave] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyBranch);

  // Fetch branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const { data } = await getAllBranches();
      
      // --- 2. FILTER LOGIC ---
      if (isAdmin) {
        setBranches(data.data);
      } else {
        // Only show the branch that matches the manager's assigned branchId
        const filtered = data.data.filter((b: any) => b.branchId === managerBranchId);
        setBranches(filtered);
      }
    } catch (err) {
      setError("Failed to fetch branches.");
      setTimeout(() => {
        setError("")
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openAdd = () => {
    setIsSave("Add")
    setEditingId(null);
    setForm(emptyBranch);
    setIsOpen(true);
  };

  const handleLocationSelect = (location: { address: string, lat: number, lng: number, placeId: string }) => {
    setForm((prev: any) => ({
      ...prev,
      address: location.address,
      placeId: location.placeId,
      coordinates: { lat: location.lat, lng: location.lng }
    }));
  };

  const openEdit = (branch: any) => {
    setEditingId(branch.branchId);
    setIsSave("Save")
    // Ensure backward compatibility if friday hours don’t exist
    const updatedBranch = {
      ...branch,
      businessHours: {
        ...branch.businessHours,
        friday: branch.businessHours?.friday || {
          open: "",
          close: "",
          isClosed: false,
        },
      },
    };
    setForm(updatedBranch);
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if(!form.name || !form.contactNumber || !form.businessHours.open || !form.businessHours.close || (!form.services.dineIn && !form.services.pickup) ||
      !form.businessHours.friday.isClosed && (!form.businessHours.friday.open || !form.businessHours.friday.close)) {
        alert("Please fill in all required fields.");
        setLoading(false);
        setIsSave(null);
        return;
      }
      if(!form.address){
        alert("Please do not fill address manually. Drag the marker or click on map to select address.");
        setLoading(false);
        setIsSave(null);
        return;
      }

      if (editingId) {
        const { branchId, createdAt, ...payload } = form;
        await updateBranch(editingId, payload);
      } else {
        await createBranch(form);
      }
      fetchBranches();
      setIsOpen(false);
    } catch (err) {
      setError("Failed to save branch.");
    } finally {
      setLoading(false);
      setIsSave(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    try {
      setLoading(true)
      await deleteBranch(id);
      fetchBranches();
    } catch (err) {
      setError("Failed to delete branch.");
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setForm((prev: any) => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: !prev.services[service as keyof typeof prev.services],
      },
    }));
  };

  const toggleFridayClosed = () => {
    setForm((prev: any) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        friday: {
          ...prev.businessHours.friday,
          isClosed: !prev.businessHours.friday.isClosed,
        },
      },
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800">{isAdmin ? "Branches" : "My Branch"}</h3>
        {/* --- 3. HIDE ADD BUTTON FOR MANAGERS --- */}
        {isAdmin && !loading &&(
          <button
            onClick={openAdd}
            className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition"
          >
            + Add Branch
          </button>
        )}
      </div>

      {loading ? (
        < Loader tab="branches" />
      ) : branches.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
              No branch found.
          </div>
      ): (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((branch: any) => (
            <div
              key={branch.branchId}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-5"
            >
              <h4 className="text-xl font-semibold text-gray-800">
                {branch.name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{branch.address}</p>
              <p className="text-sm text-gray-600 mt-1">
                {branch.contactNumber}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Hours: {branch.businessHours?.open} -{" "}
                {branch.businessHours?.close}
              </p>
              {branch.businessHours?.friday && (
                <p className="text-sm text-gray-600 mt-1">
                  Friday:{" "}
                  {branch.businessHours.friday.isClosed
                    ? "Closed"
                    : `${branch.businessHours.friday.open} - ${branch.businessHours.friday.close}`}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Services:{" "}
                {[
                  branch.services?.dineIn ? "Dine-in" : null,
                  branch.services?.pickup ? "Pickup" : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Status: {branch.status}
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openEdit(branch)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                >
                  Edit
                </button>
                {/* --- 4. HIDE DELETE BUTTON FOR MANAGERS --- */}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(branch.branchId)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Branch Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h3 className="text-lg font-semibold mb-4 flex justify-center">
          {editingId ? "Edit Branch" : "Add New Branch"}
        </h3>

        <div className="space-y-4">
          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Branch Name: <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Branch Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* GOOGLE MAPS PICKER */}
          <div>
            <label className="block text-sm font-medium mb-1">Address: <span className="text-red-500">*</span></label>
            <MapPicker 
              initialAddress={form.address}
              initialCoords={form.coordinates}
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Contact Number: <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Contact Number"
              value={form.contactNumber}
              onChange={(e) =>
                setForm({ ...form, contactNumber: e.target.value })
              }
            />
          </div>

          {/* Regular Business Hours */}
          <div>
            <p className="text-sm font-medium mb-1">Regular Hours: <span className="text-red-500">*</span></p>
            <div className="flex gap-3">
              <input
                type="time"
                className="w-full border rounded-md px-3 py-2"
                value={form.businessHours.open || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    businessHours: {
                      ...form.businessHours,
                      open: e.target.value,
                    },
                  })
                }
              />
              <input
                type="time"
                className="w-full border rounded-md px-3 py-2"
                value={form.businessHours.close || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    businessHours: {
                      ...form.businessHours,
                      close: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* Friday Hours */}
          <div>
            <p className="text-sm font-medium mb-1">Friday Hours: <span className="text-red-500">*</span></p>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={form.businessHours.friday.isClosed}
                onChange={toggleFridayClosed}
              />
              Closed on Friday
            </label>

            {!form.businessHours.friday.isClosed && (
              <div className="flex gap-3">
                <input
                  type="time"
                  className="w-full border rounded-md px-3 py-2"
                  value={form.businessHours.friday.open || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      businessHours: {
                        ...form.businessHours,
                        friday: {
                          ...form.businessHours.friday,
                          open: e.target.value,
                        },
                      },
                    })
                  }
                />
                <input
                  type="time"
                  className="w-full border rounded-md px-3 py-2"
                  value={form.businessHours.friday.close || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      businessHours: {
                        ...form.businessHours,
                        friday: {
                          ...form.businessHours.friday,
                          close: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <p className="text-sm font-medium mb-1">Services: <span className="text-red-500">*</span></p>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.services.dineIn}
                  onChange={() => toggleService("dineIn")}
                />
                Dine-in
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.services.pickup}
                  onChange={() => toggleService("pickup")}
                />
                Pickup
              </label>
            </div>
          </div>

          {/* Map */}
          {/* <div>
            <label className="block text-sm font-medium mb-1">
              Location on Map:
            </label>
            <MapPicker
              location={form.coordinates}
              onChange={(coords: any) =>
                setForm({ ...form, coordinates: coords })
              }
              onAddressChange={(e: any) => setForm({ ...form, address: e })}
            />
          </div> */}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition"
            >
              {isSave === "Save" ? loading ? "Saving..." : "Save" : isSave === "Add" ? loading ? "Adding..." : "Add" : "Save"}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
