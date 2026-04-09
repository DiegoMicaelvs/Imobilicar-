import { db } from "../server/db";
import { vehicles } from "../shared/schema";
import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import * as path from "path";

async function updateRenavams() {
  console.log("Updating renavams from Excel spreadsheet...");
  
  const filePath = path.join(process.cwd(), "attached_assets", "Upar_no_sistema_1765388011950.xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  
  const plateToRenavam = new Map<string, string>();
  
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const plate = (row.getCell(3).text || "").trim().toUpperCase();
    const renavam = (row.getCell(4).text || "").trim();
    
    if (plate && renavam) {
      plateToRenavam.set(plate, renavam);
    }
  });
  
  console.log(`Found ${plateToRenavam.size} plate-renavam mappings`);
  
  const allVehicles = await db.select().from(vehicles);
  console.log(`Found ${allVehicles.length} vehicles in database`);
  
  let updatedCount = 0;
  
  for (const vehicle of allVehicles) {
    if (!vehicle.licensePlate) continue;
    
    const normalizedPlate = vehicle.licensePlate.trim().toUpperCase();
    const correctRenavam = plateToRenavam.get(normalizedPlate);
    
    if (correctRenavam && vehicle.renavam !== correctRenavam) {
      console.log(`Updating ${vehicle.name} (${normalizedPlate}): "${vehicle.renavam}" -> "${correctRenavam}"`);
      
      await db.update(vehicles)
        .set({ renavam: correctRenavam })
        .where(eq(vehicles.id, vehicle.id));
      
      updatedCount++;
    }
  }
  
  console.log(`\nUpdated ${updatedCount} vehicle renavams`);
}

updateRenavams()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
