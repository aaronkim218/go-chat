import { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";
import { useRequireAuth } from "../hooks/useRequireAuth";

const NavBar = () => {
  const { session } = useRequireAuth();
  const [authErr, setAuthErr] = useState<AuthError | null>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    setAuthErr(error);
  };

  return session?.user.email ? (
    <div>
      <p>Welcome, {session.user.email}</p>
      <button onClick={() => navigate("/home")}>Home</button>
      <button onClick={() => navigate("/profile")}>Profile</button>
      <button onClick={() => navigate("/rooms")}>Rooms</button>
      <button onClick={() => handleLogout()}>Logout</button>
      <p>{authErr && <p>Error: {authErr.message}</p>}</p>
    </div>
  ) : (
    <>
      <p>default nav bar</p>
    </>
  );
};

export default NavBar;
