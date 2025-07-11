import { patchProfileByUserId } from "@/api";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UNKNOWN_ERROR } from "@/constants";
import { useUserContext } from "@/contexts/User";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { isObjectEmpty } from "@/utils/object";
import { getProfileDiff } from "@/utils/profile";
import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const Profile = () => {
  const { setProfile } = useUserContext();
  const { profile } = useRequireAuth();
  const [updatedProfile, setUpdatedProfile] = useState(profile);
  const [idempotencyKey, setIdempotencyKey] = useState(uuidv4());

  const handlePatchProfile = async () => {
    try {
      const partialProfile = getProfileDiff(profile, updatedProfile);
      if (isObjectEmpty(partialProfile)) {
        toast.info("No changes to save");
        return;
      }
      const updatedFields = await patchProfileByUserId(
        partialProfile,
        idempotencyKey,
      );
      setProfile({ ...profile, ...updatedFields });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    } finally {
      setIdempotencyKey(uuidv4());
    }
  };

  return (
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
            <CardDescription>
              Last updated: {new Date(profile.updatedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className=" flex flex-col gap-4">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={updatedProfile.username}
              onChange={(e) =>
                setUpdatedProfile({
                  ...updatedProfile,
                  username: e.target.value,
                })
              }
            />
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={updatedProfile.firstName}
              onChange={(e) =>
                setUpdatedProfile({
                  ...updatedProfile,
                  firstName: e.target.value,
                })
              }
              placeholder="First Name"
            />
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={updatedProfile.lastName}
              onChange={(e) =>
                setUpdatedProfile({
                  ...updatedProfile,
                  lastName: e.target.value,
                })
              }
              placeholder="Last Name"
            />
          </CardContent>
          <CardFooter className=" justify-end">
            <Button onClick={() => handlePatchProfile()}>Save profile</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
