import { useState } from "react";
import { searchProfiles } from "../api";
import { Profile, SearchProfilesOptions } from "../types";
import { useNavigate } from "react-router-dom";

const SUGGESTIONS_LIMIT = 5;

const SearchPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [options, setOptions] = useState<SearchProfilesOptions | undefined>(
    undefined,
  );
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!options) {
      console.error("Search options are not set");
      return;
    } else if (!options.username) {
      setProfiles([]);
      return;
    }

    try {
      const resp = await searchProfiles(options);
      setProfiles(resp);
    } catch (error) {
      console.error("Error searching profiles:", error);
    }
  };

  const handleSuggest = async (opts: SearchProfilesOptions) => {
    if (!opts) {
      console.error("Search options are not set");
      return;
    } else if (!opts.username) {
      setSuggestions([]);
      return;
    }

    try {
      const resp = await searchProfiles({
        ...opts,
        limit: SUGGESTIONS_LIMIT,
      });
      setSuggestions(resp);
    } catch (error) {
      console.error("Error suggesting profiles:", error);
    }
  };

  return (
    <div>
      <h1>Search profiles page</h1>
      <input
        type="text"
        placeholder="Search by username"
        onChange={(e) => {
          setOptions({ ...options, username: e.target.value });
          handleSuggest({ ...options, username: e.target.value });
        }}
      />
      <button onClick={() => handleSearch()}>Search</button>
      <div>
        <h2>Suggestions</h2>
        <div>
          {suggestions.map((profile) => (
            <button
              key={profile.userId}
              onClick={() => navigate(`/profile/${profile.userId}`)}
            >
              {profile.username} ({profile.firstName} {profile.lastName})
            </button>
          ))}
        </div>
      </div>
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
