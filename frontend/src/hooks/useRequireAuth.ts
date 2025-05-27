import { useAuthContext } from "../contexts/auth";

export const useRequireAuth = () => {
  const { session, profile } = useAuthContext();

  if (!session) {
    throw new Error("useRequireAuth called without a session");
  }

  if (!profile) {
    throw new Error("useRequireAuth called without a profile");
  }

  return { session, profile };
};
