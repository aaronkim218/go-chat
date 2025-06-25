import { useState } from "react";
import { searchProfiles } from "../api";
import { Profile, SearchProfilesOptions } from "../types";
import { useNavigate } from "react-router-dom";
import UserSuggestionSearch from "../components/UserSuggestionSearch";

const SUGGESTIONS_LIMIT = 5;

const SearchPage = () => {
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
    <div>
      <h1>Search profiles page</h1>
      <UserSuggestionSearch
        searchOptions={options}
        setSearchOptions={setOptions}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        handleClick={(userId: string) => navigate(`/profile/${userId}`)}
      />
      <button onClick={() => handleSearch()}>Search</button>
      <div>
        <h2>Search Results</h2>
        <div>
          {profiles.map((profile) => (
            <button
              key={profile.userId}
              onClick={() => navigate(`/profile/${profile.userId}`)}
            >
              {profile.username} ({profile.firstName} {profile.lastName})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
