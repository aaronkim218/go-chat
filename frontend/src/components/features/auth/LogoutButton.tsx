import { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  const [authErr, setAuthErr] = useState<AuthError | null>(null);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    setAuthErr(error);
  };

  return (
    <>
      <Button className=" cursor-pointer" onClick={() => handleLogout()}>
        <LogOut />
      </Button>
      <p>{authErr && <p>Error: {authErr.message}</p>}</p>
    </>
  );
};
export default LogoutButton;
