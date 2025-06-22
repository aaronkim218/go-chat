import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUserContext } from "../contexts/user";
import { createProfile, CreateProfileRequest } from "../api";
import { Profile } from "../types";
import LogoutButton from "../components/LogoutButton";
import { v4 as uuidv4 } from "uuid";

const SetupPage = () => {
  const { session, setProfile } = useUserContext();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const navigate = useNavigate();
  const [idempotencyKey, setIdempotencyKey] = useState(uuidv4());

  if (session) {
    const handleCreateProfile = async () => {
      try {
        const req: CreateProfileRequest = {
          username: username,
          firstName: firstName,
          lastName: lastName,
        };
        await createProfile(req, idempotencyKey);
        const profile: Profile = {
          userId: session?.user.id,
          username: username,
          firstName: firstName,
          lastName: lastName,
        };
        setProfile(profile);
        navigate("/home");
      } catch (error) {
        console.error("Error creating profile:", error);
      } finally {
        setIdempotencyKey(uuidv4());
      }
    };

    return (
      <div>
        <LogoutButton />
        <h1>Setup Page</h1>
        <input
          placeholder="username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="first name"
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          placeholder="last name"
          onChange={(e) => setLastName(e.target.value)}
        />
        <button onClick={() => handleCreateProfile()}>Create Profile</button>
      </div>
    );
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default SetupPage;
