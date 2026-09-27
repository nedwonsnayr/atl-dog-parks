import type { AdSlotProps } from "@/components/contracts";

export default function AdSlot({ slot, className }: AdSlotProps) {
  return <div data-testid={`ad-slot-${slot}`} aria-hidden="true" className={className} />;
}
