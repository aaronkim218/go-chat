import { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import supabase from "../utils/supabase";

const LogoutButton = () => {
  const [authErr, setAuthErr] = useState<AuthError | null>(null);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    setAuthErr(error);
  };

  return (
    <>
      <button onClick={() => handleLogout()}>Logout</button>
      <p>{authErr && <p>Error: {authErr.message}</p>}</p>
    </>
  );
};
export default LogoutButton;
