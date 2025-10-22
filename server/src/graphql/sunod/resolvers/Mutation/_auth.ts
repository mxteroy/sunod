export function toDateOnly(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  // keep date component only (YYYY-MM-DD) as a Date
  return new Date(dt.toISOString().slice(0, 10));
}
