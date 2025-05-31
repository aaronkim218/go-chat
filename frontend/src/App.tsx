import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthPage from "./pages/AuthPage";
import RoomsPage from "./pages/RoomsPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import RequireAuth from "./guards/RequireAuth";
import { AuthProvider } from "./contexts/auth";
import AuthLayout from "./layouts/AuthLayout";
import LandingPage from "./pages/LandingPage";
import SetupPage from "./pages/Setup";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/setup" element={<SetupPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AuthLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/chat/:roomId" element={<ChatPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
