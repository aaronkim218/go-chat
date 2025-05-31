import { Profile } from "../types";

export const getProfileDiff = (
  original: Profile,
  updated: Profile
): Partial<Profile> => {
  const diff: Partial<Profile> = {};

  for (const key in updated) {
    const typedKey = key as keyof Profile;
    if (updated[typedKey] !== original[typedKey]) {
      diff[typedKey] = updated[typedKey];
    }
  }

  return diff;
};
