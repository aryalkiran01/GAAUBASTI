# Map Search — Phase 4 Assessment

## Status: Deferred (not safely completable in Phase 4)

## What exists
- **Backend**: The `Listing` model has a `location.coordinates` field (`{ latitude: Number, longitude: Number }`) and a `2dsphere` index on `location.coordinates`. The listing search API supports location text search and filtering but does not yet support geo queries (`$near`, `$geoWithin`).
- **Frontend**: No map library is installed. `package.json` does not include Leaflet, Mapbox, React-Leaflet, or any mapping dependency. The `Listings` page uses a grid layout with no map toggle.

## Why it cannot be safely completed in Phase 4
1. **Missing frontend dependency**: Adding a map library (e.g., `leaflet` + `react-leaflet`) requires a new npm install, CSS imports, and tile provider configuration. This is a non-trivial integration that risks breaking the existing build.
2. **Geo query support needed**: The backend listing controller would need a new code path for `$near`/`$geoWithin` queries with distance filtering. The current `coordinates` field stores lat/lng as separate numbers, not as a GeoJSON `Point`, so the `$near` query shape would need schema adjustments or a computed field.
3. **UI complexity**: A map search view requires a split-pane layout (map + list), marker clustering, popup cards, and mobile responsive handling. This is a full feature, not a polish task.
4. **No tile provider configured**: Free tile providers (OpenStreetMap) work but require proper attribution and rate-limit handling.

## Recommended approach for a future phase
1. Add `leaflet` and `react-leaflet` to frontend dependencies.
2. Add a `GeoJSON Point` field to the Listing schema or use a `$centerSphere` query on the existing lat/lng fields.
3. Add `lat`, `lng`, and `radius` query params to the listing search API.
4. Build a `MapView` component with markers, popups, and a list/map toggle on the Listings page.
5. Ensure mobile responsiveness (full-screen map with collapsible list).
