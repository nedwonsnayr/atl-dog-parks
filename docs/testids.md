# `data-testid` contract

E2E specs (`e2e/**`) select elements only by these IDs. Renaming or removing one is a
contract change: record it in your PR description instead of editing silently.

Conventions: kebab-case; one ID per logical element; repeated items (cards, reviews)
share an ID and are distinguished by a `data-*` attribute such as `data-park-slug`.

## Layout (`app/layout.tsx`)

| ID               | Element                                 | Owner |
| ---------------- | --------------------------------------- | ----- |
| `auth-button`    | Sign-in / account control in the header | S5    |
| `consent-banner` | Consent banner (may be `hidden`)        | S4    |

## Park list and filters (`/`, `/neighborhoods/[slug]`)

| ID                  | Element                                                                                                | Owner |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ----- |
| `park-list`         | Container of park cards                                                                                | S2    |
| `park-card`         | One park in a list; carries `data-park-slug`                                                           | S2    |
| `park-distance`     | Distance label inside a card after "near me"                                                           | S2    |
| `search-input`      | Free-text search box (`q` param)                                                                       | S2    |
| `filters`           | Filter controls container                                                                              | S2    |
| `filter-<name>`     | One filter control: `filter-type-<type>`, `filter-amenity-<key>`, `filter-free`, `filter-neighborhood` | S2    |
| `filters-clear`     | Reset all filters                                                                                      | S2    |
| `result-count`      | "N parks" count for the current filters                                                                | S2    |
| `view-toggle-list`  | Switch to list view                                                                                    | S2    |
| `view-toggle-map`   | Switch to map view                                                                                     | S2    |
| `near-me-button`    | Requests geolocation and sorts by distance                                                             | S2    |
| `near-me-error`     | Message shown when geolocation is denied/unavailable                                                   | S2    |
| `neighborhood-link` | Link to a neighborhood page; carries `data-neighborhood-slug`                                          | S2    |

`<type>` is `public`, `business`, or `hoa-private`; `<key>` is a `BOOLEAN_AMENITIES`
value from `lib/schema.ts` (e.g. `filter-amenity-smallDogArea`).

## Park detail (`/parks/[slug]`)

| ID                   | Element                                       | Owner |
| -------------------- | --------------------------------------------- | ----- |
| `park-detail`        | Detail page root; carries `data-park-slug`    | S2    |
| `park-name`          | Park name heading                             | S2    |
| `park-amenities`     | Amenity badge list                            | S2    |
| `park-last-verified` | "Last verified" date                          | S2    |
| `map-link-google`    | Google Maps directions link                   | S2    |
| `map-link-apple`     | Apple Maps directions link                    | S2    |
| `park-website-link`  | Official website link (always for businesses) | S2    |
| `report-issue-link`  | "Report an issue" link                        | S2    |

## Map (`components/map/**`)

| ID                     | Element                        | Owner |
| ---------------------- | ------------------------------ | ----- |
| `park-map`             | Map container                  | S3    |
| `map-popup`            | Open marker popup              | S3    |
| `map-popup-link`       | Detail link inside the popup   | S3    |
| `user-location-marker` | Marker for the user's location | S3    |

## Ads and consent (`components/ads/**`, `components/consent/**`)

| ID               | Element                                                                  | Owner |
| ---------------- | ------------------------------------------------------------------------ | ----- |
| `ad-slot-<slot>` | `ad-slot-list-inline`, `ad-slot-detail-sidebar`, `ad-slot-detail-footer` | S4    |
| `consent-accept` | Accept button in the consent banner                                      | S4    |
| `consent-reject` | Reject button in the consent banner                                      | S4    |

## Reviews, submissions, auth (`components/{reviews,submissions,auth}/**`)

| ID                      | Element                                         | Owner |
| ----------------------- | ----------------------------------------------- | ----- |
| `review-section`        | Reviews section on a park page                  | S5    |
| `review-item`           | One approved review; carries `data-review-id`   | S5    |
| `review-sign-in-prompt` | "Sign in to write a review" prompt (signed out) | S5    |
| `review-form`           | Review form (verified users)                    | S5    |
| `review-rating`         | Rating input                                    | S5    |
| `review-body`           | Review text input                               | S5    |
| `review-submit`         | Review submit button                            | S5    |
| `submission-form`       | New-park / correction form                      | S5    |
| `submission-submit`     | Submission submit button                        | S5    |
| `form-success`          | Success message after a review or submission    | S5    |
| `form-error`            | Error message for a review or submission        | S5    |
| `sign-in-form`          | Magic-link email form on `/auth`                | S5    |
| `sign-in-google`        | "Continue with Google" button                   | S5    |
| `account-delete`        | Delete-account button on `/account`             | S5    |
