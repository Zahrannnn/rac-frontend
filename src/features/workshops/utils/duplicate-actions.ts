import type { DuplicateMatch } from "../types";

export type DuplicateDecision = "open" | "confirm-new" | "dismiss";

/**
 * The three SRS-mandated responses to the "possible duplicate" panel:
 *  - open        → navigate to the existing workshop's profile
 *  - confirm-new → resubmit with ConfirmDuplicate=true (record keeps a flag)
 *  - dismiss     → user declares it is not the same workshop; keep editing
 * None of them blocks — the SRS forbids blocking on similarity.
 */
export function decisionConfirmsCreation(decision: DuplicateDecision): boolean {
  return decision === "confirm-new";
}

/** The backend probe is valid only when every required field passed validation. */
export function isProbeComplete(probe: {
  nameEn: string;
  ownerName: string;
  mobile: string;
  address: string;
  governorate: string;
}): boolean {
  return (
    probe.nameEn.trim().length > 0 &&
    probe.ownerName.trim().length > 0 &&
    probe.mobile.trim().length > 0 &&
    probe.address.trim().length > 0 &&
    probe.governorate.trim().length > 0
  );
}

export function countDuplicateMatches(matches: readonly DuplicateMatch[]): number {
  return matches.length;
}
