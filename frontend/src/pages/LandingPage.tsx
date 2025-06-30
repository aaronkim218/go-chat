import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const routeToLogin = () => {
    navigate("/login");
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
            WebkitMask: `url('/graph-paper.svg')`,
            WebkitMaskRepeat: "repeat",
            WebkitMaskSize: "200px 200px",
            WebkitMaskPosition: "center",
          }}
        />
      </div>

      <nav className=" absolute flex justify-between w-screen p-4">
        <p>go-chat</p>
        <div className=" flex gap-2">
          <ModeToggle />
          <Button className=" cursor-pointer" onClick={() => routeToLogin()}>
            Log in
          </Button>
        </div>
      </nav>
      <div className=" flex flex-col items-center justify-center h-screen gap-8">
        <div className=" flex">
          <h1 className=" text-6xl">Just another chat app</h1>(for now)
        </div>
        <Button
          onClick={() => routeToLogin()}
          className="cursor-pointer text-xl py-8"
        >
          Get Started
        </Button>
      </div>
    </>
  );
};

export default LandingPage;
