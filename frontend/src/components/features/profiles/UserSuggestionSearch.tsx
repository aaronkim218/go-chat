import { Profile, SearchProfilesOptions } from "@/types";
import { searchProfiles } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UNKNOWN_ERROR } from "@/constants";

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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSuggest = async (opts: SearchProfilesOptions) => {
    if (!opts.username) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    try {
      const resp = await searchProfiles(opts);
      setSuggestions(resp);
      setOpen(resp.length > 0);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(UNKNOWN_ERROR);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      );
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleClick(suggestions[selectedIndex]);
      setOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  return (
    <div className=" relative w-full" ref={containerRef}>
      <Input
        id={inputId}
        type="text"
        placeholder="Search by username"
        value={searchOptions.username}
        onChange={(e) => {
          setSearchOptions({ ...searchOptions, username: e.target.value });
          handleSuggest({ ...searchOptions, username: e.target.value });
          setSelectedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
      />
      {open && suggestions.length > 0 && (
        <div className=" absolute w-full border border-border bg-card z-1 rounded-lg">
          {suggestions.map((profile, index) => (
            <Button
              variant={"ghost"}
              className={` w-full justify-start ${index === selectedIndex && "bg-muted"}`}
              key={profile.userId}
              onClick={() => {
                handleClick(profile);
                setOpen(false);
              }}
            >
              {profile.username} ({profile.firstName} {profile.lastName})
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSuggestionSearch;
