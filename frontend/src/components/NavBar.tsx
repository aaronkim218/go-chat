import { AuthError } from "@supabase/supabase-js";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";
import SessionContext from "../contexts/session";

const NavBar = () => {
  const session = useContext(SessionContext);
  const [authErr, setAuthErr] = useState<AuthError | null>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      console.log("Logged out successfully");
      navigate("/");
      return;
    }

    setAuthErr(error);
  };

  return session?.user.email ? (
    <div>
      <p>Welcome, {session.user.email}</p>
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
