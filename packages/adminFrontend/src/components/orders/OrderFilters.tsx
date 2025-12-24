// src/components/orders/OrderFilters.tsx

import React from "react";
import { Search, Filter } from "lucide-react";
import { Branch } from "../menu/types";

interface OrderFiltersProps {
  branches: Branch[];
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  branchFilter: string;
  setBranchFilter: (branch: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function OrderFilters({
  branches,
  statusFilter,
  setStatusFilter,
  branchFilter,
  setBranchFilter,
  searchQuery,
  setSearchQuery,
}: OrderFiltersProps) {
  const statuses = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Orders
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch
          </label>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Branches</option>
            {branches.map((item) => (
              <option key={item.branchId} value={item.branchId}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {(statusFilter !== "all" || branchFilter !== "all" || searchQuery) && (
        <div className="mt-4">
          <button
            onClick={() => {
              setStatusFilter("all");
              setBranchFilter("all");
              setSearchQuery("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
