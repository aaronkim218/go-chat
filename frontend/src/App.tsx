import { useEffect, useState } from "react";
import "./App.css";
import { createClient, Session } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_API_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: "localhost:5173/",
      },
    });

    console.log("error: ", error);
    console.log("data: ", data);

    setEmail("");
    setPassword("");
  };

  const handleSignIn = async () => {
    console.log("email: ", email);
    console.log("password: ", password);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    console.log("error: ", error);
    console.log("data: ", data);

    setEmail("");
    setPassword("");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    console.log("error: ", error);

    setEmail("");
    setPassword("");
  };

  if (session) {
    return (
      <div>
        <p>Logged in!</p>
        <button onClick={() => handleLogout()}>Logout</button>
      </div>
    );
  } else {
    return (
      <div>
        <input placeholder="email" onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={() => handleSignUp()}>sign up</button>
        <button onClick={() => handleSignIn()}>sign in</button>
      </div>
    );
  }
}

export default App;
