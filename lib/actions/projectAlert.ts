"use server";

import { currentUser } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import ProjectAlert from "@/models/ProjectAlert";

type BudgetType = "fixed" | "hourly";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function createProjectAlert(data: {
  searchQuery: string;
  categories: string[];
  locations: string[];
  budgetTypes: BudgetType[];
}) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const searchQuery = data.searchQuery.trim();
  const categories = Array.from(new Set(data.categories.filter(Boolean))).sort();
  const locations = Array.from(new Set(data.locations.filter(Boolean))).sort();
  const budgetTypes = Array.from(new Set(data.budgetTypes.filter(Boolean))).sort();

  if (!searchQuery && categories.length === 0 && locations.length === 0 && budgetTypes.length === 0) {
    throw new Error("Choose at least one filter or search term before creating an alert");
  }

  await connectDB();
  const alert = await ProjectAlert.findOneAndUpdate(
    {
      clerkUserId: user.id,
      searchQuery,
      categories,
      locations,
      budgetTypes,
    },
    {
      clerkUserId: user.id,
      searchQuery,
      categories,
      locations,
      budgetTypes,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return serialize(alert);
}
