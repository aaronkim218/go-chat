import { useState } from "react";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { patchProfileByUserId } from "../api";
import { useUserContext } from "../contexts/user";
import { getProfileDiff } from "../utils/profile";
import { isObjectEmpty } from "../utils/object";

const ProfilePage = () => {
  const { setProfile } = useUserContext();
  const { profile } = useRequireAuth();
  const [updatedProfile, setUpdatedProfile] = useState(profile);

  const handlePatchProfile = async () => {
    try {
      const partialProfile = getProfileDiff(profile, updatedProfile);
      if (isObjectEmpty(partialProfile)) return;
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
      <p>Username: {profile.username}</p>
      <p>First name: {profile.firstName}</p>
      <p>Last name: {profile.lastName}</p>
      <input
        type="text"
        value={updatedProfile.username}
        onChange={(e) =>
          setUpdatedProfile({ ...updatedProfile, username: e.target.value })
        }
        placeholder="username"
      />
      <input
        type="text"
        value={updatedProfile.firstName}
        onChange={(e) =>
          setUpdatedProfile({ ...updatedProfile, firstName: e.target.value })
        }
        placeholder="first name"
      />
      <input
        type="text"
        value={updatedProfile.lastName}
        onChange={(e) =>
          setUpdatedProfile({ ...updatedProfile, lastName: e.target.value })
        }
        placeholder="last name"
      />
      <button onClick={() => handlePatchProfile()}>Save profile</button>
    </div>
  );
};

export default ProfilePage;
