import React from "react";

export default function ProfileCard({ profile, onEdit } : any) {
  // Fallback/dummy values
  const avatar = profile.avatar || "https://via.placeholder.com/80";
  const fullName = profile.fullName || "John Doe";
  const email = profile.email || "example@email.com";
  const phone = profile.phone || "+123 456 7890";
  const address = profile.address || "123 Main Street, City, Country";
  const joinedAt = profile.joinedAt ? new Date(profile.joinedAt).toDateString() : "Jan 1, 2023";
  const bio = profile.bio || "This is a short bio about the user.";

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-xl p-6">
      <div className="flex items-center space-x-4">
        <img
          src={"../../public/images/close-up-portrait-curly-handsome-european-male.jpg"}
          alt="avatar"
          className="w-20 h-20 rounded-full border-2 border-blue-500"
        />
        <div>
          <h2 className="text-xl font-semibold">{fullName}</h2>
          <p className="text-gray-600">{email}</p>
          <p className="text-gray-600">{phone}</p>
        </div>
      </div>

      <div className="mt-4 text-gray-700">
        <p><strong>Address:</strong> {address}</p>
        <p><strong>Joined:</strong> {joinedAt}</p>
      </div>

      <p className="mt-4 text-sm text-gray-600">{bio}</p>

      {/* <button
        onClick={onEdit}
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        Edit Profile
      </button> */}
    </div>
  );
}
