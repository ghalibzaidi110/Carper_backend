/**
 * Damage classes that route through the cost-estimation model (repair flow).
 * Ported from new-webxr/src/estimate.js:38.
 */
export const REPAIR_TYPES = new Set(['dent', 'scratch', 'crack']);

/**
 * Damage classes that route through SerpApi vendor search (parts replacement flow).
 * Ported from new-webxr/src/estimate.js:39.
 */
export const PARTS_TYPES = new Set(['glass_shatter', 'tire_flat', 'lamp_broken']);
