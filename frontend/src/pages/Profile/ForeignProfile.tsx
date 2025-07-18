import { getForeignProfileByUserId } from "@/api";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UNKNOWN_ERROR } from "@/constants";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const ForeignProfile = () => {
  const { profileId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(location.state?.profile || null);

  useEffect(() => {
    if (!profileId) {
      navigate("/home");
      return;
    }

    if (!profile) {
      fetchProfile(profileId);
    }
  });

  const fetchProfile = async (profileId: string) => {
    try {
      const profile = await getForeignProfileByUserId(profileId);
      setProfile(profile);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    }
  };

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
