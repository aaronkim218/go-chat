import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/features/auth/LogoutButton";

const UnauthLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routeToLogin = () => {
    navigate("/login");
  };

  const routeToLanding = () => {
    navigate("/");
  };

  return (
    <>
      <div
        className=" absolute inset-0 opacity-20 z-[-1]"
        style={{
          filter: "blur(2px)",
          maskImage:
            "radial-gradient(circle at center, transparent 40%, black 80%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "var(--color-primary)",
            mask: `url('/4-point-stars.svg')`,
            maskRepeat: "repeat",
            maskSize: "25px 25px",
            maskPosition: "center",
            WebkitMask: `url('/4-point-stars.svg')`,
            WebkitMaskRepeat: "repeat",
            WebkitMaskSize: "25px 25px",
            WebkitMaskPosition: "center",
          }}
        />
      </div>

      <nav className=" absolute flex justify-between w-screen p-4 items-center">
        <p
          onClick={() => routeToLanding()}
          className=" text-2xl cursor-pointer"
        >
          Go-Chat
        </p>
        <div className=" flex gap-2">
          <ModeToggle />
          {location.pathname === "/" && (
            <Button className=" cursor-pointer" onClick={() => routeToLogin()}>
              Log in
            </Button>
          )}
          {location.pathname === "/setup" && <LogoutButton />}
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default UnauthLayout;
