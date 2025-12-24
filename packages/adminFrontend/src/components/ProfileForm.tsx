import React, { useState } from "react";

export default function ProfileForm({ profile, onSave, onCancel } : any) {
  const [formData, setFormData] = useState(profile);

  const handleChange = (e : any) => {
    const { name, value } = e.target;
    setFormData((prev : any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e : any) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white shadow-md rounded-xl p-6 space-y-4"
    >
      <div className="flex justify-center">
        <img
          src={formData.avatar}
          alt="avatar"
          className="w-20 h-20 rounded-full border-2 border-blue-500"
        />
      </div>

      {["fullName", "email", "phone", "address", "bio"].map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium capitalize">{field}</label>
          <input
            type="text"
            name={field}
            value={formData[field]}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      ))}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Save
        </button>
      </div>
    </form>
  );
}
