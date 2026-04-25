/**
 * Vendor search configuration — ported from new-webxr/server.js:43-81.
 * Each `damageType` entry maps to a Google Shopping query template and a
 * fallback PKR price range used when SerpApi is unavailable or returns no hits.
 */

export interface SearchConfig {
  query: string;
  partName: string;
  fallback: { min: number; max: number };
}

export const SEARCH_CONFIG: Record<string, SearchConfig> = {
  glass_shatter: {
    query: 'car windshield glass replacement price Pakistan',
    partName: 'Windshield / Window Glass',
    fallback: { min: 15000, max: 50000 },
  },
  tire_flat: {
    query: 'car tyre replacement price Pakistan',
    partName: 'Tyre Replacement',
    fallback: { min: 8000, max: 25000 },
  },
  lamp_broken: {
    query: 'car headlight assembly replacement price Pakistan',
    partName: 'Headlight / Lamp Assembly',
    fallback: { min: 5000, max: 30000 },
  },
};

/** Panel location → human-readable part name fragment for the search query. */
export const PANEL_QUERY_MAP: Record<string, string> = {
  front_bumper: 'front bumper',
  back_bumper: 'rear bumper',
  hood: 'car hood bonnet',
  front_glass: 'windshield front glass',
  back_glass: 'rear windshield glass',
  front_left_door: 'front left door',
  front_right_door: 'front right door',
  back_left_door: 'rear left door',
  back_right_door: 'rear right door',
  back_door: 'rear hatch door',
  front_left_light: 'front left headlight',
  front_right_light: 'front right headlight',
  back_left_light: 'rear left tail light',
  back_right_light: 'rear right tail light',
  back_light: 'rear tail light',
  front_light: 'front headlight',
  left_mirror: 'left side mirror',
  right_mirror: 'right side mirror',
};
