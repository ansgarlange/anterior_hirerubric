export const uid = () => Math.random().toString(36).slice(2, 9);

export const PALETTE = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#65a30d", "#e11d48"];
export const color = (i) => PALETTE[i % PALETTE.length];

export function suggested(cand, fn) {
  const vals = fn.dimensions.map((d) => cand.scores[d.id]).filter((v) => v != null).sort((a, b) => a - b);
  if (!vals.length) return null;
  const mid = Math.floor(vals.length / 2);
  const median = vals.length % 2 ? vals[mid] : Math.round((vals[mid - 1] + vals[mid]) / 2);
  return { median, min: vals[0], max: vals[vals.length - 1], scored: vals.length };
}
