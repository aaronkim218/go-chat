export const getJwt = (): string | null => {
  const value = localStorage.getItem(
    import.meta.env.VITE_JWT_LOCAL_STORAGE_KEY
  );

  if (value) {
    return JSON.parse(value).access_token;
  }

  return null;
};
