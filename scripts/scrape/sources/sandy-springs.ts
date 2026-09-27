import { createArcGisAdapter, stringAttribute } from "./arcgis";

const endpoint =
  "https://gis2.sandyspringsga.gov/arcgis/rest/services/Basemap/City_Map_cs/MapServer/15";

export const sandySpringsGisAdapter = createArcGisAdapter({
  name: "sandy-springs-gis",
  label: "City of Sandy Springs GIS",
  endpoint,
  where: "UPPER(ParkName) LIKE '%DOG%' OR UPPER(Amenities) LIKE '%DOG%'",
  outFields: [
    "OBJECTID",
    "GlobalID",
    "UniqueParkID",
    "ParkName",
    "Amenities",
    "Address_Full",
    "City",
    "ZipCode",
  ],
  isDogPark(attributes) {
    const text = [stringAttribute(attributes, "ParkName"), stringAttribute(attributes, "Amenities")]
      .filter(Boolean)
      .join(" ");
    return /\bdog\s+park\b/i.test(text);
  },
  map(attributes) {
    const objectId = stringAttribute(attributes, "OBJECTID") ?? "unknown";
    return {
      objectId,
      id:
        stringAttribute(attributes, "GlobalID") ??
        stringAttribute(attributes, "UniqueParkID") ??
        objectId,
      name: stringAttribute(attributes, "ParkName") ?? `Sandy Springs dog park ${objectId}`,
      address: formatAddress(attributes),
      city: stringAttribute(attributes, "City") ?? "Sandy Springs",
      county: "Fulton",
    };
  },
});

function formatAddress(attributes: Record<string, unknown>): string | undefined {
  const address = stringAttribute(attributes, "Address_Full");
  if (!address) return undefined;
  const city = stringAttribute(attributes, "City") ?? "Sandy Springs";
  const zip = stringAttribute(attributes, "ZipCode");
  return [address, `${city}, GA`, zip].filter(Boolean).join(" ");
}
