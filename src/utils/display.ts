function notBlank(s?: string | null): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

/**
 * Display name for a student card / list row.
 *
 * Falls back through preferredName → firstName, treating empty strings as
 * missing (the form's default value is `''`, which `??` does not catch).
 * Always appends the lastName when present.
 */
export function studentDisplayName(s: {
  firstName?: string;
  preferredName?: string;
  lastName?: string;
}): string {
  const first = notBlank(s.preferredName) ?? notBlank(s.firstName) ?? '';
  const last = notBlank(s.lastName) ?? '';
  return [first, last].filter(Boolean).join(' ');
}

/**
 * Greeting name for a user's profile (parent / teacher home).
 * preferredName → first word of fullName → fallback string.
 */
export function userGreetingName(
  profile: { preferredName?: string; fullName?: string } | null | undefined,
  fallback: string
): string {
  const preferred = notBlank(profile?.preferredName);
  if (preferred) return preferred;
  const firstWord = notBlank(profile?.fullName?.split(' ')[0]);
  return firstWord ?? fallback;
}
