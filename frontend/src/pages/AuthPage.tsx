import { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../utils/supabase";
import { useAuthContext } from "../contexts/auth";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();
  const { loading } = useAuthContext();

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (!error) {
      navigate("/home");
      return;
    }

    setError(error);
  };

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (!error) {
      navigate("/home");
      return;
    }

    setError(error);
  };

  return loading ? (
    <div>Loading...</div>
  ) : (
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

export default AuthPage;
