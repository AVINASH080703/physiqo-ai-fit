/** Unit conversion helpers — UI converts on display only; storage stays metric. */
export type UnitSystem = "metric" | "imperial";

export const ML_PER_OZ = 29.5735;
export const KG_PER_LB = 0.453592;

export const mlToOz = (ml: number) => ml / ML_PER_OZ;
export const ozToMl = (oz: number) => oz * ML_PER_OZ;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;

export function formatVolume(ml: number, system: UnitSystem): string {
  if (system === "imperial") return `${mlToOz(ml).toFixed(1)} oz`;
  return ml >= 1000 ? `${(ml / 1000).toFixed(2)} L` : `${Math.round(ml)} ml`;
}

export function formatWeight(kg: number, system: UnitSystem): string {
  if (system === "imperial") return `${kgToLb(kg).toFixed(1)} lb`;
  return `${kg.toFixed(1)} kg`;
}
