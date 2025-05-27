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
  loading: boolean;
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session) {
        await fetchProfile();
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session) {
        await fetchProfile();
      } else {
        setProfile(null);
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && profile) {
      navigate("/home");
    }
  }, [session, profile]);

  const fetchProfile = async () => {
    try {
      const profile = await getProfileByUserId();
      setProfile(profile);
    } catch (error) {
      console.error("error getting profile by user id:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, loading, profile, setProfile, fetchProfile }}
    >
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
