import { BOOLEAN_AMENITIES, type Amenities } from "@/lib/schema";

const amenityLabels = {
  fenced: "Fenced",
  offLeash: "Off leash",
  smallDogArea: "Small-dog area",
  water: "Water",
  shade: "Shade",
  lighting: "Lighting",
  parking: "Parking",
  restrooms: "Restrooms",
} satisfies Record<(typeof BOOLEAN_AMENITIES)[number], string>;

export default function AmenityBadges({
  amenities,
  compact = false,
}: {
  amenities: Amenities;
  compact?: boolean;
}) {
  const confirmed = BOOLEAN_AMENITIES.filter((amenity) => amenities[amenity] === true);

  return (
    <ul
      data-testid={compact ? undefined : "park-amenities"}
      aria-label="Park amenities"
      className="flex flex-wrap gap-2"
    >
      {confirmed.map((amenity) => (
        <li
          key={amenity}
          className={`rounded-full bg-emerald-50 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800 ${
            compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
        >
          {amenityLabels[amenity]}
        </li>
      ))}
      {amenities.surface.map((surface) => (
        <li
          key={surface}
          className={`rounded-full bg-amber-50 font-medium capitalize text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800 ${
            compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
        >
          {surface}
        </li>
      ))}
    </ul>
  );
}
