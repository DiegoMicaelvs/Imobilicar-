import ExcelJS from 'exceljs';
import { db } from '../server/db.js';
import { customers, vehicles } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

function normalizeCPF(cpf: any): string {
  if (!cpf) return '';
  const cpfStr = String(cpf).replace(/\D/g, '');
  if (cpfStr.length === 11) {
    return `${cpfStr.slice(0, 3)}.${cpfStr.slice(3, 6)}.${cpfStr.slice(6, 9)}-${cpfStr.slice(9)}`;
  }
  return cpfStr;
}

function normalizePhone(phone: any): string {
  if (!phone) return '';
  const phoneStr = String(phone).replace(/\D/g, '');
  if (phoneStr.length === 11) {
    return `(${phoneStr.slice(0, 2)}) ${phoneStr.slice(2, 7)}-${phoneStr.slice(7)}`;
  } else if (phoneStr.length === 10) {
    return `(${phoneStr.slice(0, 2)}) ${phoneStr.slice(2, 6)}-${phoneStr.slice(6)}`;
  }
  return phoneStr;
}

function normalizeCNH(cnh: any): string {
  if (!cnh) return '';
  return String(cnh).replace(/\D/g, '');
}

function normalizeEmail(email: any): string {
  if (!email || email === '-' || email === 'N/A') return '';
  return String(email).trim().toLowerCase();
}

function parseYearModel(yearModel: string): { year: number; modelYear: number } {
  const parts = yearModel.split('/');
  if (parts.length === 2) {
    return {
      year: parseInt(parts[0]),
      modelYear: parseInt(parts[1])
    };
  }
  const singleYear = parseInt(yearModel);
  return {
    year: singleYear,
    modelYear: singleYear
  };
}

async function fetchFipePrice(brand: string, model: string, year: number): Promise<number | null> {
  try {
    console.log(`FIPE lookup for ${brand} ${model} ${year} - manual entry required`);
    return null;
  } catch (error) {
    console.error('Error fetching FIPE price:', error);
    return null;
  }
}

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
  console.log('Starting import process...\n');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('attached_assets/INVESTIDORES- SISTEMA  (1)_1764077647004.xlsx');
  const worksheet = workbook.worksheets[0];
  const data = sheetToJson(worksheet);
  
  console.log(`Found ${data.length} rows in Excel file\n`);
  
  const investorMap = new Map<string, any>();
  const vehiclesByInvestor = new Map<string, any[]>();
  
  for (const row of data) {
    const cpf = normalizeCPF(row.CPF);
    if (!cpf) {
      console.warn(`Skipping row - no CPF: ${row['PROPRIETÁRIO']}`);
      continue;
    }
    
    if (!investorMap.has(cpf)) {
      investorMap.set(cpf, {
        name: row['PROPRIETÁRIO'],
        cpf: cpf,
        cnh: normalizeCNH(row.CNH),
        phone: normalizePhone(row.TELEFONE),
        email: normalizeEmail(row.EMAIL),
        dividendValue: row[' VALOR ACORDADO'] || 0,
        paymentDate: row['DATA DE PAGAMENTO'] || 10
      });
    }
    
    if (!vehiclesByInvestor.has(cpf)) {
      vehiclesByInvestor.set(cpf, []);
    }
    
    const yearData = parseYearModel(row.ANOMOD);
    
    vehiclesByInvestor.get(cpf)!.push({
      brandModel: row['MARCA/MODELO'],
      year: yearData.year,
      modelYear: yearData.modelYear,
      plate: row.PLACA,
      renavam: row.RENAVAM,
      dividendValue: row[' VALOR ACORDADO'] || 0
    });
  }
  
  console.log(`Found ${investorMap.size} unique investors\n`);
  
  const createdInvestors = new Map<string, string>();
  let investorCount = 0;
  
  for (const [cpf, investorData] of investorMap.entries()) {
    try {
      const existing = await db
        .select()
        .from(customers)
        .where(eq(customers.cpf, cpf))
        .limit(1);
      
      let investorId: string;
      
      if (existing.length > 0) {
        console.log(`Investor already exists: ${investorData.name} (${cpf})`);
        investorId = existing[0].id;
      } else {
        const [newInvestor] = await db.insert(customers).values({
          name: investorData.name,
          cpf: investorData.cpf,
          driverLicense: investorData.cnh || 'A ADICIONAR',
          phone: investorData.phone || '(00) 00000-0000',
          email: investorData.email || `investidor${cpf.replace(/\D/g, '')}@imobilicar.com.br`,
          status: 'active',
          monthlyDividend: investorData.dividendValue.toString(),
          paymentDate: investorData.paymentDate
        }).returning();
        
        investorId = newInvestor.id;
        investorCount++;
        console.log(`Created investor: ${investorData.name} (${cpf})`);
      }
      
      createdInvestors.set(cpf, investorId);
    } catch (error) {
      console.error(`Error creating investor ${investorData.name}:`, error);
    }
  }
  
  console.log(`\nCreated ${investorCount} new investors\n`);
  
  let vehicleCount = 0;
  let skippedCount = 0;
  
  for (const [cpf, vehicleList] of vehiclesByInvestor.entries()) {
    const investorId = createdInvestors.get(cpf);
    if (!investorId) {
      console.warn(`No investor ID for CPF ${cpf}, skipping vehicles`);
      continue;
    }
    
    for (const vehicleData of vehicleList) {
      try {
        const existing = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.licensePlate, vehicleData.plate))
          .limit(1);
        
        if (existing.length > 0) {
          console.log(`Vehicle already exists: ${vehicleData.brandModel} (${vehicleData.plate})`);
          skippedCount++;
          continue;
        }
        
        const brandModel = vehicleData.brandModel;
        const parts = brandModel.split(' ');
        const brand = parts[0] || 'MARCA';
        const model = parts.slice(1).join(' ') || 'MODELO';
        
        const fipePrice = await fetchFipePrice(brand, model, vehicleData.year);
        
        await db.insert(vehicles).values({
          name: brandModel,
          brand: brand,
          model: model,
          category: 'Hatch',
          transmission: 'Manual',
          fuel: 'Flex',
          year: vehicleData.year,
          seats: 5,
          fipeValue: fipePrice || 0,
          pricePerDay: '70.00',
          available: true,
          isInvestorVehicle: true,
          ownerId: investorId,
          licensePlate: vehicleData.plate,
          renavam: vehicleData.renavam,
          customDividend: vehicleData.dividendValue.toString(),
          imageUrl: '/placeholder-car.jpg'
        });
        
        vehicleCount++;
        console.log(`Created vehicle: ${brandModel} (${vehicleData.plate}) for investor ${cpf}`);
      } catch (error) {
        console.error(`Error creating vehicle ${vehicleData.brandModel}:`, error);
      }
    }
  }
  
  console.log(`\n=== Import Summary ===`);
  console.log(`Total rows in Excel: ${data.length}`);
  console.log(`Unique investors: ${investorMap.size}`);
  console.log(`New investors created: ${investorCount}`);
  console.log(`New vehicles created: ${vehicleCount}`);
  console.log(`Vehicles skipped (already exist): ${skippedCount}`);
  console.log(`\nNote: FIPE values set to 0 - admin should update manually`);
  console.log(`Note: Default values used for category, transmission, fuel - admin should update`);
}

main().catch(console.error);
