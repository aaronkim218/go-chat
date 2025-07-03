import { Profile, SearchProfilesOptions } from "@/types";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import UserSuggestionSearch from "./UserSuggestionSearch";

interface AddUsersDialogProps {
  onAddUsers: () => void;
  searchOptions: SearchProfilesOptions;
  setSearchOptions: (options: SearchProfilesOptions) => void;
  suggestions: Profile[];
  setSuggestions: (suggestions: Profile[]) => void;
  handleClick: (userId: string) => void;
}

const AddUsersDialog = ({
  onAddUsers,
  searchOptions,
  setSearchOptions,
  suggestions,
  setSuggestions,
  handleClick,
}: AddUsersDialogProps) => {
  return (
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
          handleClick={handleClick}
        />
        <DialogFooter>
          {/* <DialogClose asChild> */}
          <DialogClose>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => onAddUsers()}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUsersDialog;
