import { useRequireAuth } from "../hooks/useRequireAuth";

const ProfilePage = () => {
  const { profile } = useRequireAuth();

  return (
    <div>
      <h1>Profile</h1>
      <p>User id: {profile.userId}</p>
    </div>
  );
};

export default ProfilePage;
