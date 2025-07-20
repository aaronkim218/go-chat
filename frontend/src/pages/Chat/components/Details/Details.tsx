import { addUsersToRoom, deleteRoom } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserSuggestionSearch from "@/components/features/profiles/UserSuggestionSearch";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Profile, Room, SearchProfilesOptions } from "@/types";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Crown, UserPlus, X } from "lucide-react";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";

interface DetailsProps {
  activeRoom: Room;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  setActiveRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  activeProfiles: Set<string>;
  profilesHashMap: Map<string, Profile>;
  updateProfilesHashMap: (newProfiles: Profile[]) => void;
}

const Details = ({
  activeRoom,
  setRooms,
  setActiveRoom,
  activeProfiles,
  profilesHashMap,
  updateProfilesHashMap,
}: DetailsProps) => {
  const [newUsers, setNewUsers] = useState<Profile[]>([]);
  const [searchOptions, setSearchOptions] = useState<SearchProfilesOptions>({
    username: "",
    excludeRoom: activeRoom.id,
  });
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const { session } = useRequireAuth();
  const [open, setOpen] = useState(false);
  const profiles = Array.from(profilesHashMap.values()).sort((a, b) =>
    a.username.toLowerCase().localeCompare(b.username.toLowerCase()),
  );

  useEffect(() => {
    setSearchOptions({
      username: "",
      excludeRoom: activeRoom.id,
    });
    setSuggestions([]);
    setNewUsers([]);
  }, [activeRoom.id]);

  const handleAddUsersToRoom = async (newUsers: Profile[]) => {
    try {
      const userIds = newUsers.map((user) => user.userId);
      const resp = await addUsersToRoom(activeRoom.id, userIds);
      setOpen(false);
      setNewUsers([]);
      const successfulIds = new Set(resp.successes);
      const successfulNewUsers = newUsers.filter((user) =>
        successfulIds.has(user.userId),
      );
      updateProfilesHashMap(successfulNewUsers);
      console.log("TODO: do something with addUsersToRoom response: ", resp);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      setActiveRoom(null);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    }
  };

  const isActive = (profile: Profile) => {
    return (
      session.user.id === profile.userId || activeProfiles.has(profile.userId)
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      Details
      <Separator />
      <div className=" flex items-center justify-between">
        Members
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <UserPlus />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Search for new users below</DialogTitle>
              <DialogDescription>
                Submit when you have added all the users you want
              </DialogDescription>
            </DialogHeader>
            <UserSuggestionSearch
              searchOptions={searchOptions}
              setSearchOptions={setSearchOptions}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
              handleClick={(profile: Profile) => {
                setNewUsers((prev) => [...prev, profile]);
                setSearchOptions({ ...searchOptions, username: "" });
                setSuggestions([]);
              }}
            />
            <ul>
              {newUsers.map((user, index) => (
                <li className=" flex justify-between items-center" key={index}>
                  {user.username}
                  <Button
                    className=" cursor-pointer"
                    variant={"ghost"}
                    onClick={() =>
                      setNewUsers((prev) => prev.filter((u) => u !== user))
                    }
                  >
                    <X className=" text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={() => handleAddUsersToRoom(newUsers)}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <ul className=" flex flex-col gap-2">
        {profiles.map((profile) => (
          <li className=" flex items-center gap-2" key={profile.userId}>
            <CustomAvatar
              firstName={profile.firstName}
              lastName={profile.lastName}
            />
            {profile.username} ({profile.firstName} {profile.lastName}){" "}
            {profile.userId === activeRoom.host && <Crown />}
            {isActive(profile) && (
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
            )}
          </li>
        ))}
      </ul>
      {activeRoom.host === session.user.id && (
        <>
          <Separator />
          Danger Zone
          <Button
            variant={"destructive"}
            onClick={() => handleDeleteRoom(activeRoom.id)}
          >
            Delete Room
          </Button>
        </>
      )}
    </div>
  );
};

export default Details;
