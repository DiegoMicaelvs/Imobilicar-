import { db } from "../server/db";
import { customers } from "../shared/schema";
import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";

async function updateInvestorCNH() {
  console.log("Starting CNH update from spreadsheet...\n");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("attached_assets/Upar_no_sistema_1765454340631.xlsx");
  const worksheet = workbook.worksheets[0];

  const cpfCnhMap: Record<string, string> = {};
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const cpf = row.getCell(6).value;
    const cnh = row.getCell(7).value;
    
    if (cpf && cnh) {
      const cleanCpf = String(cpf).replace(/\D/g, '');
      cpfCnhMap[cleanCpf] = String(cnh);
    }
  });

  console.log(`Found ${Object.keys(cpfCnhMap).length} investors with CNH data\n`);

  const allInvestors = await db.select().from(customers);
  console.log(`Total investors in database: ${allInvestors.length}\n`);

  let updated = 0;
  let notFound = 0;
  let alreadyHasCNH = 0;

  for (const [cpf, cnh] of Object.entries(cpfCnhMap)) {
    const investor = allInvestors.find(inv => inv.cpf.replace(/\D/g, '') === cpf);
    
    if (!investor) {
      console.log(`[NOT FOUND] CPF ${cpf} not found in database`);
      notFound++;
      continue;
    }

    if (investor.driverLicense) {
      console.log(`[ALREADY HAS CNH] ${investor.name} (${cpf}) - Current: ${investor.driverLicense}`);
      alreadyHasCNH++;
      continue;
    }

    await db.update(customers)
      .set({ driverLicense: cnh })
      .where(eq(customers.id, investor.id));
    
    console.log(`[UPDATED] ${investor.name} (${cpf}) - CNH: ${cnh}`);
    updated++;
  }

  console.log("\n========================================");
  console.log("SUMMARY");
  console.log("========================================");
  console.log(`Total CPFs in spreadsheet with CNH: ${Object.keys(cpfCnhMap).length}`);
  console.log(`Successfully updated: ${updated}`);
  console.log(`Already had CNH: ${alreadyHasCNH}`);
  console.log(`Not found in database: ${notFound}`);
  console.log("========================================\n");
}

updateInvestorCNH()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
