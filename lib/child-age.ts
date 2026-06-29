/** Story content is written for ages 3–12. */
export const MIN_STORY_AGE = 3;
export const MAX_STORY_AGE = 12;

export type AgeBand = "young" | "mid" | "older";

export function parseBirthDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatBirthDateIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole years on a given calendar day (default: today). */
export function ageFromBirthDate(birthDate: Date, asOf = new Date()): number {
  let age = asOf.getFullYear() - birthDate.getUTCFullYear();
  const monthDiff = asOf.getMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function clampStoryAge(age: number): number {
  return Math.min(MAX_STORY_AGE, Math.max(MIN_STORY_AGE, age));
}

export function getAgeBand(age: number): AgeBand {
  if (age <= 5) return "young";
  if (age <= 8) return "mid";
  return "older";
}

export function defaultBirthDateForAge(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return formatBirthDateIso(
    new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  );
}

/** Estimate birth date for legacy profiles that only stored age. */
export function estimateBirthDateFromAge(age: number, referenceDate = new Date()): Date {
  const year = referenceDate.getFullYear() - age;
  return new Date(Date.UTC(year, referenceDate.getMonth(), referenceDate.getDate()));
}

export function getEffectiveAge(params: {
  birthDate?: Date | string | null;
  storedAge?: number | null;
  profileCreatedAt?: Date | null;
}): number {
  if (params.birthDate) {
    const parsed =
      typeof params.birthDate === "string"
        ? parseBirthDate(params.birthDate)
        : params.birthDate;
    if (parsed) return clampStoryAge(ageFromBirthDate(parsed));
  }

  if (params.storedAge != null && params.storedAge > 0) {
    return clampStoryAge(params.storedAge);
  }

  return 5;
}

export function birthDateInputBounds(asOf = new Date()): { min: string; max: string } {
  const maxDate = new Date(asOf);
  maxDate.setFullYear(maxDate.getFullYear() - MIN_STORY_AGE);
  const minDate = new Date(asOf);
  minDate.setFullYear(minDate.getFullYear() - MAX_STORY_AGE);
  return {
    min: formatBirthDateIso(
      new Date(Date.UTC(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()))
    ),
    max: formatBirthDateIso(
      new Date(Date.UTC(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()))
    ),
  };
}

export function birthDateFromRecord(record: {
  birthDate?: Date | null;
  age: number;
  createdAt?: Date;
}): string | undefined {
  if (record.birthDate) return formatBirthDateIso(record.birthDate);
  if (record.createdAt && record.age > 0) {
    return formatBirthDateIso(estimateBirthDateFromAge(record.age, record.createdAt));
  }
  return undefined;
}

function calendarDayInSast(date: Date): { year: number; month: number; day: number } {
  const sast = new Date(date.toLocaleString("en-US", { timeZone: "Africa/Johannesburg" }));
  return { year: sast.getFullYear(), month: sast.getMonth(), day: sast.getDate() };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** True when storyDate (SAST calendar day) matches the child's birth month/day. */
export function isBirthdayOnDate(birthDate: Date | string, storyDate: Date): boolean {
  const parsed = typeof birthDate === "string" ? parseBirthDate(birthDate) : birthDate;
  if (!parsed) return false;

  const story = calendarDayInSast(storyDate);
  const birthMonth = parsed.getUTCMonth();
  const birthDay = parsed.getUTCDate();

  // Feb 29 birthdays are celebrated on Feb 28 in non-leap years.
  if (birthMonth === 1 && birthDay === 29) {
    if (story.month === 1 && story.day === 29) return true;
    if (story.month === 1 && story.day === 28 && !isLeapYear(story.year)) return true;
    return false;
  }

  return story.month === birthMonth && story.day === birthDay;
}

/** Child's age on a given calendar day (e.g. story date). */
export function getAgeOnDate(birthDate: Date | string, onDate: Date): number {
  const parsed = typeof birthDate === "string" ? parseBirthDate(birthDate) : birthDate;
  if (!parsed) return 5;
  return clampStoryAge(ageFromBirthDate(parsed, onDate));
}
