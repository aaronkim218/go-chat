import { addUsersToRoom, deleteRoom, getProfilesByRoomId } from "@/api";
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

interface DetailsProps {
  activeRoom: Room;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  setActiveRoom: React.Dispatch<React.SetStateAction<Room | null>>;
}

const Details = ({ activeRoom, setRooms, setActiveRoom }: DetailsProps) => {
  const [newUsers, setNewUsers] = useState<Profile[]>([]);
  const [searchOptions, setSearchOptions] = useState<SearchProfilesOptions>({
    username: "",
    excludeRoom: activeRoom.id,
  });
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { session } = useRequireAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchProfiles();
    setSearchOptions({
      username: "",
      excludeRoom: activeRoom.id,
    });
    setSuggestions([]);
    setNewUsers([]);
  }, [activeRoom.id]);

  const fetchProfiles = async () => {
    try {
      const profiles = await getProfilesByRoomId(activeRoom.id);
      setProfiles(profiles);
    } catch (error) {
      console.error("error getting profiles for room:", error);
    }
  };

  const handleAddUsersToRoom = async () => {
    try {
      const userIds = newUsers.map((user) => user.userId);
      const resp = await addUsersToRoom(activeRoom.id, userIds);
      setOpen(false);
      setNewUsers([]);
      const successfulIds = new Set(resp.successes);
      const successfulNewUsers = newUsers.filter((user) =>
        successfulIds.has(user.userId),
      );
      setProfiles((prev) =>
        [...prev, ...successfulNewUsers].sort((a, b) =>
          a.username.toLowerCase().localeCompare(b.username.toLowerCase()),
        ),
      );
      console.log("TODO: do something with addUsersToRoom response: ", resp);
    } catch (error) {
      console.error("error adding users to room:", error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      setActiveRoom(null);
    } catch (error) {
      console.error("error deleting room:", error);
    }
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
                    onClick={() =>
                      setNewUsers((prev) => prev.filter((u) => u !== user))
                    }
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={() => handleAddUsersToRoom()}>
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
          </li>
        ))}
      </ul>
      {activeRoom.host === session.user.id && (
        <>
          <Separator />
          Danger Zone
          <Button onClick={() => handleDeleteRoom(activeRoom.id)}>
            Delete Room
          </Button>
        </>
      )}
    </div>
  );
};

export default Details;
