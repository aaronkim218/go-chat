import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserSuggestionSearch from "@/components/features/profiles/UserSuggestionSearch";
import { Profile, SearchProfilesOptions } from "@/types";
import { searchProfiles } from "@/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { Search } from "lucide-react";

const SUGGESTIONS_LIMIT = 5;

const SearchProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [options, setOptions] = useState<SearchProfilesOptions>({
    username: "",
    limit: SUGGESTIONS_LIMIT,
  });
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!options.username) {
      setProfiles([]);
      return;
    }

    try {
      const resp = await searchProfiles(options);
      setProfiles(resp);
      setSuggestions([]);
    } catch (error) {
      console.error("Error searching profiles:", error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full gap-12">
      <h1>Search profiles page</h1>
      <div className=" flex">
        <UserSuggestionSearch
          searchOptions={options}
          setSearchOptions={setOptions}
          suggestions={suggestions}
          setSuggestions={setSuggestions}
          handleClick={(profile: Profile) =>
            navigate(`/profile/${profile.userId}`)
          }
        />
        <Button onClick={() => handleSearch()}>
          <Search />
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow
              key={profile.userId}
              onClick={() => navigate(`/profile/${profile.userId}`)}
            >
              <TableCell>
                <div className=" flex items-center gap-2">
                  <CustomAvatar
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                  />
                  {profile.username}
                </div>
              </TableCell>
              <TableCell>{profile.firstName}</TableCell>
              <TableCell>{profile.lastName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SearchProfiles;
