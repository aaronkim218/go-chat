export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  const rtf = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  if (diffMin < 60) {
    return rtf.format(-diffMin, "minute");
  } else if (diffHr < 24) {
    return rtf.format(-diffHr, "hour");
  } else {
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
};
