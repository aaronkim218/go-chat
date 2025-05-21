import { useContext } from "react";
import SessionContext from "../contexts/session";
import { Session } from "@supabase/supabase-js";

const useSessionContext = (): Session => {
  const context = useContext(SessionContext);

  if (context === null) {
    throw new Error("session context is null");
  }

  return context;
};

export default useSessionContext;
