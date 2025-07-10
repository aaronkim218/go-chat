import { useState } from "react";
import supabase from "@/utils/supabase";
import GoogleSignInButton from "@/components/features/auth/GoogleSignInButton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/contexts/User";
import { toast } from "sonner";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { firstLoad } = useUserContext();

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error?.message) {
      toast.error(error.message);
    }
  };

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error?.message) {
      toast.error(error.message);
    }
  };

  return firstLoad ? (
    <div>Loading...</div>
  ) : (
    <div className=" flex flex-col items-center justify-center h-screen">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Authenticate yourself 🫵</CardTitle>
        </CardHeader>
        <CardContent className=" flex flex-col gap-8">
          <div className=" flex flex-col gap-4">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className=" flex flex-col gap-4">
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className=" flex flex-col items-center gap-2">
          <Button
            className=" cursor-pointer w-full"
            onClick={() => handleSignIn()}
          >
            Log in
          </Button>
          <Button
            className=" cursor-pointer w-full"
            variant={"outline"}
            onClick={() => handleSignUp()}
          >
            Sign up
          </Button>
          <GoogleSignInButton />
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
