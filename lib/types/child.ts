import { z } from "zod";
import { SA_PROVINCES, formatSaLocation, getHomeBaseGuidance } from "@/lib/sa-locations";
import {
  ageFromBirthDate,
  clampStoryAge,
  defaultBirthDateForAge,
  MAX_STORY_AGE,
  MIN_STORY_AGE,
  parseBirthDate,
} from "@/lib/child-age";
import {
  ACTIVE_STORY_LANGUAGE_IDS,
  getLanguageLabel,
  getStoryLanguageInstruction,
} from "@/lib/sa-languages";
import type { BillingInterval } from "@/lib/pricing";

export const INTEREST_OPTIONS = [
  "cars",
  "princesses",
  "dinosaurs",
  "space",
  "animals",
  "soccer",
  "ballet",
  "superheroes",
  "nature",
  "pirates",
  "trains",
  "unicorns",
  "robots",
  "fairy tales",
] as const;

const birthDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth (YYYY-MM-DD)");

export const childProfileSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50),
    birthDate: birthDateField,
    pronouns: z.enum(["he/him", "she/her", "they/them"]),
    interests: z.array(z.string()).min(1, "Pick at least one interest"),
    favoriteColors: z.string().min(1, "Pick a favourite colour"),
    favoriteToy: z.string().optional(),
    petInfo: z.string().optional(),
    siblingNames: z.string().optional(),
    bestFriend: z.string().optional(),
    favoritePlace: z.string().optional(),
    province: z.enum(SA_PROVINCES, { message: "Select your province" }),
    cityOrTown: z.string().min(1, "City or town is required").max(80),
    customCity: z.string().max(80).optional(),
    suburb: z.string().max(80).optional(),
    topicsToAvoid: z.string().optional(),
    storyMood: z.enum(["gentle", "adventurous", "funny", "educational"]).default("gentle"),
    moralTheme: z.string().optional(),
    readAloudBy: z.enum(["parent", "child", "both"]).default("parent"),
    language: z.enum(ACTIVE_STORY_LANGUAGE_IDS, { message: "Choose a story language" }),
    /** Legacy signups may still send age; ignored when birthDate is present. */
    age: z.coerce.number().min(MIN_STORY_AGE).max(MAX_STORY_AGE).optional(),
  })
  .superRefine((data, ctx) => {
    const parsed = parseBirthDate(data.birthDate);
    if (!parsed) {
      ctx.addIssue({
        code: "custom",
        path: ["birthDate"],
        message: "Enter a valid date of birth",
      });
      return;
    }
    const age = ageFromBirthDate(parsed);
    if (age < MIN_STORY_AGE || age > MAX_STORY_AGE) {
      ctx.addIssue({
        code: "custom",
        path: ["birthDate"],
        message: `Stories are for children aged ${MIN_STORY_AGE}–${MAX_STORY_AGE}`,
      });
    }
  })
  .transform((data) => ({
    ...data,
    age: clampStoryAge(ageFromBirthDate(parseBirthDate(data.birthDate)!)),
  }));

export type ChildProfileInput = z.infer<typeof childProfileSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, "Your name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreedToTerms: z.literal(true, {
    message: "You must agree to the Terms & Privacy Policy",
  }),
  billingInterval: z.enum(["monthly", "annual"]).default("monthly"),
  children: z.array(childProfileSchema).min(1, "Add at least one child"),
  affiliateCode: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type { BillingInterval };

export function getWordBudget(age: number): { min: number; max: number; perPage: number } {
  if (age <= 5) return { min: 200, max: 300, perPage: 25 };
  if (age <= 8) return { min: 400, max: 550, perPage: 45 };
  return { min: 1000, max: 1500, perPage: 120 };
}

export function childProfileToPromptContext(child: ChildProfileInput): string {
  const city =
    child.cityOrTown === "Other" && child.customCity?.trim()
      ? child.customCity.trim()
      : child.cityOrTown;

  return [
    `Name: ${child.name}`,
    `Age: ${child.age} (updates automatically from date of birth)`,
    `Pronouns: ${child.pronouns}`,
    `Location: ${formatSaLocation(child.province, city, child.suburb)}`,
    getHomeBaseGuidance(child.province, city),
    `Interests: ${child.interests.join(", ")}`,
    `Favourite colours: ${child.favoriteColors}`,
    child.favoriteToy ? `Favourite toy: ${child.favoriteToy}` : null,
    child.petInfo ? `Pet: ${child.petInfo}` : null,
    child.siblingNames ? `Siblings: ${child.siblingNames}` : null,
    child.bestFriend ? `Best friend: ${child.bestFriend}` : null,
    child.favoritePlace ? `Favourite place at home: ${child.favoritePlace}` : null,
    child.topicsToAvoid ? `Avoid: ${child.topicsToAvoid}` : null,
    `Mood: ${child.storyMood}`,
    child.moralTheme ? `Moral theme: ${child.moralTheme}` : null,
    `Story language: ${getLanguageLabel(child.language)} — ${getStoryLanguageInstruction(child.language)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getResolvedCity(child: ChildProfileInput): string {
  if (child.cityOrTown === "Other" && child.customCity?.trim()) {
    return child.customCity.trim();
  }
  return child.cityOrTown;
}

export function isChildLocationComplete(child: ChildProfileInput): boolean {
  if (!child.province || !child.cityOrTown) return false;
  if (child.cityOrTown === "Other" && !child.customCity?.trim()) return false;
  return true;
}

export { defaultBirthDateForAge };
