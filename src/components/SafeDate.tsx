
"use client";

import { useEffect, useState } from "react";

/**
 * SafeDate handles date formatting on the client side only to prevent 
 * hydration mismatches between server and client locales.
 */
export function SafeDate({ date, format = "datetime" }: { date: any, format?: "date" | "time" | "datetime" }) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    if (!date) return;
    
    // Handle Firestore Timestamps vs Strings vs Date objects
    const d = date?.toDate ? date.toDate() : new Date(date);
    
    if (isNaN(d.getTime())) {
      setFormatted("Invalid Date");
      return;
    }

    if (format === "date") {
      setFormatted(d.toLocaleDateString());
    } else if (format === "time") {
      setFormatted(d.toLocaleTimeString());
    } else {
      setFormatted(d.toLocaleString());
    }
  }, [date, format]);

  // Return a span with a key to help React handle the text transition
  return <span className="tabular-nums">{formatted || "..."}</span>;
}
