import React, { useEffect, useState } from "react";
import {
  CreateRoomRequest,
  Profile,
  Room,
  SearchProfilesOptions,
} from "@/types";
import { createRoom, getRoomsByUserId } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import UserSuggestionSearch from "@/components/features/profiles/UserSuggestionSearch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";

interface RoomsProps {
  activeRoom: Room | null;
  onRoomSelect: (room: Room) => void;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  pendingRoomJoin: string | null;
}

const Rooms = ({
  activeRoom,
  onRoomSelect,
  rooms,
  setRooms,
  pendingRoomJoin,
}: RoomsProps) => {
  const { profile } = useRequireAuth();
  const [createRoomRequest, setCreateRoomRequest] = useState<CreateRoomRequest>(
    { name: `${profile.username}'s Room`, members: [] },
  );
  const [open, setOpen] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchProfilesOptions>({
    username: "",
  });
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [newMembers, setNewMembers] = useState<Profile[]>([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await getRoomsByUserId();
      setRooms(response);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    }
  };

  const handleCreateRoom = async () => {
    try {
      const userIds = newMembers.map((member) => member.userId);
      const resp = await createRoom({
        ...createRoomRequest,
        members: [...userIds],
      });
      setRooms((prev) => [resp.room, ...prev]);
      setOpen(false);
      onRoomSelect(resp.room);
      setCreateRoomRequest({ name: "", members: [] });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      Rooms
      <Separator />
      <Dialog
        open={open}
        onOpenChange={(open: boolean) => {
          setOpen(open);
          setCreateRoomRequest({
            name: `${profile.username}'s Room`,
            members: [],
          });
        }}
      >
        <DialogTrigger asChild>
          <Button variant={"secondary"}>New Room</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter room name</DialogTitle>
            <DialogDescription>
              Leave blank for default room name
            </DialogDescription>
          </DialogHeader>
          <div className=" flex flex-col gap-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              type="text"
              value={createRoomRequest.name}
              onChange={(e) =>
                setCreateRoomRequest({
                  ...createRoomRequest,
                  name: e.target.value,
                })
              }
            />
            <Label htmlFor="memberSearch">Add Members</Label>
            <UserSuggestionSearch
              inputId="memberSearch"
              searchOptions={searchOptions}
              setSearchOptions={setSearchOptions}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
              handleClick={(profile: Profile) => {
                setNewMembers((prev) => [...prev, profile]);
                setSearchOptions({ ...searchOptions, username: "" });
                setSuggestions([]);
              }}
            />
            <ul>
              {newMembers.map((member, index) => (
                <li className=" flex justify-between items-center" key={index}>
                  {member.username}
                  <Button
                    onClick={() =>
                      setNewMembers((prev) => prev.filter((m) => m !== member))
                    }
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={() => handleCreateRoom()}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ul className="flex flex-col gap-2">
        {rooms.map((room) => (
          <li className=" w-full" key={room.id}>
            <Button
              className=" w-full justify-start"
              variant={room.id === activeRoom?.id ? "secondary" : "ghost"}
              disabled={pendingRoomJoin === room.id}
              onClick={() => onRoomSelect(room)}
            >
              {pendingRoomJoin === room.id ? "Joining..." : room.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Rooms;
