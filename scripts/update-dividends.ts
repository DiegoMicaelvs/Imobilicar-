import ExcelJS from 'exceljs';
import { db } from '../server/db.js';
import { vehicles } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

function sheetToJson(worksheet: ExcelJS.Worksheet): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cell.text || '';
  });
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      obj[header] = cell.value ?? null;
    });
    rows.push(obj);
  });
  return rows;
}

async function main() {
  console.log('Starting dividend update process...\n');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('attached_assets/INVESTIDORES- SISTEMA  (1)_1764077647004.xlsx');
  const worksheet = workbook.worksheets[0];
  const data = sheetToJson(worksheet);
  
  console.log(`Found ${data.length} rows in Excel file\n`);
  
  let updatedCount = 0;
  let notFoundCount = 0;
  
  for (const row of data) {
    const plate = row.PLACA;
    const dividendValue = row[' VALOR ACORDADO'];
    
    if (!plate || !dividendValue) {
      console.warn(`Skipping row - missing plate or dividend: ${row['MARCA/MODELO']}`);
      continue;
    }
    
    try {
      const existingVehicles = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.licensePlate, plate))
        .limit(1);
      
      if (existingVehicles.length === 0) {
        console.log(`Vehicle not found: ${row['MARCA/MODELO']} (${plate})`);
        notFoundCount++;
        continue;
      }
      
      const vehicle = existingVehicles[0];
      
      await db
        .update(vehicles)
        .set({
          customDividend: dividendValue.toString()
        })
        .where(eq(vehicles.id, vehicle.id));
      
      updatedCount++;
      console.log(`Updated ${row['MARCA/MODELO']} (${plate}): R$ ${dividendValue}`);
    } catch (error) {
      console.error(`Error updating vehicle ${row['MARCA/MODELO']} (${plate}):`, error);
    }
  }
  
  console.log(`\n=== Update Summary ===`);
  console.log(`Total rows in Excel: ${data.length}`);
  console.log(`Vehicles updated: ${updatedCount}`);
  console.log(`Vehicles not found: ${notFoundCount}`);
}

main().catch(console.error);
