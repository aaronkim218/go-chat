import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthPage from "./pages/AuthPage";
import RoomsPage from "./pages/RoomsPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import RequireUser from "./guards/RequireUser";
import { UserProvider } from "./contexts/user";
import AuthLayout from "./layouts/AuthLayout";
import LandingPage from "./pages/LandingPage";
import SetupPage from "./pages/Setup";
import BaseLayout from "./layouts/BaseLayout";
import ForeignProfilePage from "./pages/ForeignProfilePage";
import SearchPage from "./pages/SearchPage";
import { ThemeProvider } from "./components/ThemeProvider";
import UnauthLayout from "./layouts/UnauthLayout";

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <UserProvider>
          <Routes>
            <Route element={<BaseLayout />}>
              <Route element={<UnauthLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/setup" element={<SetupPage />} />
              </Route>
              <Route element={<RequireUser />}>
                <Route element={<AuthLayout />}>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route
                    path="/profile/:profileId"
                    element={<ForeignProfilePage />}
                  />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/chat/:roomId" element={<ChatPage />} />
                  <Route path="/rooms" element={<RoomsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
