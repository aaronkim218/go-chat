import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const routeToLogin = () => {
    navigate("/login");
  };

  return (
    <>
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
