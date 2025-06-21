import { useParams } from "react-router-dom";

const ForeignProfilePage = () => {
  const { profileId } = useParams();

  return (
    <div>
      <h1>Foreign profile page for profile: {profileId}</h1>
    </div>
  );
};

export default ForeignProfilePage;
