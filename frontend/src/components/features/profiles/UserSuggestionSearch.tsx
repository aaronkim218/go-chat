import { Profile, SearchProfilesOptions } from "@/types";
import { searchProfiles } from "@/api";
import { Button } from "@/components/ui/button";

interface UserSuggestionSearchProps {
  searchOptions: SearchProfilesOptions;
  setSearchOptions: (options: SearchProfilesOptions) => void;
  suggestions: Profile[];
  setSuggestions: (suggestions: Profile[]) => void;
  handleClick: (profile: Profile) => void;
  inputId?: string;
}

const UserSuggestionSearch = ({
  searchOptions,
  setSearchOptions,
  suggestions,
  setSuggestions,
  handleClick,
  inputId,
}: UserSuggestionSearchProps) => {
  const handleSuggest = async (opts: SearchProfilesOptions) => {
    if (!opts.username) {
      setSuggestions([]);
      return;
    }

    try {
      const resp = await searchProfiles(opts);
      setSuggestions(resp);
    } catch (error) {
      console.error("Error suggesting profiles:", error);
    }
  };

  return (
    <>
      <input
        id={inputId}
        type="text"
        placeholder="Search by username"
        value={searchOptions.username}
        onChange={(e) => {
          setSearchOptions({ ...searchOptions, username: e.target.value });
          handleSuggest({ ...searchOptions, username: e.target.value });
        }}
      />
      <div>
        {suggestions.map((profile) => (
          <Button key={profile.userId} onClick={() => handleClick(profile)}>
            {profile.username} ({profile.firstName} {profile.lastName})
          </Button>
        ))}
      </div>
    </>
  );
};

export default UserSuggestionSearch;
