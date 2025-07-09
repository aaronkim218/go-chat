import { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import supabase from "@/utils/supabase";

const useLogout = () => {
  const [authErr, setAuthErr] = useState<AuthError | null>(null);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    setAuthErr(error);
  };

  return { handleLogout, authErr };
};

export default useLogout;
