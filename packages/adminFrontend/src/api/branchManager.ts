import api from "./api";

export type CreateBranchManagerPayload = {
  email: string;
  branchId: string;
};


// Create a new branch manager (admin only)
export const createBranchManager = (data: CreateBranchManagerPayload) => {
  const resp = api.post("/branch_manager", data);
  return resp
};

// Get all branches manager (admin only)
export const getAllBranchManager = () => api.get("/branch_manager");
  
// disable branch manager (admin only)
export const updateBranchManagerStatus = (email: string, status: "ACTIVE" | "DISABLED") => api.put(`/branch_manager/status/${email}`, { status });

// Delete a branch manager (admin only)
export const deleteBranchManager = (id: string) => api.delete(`/branch_manager/delete/${id}`);

//  auth me
export const authMe = () => api.get("/auth/me");

export default {
  createBranchManager,
  getAllBranchManager,
  updateBranchManagerStatus,
  deleteBranchManager,
  authMe,
};
