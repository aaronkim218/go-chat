import { useState } from "react";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { patchProfileByUserId } from "../api";
import { useAuthContext } from "../contexts/auth";
import { getProfileDiff } from "../utils/profile";

const ProfilePage = () => {
  const { setProfile } = useAuthContext();
  const { profile } = useRequireAuth();
  const [updatedProfile, setUpdatedProfile] = useState(profile);

  const handlePatchProfile = async () => {
    try {
      const partialProfile = getProfileDiff(profile, updatedProfile);
      await patchProfileByUserId(partialProfile);
      setProfile(updatedProfile);
    } catch (error) {
      console.error("Failed to patch profile:", error);
    }
  };

  return (
    <div>
      <h1>Profile</h1>
      <p>User id: {profile.userId}</p>
      <input
        type="text"
        value={updatedProfile.username}
        onChange={(e) =>
          setUpdatedProfile({ ...updatedProfile, username: e.target.value })
        }
        placeholder="username"
      />
      <button onClick={() => handlePatchProfile()}>Save profile</button>
    </div>
  );
};

export default ProfilePage;
