import { db } from "../server/db";
import { customers, vehicles } from "../shared/schema";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

function extractYear(anoStr: string): number {
  if (!anoStr) return 2020;
  const parts = anoStr.split("/");
  if (parts.length === 2) {
    return parseInt(parts[1]) || 2020;
  }
  return parseInt(anoStr) || 2020;
}

function formatCpfCnpj(value: string): string {
  if (!value) return "";
  return value.toString().trim();
}

function formatPhone(value: string | number): string {
  if (!value) return "";
  return value.toString().replace(/[^\d()-\s]/g, "").trim();
}

function extractBrandModel(marcaModelo: string): { brand: string; model: string } {
  if (!marcaModelo) return { brand: "", model: "" };
  const parts = marcaModelo.trim().split(" ");
  const brand = parts[0] || "";
  const model = parts.slice(1).join(" ") || "";
  return { brand, model };
}

function mapCategory(cat: string): string {
  const catUpper = (cat || "").toUpperCase().trim();
  const mapping: Record<string, string> = {
    "HATCH": "Hatch",
    "SEDAN": "Sedan",
    "SEDA": "Sedan",
    "SUV": "SUV",
    "PICKUP": "Pickup",
    "VAN": "Van",
    "MINIVAN": "Minivan",
    "UTILITÁRIO": "Utilitário",
    "ESPORTIVO": "Esportivo",
    "LUXO": "Luxo",
    "ECONÔMICO": "Econômico",
  };
  return mapping[catUpper] || "Hatch";
}

function mapTransmission(cambio: string): string {
  const cambioUpper = (cambio || "").toUpperCase().trim();
  if (cambioUpper.includes("AUTO")) return "Automático";
  return "Manual";
}

async function main() {
  console.log("Starting import...");
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("attached_assets/Upar_no_sistema_1765388011950.xlsx");
  const sheet = workbook.getWorksheet("Planilha1")!;
  
  const rawData: any[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const rowValues: any[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowValues[colNumber - 1] = cell.value ?? "";
    });
    rawData.push(rowValues);
  });
  
  const dataRows = rawData.slice(1).filter(row => row[0]);
  
  console.log(`Found ${dataRows.length} vehicles to import`);
  
  const investorMap = new Map<string, {
    name: string;
    cpf: string;
    phone: string;
    email: string;
    vehicles: any[];
    paymentDays: Set<number>;
  }>();
  
  for (const row of dataRows) {
    const cpf = formatCpfCnpj(row[5]?.toString() || "");
    if (!cpf) continue;
    
    const proprietario = (row[4] || "").toString().trim();
    const telefone = formatPhone(row[7]);
    const email = (row[8] || "").toString().trim();
    const paymentDay = parseInt(row[10]) || 0;
    
    if (!investorMap.has(cpf)) {
      investorMap.set(cpf, {
        name: proprietario,
        cpf,
        phone: telefone,
        email: email !== "-" ? email : "",
        vehicles: [],
        paymentDays: new Set(),
      });
    }
    
    const investor = investorMap.get(cpf)!;
    if (paymentDay > 0 && paymentDay <= 31) {
      investor.paymentDays.add(paymentDay);
    }
    
    const { brand, model } = extractBrandModel(row[0]?.toString() || "");
    
    investor.vehicles.push({
      name: row[0]?.toString() || "",
      brand,
      model,
      year: extractYear(row[1]?.toString() || ""),
      plate: (row[2] || "").toString().trim(),
      renavam: (row[3] || "").toString().trim(),
      valorAcordado: parseFloat(row[9]) || 0,
      paymentDay,
      fipeValue: parseFloat(row[11]) || 0,
      ipvaValue: parseFloat(row[12]) || 0,
      mileage: parseInt(row[14]) || 0,
      category: mapCategory(row[15]?.toString() || ""),
      engine: (row[16] || "").toString().trim(),
      hasInsurance: (row[17] || "").toString().toUpperCase() === "SIM",
      seats: parseInt(row[18]) || 5,
      transmission: mapTransmission(row[19]?.toString() || ""),
    });
  }
  
  console.log(`Found ${investorMap.size} unique investors`);
  
  const defaultPassword = await bcrypt.hash("Investicar@2025", 10);
  
  let investorCount = 0;
  let vehicleCount = 0;
  
  for (const [cpf, data] of investorMap) {
    const isImobilicar = data.name.toUpperCase().includes("IMOBILICAR");
    
    let customerId: string | null = null;
    
    if (!isImobilicar) {
      const paymentDaysArray = Array.from(data.paymentDays).sort((a, b) => a - b);
      const paymentDay = paymentDaysArray[0] || null;
      
      const existingCustomer = await db.select().from(customers).where(eq(customers.cpf, cpf)).limit(1);
      
      if (existingCustomer.length === 0) {
        const [newCustomer] = await db.insert(customers).values({
          name: data.name,
          cpf,
          email: data.email || `${cpf.replace(/\D/g, "")}@investidor.com`,
          phone: data.phone,
          password: defaultPassword,
          bonusBalance: "0",
          totalSpent: "0",
          totalEarnings: "0",
          rating: 5,
          totalRentals: 0,
          status: "active",
          paymentDate: paymentDay,
        }).returning();
        
        customerId = newCustomer.id;
        investorCount++;
        console.log(`Created investor: ${data.name} (${cpf})`);
      } else {
        customerId = existingCustomer[0].id;
        await db.update(customers).set({
          phone: data.phone || existingCustomer[0].phone,
          email: data.email || existingCustomer[0].email,
          password: existingCustomer[0].password || defaultPassword,
          paymentDate: paymentDay || existingCustomer[0].paymentDate,
        }).where(eq(customers.id, customerId));
        console.log(`Updated existing investor: ${data.name}`);
      }
    }
    
    for (const v of data.vehicles) {
      const existingVehicle = await db.select().from(vehicles).where(eq(vehicles.licensePlate, v.plate)).limit(1);
      
      if (existingVehicle.length === 0) {
        await db.insert(vehicles).values({
          name: v.name,
          brand: v.brand,
          model: v.model,
          year: v.year,
          licensePlate: v.plate,
          renavam: v.renavam,
          category: v.category,
          transmission: v.transmission,
          fuel: "Flex",
          seats: v.seats,
          fipeValue: v.fipeValue.toString(),
          ipvaValue: v.ipvaValue.toString(),
          hasInsurance: v.hasInsurance,
          mileage: v.mileage,
          pricePerDay: "150",
          monthlyPrice: "2800",
          available: true,
          isInvestorVehicle: !isImobilicar,
          ownerId: customerId,
          customDividend: v.valorAcordado > 0 ? v.valorAcordado.toString() : null,
          availableForFinancing: true,
          imageUrl: "https://placehold.co/400x300?text=Sem+Imagem",
        });
        vehicleCount++;
        console.log(`Created vehicle: ${v.name} (${v.plate})`);
      } else {
        await db.update(vehicles).set({
          name: v.name,
          brand: v.brand,
          model: v.model,
          year: v.year,
          renavam: v.renavam,
          category: v.category,
          transmission: v.transmission,
          seats: v.seats,
          fipeValue: v.fipeValue.toString(),
          ipvaValue: v.ipvaValue.toString(),
          hasInsurance: v.hasInsurance,
          mileage: v.mileage,
          isInvestorVehicle: !isImobilicar,
          ownerId: customerId,
          customDividend: v.valorAcordado > 0 ? v.valorAcordado.toString() : null,
        }).where(eq(vehicles.licensePlate, v.plate));
        console.log(`Updated vehicle: ${v.name} (${v.plate})`);
      }
    }
  }
  
  console.log("\n=== Import Summary ===");
  console.log(`Investors created: ${investorCount}`);
  console.log(`Vehicles created: ${vehicleCount}`);
  console.log("Import completed!");
  
  process.exit(0);
}

main().catch(err => {
  console.error("Import error:", err);
  process.exit(1);
});
