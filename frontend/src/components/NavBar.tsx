import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "../hooks/useRequireAuth";
import LogoutButton from "./LogoutButton";

const NavBar = () => {
  const { session } = useRequireAuth();
  const navigate = useNavigate();

  return session?.user.email ? (
    <div>
      <p>Welcome, {session.user.email}</p>
      <button onClick={() => navigate("/home")}>Home</button>
      <button onClick={() => navigate("/profile")}>Profile</button>
      <button onClick={() => navigate("/rooms")}>Rooms</button>
      <button onClick={() => navigate("/search")}>Search</button>
      <LogoutButton />
    </div>
  ) : (
    <>
      <p>default nav bar</p>
    </>
  );
};

export default NavBar;
