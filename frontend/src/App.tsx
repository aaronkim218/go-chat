import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { Session } from "@supabase/supabase-js";
import SessionContext from "./contexts/session";
import { useState } from "react";
import NavBar from "./components/NavBar";
import Rooms from "./pages/Rooms";

const ProtectedRoute = ({ session }: { session: Session | null }) => {
  if (!session) {
    return <Navigate to="/" />;
  }

  return (
    <SessionContext.Provider value={session}>
      <NavBar />
      <Outlet />
    </SessionContext.Provider>
  );
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth onSessionChange={setSession} />} />

        <Route element={<ProtectedRoute session={session} />}>
          <Route path="/chat/:roomId" element={<Chat />} />
          <Route path="/rooms" element={<Rooms />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
