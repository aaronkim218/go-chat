export const isObjectEmpty = (obj: any): boolean => {
  return JSON.stringify(obj) === "{}";
};
