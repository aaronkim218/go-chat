import { addUsersToRoom, getProfilesByRoomId } from "@/api";
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
import UserSuggestionSearch from "@/components/UserSuggestionSearch";
import { Profile, SearchProfilesOptions } from "@/types";
import { useEffect, useState } from "react";

interface DetailsProps {
  roomId: string;
}

const Details = ({ roomId }: DetailsProps) => {
  const [newUsers, setNewUsers] = useState<string[]>([]);
  const [searchOptions, setSearchOptions] = useState<SearchProfilesOptions>({
    username: "",
    excludeRoom: roomId,
  });
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const profiles = await getProfilesByRoomId(roomId);
        setProfiles(profiles);
      } catch (error) {
        console.error("error getting profiles for room:", error);
      }
    };

    fetchProfiles();
  }, [roomId]);

  const handleAddUsersToRoom = async () => {
    try {
      const resp = await addUsersToRoom(roomId, newUsers);
      console.log("TODO: do something with addUsersToRoom response: ", resp);
    } catch (error) {
      console.error("error adding users to room:", error);
    }
  };

  return (
    <div>
      <h1>Details</h1>
      <Dialog>
        <DialogTrigger>Add Users</DialogTrigger>
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
        <h6 className="">Profiles</h6>
        <ul>
          {profiles.map((profile) => (
            <li key={profile.userId}>
              {profile.username} ({profile.firstName} {profile.lastName})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Details;
