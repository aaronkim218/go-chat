import { Session } from "@supabase/supabase-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import supabase from "../utils/supabase";
import { useNavigate } from "react-router-dom";
import { Profile } from "../types";
import { getProfileByUserId } from "../api";

interface AuthContextType {
  session: Session | null;
  firstLoad: boolean;
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session) {
        const profile = await fetchProfile();
        setProfile(profile);
      } else {
        setProfile(null);
      }

      setFirstLoad(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session) {
        const profile = await fetchProfile();
        setProfile(profile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && profile) {
      navigate("/home");
    } else if (session && !profile) {
      navigate("/setup");
    } else {
      navigate("/login");
    }
  }, [session, profile]);

  const fetchProfile = async (): Promise<Profile | null> => {
    try {
      return await getProfileByUserId();
    } catch (error) {
      console.error("error getting profile by user id:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ session, firstLoad, profile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};
