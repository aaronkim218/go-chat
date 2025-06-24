import { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import supabase from "../utils/supabase";
import { useUserContext } from "../contexts/user";
import GoogleSignInButton from "../components/GoogleSignInButton";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError | null>(null);
  const { firstLoad } = useUserContext();

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

  return firstLoad ? (
    <div>Loading...</div>
  ) : (
    <div>
      <GoogleSignInButton />
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
