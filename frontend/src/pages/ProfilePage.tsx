import { useState } from "react";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { patchProfileByUserId } from "../api";
import { Profile } from "../types";

const ProfilePage = () => {
  const { profile } = useRequireAuth();
  const [username, setUsername] = useState(profile.username);

  const handlePatchProfile = async () => {
    try {
      const partialProfile: Partial<Profile> = {
        username: username,
      };
      await patchProfileByUserId(partialProfile);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  return (
    <div>
      <h1>Profile</h1>
      <p>User id: {profile.userId}</p>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={() => handlePatchProfile()}>Save profile</button>
    </div>
  );
};

export default ProfilePage;
