import type { ParkMapProps } from "@/components/contracts";

export default function ParkMap({ parks, className }: ParkMapProps) {
  return (
    <div
      data-testid="park-map"
      className={`flex h-96 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-500 ${className ?? ""}`}
    >
      Map of {parks.length} parks
    </div>
  );
}
