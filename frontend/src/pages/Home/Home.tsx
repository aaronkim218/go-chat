import { useRequireAuth } from "@/hooks/useRequireAuth";

const Home = () => {
  const { profile } = useRequireAuth();

  return (
    <div className=" flex flex-col items-center justify-center w-full">
      <h1 className=" text-8xl">Welcome, {profile.username}</h1>
    </div>
  );
};

export default Home;
