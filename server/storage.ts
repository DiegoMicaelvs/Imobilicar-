import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db.js";
import {
  vehicles,
  rentals,
  rentalInspectionItems,
  leads,
  interactions,
  vehicleRequests,
  customers,
  customerEvents,
  investorEvents,
  investmentQuotas,
  investorPayments,
  financings,
  vehicleInspections,
  auditLogs,
  adminUsers,
  contractTemplates,
  tradeInVehicles,
  rentalPlans,
  financingProposals,
  operationalExpenses,
  type Vehicle,
  type InsertVehicle,
  type Rental,
  type InsertRental,
  type RentalInspectionItem,
  type InsertRentalInspectionItem,
  type Lead,
  type InsertLead,
  type Interaction,
  type InsertInteraction,
  type VehicleRequest,
  type InsertVehicleRequest,
  type Customer,
  type InsertCustomer,
  type UpdateCustomer,
  type CustomerEvent,
  type InsertCustomerEvent,
  type InvestorEvent,
  type InsertInvestorEvent,
  type InvestmentQuota,
  type InsertInvestmentQuota,
  type InvestorPayment,
  type InsertInvestorPayment,
  type Financing,
  type InsertFinancing,
  type VehicleInspection,
  type InsertVehicleInspection,
  type AuditLog,
  type InsertAuditLog,
  type AdminUser,
  type InsertAdminUser,
  type ContractTemplate,
  type InsertContractTemplate,
  type TradeInVehicle,
  type InsertTradeInVehicle,
  type RentalPlan,
  type InsertRentalPlan,
  type FinancingProposal,
  type InsertFinancingProposal,
  type OperationalExpense,
  type InsertOperationalExpense,
} from "../shared/schema.js";

export interface IStorage {
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehiclesByOwner(ownerId: string): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;
  getVehicleRentals(vehicleId: string): Promise<Rental[]>;
  getVehicleEvents(vehicleId: string): Promise<CustomerEvent[]>;

  getRentals(): Promise<Rental[]>;
  getRental(id: string): Promise<Rental | undefined>;
  createRental(rental: InsertRental & { totalPrice: number }): Promise<Rental>;
  updateRentalStatus(id: string, status: string): Promise<Rental | undefined>;
  updateRental(id: string, data: Partial<Rental>): Promise<Rental | undefined>;
  deleteRental(id: string): Promise<boolean>;

  // Rental Inspection Items (Vistoria de Check-in)
  getRentalInspectionItems(rentalId: string): Promise<RentalInspectionItem[]>;
  getRentalInspectionItem(id: string): Promise<RentalInspectionItem | undefined>;
  createRentalInspectionItem(item: InsertRentalInspectionItem): Promise<RentalInspectionItem>;
  updateRentalInspectionItem(id: string, data: Partial<RentalInspectionItem>): Promise<RentalInspectionItem | undefined>;
  deleteRentalInspectionItem(id: string): Promise<boolean>;
  getRentalApprovalStatus(rentalId: string): Promise<{
    checkinComplete: boolean;
    contractGenerated: boolean;
    paymentVerified: boolean;
    canApprove: boolean;
    missingItems: string[];
  }>;

  // Investor methods now use Customer (investors are just customers with specific status/role)
  getInvestors(): Promise<Customer[]>;
  getInvestor(id: string): Promise<Customer | undefined>;

  createInvestor(investor: InsertCustomer): Promise<Customer>;
  updateInvestor(id: string, data: Partial<Customer>): Promise<Customer | undefined>;
  deleteInvestor(id: string): Promise<boolean>;
  updateInvestorEarnings(id: string, amount: number): Promise<Customer | undefined>;
  approveInvestor(id: string, dailyPrice?: string): Promise<Customer | undefined>;
  rejectInvestor(id: string): Promise<Customer | undefined>;
  getDuplicateInvestors(): Promise<{ cpf: string; investors: Customer[] }[]>;
  mergeInvestors(keepInvestorId: string, removeInvestorIds: string[]): Promise<Customer | undefined>;

  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, data: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;

  getInteractions(): Promise<Interaction[]>;
  getInteraction(id: string): Promise<Interaction | undefined>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;

  getVehicleRequests(): Promise<(VehicleRequest & { investor?: Customer })[]>;
  getVehicleRequest(id: string): Promise<VehicleRequest | undefined>;
  createVehicleRequest(request: InsertVehicleRequest): Promise<VehicleRequest>;
  updateVehicleRequestStatus(id: string, status: string, adminNotes?: string): Promise<VehicleRequest | undefined>;
  approveVehicleRequest(id: string, pricePerDay: string, monthlyPrice?: string, customDividend?: string): Promise<Vehicle | undefined>;

  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByCpf(cpf: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  getCustomerRentals(customerId: string): Promise<Rental[]>;
  updateCustomerStats(customerId: string): Promise<void>;
  getCurrentRental(customerId: string): Promise<Rental | undefined>;
  getAverageRentalDuration(customerId: string): Promise<number>;

  getAllCustomerEvents(): Promise<CustomerEvent[]>;
  getCustomerEvents(customerId: string): Promise<CustomerEvent[]>;
  getCustomerEvent(id: string): Promise<CustomerEvent | undefined>;
  createCustomerEvent(event: InsertCustomerEvent): Promise<CustomerEvent>;
  updateCustomerEvent(id: string, data: Partial<CustomerEvent>): Promise<CustomerEvent | undefined>;
  deleteCustomerEvent(id: string): Promise<boolean>;

  getInvestorEvents(investorId: string): Promise<any[]>;
  getInvestorEvent(id: string): Promise<InvestorEvent | undefined>;
  createInvestorEvent(event: InsertInvestorEvent): Promise<InvestorEvent>;
  updateInvestorEvent(id: string, data: Partial<InvestorEvent>): Promise<InvestorEvent | undefined>;
  deleteInvestorEvent(id: string): Promise<boolean>;
  getInvestorVehicles(investorId: string): Promise<Vehicle[]>;

  getInvestmentQuotas(): Promise<InvestmentQuota[]>;
  getInvestmentQuota(id: string): Promise<InvestmentQuota | undefined>;
  createInvestmentQuota(quota: InsertInvestmentQuota): Promise<InvestmentQuota>;
  updateInvestmentQuota(id: string, data: Partial<InvestmentQuota>): Promise<InvestmentQuota | undefined>;
  deleteInvestmentQuota(id: string): Promise<boolean>;

  getAllInvestorPayments(): Promise<InvestorPayment[]>;
  getInvestorPayments(investorId: string): Promise<InvestorPayment[]>;
  getInvestorPayment(id: string): Promise<InvestorPayment | undefined>;
  createInvestorPayment(payment: InsertInvestorPayment): Promise<InvestorPayment>;
  updateInvestorPayment(id: string, data: Partial<InvestorPayment>): Promise<InvestorPayment | undefined>;
  deleteInvestorPayment(id: string): Promise<boolean>;

  getFinancings(): Promise<Financing[]>;
  getFinancing(id: string): Promise<Financing | undefined>;
  createFinancing(financing: InsertFinancing): Promise<Financing>;
  updateFinancing(id: string, data: Partial<Financing>): Promise<Financing | undefined>;
  deleteFinancing(id: string): Promise<boolean>;
  getCustomerFinancings(customerId: string): Promise<Financing[]>;

  getVehicleInspections(vehicleId: string): Promise<VehicleInspection[]>;
  getVehicleInspection(id: string): Promise<VehicleInspection | undefined>;
  createVehicleInspection(inspection: InsertVehicleInspection): Promise<VehicleInspection>;
  createBulkVehicleInspections(inspections: InsertVehicleInspection[]): Promise<VehicleInspection[]>;
  updateVehicleInspection(id: string, data: Partial<VehicleInspection>): Promise<VehicleInspection | undefined>;
  deleteVehicleInspection(id: string): Promise<boolean>;

  getAdminUsers(): Promise<AdminUser[]>;
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminUserByCpf(cpf: string): Promise<AdminUser | undefined>;
  getInvestorByCpf(cpf: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser | undefined>;
  deleteAdminUser(id: string): Promise<boolean>;

  getContractTemplates(): Promise<ContractTemplate[]>;
  getContractTemplate(id: string): Promise<ContractTemplate | undefined>;
  getContractTemplatesByType(type: string): Promise<ContractTemplate[]>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  updateContractTemplate(id: string, data: Partial<ContractTemplate>): Promise<ContractTemplate | undefined>;
  deleteContractTemplate(id: string): Promise<boolean>;

  getTradeInVehicles(): Promise<TradeInVehicle[]>;
  getTradeInVehicle(id: string): Promise<TradeInVehicle | undefined>;
  getTradeInVehicleByFinancingId(financingId: string): Promise<TradeInVehicle | undefined>;
  createTradeInVehicle(vehicle: InsertTradeInVehicle): Promise<TradeInVehicle>;
  updateTradeInVehicle(id: string, data: Partial<TradeInVehicle>): Promise<TradeInVehicle | undefined>;
  deleteTradeInVehicle(id: string): Promise<boolean>;

  getRentalPlans(): Promise<RentalPlan[]>;
  getRentalPlan(id: string): Promise<RentalPlan | undefined>;
  createRentalPlan(plan: InsertRentalPlan): Promise<RentalPlan>;
  updateRentalPlan(id: string, data: Partial<RentalPlan>): Promise<RentalPlan | undefined>;
  deleteRentalPlan(id: string): Promise<boolean>;

  getFinancingProposals(): Promise<FinancingProposal[]>;
  getFinancingProposal(id: string): Promise<FinancingProposal | undefined>;
  createFinancingProposal(proposal: InsertFinancingProposal): Promise<FinancingProposal>;
  approveFinancingProposal(id: string, adminReviewerId: string | null, approvedValues: string, adminNotes?: string): Promise<FinancingProposal | undefined>;
  rejectFinancingProposal(id: string, adminReviewerId: string, adminNotes: string): Promise<FinancingProposal | undefined>;
  dismissFinancingProposal(id: string): Promise<FinancingProposal | undefined>;
  getFinancingProposalsBySeller(sellerId: string): Promise<FinancingProposal[]>;

  getAllOperationalExpenses(): Promise<OperationalExpense[]>;
}

export class DatabaseStorage implements IStorage {
  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.ownerId, ownerId));
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        ...insertVehicle,
        imageUrl: insertVehicle.imageUrl || "",
        available: insertVehicle.available ?? true,
        isInvestorVehicle: insertVehicle.isInvestorVehicle ?? false,
        ownerId: insertVehicle.ownerId ?? null,
        investorPercentage: insertVehicle.investorPercentage ?? 70,
      })
      .returning();
    return vehicle;
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const [updated] = await db
      .update(vehicles)
      .set(data)
      .where(eq(vehicles.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    // Deletar dependências primeiro
    
    // 1. Deletar eventos do veículo
    await db.delete(customerEvents).where(eq(customerEvents.vehicleId, id));
    
    // 2. Deletar inspeções do veículo
    await db.delete(vehicleInspections).where(eq(vehicleInspections.vehicleId, id));
    
    // 3. Atualizar rentals para remover referência ao veículo (setar NULL)
    await db
      .update(rentals)
      .set({ vehicleId: sql`NULL` })
      .where(eq(rentals.vehicleId, id));
    
    // 4. Finalmente deletar o veículo
    const result = await db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning();
    return result.length > 0;
  }

  async getVehicleRentals(vehicleId: string): Promise<Rental[]> {
    return await db
      .select()
      .from(rentals)
      .where(eq(rentals.vehicleId, vehicleId))
      .orderBy(desc(rentals.startDate));
  }

  async getVehicleEvents(vehicleId: string): Promise<CustomerEvent[]> {
    return await db
      .select()
      .from(customerEvents)
      .where(eq(customerEvents.vehicleId, vehicleId))
      .orderBy(desc(customerEvents.createdAt));
  }

  // Rentals
  async getRentals(): Promise<Rental[]> {
    return await db.select().from(rentals).orderBy(desc(rentals.createdAt)).limit(200);
  }

  async getRental(id: string): Promise<Rental | undefined> {
    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));
    return rental || undefined;
  }

  async createRental(data: InsertRental & { totalPrice: number }): Promise<Rental> {
    const [rental] = await db
      .insert(rentals)
      .values({
        ...data,
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(),
        totalPrice: data.totalPrice.toString(),
        status: data.status || "pending",
        isNegativado: data.isNegativado ?? false,
      } as any)
      .returning();

    // Update vehicle availability
    if (data.vehicleId) {
      await this.updateVehicle(data.vehicleId, { available: false });
    }

    return rental;
  }

  async updateRentalStatus(id: string, status: string): Promise<Rental | undefined> {
    const [updated] = await db
      .update(rentals)
      .set({ status })
      .where(eq(rentals.id, id))
      .returning();
    return updated || undefined;
  }

  async updateRental(id: string, data: Partial<Rental>): Promise<Rental | undefined> {
    const [updated] = await db
      .update(rentals)
      .set(data)
      .where(eq(rentals.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRental(id: string): Promise<boolean> {
    const result = await db
      .delete(rentals)
      .where(eq(rentals.id, id));
    return true;
  }

  // Rental Inspection Items (Vistoria de Check-in)
  async getRentalInspectionItems(rentalId: string): Promise<RentalInspectionItem[]> {
    return await db
      .select()
      .from(rentalInspectionItems)
      .where(eq(rentalInspectionItems.rentalId, rentalId))
      .orderBy(desc(rentalInspectionItems.createdAt));
  }

  async getRentalInspectionItem(id: string): Promise<RentalInspectionItem | undefined> {
    const [item] = await db
      .select()
      .from(rentalInspectionItems)
      .where(eq(rentalInspectionItems.id, id));
    return item || undefined;
  }

  async createRentalInspectionItem(item: InsertRentalInspectionItem): Promise<RentalInspectionItem> {
    const [created] = await db
      .insert(rentalInspectionItems)
      .values(item)
      .returning();
    return created;
  }

  async updateRentalInspectionItem(id: string, data: Partial<RentalInspectionItem>): Promise<RentalInspectionItem | undefined> {
    const [updated] = await db
      .update(rentalInspectionItems)
      .set(data)
      .where(eq(rentalInspectionItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRentalInspectionItem(id: string): Promise<boolean> {
    const result = await db
      .delete(rentalInspectionItems)
      .where(eq(rentalInspectionItems.id, id))
      .returning();
    return result.length > 0;
  }

  async getRentalApprovalStatus(rentalId: string): Promise<{
    checkinComplete: boolean;
    contractGenerated: boolean;
    paymentVerified: boolean;
    canApprove: boolean;
    missingItems: string[];
  }> {
    // Buscar o aluguel
    const rental = await this.getRental(rentalId);
    if (!rental) {
      throw new Error("Aluguel não encontrado");
    }

    // Verificar itens de vistoria
    const inspectionItems = await this.getRentalInspectionItems(rentalId);
    const requiredPhotoTypes = [
      "frontal",
      "fundo",
      "lateral_direita",
      "lateral_esquerda",
      "motor",
      "step_macaco_triangulo",
      "pneu",
      "chassi",
      "nivel_gasolina"
    ];
    
    const existingPhotoTypes = inspectionItems.map(item => item.photoType);
    const missingPhotoTypes = requiredPhotoTypes.filter(type => !existingPhotoTypes.includes(type));
    
    const checkinComplete = missingPhotoTypes.length === 0 && !!rental.checkinCompletedAt;
    const contractGenerated = !!rental.contractGeneratedAt;
    const paymentVerified = !!rental.paymentVerifiedAt && !!rental.paymentProofUrl;

    const missingItems: string[] = [];
    if (!checkinComplete) {
      if (missingPhotoTypes.length > 0) {
        missingItems.push(`Fotos de vistoria faltando: ${missingPhotoTypes.join(", ")}`);
      }
      if (!rental.checkinCompletedAt) {
        missingItems.push("Vistoria não marcada como concluída");
      }
    }
    if (!contractGenerated) {
      missingItems.push("Contrato não gerado");
    }
    if (!paymentVerified) {
      if (!rental.paymentProofUrl) {
        missingItems.push("Comprovante de pagamento não anexado");
      }
      if (!rental.paymentVerifiedAt) {
        missingItems.push("Pagamento não verificado");
      }
    }

    return {
      checkinComplete,
      contractGenerated,
      paymentVerified,
      canApprove: checkinComplete && contractGenerated && paymentVerified,
      missingItems,
    };
  }

  // Investors (now using customers table)
  async getInvestors(): Promise<Customer[]> {
    const investorIds = new Set<string>();

    const investorVehicleRows = await db
      .select({ ownerId: vehicles.ownerId })
      .from(vehicles)
      .where(eq(vehicles.isInvestorVehicle, true));

    for (const row of investorVehicleRows) {
      if (row.ownerId) investorIds.add(row.ownerId);
    }

    const pendingRequests = await db
      .select({ ownerId: vehicleRequests.ownerId })
      .from(vehicleRequests)
      .where(sql`${vehicleRequests.status} != 'rejected'`);

    for (const row of pendingRequests) {
      if (row.ownerId) investorIds.add(row.ownerId);
    }

    if (investorIds.size === 0) return [];

    const ids = Array.from(investorIds);
    return await db
      .select()
      .from(customers)
      .where(sql`${customers.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
  }

  async getInvestor(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }



  async createInvestor(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values({
        ...insertCustomer,
        totalSpent: "0",
        totalRentals: 0,
        totalEarnings: "0",
        status: insertCustomer.status || "pending",
        tags: insertCustomer.tags || [],
        notes: insertCustomer.notes || null,
        lastRentalAt: null,
      })
      .returning();
    return customer;
  }

  async updateInvestor(id: string, data: Partial<Customer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set(data)
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteInvestor(id: string): Promise<boolean> {
    // First, get the investor to find their CPF
    const investor = await this.getInvestor(id);
    
    // Delete the investor from customers table
    const result = await db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning();
    
    // If investor was deleted and had a CPF, also delete their admin_user account
    if (result.length > 0 && investor?.cpf) {
      const adminUser = await this.getAdminUserByCpf(investor.cpf);
      if (adminUser && adminUser.role === 'INVESTIDOR') {
        await this.deleteAdminUser(adminUser.id);
        console.log(`Deleted admin_user account for investor ${investor.name} (CPF: ${investor.cpf})`);
      }
    }
    
    return result.length > 0;
  }

  async updateInvestorEarnings(id: string, amount: number): Promise<Customer | undefined> {
    const customer = await this.getInvestor(id);
    if (!customer) return undefined;

    const currentEarnings = Number(customer.totalEarnings);
    const [updated] = await db
      .update(customers)
      .set({ totalEarnings: (currentEarnings + amount).toString() })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async approveInvestor(id: string, dailyPrice?: string): Promise<Customer | undefined> {
    // Aprovar investidor
    const [updated] = await db
      .update(customers)
      .set({ status: "approved", reviewedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    
    if (!updated) return undefined;
    
    // Buscar todos os veículos pendentes deste investidor
    const pendingVehicles = await db
      .select()
      .from(vehicleRequests)
      .where(
        and(
          eq(vehicleRequests.ownerId, id),
          eq(vehicleRequests.status, "pending")
        )
      );
    
    // Se dailyPrice foi fornecido, atualizar o primeiro veículo com esse preço
    if (dailyPrice && pendingVehicles.length > 0) {
      await db
        .update(vehicleRequests)
        .set({ pricePerDay: dailyPrice })
        .where(eq(vehicleRequests.id, pendingVehicles[0].id));
    }
    
    // Aprovar todos os veículos - usar pricePerDay do request se disponível, senão usar dailyPrice fornecido
    for (const request of pendingVehicles) {
      const vehiclePricePerDay = request.pricePerDay || dailyPrice || "100"; // Usar valor padrão se não fornecido
      await this.approveVehicleRequest(request.id, vehiclePricePerDay);
    }
    
    return updated;
  }

  async rejectInvestor(id: string): Promise<Customer | undefined> {
    // Rejeitar investidor
    const [updated] = await db
      .update(customers)
      .set({ status: "rejected", reviewedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    
    if (!updated) return undefined;
    
    // Rejeitar todos os veículos pendentes deste investidor
    await db
      .update(vehicleRequests)
      .set({ status: "rejected", reviewedAt: new Date() })
      .where(
        and(
          eq(vehicleRequests.ownerId, id),
          eq(vehicleRequests.status, "pending")
        )
      );
    
    return updated;
  }

  async getDuplicateInvestors(): Promise<{ cpf: string; investors: Customer[] }[]> {
    const allCustomers = await db.select().from(customers);
    const cpfMap = new Map<string, Customer[]>();
    
    for (const customer of allCustomers) {
      const existing = cpfMap.get(customer.cpf) || [];
      existing.push(customer);
      cpfMap.set(customer.cpf, existing);
    }
    
    const duplicates: { cpf: string; investors: Customer[] }[] = [];
    const entries = Array.from(cpfMap.entries());
    for (const [cpf, customerList] of entries) {
      if (customerList.length > 1) {
        duplicates.push({ cpf, investors: customerList });
      }
    }
    
    return duplicates;
  }

  async mergeInvestors(keepInvestorId: string, removeInvestorIds: string[]): Promise<Customer | undefined> {
    const keepCustomer = await this.getInvestor(keepInvestorId);
    if (!keepCustomer) return undefined;
    
    let totalEarningsToAdd = 0;
    
    for (const removeId of removeInvestorIds) {
      const removeCustomer = await this.getInvestor(removeId);
      if (!removeCustomer) continue;
      
      totalEarningsToAdd += Number(removeCustomer.totalEarnings);
      
      await db
        .update(vehicleRequests)
        .set({ ownerId: keepInvestorId })
        .where(eq(vehicleRequests.ownerId, removeId));
      
      await db
        .update(vehicles)
        .set({ ownerId: keepInvestorId })
        .where(eq(vehicles.ownerId, removeId));
      
      await db
        .delete(customers)
        .where(eq(customers.id, removeId));
    }
    
    const newTotalEarnings = Number(keepCustomer.totalEarnings) + totalEarningsToAdd;
    const [updated] = await db
      .update(customers)
      .set({ totalEarnings: newTotalEarnings.toString() })
      .where(eq(customers.id, keepInvestorId))
      .returning();
    
    return updated || undefined;
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values({
        ...insertLead,
        status: insertLead.status || "new",
        notes: insertLead.notes || null,
        convertedAt: null,
      })
      .returning();
    return lead;
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead | undefined> {
    const [updated] = await db
      .update(leads)
      .set(data)
      .where(eq(leads.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Interactions
  async getInteractions(): Promise<Interaction[]> {
    return await db.select().from(interactions);
  }

  async getInteraction(id: string): Promise<Interaction | undefined> {
    const [interaction] = await db.select().from(interactions).where(eq(interactions.id, id));
    return interaction || undefined;
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const [interaction] = await db
      .insert(interactions)
      .values({
        ...insertInteraction,
        customerId: insertInteraction.customerId || null,
        leadId: insertInteraction.leadId || null,
      })
      .returning();
    return interaction;
  }

  // Vehicle Requests
  async getVehicleRequests(): Promise<(VehicleRequest & { investor?: Customer })[]> {
    // Limit to last 200 requests to avoid timeout
    const results = await db
      .select({
        vehicleRequest: vehicleRequests,
        investor: customers,
      })
      .from(vehicleRequests)
      .leftJoin(customers, eq(vehicleRequests.ownerId, customers.id))
      .orderBy(desc(vehicleRequests.createdAt))
      .limit(200);

    return results.map(row => ({
      ...row.vehicleRequest,
      investor: row.investor || undefined,
    }));
  }

  async getVehicleRequest(id: string): Promise<VehicleRequest | undefined> {
    const [request] = await db.select().from(vehicleRequests).where(eq(vehicleRequests.id, id));
    return request || undefined;
  }

  async createVehicleRequest(insertRequest: InsertVehicleRequest): Promise<VehicleRequest> {
    const [request] = await db
      .insert(vehicleRequests)
      .values({
        ...insertRequest,
        status: "pending",
        adminNotes: null,
        reviewedAt: null,
      })
      .returning();
    return request;
  }

  async updateVehicleRequestStatus(id: string, status: string, adminNotes?: string): Promise<VehicleRequest | undefined> {
    const [updated] = await db
      .update(vehicleRequests)
      .set({ 
        status, 
        adminNotes: adminNotes || null,
        reviewedAt: new Date(),
      })
      .where(eq(vehicleRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async approveVehicleRequest(id: string, pricePerDay: string, monthlyPrice?: string, customDividend?: string): Promise<Vehicle | undefined> {
    const request = await this.getVehicleRequest(id);
    if (!request || request.status !== "pending") return undefined;

    // Create vehicle from request - usar pricePerDay fornecido pelo admin
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        name: request.name,
        category: request.category,
        brand: request.brand,
        model: request.model,
        year: request.year,
        pricePerDay: pricePerDay, // Admin define o pricePerDay na aprovação
        monthlyPrice: monthlyPrice || request.monthlyPrice,
        transmission: request.transmission,
        fuel: request.fuel,
        seats: request.seats,
        imageUrl: request.imageUrl,
        available: true,
        isInvestorVehicle: true,
        ownerId: request.ownerId,
        investorPercentage: null, // Não usamos mais percentual
        customDividend: customDividend || null, // Usar dividendo fixo fornecido pelo admin
        licensePlate: request.licensePlate,
        fipeValue: request.fipeValue,
      })
      .returning();

    // Save evaluation inspection photos to vehicle_inspections table
    const inspectionsToCreate = [];
    if (request.evaluationFrontImage) {
      inspectionsToCreate.push({
        vehicleId: vehicle.id,
        type: "evaluation",
        imageUrl: request.evaluationFrontImage,
        imageType: "front",
        notes: "Foto frontal - avaliação inicial do investidor",
        uploadedBy: null,
      });
    }
    if (request.evaluationBackImage) {
      inspectionsToCreate.push({
        vehicleId: vehicle.id,
        type: "evaluation",
        imageUrl: request.evaluationBackImage,
        imageType: "back",
        notes: "Foto traseira - avaliação inicial do investidor",
        uploadedBy: null,
      });
    }
    if (request.evaluationRightSideImage) {
      inspectionsToCreate.push({
        vehicleId: vehicle.id,
        type: "evaluation",
        imageUrl: request.evaluationRightSideImage,
        imageType: "right_side",
        notes: "Lateral direita - avaliação inicial do investidor",
        uploadedBy: null,
      });
    }
    if (request.evaluationLeftSideImage) {
      inspectionsToCreate.push({
        vehicleId: vehicle.id,
        type: "evaluation",
        imageUrl: request.evaluationLeftSideImage,
        imageType: "left_side",
        notes: "Lateral esquerda - avaliação inicial do investidor",
        uploadedBy: null,
      });
    }

    // Bulk insert inspection photos
    if (inspectionsToCreate.length > 0) {
      await this.createBulkVehicleInspections(inspectionsToCreate);
    }

    // Update request status
    await this.updateVehicleRequestStatus(id, "approved");

    // Update investor's monthlyDividend if customDividend was provided
    if (customDividend && request.ownerId) {
      await this.updateInvestor(request.ownerId, {
        monthlyDividend: customDividend
      });
    }

    return vehicle;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    // Limit to last 500 customers to avoid timeout
    return await db.select().from(customers).orderBy(desc(customers.createdAt)).limit(500);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByCpf(cpf: string): Promise<Customer | undefined> {
    // Busca por CPF com ou sem formatação
    // Remove todos os caracteres não numéricos para comparação
    const cleanCpf = cpf.replace(/\D/g, '');
    const [customer] = await db
      .select()
      .from(customers)
      .where(sql`REPLACE(REPLACE(REPLACE(${customers.cpf}, '.', ''), '-', ''), '/', '') = ${cleanCpf}`);
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values({
        ...insertCustomer,
        totalSpent: "0",
        totalRentals: 0,
        status: insertCustomer.status || "active",
        tags: insertCustomer.tags || [],
        notes: insertCustomer.notes || null,
        lastRentalAt: null,
      })
      .returning();
    return customer;
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set(data)
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning();
    return result.length > 0;
  }

  async getCustomerRentals(customerId: string): Promise<Rental[]> {
    return await db.select().from(rentals).where(eq(rentals.customerId, customerId));
  }

  async updateCustomerStats(customerId: string): Promise<void> {
    const customerRentals = await this.getCustomerRentals(customerId);
    
    const totalSpent = customerRentals.reduce((sum, rental) => {
      return sum + Number(rental.totalPrice);
    }, 0);

    const lastRental = customerRentals.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    await this.updateCustomer(customerId, {
      totalSpent: totalSpent.toString(),
      totalRentals: customerRentals.length,
      lastRentalAt: lastRental ? lastRental.createdAt : null,
    });
  }

  async getCurrentRental(customerId: string): Promise<Rental | undefined> {
    const [currentRental] = await db
      .select()
      .from(rentals)
      .where(
        and(
          eq(rentals.customerId, customerId),
          eq(rentals.status, "pending")
        )
      )
      .orderBy(desc(rentals.createdAt))
      .limit(1);
    return currentRental || undefined;
  }

  async getAverageRentalDuration(customerId: string): Promise<number> {
    const customerRentals = await this.getCustomerRentals(customerId);
    
    if (customerRentals.length === 0) return 0;
    
    const totalDays = customerRentals.reduce((sum, rental) => {
      const start = new Date(rental.startDate);
      const end = new Date(rental.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / customerRentals.length);
  }

  // Customer Events
  async getAllCustomerEvents(): Promise<CustomerEvent[]> {
    // Limit to last 1000 events to avoid timeout
    return await db
      .select()
      .from(customerEvents)
      .orderBy(desc(customerEvents.createdAt))
      .limit(1000);
  }

  async getCustomerEvents(customerId: string): Promise<CustomerEvent[]> {
    return await db
      .select()
      .from(customerEvents)
      .where(eq(customerEvents.customerId, customerId))
      .orderBy(desc(customerEvents.createdAt));
  }

  async getCustomerEvent(id: string): Promise<CustomerEvent | undefined> {
    const [event] = await db.select().from(customerEvents).where(eq(customerEvents.id, id));
    return event || undefined;
  }

  async createCustomerEvent(insertEvent: InsertCustomerEvent): Promise<CustomerEvent> {
    const [event] = await db
      .insert(customerEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateCustomerEvent(id: string, data: Partial<CustomerEvent>): Promise<CustomerEvent | undefined> {
    const [updated] = await db
      .update(customerEvents)
      .set(data)
      .where(eq(customerEvents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomerEvent(id: string): Promise<boolean> {
    const result = await db
      .delete(customerEvents)
      .where(eq(customerEvents.id, id))
      .returning();
    return result.length > 0;
  }

  // Investor Events - Returns both investor-specific events AND customer events for the investor
  async getInvestorEvents(investorId: string): Promise<any[]> {
    // Get investor-specific events
    const invEvents = await db
      .select()
      .from(investorEvents)
      .where(eq(investorEvents.ownerId, investorId))
      .orderBy(desc(investorEvents.createdAt));
    
    // Get customer events for this investor (since investors are also customers)
    const custEvents = await db
      .select()
      .from(customerEvents)
      .where(eq(customerEvents.customerId, investorId))
      .orderBy(desc(customerEvents.createdAt));
    
    // Merge both types and sort by createdAt
    const allEvents = [...invEvents, ...custEvents];
    allEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return allEvents;
  }

  async getInvestorEvent(id: string): Promise<InvestorEvent | undefined> {
    const [event] = await db.select().from(investorEvents).where(eq(investorEvents.id, id));
    return event || undefined;
  }

  async createInvestorEvent(insertEvent: InsertInvestorEvent): Promise<InvestorEvent> {
    const [event] = await db
      .insert(investorEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateInvestorEvent(id: string, data: Partial<InvestorEvent>): Promise<InvestorEvent | undefined> {
    const [updated] = await db
      .update(investorEvents)
      .set(data)
      .where(eq(investorEvents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteInvestorEvent(id: string): Promise<boolean> {
    const result = await db
      .delete(investorEvents)
      .where(eq(investorEvents.id, id))
      .returning();
    return result.length > 0;
  }

  async getInvestorVehicles(investorId: string): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.ownerId, investorId));
  }

  // Investment Quotas
  async getInvestmentQuotas(): Promise<InvestmentQuota[]> {
    return await db
      .select()
      .from(investmentQuotas)
      .orderBy(investmentQuotas.category, investmentQuotas.minValue);
  }

  async getInvestmentQuota(id: string): Promise<InvestmentQuota | undefined> {
    const [quota] = await db.select().from(investmentQuotas).where(eq(investmentQuotas.id, id));
    return quota || undefined;
  }

  async createInvestmentQuota(insertQuota: InsertInvestmentQuota): Promise<InvestmentQuota> {
    const [quota] = await db
      .insert(investmentQuotas)
      .values(insertQuota)
      .returning();
    return quota;
  }

  async updateInvestmentQuota(id: string, data: Partial<InvestmentQuota>): Promise<InvestmentQuota | undefined> {
    const [updated] = await db
      .update(investmentQuotas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(investmentQuotas.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteInvestmentQuota(id: string): Promise<boolean> {
    const result = await db
      .delete(investmentQuotas)
      .where(eq(investmentQuotas.id, id))
      .returning();
    return result.length > 0;
  }

  // Investor Payments
  async getAllInvestorPayments(): Promise<InvestorPayment[]> {
    return await db
      .select()
      .from(investorPayments)
      .orderBy(desc(investorPayments.paymentDate));
  }

  async getInvestorPayments(investorId: string): Promise<InvestorPayment[]> {
    return await db
      .select()
      .from(investorPayments)
      .where(eq(investorPayments.investorId, investorId))
      .orderBy(desc(investorPayments.paymentDate));
  }

  async getInvestorPayment(id: string): Promise<InvestorPayment | undefined> {
    const [payment] = await db.select().from(investorPayments).where(eq(investorPayments.id, id));
    return payment || undefined;
  }

  async createInvestorPayment(insertPayment: InsertInvestorPayment): Promise<InvestorPayment> {
    const [payment] = await db
      .insert(investorPayments)
      .values(insertPayment)
      .returning();
    
    // Atualizar totalEarnings do investidor
    const investorPaymentsList = await this.getInvestorPayments(insertPayment.investorId);
    const totalEarnings = investorPaymentsList.reduce((sum: number, p: InvestorPayment) => {
      if (p.status === 'paid') {
        return sum + Number(p.amount);
      }
      return sum;
    }, 0);
    
    await this.updateCustomer(insertPayment.investorId, {
      totalEarnings: totalEarnings.toString(),
    });
    
    return payment;
  }

  async updateInvestorPayment(id: string, data: Partial<InvestorPayment>): Promise<InvestorPayment | undefined> {
    const [updated] = await db
      .update(investorPayments)
      .set(data)
      .where(eq(investorPayments.id, id))
      .returning();
    
    // Recalcular totalEarnings se mudou o status ou valor
    if (updated && (data.status || data.amount)) {
      const investorPaymentsList = await this.getInvestorPayments(updated.investorId);
      const totalEarnings = investorPaymentsList.reduce((sum: number, p: InvestorPayment) => {
        if (p.status === 'paid') {
          return sum + Number(p.amount);
        }
        return sum;
      }, 0);
      
      await this.updateCustomer(updated.investorId, {
        totalEarnings: totalEarnings.toString(),
      });
    }
    
    return updated || undefined;
  }

  async deleteInvestorPayment(id: string): Promise<boolean> {
    const payment = await this.getInvestorPayment(id);
    if (!payment) return false;
    
    const result = await db
      .delete(investorPayments)
      .where(eq(investorPayments.id, id))
      .returning();
    
    // Recalcular totalEarnings após deletar
    if (result.length > 0) {
      const investorPaymentsList = await this.getInvestorPayments(payment.investorId);
      const totalEarnings = investorPaymentsList.reduce((sum: number, p: InvestorPayment) => {
        if (p.status === 'paid') {
          return sum + Number(p.amount);
        }
        return sum;
      }, 0);
      
      await this.updateCustomer(payment.investorId, {
        totalEarnings: totalEarnings.toString(),
      });
    }
    
    return result.length > 0;
  }

  // Financings
  async getFinancings(): Promise<Financing[]> {
    // Limit to last 200 financings to avoid timeout
    return await db
      .select()
      .from(financings)
      .orderBy(desc(financings.createdAt))
      .limit(200);
  }

  async getFinancing(id: string): Promise<Financing | undefined> {
    const [financing] = await db.select().from(financings).where(eq(financings.id, id));
    return financing || undefined;
  }

  async createFinancing(insertFinancing: InsertFinancing): Promise<Financing> {
    const [financing] = await db
      .insert(financings)
      .values(insertFinancing)
      .returning();
    return financing;
  }

  async updateFinancing(id: string, data: Partial<Financing>): Promise<Financing | undefined> {
    const [updated] = await db
      .update(financings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(financings.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteFinancing(id: string): Promise<boolean> {
    const result = await db
      .delete(financings)
      .where(eq(financings.id, id))
      .returning();
    return result.length > 0;
  }

  async getCustomerFinancings(customerId: string): Promise<Financing[]> {
    return await db
      .select()
      .from(financings)
      .where(eq(financings.customerId, customerId))
      .orderBy(desc(financings.createdAt));
  }

  // Vehicle Inspections
  async getVehicleInspections(vehicleId: string): Promise<VehicleInspection[]> {
    return await db
      .select()
      .from(vehicleInspections)
      .where(eq(vehicleInspections.vehicleId, vehicleId))
      .orderBy(desc(vehicleInspections.createdAt));
  }

  async createVehicleInspection(inspection: InsertVehicleInspection): Promise<VehicleInspection> {
    const [created] = await db
      .insert(vehicleInspections)
      .values(inspection)
      .returning();
    return created;
  }

  async createBulkVehicleInspections(inspections: InsertVehicleInspection[]): Promise<VehicleInspection[]> {
    if (inspections.length === 0) return [];
    const created = await db
      .insert(vehicleInspections)
      .values(inspections)
      .returning();
    return created;
  }

  async getVehicleInspection(id: string): Promise<VehicleInspection | undefined> {
    const [inspection] = await db
      .select()
      .from(vehicleInspections)
      .where(eq(vehicleInspections.id, id));
    return inspection || undefined;
  }

  async updateVehicleInspection(id: string, data: Partial<VehicleInspection>): Promise<VehicleInspection | undefined> {
    const [updated] = await db
      .update(vehicleInspections)
      .set(data)
      .where(eq(vehicleInspections.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVehicleInspection(id: string): Promise<boolean> {
    const result = await db
      .delete(vehicleInspections)
      .where(eq(vehicleInspections.id, id))
      .returning();
    return result.length > 0;
  }

  // Audit Logs
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return created;
  }

  // Admin Users
  async getAdminUsers(): Promise<AdminUser[]> {
    return await db
      .select()
      .from(adminUsers)
      .orderBy(desc(adminUsers.createdAt));
  }

  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id));
    return user || undefined;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email));
    return user || undefined;
  }

  async getAdminUserByCpf(cpf: string): Promise<AdminUser | undefined> {
    // Busca por CPF com ou sem formatação
    const cleanCpf = cpf.replace(/\D/g, '');
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(sql`REPLACE(REPLACE(REPLACE(${adminUsers.cpf}, '.', ''), '-', ''), '/', '') = ${cleanCpf}`);
    return user || undefined;
  }

  async getInvestorByCpf(cpf: string): Promise<AdminUser | undefined> {
    // Busca por CPF com ou sem formatação
    const cleanCpf = cpf.replace(/\D/g, '');
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(
        and(
          sql`REPLACE(REPLACE(REPLACE(${adminUsers.cpf}, '.', ''), '-', ''), '/', '') = ${cleanCpf}`,
          eq(adminUsers.role, 'INVESTIDOR')
        )
      );
    return user || undefined;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [created] = await db
      .insert(adminUsers)
      .values(user)
      .returning();
    return created;
  }

  async updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser | undefined> {
    const [updated] = await db
      .update(adminUsers)
      .set(data)
      .where(eq(adminUsers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    const result = await db
      .delete(adminUsers)
      .where(eq(adminUsers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Contract Templates
  async getContractTemplates(): Promise<ContractTemplate[]> {
    return await db
      .select()
      .from(contractTemplates)
      .orderBy(desc(contractTemplates.createdAt));
  }

  async getContractTemplate(id: string): Promise<ContractTemplate | undefined> {
    const [template] = await db
      .select()
      .from(contractTemplates)
      .where(eq(contractTemplates.id, id));
    return template || undefined;
  }

  async getContractTemplatesByType(type: string): Promise<ContractTemplate[]> {
    return await db
      .select()
      .from(contractTemplates)
      .where(eq(contractTemplates.type, type))
      .orderBy(desc(contractTemplates.createdAt));
  }

  async createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate> {
    const [created] = await db
      .insert(contractTemplates)
      .values(template)
      .returning();
    return created;
  }

  async updateContractTemplate(id: string, data: Partial<ContractTemplate>): Promise<ContractTemplate | undefined> {
    const [updated] = await db
      .update(contractTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contractTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContractTemplate(id: string): Promise<boolean> {
    const result = await db
      .delete(contractTemplates)
      .where(eq(contractTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Trade-in Vehicles
  async getTradeInVehicles(): Promise<TradeInVehicle[]> {
    return await db
      .select()
      .from(tradeInVehicles)
      .orderBy(desc(tradeInVehicles.createdAt));
  }

  async getTradeInVehicle(id: string): Promise<TradeInVehicle | undefined> {
    const [vehicle] = await db
      .select()
      .from(tradeInVehicles)
      .where(eq(tradeInVehicles.id, id));
    return vehicle || undefined;
  }

  async getTradeInVehicleByFinancingId(financingId: string): Promise<TradeInVehicle | undefined> {
    const [vehicle] = await db
      .select()
      .from(tradeInVehicles)
      .where(eq(tradeInVehicles.financingId, financingId));
    return vehicle || undefined;
  }

  async createTradeInVehicle(vehicle: InsertTradeInVehicle): Promise<TradeInVehicle> {
    const [created] = await db
      .insert(tradeInVehicles)
      .values(vehicle)
      .returning();
    return created;
  }

  async updateTradeInVehicle(id: string, data: Partial<TradeInVehicle>): Promise<TradeInVehicle | undefined> {
    const [updated] = await db
      .update(tradeInVehicles)
      .set(data)
      .where(eq(tradeInVehicles.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTradeInVehicle(id: string): Promise<boolean> {
    const result = await db
      .delete(tradeInVehicles)
      .where(eq(tradeInVehicles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Rental Plans
  async getRentalPlans(): Promise<RentalPlan[]> {
    return await db
      .select()
      .from(rentalPlans)
      .orderBy(desc(rentalPlans.createdAt));
  }

  async getRentalPlan(id: string): Promise<RentalPlan | undefined> {
    const [plan] = await db
      .select()
      .from(rentalPlans)
      .where(eq(rentalPlans.id, id));
    return plan || undefined;
  }

  async createRentalPlan(plan: InsertRentalPlan): Promise<RentalPlan> {
    const [created] = await db
      .insert(rentalPlans)
      .values(plan)
      .returning();
    return created;
  }

  async updateRentalPlan(id: string, data: Partial<RentalPlan>): Promise<RentalPlan | undefined> {
    const [updated] = await db
      .update(rentalPlans)
      .set(data)
      .where(eq(rentalPlans.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRentalPlan(id: string): Promise<boolean> {
    const result = await db
      .delete(rentalPlans)
      .where(eq(rentalPlans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Financing Proposals
  async getFinancingProposals(): Promise<FinancingProposal[]> {
    return await db
      .select()
      .from(financingProposals)
      .orderBy(desc(financingProposals.createdAt));
  }

  async getFinancingProposal(id: string): Promise<FinancingProposal | undefined> {
    const [proposal] = await db
      .select()
      .from(financingProposals)
      .where(eq(financingProposals.id, id));
    return proposal || undefined;
  }

  async createFinancingProposal(proposal: InsertFinancingProposal): Promise<FinancingProposal> {
    const [created] = await db
      .insert(financingProposals)
      .values(proposal)
      .returning();
    return created;
  }

  async approveFinancingProposal(
    id: string, 
    adminReviewerId: string | null, 
    approvedValues: string, 
    adminNotes?: string
  ): Promise<FinancingProposal | undefined> {
    const proposal = await this.getFinancingProposal(id);
    if (!proposal || proposal.status !== "pending") return undefined;

    const [updated] = await db
      .update(financingProposals)
      .set({
        status: "approved",
        adminReviewerId: adminReviewerId || null,
        approvedValues,
        adminNotes: adminNotes || null,
        reviewedAt: sql`now()`,
      })
      .where(eq(financingProposals.id, id))
      .returning();

    return updated || undefined;
  }

  async rejectFinancingProposal(
    id: string, 
    adminReviewerId: string, 
    adminNotes: string
  ): Promise<FinancingProposal | undefined> {
    const proposal = await this.getFinancingProposal(id);
    if (!proposal || proposal.status !== "pending") return undefined;

    const [updated] = await db
      .update(financingProposals)
      .set({
        status: "rejected",
        adminReviewerId,
        adminNotes,
        reviewedAt: sql`now()`,
      })
      .where(eq(financingProposals.id, id))
      .returning();

    return updated || undefined;
  }

  async getFinancingProposalsBySeller(sellerId: string): Promise<FinancingProposal[]> {
    return await db
      .select()
      .from(financingProposals)
      .where(eq(financingProposals.sellerId, sellerId))
      .orderBy(desc(financingProposals.createdAt));
  }

  async dismissFinancingProposal(id: string): Promise<FinancingProposal | undefined> {
    const proposal = await this.getFinancingProposal(id);
    if (!proposal) return undefined;

    const [updated] = await db
      .update(financingProposals)
      .set({
        dismissedAt: sql`now()`,
      })
      .where(eq(financingProposals.id, id))
      .returning();

    return updated || undefined;
  }

  // Operational Expenses
  async getAllOperationalExpenses(): Promise<OperationalExpense[]> {
    return await db
      .select()
      .from(operationalExpenses)
      .orderBy(desc(operationalExpenses.date));
  }
}

export const storage = new DatabaseStorage();
