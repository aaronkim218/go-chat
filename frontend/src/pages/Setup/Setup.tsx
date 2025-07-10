import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUserContext } from "@/contexts/User";
import { createProfile, CreateProfileRequest } from "@/api";
import { v4 as uuidv4 } from "uuid";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";

const Setup = () => {
  const { session, setProfile } = useUserContext();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const navigate = useNavigate();
  const [idempotencyKey, setIdempotencyKey] = useState(uuidv4());

  if (session) {
    const handleCreateProfile = async () => {
      try {
        const req: CreateProfileRequest = {
          username: username,
          firstName: firstName,
          lastName: lastName,
        };
        await createProfile(req, idempotencyKey);
        const profile: Profile = {
          userId: session?.user.id,
          username: username,
          firstName: firstName,
          lastName: lastName,
        };
        setProfile(profile);
        navigate("/home");
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
      <div className=" flex flex-col items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Give us some more info 🫵</CardTitle>
          </CardHeader>
          <CardContent className=" flex flex-col gap-8">
            <div className=" flex flex-col gap-4">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className=" flex flex-col gap-4">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className=" flex flex-col gap-4">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className=" flex flex-col items-center gap-2">
            <Button onClick={() => handleCreateProfile()}>
              Create Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default Setup;
