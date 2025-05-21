import { AuthError, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";

const Auth: React.FC<{
  onSessionChange: (session: Session | null) => void;
}> = ({ onSessionChange }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      onSessionChange(session);

      if (session) {
        navigate("/rooms");
        return;
      } else {
        navigate("/");
        return;
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      onSessionChange(session);

      if (session) {
        navigate("/rooms");
        return;
      } else {
        navigate("/");
        return;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    setError(error);
  };

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setError(error);
  };

  return (
    <div>
      <input placeholder="email" onChange={(e) => setEmail(e.target.value)} />
      <input
        placeholder="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => handleSignUp()}>sign up</button>
      <button onClick={() => handleSignIn()}>sign in</button>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
};

export default Auth;
