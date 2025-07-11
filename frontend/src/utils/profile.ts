import { PatchProfileRequest, Profile } from "@/types";

export const getProfileDiff = (
  original: Profile,
  updated: Profile,
): PatchProfileRequest => {
  const diff: PatchProfileRequest = {};

  const keys: (keyof PatchProfileRequest)[] = [
    "username",
    "firstName",
    "lastName",
  ];

  for (const key of keys) {
    if (updated[key] !== original[key]) {
      diff[key] = updated[key];
    }
  }

  return diff;
};
