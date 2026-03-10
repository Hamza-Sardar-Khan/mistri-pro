export const AVAILABLE_SKILLS = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Mason",
  "Welder",
  "HVAC Technician",
  "Roofer",
  "Tiler",
  "Landscaper",
] as const;

export type Skill = (typeof AVAILABLE_SKILLS)[number];
