import type { Park } from "@/lib/schema";
import ParkCard from "./ParkCard";

export type ParkListItem = Park & { distanceMiles?: number };

export default function ParkList({ parks }: { parks: ParkListItem[] }) {
  return (
    <div
      data-testid="park-list"
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      aria-label="Dog parks"
    >
      {parks.map((park) => (
        <ParkCard key={park.slug} park={park} distanceMiles={park.distanceMiles} />
      ))}
    </div>
  );
}
