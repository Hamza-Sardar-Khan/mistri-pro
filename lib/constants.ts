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

export const AVAILABLE_LOCATIONS = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sukkur",
  "Abbottabad",
  "Gilgit",
  "Muzaffarabad",
] as const;

export type Location = (typeof AVAILABLE_LOCATIONS)[number];
