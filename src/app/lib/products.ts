import type { AppCategory, ProductRarity } from "@/app/types";

export const APP_CATEGORIES: AppCategory[] = [
  "Alimentos",
  "Bebidas",
  "Higiene/Cuidado personal",
  "Limpieza/Hogar",
  "Mascotas",
  "Salud/Farmacia",
  "Otros"
];

const CATEGORY_KEYWORDS: Record<AppCategory, string[]> = {
  Alimentos: ["food", "foods", "snack", "snacks", "meal", "pan", "bread", "bakery"],
  Bebidas: ["beverage", "beverages", "drink", "drinks", "agua", "juice", "soda"],
  "Higiene/Cuidado personal": ["hygiene", "toiletries", "cosmetic", "shampoo", "soap"],
  "Limpieza/Hogar": ["clean", "cleaning", "home", "household", "detergent", "lavanderia"],
  Mascotas: ["pets", "pet-food", "pet", "dog", "cat"],
  "Salud/Farmacia": ["health", "pharmacy", "medicine", "medical", "supplement"],
  Otros: []
};

export const normalizeCategory = (categoriesTags?: string[], categories?: string): AppCategory => {
  const tags = categoriesTags ?? [];
  const fallback = categories ?? "";
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  const normalizedCategories = fallback.toLowerCase();

  for (const category of APP_CATEGORIES) {
    if (category === "Otros") continue;
    const keywords = CATEGORY_KEYWORDS[category];
    if (
      keywords.some((keyword) =>
        normalizedTags.some((tag) => tag.includes(keyword)) ||
        normalizedCategories.includes(keyword)
      )
    ) {
      return category;
    }
  }

  return "Otros";
};

const hashBarcode = (barcode: string) => {
  let hash = 0;
  for (let i = 0; i < barcode.length; i += 1) {
    hash = (hash * 31 + barcode.charCodeAt(i)) % 100000;
  }
  return hash;
};

export const rarityFromBarcode = (barcode: string): ProductRarity => {
  const roll = hashBarcode(barcode) % 100;
  if (roll < 70) return "común";
  if (roll < 90) return "raro";
  if (roll < 98) return "épico";
  return "legendario";
};

export const rarityBaseXp: Record<ProductRarity, number> = {
  común: 50,
  raro: 120,
  épico: 250,
  legendario: 600
};

export const streakBonusByDays = (streak: number) => {
  if (streak >= 15) return 60;
  if (streak >= 8) return 40;
  if (streak >= 4) return 20;
  return 0;
};
