export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  return rtf.format(-diffMin, "minute");
};
