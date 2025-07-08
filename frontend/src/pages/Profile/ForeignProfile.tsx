import { getForeignProfileByUserId } from "@/api";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const ForeignProfile = () => {
  const { profileId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(location.state?.profile || null);

  useEffect(() => {
    if (!profileId) {
      console.error("Profile ID is required. navigating back to home.");
      navigate("/home");
      return;
    }

    const fetchProfile = async () => {
      console.log("Fetching profile for user ID:", profileId);
      try {
        const profile = await getForeignProfileByUserId(profileId);
        setProfile(profile);
      } catch (error) {
        console.error("error getting profile by user id:", error);
      }
    };

    if (!profile) {
      fetchProfile();
    }
  });

  return profile ? (
    <div className=" w-full flex flex-col justify-center items-center gap-4 p-4">
      <div className=" flex justify-center gap-2 w-full">
        <Card className=" min-w-1/3">
          <CardContent className=" flex flex-col justify-center items-center h-full">
            <CustomAvatar
              firstName={profile.firstName}
              lastName={profile.lastName}
              className=" scale-600"
            />
          </CardContent>
        </Card>
        <Card className=" min-w-1/3">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className=" flex flex-col gap-4">
            <Label>Username</Label>
            {profile.username}
            <Label>First Name</Label>
            {profile.firstName}
            <Label>Last Name</Label>
            {profile.lastName}
          </CardContent>
        </Card>
      </div>
    </div>
  ) : (
    <div className="flex justify-center items-center h-screen">
      <p className="text-lg text-gray-500">Loading profile...</p>
    </div>
  );
};

export default ForeignProfile;
