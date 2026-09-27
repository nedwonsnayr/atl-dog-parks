import type { AdSlotProps } from "@/components/contracts";
import { adsEnabled, publicEnv } from "@/lib/env";
import AdSlotClient from "./AdSlotClient";

export default function AdSlot({ slot, className }: AdSlotProps) {
  if (!adsEnabled || !publicEnv.NEXT_PUBLIC_ADSENSE_CLIENT) {
    return null;
  }

  return (
    <AdSlotClient slot={slot} className={className} client={publicEnv.NEXT_PUBLIC_ADSENSE_CLIENT} />
  );
}
