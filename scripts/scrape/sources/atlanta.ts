import { createArcGisAdapter, stringAttribute } from "./arcgis";

const endpoint =
  "https://services6.arcgis.com/QmEXbya2dRd48yU4/arcgis/rest/services/City_of_Atlanta_Parks/FeatureServer/9";

export const atlantaGisAdapter = createArcGisAdapter({
  name: "atlanta-gis",
  label: "City of Atlanta Department of Parks and Recreation GIS",
  endpoint,
  where: "UPPER(NAME) LIKE '%DOG%PARK%' OR UPPER(ALT_NAME) LIKE '%DOG%PARK%'",
  outFields: ["OBJECTID", "GlobalID", "ParkID", "NAME", "ALT_NAME", "NAV_ADDR", "NEIGHBOR", "ZIP"],
  isDogPark(attributes) {
    const names = [stringAttribute(attributes, "NAME"), stringAttribute(attributes, "ALT_NAME")];
    return names.some((name) => name !== undefined && /\bdog\s+park\b/i.test(name));
  },
  map(attributes, coordinates) {
    const objectId = required(attributes, "OBJECTID");
    return {
      objectId,
      id:
        stringAttribute(attributes, "GlobalID") ??
        stringAttribute(attributes, "ParkID") ??
        objectId,
      name:
        stringAttribute(attributes, "ALT_NAME") ??
        stringAttribute(attributes, "NAME") ??
        `Atlanta dog park ${objectId}`,
      address: formatAddress(attributes),
      neighborhood: stringAttribute(attributes, "NEIGHBOR"),
      city: "Atlanta",
      // Atlanta crosses the county line near 84.33° W; draft additions remain human-reviewed.
      county: coordinates.x > -84.33 ? "DeKalb" : "Fulton",
    };
  },
});

function formatAddress(attributes: Record<string, unknown>): string | undefined {
  const address = stringAttribute(attributes, "NAV_ADDR");
  const zip = stringAttribute(attributes, "ZIP");
  if (!address) return undefined;
  return [address, "Atlanta, GA", zip].filter(Boolean).join(" ");
}

function required(attributes: Record<string, unknown>, field: string): string {
  return stringAttribute(attributes, field) ?? "unknown";
}
