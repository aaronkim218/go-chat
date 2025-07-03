import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound/NotFound";
import Auth from "./pages/Auth/Auth";
import Home from "./pages/Home/Home";
import RequireUser from "./guards/RequireUser";
import { UserProvider } from "./contexts/user";
import AuthLayout from "./layouts/AuthLayout";
import Landing from "./pages/Landing/Landing";
import Setup from "./pages/Setup/Setup";
import BaseLayout from "./layouts/BaseLayout";
import ForeignProfile from "./pages/Profile/ForeignProfile";
import Search from "./pages/Search/Search";
import { ThemeProvider } from "./components/ThemeProvider";
import UnauthLayout from "./layouts/UnauthLayout";
import Chat from "./pages/Chat/Chat";
import Profile from "./pages/Profile/Profile";

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <UserProvider>
          <Routes>
            <Route element={<BaseLayout />}>
              <Route element={<UnauthLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/setup" element={<Setup />} />
              </Route>
              <Route element={<RequireUser />}>
                <Route element={<AuthLayout />}>
                  <Route path="/home" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route
                    path="/profile/:profileId"
                    element={<ForeignProfile />}
                  />
                  <Route path="/search" element={<Search />} />
                  <Route path="/chat" element={<Chat />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
