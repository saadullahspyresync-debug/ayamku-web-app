import React, { useState } from "react";
import ProfileCard from "../components/ProfileCard";
import ProfileForm from "../components/ProfileForm";
import { useAuth } from "../contexts/AuthContext"; // ✅ Import useAuth hook
// import { updateUserAttributes } from 'aws-amplify/auth'; // ✅ Example for updating

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth(); // ✅ Get user data and functions from context
  const [isEditing, setIsEditing] = useState(false);

  // Save profile updates
  const handleSave = async (updatedProfile : any) => {
    try {
      // In a real app, you would call your update function here, e.g.:
      // await updateUserAttributes({
      //   userAttributes: {
      //     name: updatedProfile.name,
      //     // ... other attributes
      //   },
      // });
      
      // ✅ After updating, refresh the user data in the context
      await refreshUser(); 
      setIsEditing(false);
      // You might want to add a success toast here
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to save changes. Try again.");
    }
  };

  // ✅ Use isLoading from the context
  if (isLoading) return <p className="text-center mt-20">Loading profile...</p>;
  
  // ✅ Check for user from the context
  if (!user) return <p className="text-center mt-20">No profile found. Please log in.</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <h1 className="text-3xl font-bold text-center mb-6">User Profile</h1>
      {isEditing ? (
        <ProfileForm
          profile={user} // ✅ Pass the user object from context
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <ProfileCard 
          profile={user} // ✅ Pass the user object from context
          onEdit={() => setIsEditing(true)} 
        />
      )}
    </div>
  );
}