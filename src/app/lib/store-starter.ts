import {
  addDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { db } from "@/firebase";

const STARTER_CATALOG = [
  {
    category: {
      name: "Bebidas",
      description: "Bebidas para canjear con XP.",
      order: 0
    },
    rewards: [
      {
        name: "Pepsi",
        description: "Una Pepsi.",
        cost: 400,
        emoji: "🥤"
      }
    ]
  },
  {
    category: {
      name: "Snacks",
      description: "Algo rico para darse un gusto.",
      order: 1
    },
    rewards: [
      {
        name: "Alfajor",
        description: "Un alfajor a elección.",
        cost: 250,
        emoji: "🍫"
      },
      {
        name: "Papas",
        description: "Un paquete de papas.",
        cost: 350,
        emoji: "🍟"
      },
      {
        name: "Gomitas",
        description: "Un paquete de gomitas.",
        cost: 300,
        emoji: "🍬"
      }
    ]
  },
  {
    category: {
      name: "Comidas",
      description: "Premios de comida más grandes.",
      order: 2
    },
    rewards: [
      {
        name: "Delivery Mostaza",
        description: "Un pedido de Mostaza.",
        cost: 1200,
        emoji: "🍔"
      }
    ]
  }
];

let seedRunning = false;

export async function seedStarterStore() {
  if (seedRunning) return;
  seedRunning = true;

  try {
    const categoriesSnapshot = await getDocs(
      collection(db, "storeCategories")
    );
    const rewardsSnapshot = await getDocs(
      collection(db, "storeRewards")
    );

    const existingCategories = new Map(
      categoriesSnapshot.docs.map((document) => [
        String(document.data().name).trim().toLowerCase(),
        document.id
      ])
    );

    const existingRewards = new Set(
      rewardsSnapshot.docs.map((document) =>
        String(document.data().name).trim().toLowerCase()
      )
    );

    for (const group of STARTER_CATALOG) {
      const categoryKey = group.category.name.toLowerCase();
      let categoryId = existingCategories.get(categoryKey);

      if (!categoryId) {
        const categoryReference = await addDoc(
          collection(db, "storeCategories"),
          {
            name: group.category.name,
            description: group.category.description,
            order: group.category.order,
            active: true,
            createdAt: new Date().toISOString()
          }
        );

        categoryId = categoryReference.id;
        existingCategories.set(categoryKey, categoryId);
      }

      for (const reward of group.rewards) {
        const rewardKey = reward.name.toLowerCase();
        if (existingRewards.has(rewardKey)) continue;

        await addDoc(collection(db, "storeRewards"), {
          name: reward.name,
          description: reward.description,
          categoryId,
          cost: reward.cost,
          emoji: reward.emoji,
          active: true,
          createdAt: new Date().toISOString()
        });

        existingRewards.add(rewardKey);
      }
    }
  } finally {
    seedRunning = false;
  }
}
