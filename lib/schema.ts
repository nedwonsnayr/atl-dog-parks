import { z } from "zod";

export const PARK_TYPES = ["public", "business", "hoa/private"] as const;
export type ParkType = (typeof PARK_TYPES)[number];

export const PARK_STATUSES = ["published", "draft", "flagged"] as const;
export type ParkStatus = (typeof PARK_STATUSES)[number];

export const COUNTIES = ["Fulton", "DeKalb", "Cobb", "Clayton"] as const;
export type County = (typeof COUNTIES)[number];

export const SURFACES = ["grass", "gravel", "turf", "mulch", "dirt"] as const;
export type Surface = (typeof SURFACES)[number];

export const BOOLEAN_AMENITIES = [
  "fenced",
  "offLeash",
  "smallDogArea",
  "water",
  "shade",
  "lighting",
  "parking",
  "restrooms",
] as const;
export type BooleanAmenity = (typeof BOOLEAN_AMENITIES)[number];

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// null means "unknown", which must stay distinct from a confirmed false.
const amenityFlag = z.boolean().nullable();

export const AmenitiesSchema = z.object({
  fenced: amenityFlag,
  offLeash: amenityFlag,
  smallDogArea: amenityFlag,
  water: amenityFlag,
  shade: amenityFlag,
  lighting: amenityFlag,
  parking: amenityFlag,
  restrooms: amenityFlag,
  surface: z.array(z.enum(SURFACES)),
});
export type Amenities = z.infer<typeof AmenitiesSchema>;

export const FeesSchema = z.object({
  free: z.boolean(),
  details: z.string().min(1).optional(),
});

export const SourceSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
  retrievedAt: z.iso.date().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

const ParkObjectSchema = z.object({
  slug: z.string().regex(slugPattern, "slug must be lowercase kebab-case"),
  name: z.string().min(1),
  type: z.enum(PARK_TYPES),
  status: z.enum(PARK_STATUSES),
  description: z.string().min(40, "description must be substantive original text"),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  county: z.enum(COUNTIES),
  osmId: z
    .string()
    .regex(/^(node|way|relation)\/\d+$/)
    .optional(),
  googlePlaceId: z.string().min(1).optional(),
  website: z.url().optional(),
  amenities: AmenitiesSchema,
  fees: FeesSchema,
  hours: z.string().min(1).optional(),
  rules: z.array(z.string().min(1)),
  permitRequired: z.boolean(),
  lastVerified: z.iso.date(),
  sources: z.array(SourceSchema).min(1),
  manualOverrides: z.array(z.string().min(1)),
});

export type ParkField = keyof z.infer<typeof ParkObjectSchema>;
export const PARK_FIELDS = Object.keys(ParkObjectSchema.shape) as ParkField[];

/**
 * A park record from `data/parks/<slug>.json`.
 * `manualOverrides` entries are top-level field names or dotted paths into
 * nested objects (e.g. "amenities.water"); the scraper never overwrites them.
 */
export const ParkSchema = ParkObjectSchema.superRefine((park, ctx) => {
  if (park.type === "business" && !park.website) {
    ctx.addIssue({
      code: "custom",
      path: ["website"],
      message: "website is required for business parks",
    });
  }
  park.manualOverrides.forEach((field, i) => {
    const root = field.split(".")[0] as ParkField;
    if (!PARK_FIELDS.includes(root)) {
      ctx.addIssue({
        code: "custom",
        path: ["manualOverrides", i],
        message: `unknown park field "${field}"`,
      });
    }
  });
});

export type Park = z.infer<typeof ParkSchema>;
