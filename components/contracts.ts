import type { LatLng } from "@/lib/geo";
import type { Park } from "@/lib/schema";

export type { LatLng };

export interface ParkMapProps {
  parks: Park[];
  selectedSlug?: string;
  onSelect?: (slug: string) => void;
  /** Stays on the client; never sent to the server. */
  userLocation?: LatLng | null;
  className?: string;
}

export const AD_SLOTS = ["list-inline", "detail-sidebar", "detail-footer"] as const;
export type AdSlotName = (typeof AD_SLOTS)[number];

export interface AdSlotProps {
  slot: AdSlotName;
  className?: string;
}

export interface ReviewSectionProps {
  parkSlug: string;
}

/** Without `parkSlug` the form proposes a new park; with it, a correction. */
export interface SubmissionFormProps {
  parkSlug?: string;
}

export interface AuthButtonProps {
  className?: string;
}
