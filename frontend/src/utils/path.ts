import { AUTH_PATHS } from "@/constants";
import { matchPath } from "react-router-dom";

export const isAuthPath = (path: string): boolean => {
  return AUTH_PATHS.some((authPath) => matchPath(authPath, path) !== null);
};
