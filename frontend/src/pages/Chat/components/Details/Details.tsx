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

interface DetailsProps {
  activeRoom: Room;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
}

const Details = ({ activeRoom, setRooms }: DetailsProps) => {
  const [newUsers, setNewUsers] = useState<string[]>([]);
  const [searchOptions, setSearchOptions] = useState<SearchProfilesOptions>({
    username: "",
    excludeRoom: activeRoom.id,
  });
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { session } = useRequireAuth();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const profiles = await getProfilesByRoomId(activeRoom.id);
        setProfiles(profiles);
      } catch (error) {
        console.error("error getting profiles for room:", error);
      }
    };

    fetchProfiles();
  }, [activeRoom]);

  const handleAddUsersToRoom = async () => {
    try {
      const resp = await addUsersToRoom(activeRoom.id, newUsers);
      console.log("TODO: do something with addUsersToRoom response: ", resp);
    } catch (error) {
      console.error("error adding users to room:", error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("error deleting room:", error);
    }
  };

  return (
    <div>
      <h1>Details</h1>
      <Dialog>
        <DialogTrigger>
          <Button variant="secondary">Add Users</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search for users below</DialogTitle>
            <DialogDescription>
              Submit when you have added all the users you want
            </DialogDescription>
          </DialogHeader>
          <UserSuggestionSearch
            searchOptions={searchOptions}
            setSearchOptions={setSearchOptions}
            suggestions={suggestions}
            setSuggestions={setSuggestions}
            handleClick={(userId: string) => {
              setNewUsers((prev) => [...prev, userId]);
              setSearchOptions({ ...searchOptions, username: "" });
            }}
          />
          <ul>
            {newUsers.map((user, index) => (
              <li key={index}>
                {user}
                <button
                  onClick={() =>
                    setNewUsers((prev) => prev.filter((u) => u !== user))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <DialogFooter>
            {/* <DialogClose asChild> */}
            <DialogClose>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => handleAddUsersToRoom()}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div>
        <h6 className="">Members</h6>
        <ul>
          {profiles.map((profile) => (
            <li key={profile.userId}>
              {profile.username} ({profile.firstName} {profile.lastName}){" "}
              {profile.userId === activeRoom.host && "(host)"}
            </li>
          ))}
        </ul>
      </div>
      {activeRoom.host === session.user.id && (
        <Button onClick={() => handleDeleteRoom(activeRoom.id)}>
          Delete Room
        </Button>
      )}
    </div>
  );
};

export default Details;
