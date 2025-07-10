import { Session } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import supabase from "@/utils/supabase";
import { useLocation, useNavigate } from "react-router-dom";
import { getProfileByUserId } from "@/api";
import { Profile } from "@/types";
import { isAuthPath } from "@/utils/path";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";

interface UserContextType {
  session: Session | null;
  firstLoad: boolean;
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session) {
        if (profile) {
          if (session.user.id !== profile.userId) {
            await fetchProfileAndNavigate();
          }
        } else {
          await fetchProfileAndNavigate();
        }
      } else {
        setProfile(null);
      }

      if (firstLoad) setFirstLoad(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (): Promise<Profile | null> => {
    try {
      return await getProfileByUserId();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
      return null;
    }
  };

  const fetchProfileAndNavigate = async () => {
    const profile = await fetchProfile();
    setProfile(profile);
    if (profile) {
      if (!isAuthPath(location.pathname)) {
        navigate("/home");
      }
    } else {
      navigate("/setup");
    }
  };

  return (
    <UserContext.Provider value={{ session, firstLoad, profile, setProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);

  if (context === null) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};
