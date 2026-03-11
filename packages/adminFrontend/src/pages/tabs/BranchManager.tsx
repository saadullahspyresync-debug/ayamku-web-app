import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

import { getAllBranches, getBranchById } from "../../api/branch";
import { createBranchManager, deleteBranchManager, getAllBranchManager, updateBranchManagerStatus } from "../../api/branchManager";
import Modal from "../../components/Modal";
import { Loader } from "../../components/Loader";

type Branch = {
  branchId: string;
  name: string;
};
type BranchManager = {
  email: string;
  userId: string;
  branchId: string;
  branchName: string;
  status: "ACTIVE" | "DISABLED";
};

const BranchManagerTab = () => {

    const [pageLoading, setPageLoading] = useState(true); 
    const [actionLoading, setActionLoading] = useState<string | null>(null); 

    const [branchManagers, setBranchManagers] = useState<BranchManager[]>([]);    
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [email, setEmail] = useState("");
    const [branchId, setBranchId] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const init = async () => {
            await Promise.all([
            fetchBranches(),
            fetchBranchManagers(),
            ]);
            setPageLoading(false);
        };
        init();
    }, []);


    const openAdd = () => {
        setEditingId(null);
        setIsOpen(true);
    };

    const fetchBranches = async () => {
        try {
          const { data } = await getAllBranches();
          setBranches(data.data);
        } catch (err) {
          throw err;
        }
    };

    // fetching all branch managers
    const fetchBranchManagers = async () => {
        try {         
            setPageLoading(true);

            const { data } = await getAllBranchManager();

            if (!data?.data || data.data.length === 0) {
                setBranchManagers([]);
            return;
            }

            const managers = data.data;

            // Fetch branch names
            const managersWithBranch = await Promise.all(
                managers.map(async (manager: any) => {
                    try {
                        const branchResp = await getBranchById(manager.branchId);
                        return {
                            ...manager,
                            branchName: branchResp.data?.data?.name || "Unknown Branch",
                        };
                    } 
                    catch (err) {
                        return {
                            ...manager,
                            branchName: "Unknown Branch",
                        };
                    }
                })
            );
            setBranchManagers(managersWithBranch);
        } 
        catch (error) {
            throw error;
        }
        finally {
            setPageLoading(false);
        }
    };


    const addBranchManager = async () => {
        // 1. Trim whitespace to prevent errors from accidental spaces
        const cleanEmail = email.trim();

        // 2. Check for empty fields
        if (!cleanEmail || !branchId) {
            // setError("Email and Branch are required");
            // setTimeout(() => {
            //     setError("")
            // }, 3000);
            alert("Email and Branch are required");
            return;
        }

        // 3. Email Format Validation (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            setError("Please enter a valid email address");
            setTimeout(() => setError(""), 3000);
            return;
        }

        setPageLoading(true);
        setError("");

        try {
            await createBranchManager( { 
                email: cleanEmail.toLowerCase(), 
                branchId 
            } );

            setIsOpen(false);
            setEmail("");
            setBranchId("");
            fetchBranchManagers();
        } 
        catch (err: any) {
            setError(err.response?.data?.error);
            setTimeout(() => {
                setError("")
            }, 3000);            
        } 
        finally {
            setPageLoading(false);
        }
    };

    // const onDeleteManager = async (id: string) => {
    //     if (!window.confirm("Delete this Branch Manager?")) return

    //     try {
    //         await deleteBranchManager(id);
    //         fetchBranchManagers();
    //     } catch (error) {
    //         alert("Failed to delete Branch Manager");
    //     }
    // }

    const disableBranchManager = async (email: string) => {
        if (!window.confirm("Disable this Branch Manager?")) return;

        setActionLoading(email);
        try {
            await updateBranchManagerStatus(email, "DISABLED");
            fetchBranchManagers();
        } 
        catch {
            alert("Failed to disable Branch Manager");
        } finally {
            setActionLoading(null);
        }
    };

    const enableBranchManager = async (email: string) => {
        if (!window.confirm("Enable this Branch Manager?")) return;

        setActionLoading(email);
        try {
            await updateBranchManagerStatus(email, "ACTIVE");
            fetchBranchManagers();
        } catch {
            alert("Failed to enable Branch Manager");
        }
        setActionLoading(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Branch Manager</h3>
                {!pageLoading &&
                    <button
                    onClick={openAdd}
                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition"
                    >
                    + Add Manager                        
                </button>}
            </div>

            {pageLoading ? (
                < Loader tab="branch manager" />
            ) : branchManagers.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No branch managers found.
                </div>
            ) : (
                <table
                    className="table-auto md:table-fixed w-full text-md text-left border-collapse"
                    style={{
                    width: "100%",
                    marginTop: 30,
                    borderCollapse: "collapse"
                    }}
                >
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Branch</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-100 bg-gray-100 space-y-5">
                        {branchManagers.map((bm) => (
                            <tr key={bm.email}>
                            <td>{bm.email}</td>
                            <td>{bm.branchName}</td>
                            <td>{bm.status}</td>
                            <td className="flex gap-3 items-center">
                                {bm.status === "ACTIVE" ? (
                                <button
                                    disabled={actionLoading === bm.email}
                                    onClick={() => disableBranchManager(bm.email)}
                                    className="w-30 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg shadow-md transition disabled:opacity-50"
                                >
                                    {actionLoading === bm.email ? "Disabling..." : "Disable"}
                                </button>
                                ) : (
                                <button
                                    disabled={actionLoading === bm.email}
                                    onClick={() => enableBranchManager(bm.email)}
                                    className="w-30 px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg shadow-md transition disabled:opacity-50"
                                >
                                    {actionLoading === bm.email ? "Enabling..." : "Enable"}
                                </button>
                                )}
                                {/* <button
                                    onClick={() => onDeleteManager(bm?.userId)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete Order"
                                    >
                                        <Trash2 className="w-7 h-7" />
                                </button> */}
                            </td>
                            </tr>
                        ))}                    
                    </tbody>
                </table> )}
            {/* )} */}

            {/* Branch Modal */}
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <h3 className="text-lg font-semibold mb-4 flex justify-center">
                    {editingId ? "Edit Branch Manager" : "Add New Branch Mananger"}
                </h3>

                {error && <p className="text-red-600">{error}</p>}

                <div className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Email:</label>
                        <input
                            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            placeholder="Email"
                            value={email}
                            type="email"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                      

                    {/* Branch */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Branch:
                        </label>
                        <select
                            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                        >                            
                            <option value="">Select a branch</option>
                            {branches && branches.map((branch) => (
                                <option key={branch.branchId} value={branch.branchId}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>  
                            
                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={addBranchManager}
                            className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition"
                        >
                            {pageLoading ? "Saving.." : "Save"}
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
    )
}

export default BranchManagerTab;