import { useUserContext } from "../contexts/user";

export const useRequireAuth = () => {
  const { session, profile } = useUserContext();

  if (!session) {
    throw new Error("useRequireAuth called without a session");
  }

  if (!profile) {
    throw new Error("useRequireAuth called without a profile");
  }

  return { session, profile };
};
