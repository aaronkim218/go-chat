import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../contexts/auth";
import { createProfile, CreateProfileRequest } from "../api";
import { Profile } from "../types";

const SetupPage = () => {
  const { session, setProfile } = useAuthContext();
  const [username, setUsername] = useState("");

  if (session) {
    const handleCreateProfile = async () => {
      try {
        const req: CreateProfileRequest = {
          username: username,
        };
        await createProfile(req);
        const profile: Profile = {
          userId: session?.user.id,
          username: username,
        };
        setProfile(profile);
      } catch (error) {
        console.error("Error creating profile:", error);
      }
    };

    return (
      <div>
        <h1>Setup Page</h1>
        <input
          placeholder="username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={() => handleCreateProfile()}>Create Profile</button>
      </div>
    );
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default SetupPage;
