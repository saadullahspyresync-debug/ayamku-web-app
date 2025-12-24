import React from "react";

export default function StatCard({ title = "Title", value = "0", icon: Icon , iconColor = "text-blue-500", bgColor = "bg-blue-50" }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`p-3 rounded-full ${bgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
