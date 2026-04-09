import { db } from "./db";
import { vehicles } from "@shared/schema";
import type { InsertVehicle } from "@shared/schema";

const sampleVehicles: InsertVehicle[] = [
  {
    name: "Chevrolet Onix 2024",
    category: "Econômico",
    brand: "Chevrolet",
    model: "Onix",
    year: 2024,
    pricePerDay: "120.00",
    transmission: "Manual",
    fuel: "Flex",
    seats: 5,
    imageUrl: "/attached_assets/image_1759951341171.png",
    available: true,
    isInvestorVehicle: false,
    ownerId: null,
    investorPercentage: 70,
  },
  {
    name: "Renault Sandero 2024",
    category: "Econômico",
    brand: "Renault",
    model: "Sandero",
    year: 2024,
    pricePerDay: "130.00",
    transmission: "Manual",
    fuel: "Flex",
    seats: 5,
    imageUrl: "/attached_assets/image_1759952226755.png",
    available: true,
    isInvestorVehicle: false,
    ownerId: null,
    investorPercentage: 70,
  },
  {
    name: "Ford Ka 2023",
    category: "Econômico",
    brand: "Ford",
    model: "Ka",
    year: 2023,
    pricePerDay: "110.00",
    transmission: "Manual",
    fuel: "Flex",
    seats: 5,
    imageUrl: "/attached_assets/image_1759951746360.png",
    available: true,
    isInvestorVehicle: false,
    ownerId: null,
    investorPercentage: 70,
  },
  {
    name: "Volkswagen Up 2024",
    category: "Econômico",
    brand: "Volkswagen",
    model: "Up",
    year: 2024,
    pricePerDay: "125.00",
    transmission: "Manual",
    fuel: "Flex",
    seats: 4,
    imageUrl: "/attached_assets/image_1759952371302.png",
    available: true,
    isInvestorVehicle: false,
    ownerId: null,
    investorPercentage: 70,
  },
  {
    name: "Fiat Mobi 2023",
    category: "Econômico",
    brand: "Fiat",
    model: "Mobi",
    year: 2023,
    pricePerDay: "100.00",
    transmission: "Manual",
    fuel: "Flex",
    seats: 4,
    imageUrl: "/attached_assets/image_1759951672883.png",
    available: true,
    isInvestorVehicle: false,
    ownerId: null,
    investorPercentage: 70,
  },
  {
    name: "Volkswagen Voyage 2024",
    category: "Sedan",
    brand: "Volkswagen",
    model: "Voyage",
    year: 2024,
    pricePerDay: "140.00",
    transmission: "Manual",
    fuel: "Flex",
    seats: 5,
    imageUrl: "/attached_assets/image_1759952481429.png",
    available: true,
    isInvestorVehicle: false,
    ownerId: null,
    investorPercentage: 70,
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if vehicles already exist
  const existingVehicles = await db.select().from(vehicles);
  
  if (existingVehicles.length > 0) {
    console.log("✅ Database already has data, skipping seed");
    process.exit(0);
  }

  // Insert sample vehicles
  await db.insert(vehicles).values(sampleVehicles);
  
  console.log("✅ Seeded 6 sample vehicles");
  console.log("🎉 Database seeded successfully!");
  
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
