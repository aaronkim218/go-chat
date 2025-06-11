export const isObjectEmpty = (obj: object): boolean => {
  return JSON.stringify(obj) === "{}";
};
