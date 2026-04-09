import { db } from "../server/db";
import { customers, vehicles, adminUsers } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "Investicar@2025";

async function createInvestorAccounts() {
  console.log("Creating investor accounts...\n");
  
  // Buscar todos os veículos de investidores
  const investorVehicles = await db.select().from(vehicles).where(eq(vehicles.isInvestorVehicle, true));
  
  console.log(`Found ${investorVehicles.length} investor vehicles`);
  
  // Agrupar veículos por ownerId
  const ownerIds = [...new Set(investorVehicles.map(v => v.ownerId).filter(Boolean))];
  
  console.log(`Found ${ownerIds.length} unique investor owners\n`);
  
  // Buscar todos os investidores (customers)
  const investors: any[] = [];
  for (const ownerId of ownerIds) {
    const customer = await db.select().from(customers).where(eq(customers.id, ownerId as string));
    if (customer.length > 0) {
      investors.push(customer[0]);
    }
  }
  
  console.log(`Found ${investors.length} investors in customers table\n`);
  
  // Hash da senha padrão
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const investor of investors) {
    try {
      // Verificar se já existe conta na tabela admin_users com o mesmo CPF
      const existingUser = await db.select().from(adminUsers).where(eq(adminUsers.cpf, investor.cpf));
      
      if (existingUser.length > 0) {
        console.log(`[SKIP] ${investor.name} (${investor.cpf}) - Account already exists`);
        skipped++;
        continue;
      }
      
      // Buscar veículos do investidor
      const investorVehs = investorVehicles.filter(v => v.ownerId === investor.id);
      
      // Criar conta na tabela admin_users
      const email = investor.email || `${investor.cpf.replace(/\D/g, '')}@investidor.imobilicar.com`;
      
      await db.insert(adminUsers).values({
        name: investor.name,
        email: email,
        cpf: investor.cpf,
        password: hashedPassword,
        role: "INVESTIDOR",
        isActive: true,
      });
      
      console.log(`[CREATED] ${investor.name} (${investor.cpf})`);
      console.log(`   Email: ${email}`);
      console.log(`   Vehicles: ${investorVehs.length}`);
      console.log(`   Payment Date: ${investor.paymentDate || 'Not set'}`);
      console.log(`   Monthly Dividend: R$ ${investor.monthlyDividend || '0'}`);
      console.log('');
      
      created++;
    } catch (error: any) {
      console.error(`[ERROR] ${investor.name} (${investor.cpf}): ${error.message}`);
      errors++;
    }
  }
  
  console.log("\n=== SUMMARY ===");
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total: ${investors.length}`);
  console.log("\nDefault password: " + DEFAULT_PASSWORD);
}

createInvestorAccounts()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
