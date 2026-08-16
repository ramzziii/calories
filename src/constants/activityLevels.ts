import { ActivityLevel } from "@/types";

export const ACTIVITY_LEVEL_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Little or no exercise, desk job",
  },
  {
    value: "light",
    label: "Lightly active",
    description: "Light exercise 1-3 days/week",
  },
  {
    value: "moderate",
    label: "Moderately active",
    description: "Moderate exercise 3-5 days/week",
  },
  {
    value: "active",
    label: "Very active",
    description: "Hard exercise 6-7 days/week",
  },
  {
    value: "very_active",
    label: "Extremely active",
    description: "Physical job or 2x/day training",
  },
];
