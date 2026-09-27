import Link from "next/link";
import { getAllParks } from "@/lib/parks";

export default function Home() {
  const parks = getAllParks();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dog parks inside the Perimeter</h1>
      <ul data-testid="park-list" className="space-y-2">
        {parks.map((park) => (
          <li key={park.slug} data-testid="park-card" data-park-slug={park.slug}>
            <Link href={`/parks/${park.slug}`} className="hover:underline">
              {park.name}
            </Link>
            <span className="text-sm text-zinc-500"> · {park.neighborhood}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
