"use client";

import { useMemo, useRef, useState } from "react";
import type { TrainingAttendee } from "../types";

/** How long a freshly added participant row stays tinted. */
const HIGHLIGHT_MS = 2400;

const withId = (set: ReadonlySet<string>, id: string) => new Set(set).add(id);
const withoutId = (set: ReadonlySet<string>, id: string) => {
  const next = new Set(set);
  next.delete(id);
  return next;
};

/**
 * Tracks attendees the server has confirmed but the refetched attendee list
 * may not include yet, and tints their rows for a few seconds after the add.
 */
export function useAttendeeHighlights(attendees: TrainingAttendee[]) {
  const [localAdds, setLocalAdds] = useState<ReadonlySet<string>>(new Set());
  const [highlighted, setHighlighted] = useState<ReadonlySet<string>>(new Set());
  const highlightTimers = useRef(new Map<string, number>());

  const enrolledTechnicianIds = useMemo(
    () => new Set([...attendees.map((a) => a.technicianId), ...localAdds]),
    [attendees, localAdds]
  );

  const onAdded = (technicianId: string) => {
    setLocalAdds((current) => withId(current, technicianId));
    setHighlighted((current) => withId(current, technicianId));
    window.clearTimeout(highlightTimers.current.get(technicianId));
    highlightTimers.current.set(
      technicianId,
      window.setTimeout(
        () => setHighlighted((current) => withoutId(current, technicianId)),
        HIGHLIGHT_MS
      )
    );
  };

  const onUndone = (technicianId: string) => {
    setLocalAdds((current) => withoutId(current, technicianId));
    setHighlighted((current) => withoutId(current, technicianId));
  };

  return { enrolledTechnicianIds, highlighted, onAdded, onUndone };
}
