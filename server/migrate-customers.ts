import { db } from "./db";
import { rentals, customers } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function migrateCustomers() {
  console.log("Iniciando migração de clientes...");

  try {
    // Buscar todos os rentals
    const allRentals = await db.select().from(rentals);
    console.log(`Encontrados ${allRentals.length} aluguéis`);

    const customersMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      cpf: string;
      isNegativado: boolean;
      totalSpent: number;
      totalRentals: number;
      lastRentalAt: string;
    }>();

    // Processar cada rental para criar/atualizar clientes
    for (const rental of allRentals) {
      const cpf = rental.customerCpf;
      
      if (customersMap.has(cpf)) {
        // Atualizar dados existentes
        const existing = customersMap.get(cpf)!;
        existing.totalSpent += Number(rental.totalPrice);
        existing.totalRentals += 1;
        
        // Atualizar última data de aluguel
        if (new Date(rental.startDate) > new Date(existing.lastRentalAt)) {
          existing.lastRentalAt = rental.startDate.toISOString();
        }
      } else {
        // Criar novo cliente no map
        customersMap.set(cpf, {
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          cpf: rental.customerCpf,
          isNegativado: rental.isNegativado || false,
          totalSpent: Number(rental.totalPrice),
          totalRentals: 1,
          lastRentalAt: rental.startDate.toISOString(),
        });
      }
    }

    console.log(`Preparados ${customersMap.size} clientes únicos para inserção`);

    // Inserir clientes no banco
    let insertedCount = 0;
    for (const [cpf, customerData] of Array.from(customersMap)) {
      // Verificar se o cliente já existe
      const existingCustomer = await db.select().from(customers).where(eq(customers.cpf, cpf)).limit(1);
      
      if (existingCustomer.length === 0) {
        // Inserir novo cliente
        await db.insert(customers).values({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          cpf: customerData.cpf,
          isNegativado: customerData.isNegativado,
          totalSpent: customerData.totalSpent.toString(),
          totalRentals: customerData.totalRentals,
          lastRentalAt: new Date(customerData.lastRentalAt),
          status: "active",
          notes: "",
          tags: [],
        });
        insertedCount++;
        console.log(`Cliente inserido: ${customerData.name} (${cpf})`);
      } else {
        console.log(`Cliente já existe: ${customerData.name} (${cpf})`);
      }
    }

    // Vincular rentals aos customers
    console.log("\nVinculando aluguéis aos clientes...");
    for (const rental of allRentals) {
      const customer = await db.select().from(customers).where(eq(customers.cpf, rental.customerCpf)).limit(1);
      
      if (customer.length > 0 && !rental.customerId) {
        await db.update(rentals)
          .set({ customerId: customer[0].id })
          .where(eq(rentals.id, rental.id));
        console.log(`Aluguel ${rental.id} vinculado ao cliente ${customer[0].id}`);
      }
    }

    console.log(`\n✅ Migração concluída!`);
    console.log(`- Clientes inseridos: ${insertedCount}`);
    console.log(`- Clientes já existentes: ${customersMap.size - insertedCount}`);
    console.log(`- Total de clientes: ${customersMap.size}`);

  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    throw error;
  }
}

// Executar migração
migrateCustomers()
  .then(() => {
    console.log("\n🎉 Script de migração finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script de migração falhou:", error);
    process.exit(1);
  });
