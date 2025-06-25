import { Profile, SearchProfilesOptions } from "../types";
import { searchProfiles } from "../api";

interface UserSuggestionSearchProps {
  searchOptions: SearchProfilesOptions;
  setSearchOptions: (options: SearchProfilesOptions) => void;
  suggestions: Profile[];
  setSuggestions: (suggestions: Profile[]) => void;
  handleClick: (userId: string) => void;
}

const UserSuggestionSearch = ({
  searchOptions,
  setSearchOptions,
  suggestions,
  setSuggestions,
  handleClick,
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
          <button
            key={profile.userId}
            onClick={() => handleClick(profile.userId)}
          >
            {profile.username} ({profile.firstName} {profile.lastName})
          </button>
        ))}
      </div>
    </>
  );
};

export default UserSuggestionSearch;
