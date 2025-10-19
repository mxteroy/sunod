// src/graphql/resolvers/mutations/_helpers.ts

/**
 * Normalizes a date input to midnight UTC of that day.
 * This is critical for ensuring that a "daily" challenge is unique
 * per calendar day, avoiding timezone-related bugs.
 * @param date The date input from GraphQL (can be a string or Date object).
 * @returns A Date object set to 00:00:00 UTC.
 */
export function toDateOnly(date: Date | string): Date {
  const d = new Date(date);

  // This is the key part: it strips the time information.
  d.setUTCHours(0, 0, 0, 0);

  return d;
}
