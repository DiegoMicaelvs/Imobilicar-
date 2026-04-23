var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  auditLogs: () => auditLogs,
  contractTemplates: () => contractTemplates,
  customerEvents: () => customerEvents,
  customerLoginSchema: () => customerLoginSchema,
  customerRegisterSchema: () => customerRegisterSchema,
  customers: () => customers,
  financingProposals: () => financingProposals,
  financings: () => financings,
  insertAdminUserSchema: () => insertAdminUserSchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertContractTemplateSchema: () => insertContractTemplateSchema,
  insertCustomerEventSchema: () => insertCustomerEventSchema,
  insertCustomerSchema: () => insertCustomerSchema,
  insertFinancingProposalSchema: () => insertFinancingProposalSchema,
  insertFinancingSchema: () => insertFinancingSchema,
  insertInteractionSchema: () => insertInteractionSchema,
  insertInvestmentQuotaSchema: () => insertInvestmentQuotaSchema,
  insertInvestorEventSchema: () => insertInvestorEventSchema,
  insertInvestorPaymentSchema: () => insertInvestorPaymentSchema,
  insertLeadSchema: () => insertLeadSchema,
  insertOperationalExpenseSchema: () => insertOperationalExpenseSchema,
  insertRentalInspectionItemSchema: () => insertRentalInspectionItemSchema,
  insertRentalPlanSchema: () => insertRentalPlanSchema,
  insertRentalSchema: () => insertRentalSchema,
  insertTradeInVehicleSchema: () => insertTradeInVehicleSchema,
  insertVehicleInspectionSchema: () => insertVehicleInspectionSchema,
  insertVehicleRequestSchema: () => insertVehicleRequestSchema,
  insertVehicleSchema: () => insertVehicleSchema,
  interactions: () => interactions,
  investmentQuotas: () => investmentQuotas,
  investorEvents: () => investorEvents,
  investorPayments: () => investorPayments,
  leads: () => leads,
  operationalExpenses: () => operationalExpenses,
  rentalInspectionItems: () => rentalInspectionItems,
  rentalPlans: () => rentalPlans,
  rentals: () => rentals,
  tradeInVehicles: () => tradeInVehicles,
  updateContractTemplateSchema: () => updateContractTemplateSchema,
  updateCustomerSchema: () => updateCustomerSchema,
  updateFinancingSchema: () => updateFinancingSchema,
  updateRentalPlanSchema: () => updateRentalPlanSchema,
  updateVehicleSchema: () => updateVehicleSchema,
  vehicleInspections: () => vehicleInspections,
  vehicleRequests: () => vehicleRequests,
  vehicles: () => vehicles
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var vehicles, rentals, rentalInspectionItems, vehicleRequests, insertVehicleSchema, updateVehicleSchema, insertVehicleRequestSchema, insertRentalSchema, insertRentalInspectionItemSchema, customers, leads, interactions, customerEvents, insertLeadSchema, insertInteractionSchema, insertCustomerSchema, updateCustomerSchema, insertCustomerEventSchema, investorEvents, insertInvestorEventSchema, investmentQuotas, investorPayments, insertInvestmentQuotaSchema, insertInvestorPaymentSchema, financings, insertFinancingSchema, updateFinancingSchema, vehicleInspections, insertVehicleInspectionSchema, adminUsers, insertAdminUserSchema, auditLogs, insertAuditLogSchema, tradeInVehicles, insertTradeInVehicleSchema, contractTemplates, insertContractTemplateSchema, updateContractTemplateSchema, rentalPlans, insertRentalPlanSchema, updateRentalPlanSchema, financingProposals, insertFinancingProposalSchema, operationalExpenses, insertOperationalExpenseSchema, customerRegisterSchema, customerLoginSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    vehicles = pgTable("vehicles", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      category: text("category").notNull(),
      brand: text("brand").notNull(),
      model: text("model").notNull(),
      year: integer("year").notNull(),
      pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
      monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
      transmission: text("transmission").notNull(),
      fuel: text("fuel").notNull(),
      seats: integer("seats").notNull(),
      imageUrl: text("image_url").notNull(),
      available: boolean("available").notNull().default(true),
      availableForFinancing: boolean("available_for_financing").notNull().default(true),
      isFinanced: boolean("is_financed").notNull().default(false),
      isInvestorVehicle: boolean("is_investor_vehicle").notNull().default(false),
      ownerId: varchar("owner_id").$type().references(() => customers.id, { onDelete: "set null" }),
      // ID do cliente/investidor proprietário
      investorPercentage: integer("investor_percentage").$type().default(70),
      licensePlate: text("license_plate"),
      renavam: text("renavam"),
      // Registro Nacional de Veículos Automotores (11 dígitos)
      chassi: text("chassi"),
      // Número do Chassi do veículo (17 caracteres)
      fipeValue: decimal("fipe_value", { precision: 10, scale: 2 }),
      // Valor FIPE do veículo
      customDividend: decimal("custom_dividend", { precision: 10, scale: 2 }),
      // Dividendo customizado definido manualmente pelo admin (quando não há quota)
      isPubliclyVisible: boolean("is_publicly_visible").notNull().default(true),
      // Controla se o veículo é visível no frontend público
      // Campos para veículos de troca
      isTradeIn: boolean("is_trade_in").notNull().default(false),
      // Indica se o veículo veio de troca
      tradeInValue: decimal("trade_in_value", { precision: 10, scale: 2 }),
      // Valor aceito na troca
      tradeInCustomerName: text("trade_in_customer_name"),
      // Nome do cliente que fez a troca
      tradeInStatus: text("trade_in_status"),
      // Status: em_estoque, vendido, avaliacao
      // Quilometragem
      mileage: integer("mileage"),
      // Quilometragem atual do veículo (em KM)
      // Informações adicionais do veículo
      hasInsurance: boolean("has_insurance").notNull().default(false),
      // Possui seguro
      insuranceValue: decimal("insurance_value", { precision: 10, scale: 2 }),
      // Valor do seguro (quando possui)
      ipvaStatus: text("ipva_status"),
      // Status do IPVA: "pago", "nao_pago", "isento"
      ipvaValue: decimal("ipva_value", { precision: 10, scale: 2 }),
      // Valor do IPVA (quando pago)
      // Documentos do veículo (para veículos de investimento)
      crlvDocumentUrl: text("crlv_document_url"),
      // CRLV (Certificado de Registro e Licenciamento do Veículo)
      laudoCautelarUrl: text("laudo_cautelar_url"),
      // Laudo Cautelar
      laudoMecanicoUrl: text("laudo_mecanico_url"),
      // Laudo Mecânico
      otherDocumentsUrls: text("other_documents_urls").array(),
      // Outros documentos do veículo
      // Informações adicionais do veículo (wizard de investimento)
      temDocumento: boolean("tem_documento"),
      // Tem documento?
      observacoesDocumento: text("observacoes_documento"),
      // Observações sobre documentação
      licenciamentoPago: boolean("licenciamento_pago"),
      // Licenciamento pago?
      observacoesLicenciamento: text("observacoes_licenciamento"),
      // Observações sobre licenciamento
      taFinanciado: boolean("ta_financiado"),
      // Tá financiado?
      observacoesFinanciado: text("observacoes_financiado"),
      // Observações sobre financiamento
      eDeLeilao: boolean("e_de_leilao"),
      // É de leilão?
      observacoesLeilao: text("observacoes_leilao"),
      // Observações sobre leilão
      temRastreador: boolean("tem_rastreador"),
      // Tem rastreador?
      localizacaoRastreador: text("localizacao_rastreador"),
      // Localização do rastreador no veículo
      problemaMecanico: text("problema_mecanico"),
      // Descrição de problemas mecânicos ou elétricos
      // Contrato de cessão do investimento (por veículo)
      investmentContractUrl: text("investment_contract_url"),
      // URL/Base64 do contrato de cessão para este veículo
      investmentContractFileName: text("investment_contract_file_name"),
      // Nome do arquivo do contrato
      // Bônus por agregar (por veículo) - pagamento único pela adição do veículo à frota
      bonusDate: text("bonus_date"),
      // Data específica do pagamento do bônus (ex: "15/12/2025")
      bonusValue: decimal("bonus_value", { precision: 10, scale: 2 }),
      // Valor do bônus a ser pago
      // Data de pagamento individual do veículo - pode ter múltiplas datas (ex: "16/20/30")
      paymentDate: text("payment_date"),
      // Dia(s) do mês para pagamento de dividendos deste veículo
      // Avarias do veículo
      hasDamage: boolean("has_damage").notNull().default(false),
      // Existe avaria no veículo?
      damageDescription: text("damage_description")
      // Descrição detalhada da avaria
    });
    rentals = pgTable("rentals", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      vehicleId: varchar("vehicle_id").references(() => vehicles.id, { onDelete: "restrict" }),
      customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
      customerName: text("customer_name").notNull(),
      customerEmail: text("customer_email").notNull(),
      customerPhone: text("customer_phone").notNull(),
      customerCpf: text("customer_cpf").notNull(),
      customerRg: text("customer_rg"),
      driverLicense: text("driver_license"),
      emergencyContact: text("emergency_contact"),
      street: text("street"),
      complement: text("complement"),
      neighborhood: text("neighborhood"),
      city: text("city"),
      state: text("state"),
      zipCode: text("zip_code"),
      // Avalista
      hasGuarantor: boolean("has_guarantor").notNull().default(false),
      guarantorName: text("guarantor_name"),
      guarantorCpf: text("guarantor_cpf"),
      guarantorRg: text("guarantor_rg"),
      guarantorEmail: text("guarantor_email"),
      guarantorPhone: text("guarantor_phone"),
      guarantorDriverLicense: text("guarantor_driver_license"),
      guarantorDocumentUrl: text("guarantor_document_url"),
      // Foto do documento com foto (CNH/RG)
      guarantorStreet: text("guarantor_street"),
      guarantorComplement: text("guarantor_complement"),
      guarantorNeighborhood: text("guarantor_neighborhood"),
      guarantorCity: text("guarantor_city"),
      guarantorState: text("guarantor_state"),
      guarantorZipCode: text("guarantor_zip_code"),
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
      status: text("status").notNull().default("pending"),
      isNegativado: boolean("is_negativado").notNull().default(false),
      // Vistoria (DEPRECATED - usar rental_inspection_items)
      hasCheckin: boolean("has_checkin").notNull().default(false),
      // Flag para indicar se check-in foi realizado
      hasCheckout: boolean("has_checkout").notNull().default(false),
      // Flag para indicar se check-out foi realizado
      checkInImages: text("check_in_images").array(),
      // URLs das imagens do check-in
      checkOutImages: text("check_out_images").array(),
      // URLs das imagens do check-out
      checkInDate: timestamp("check_in_date"),
      checkOutDate: timestamp("check_out_date"),
      checkInNotes: text("check_in_notes"),
      checkOutNotes: text("check_out_notes"),
      // Workflow de Aprovação
      checkinCompletedAt: timestamp("checkin_completed_at"),
      // Data de conclusão do check-in (9 fotos obrigatórias)
      contractGeneratedAt: timestamp("contract_generated_at"),
      // Data de geração do contrato
      contractUrl: text("contract_url"),
      // URL do contrato assinado
      paymentMethod: text("payment_method"),
      // Método de pagamento (dinheiro, pix, cartao_credito, etc)
      paymentProofUrl: text("payment_proof_url"),
      // URL do comprovante de pagamento
      paymentVerifiedAt: timestamp("payment_verified_at"),
      // Data de verificação do pagamento
      // Checkout/Devolução
      checkoutCompletedAt: timestamp("checkout_completed_at"),
      // Data de conclusão do checkout
      // Checkpoint - Análise Crítica
      checkpointTiresSame: boolean("checkpoint_tires_same"),
      // Os pneus são os mesmos do check-in?
      checkpointFuelSame: boolean("checkpoint_fuel_same"),
      // O combustível está igual ao check-in?
      checkpointHasDamages: boolean("checkpoint_has_damages"),
      // Tem avarias?
      checkpointDamagesNotes: text("checkpoint_damages_notes"),
      // Observações sobre avarias
      checkpointRepairCost: decimal("checkpoint_repair_cost", { precision: 10, scale: 2 }),
      // Custo de reparos
      repairPaid: boolean("repair_paid").default(false),
      // Status de pagamento do reparo
      // Encerramento
      finalizationDebtAmount: decimal("finalization_debt_amount", { precision: 10, scale: 2 }),
      // Valor de débitos pendentes
      finalizationPaymentMethod: text("finalization_payment_method"),
      // Método de pagamento dos débitos
      finalizationContractUrl: text("finalization_contract_url"),
      // URL do contrato de entrega
      finalizedAt: timestamp("finalized_at"),
      // Data de finalização do contrato
      selectedPlanIds: text("selected_plan_ids").array(),
      // IDs dos planos de aluguel selecionados
      // Bonificação/Desconto
      bonusDiscountUsed: decimal("bonus_discount_used", { precision: 10, scale: 2 }).default("0"),
      // Valor de bonificação usado neste aluguel
      priceBeforeDiscount: decimal("price_before_discount", { precision: 10, scale: 2 }),
      // Preço original antes do desconto de bonificação
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    }, (table) => ({
      createdAtIdx: index("rentals_created_at_idx").on(table.createdAt.desc()),
      customerIdIdx: index("rentals_customer_id_idx").on(table.customerId),
      vehicleIdIdx: index("rentals_vehicle_id_idx").on(table.vehicleId)
    }));
    rentalInspectionItems = pgTable("rental_inspection_items", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      rentalId: varchar("rental_id").notNull().references(() => rentals.id, { onDelete: "cascade" }),
      // FK para rentals
      photoType: text("photo_type").notNull(),
      // frontal, fundo, lateral_direita, lateral_esquerda, motor, step_macaco_triangulo, pneu, chassi, nivel_gasolina
      imageUrl: text("image_url").notNull(),
      hasDamage: boolean("has_damage").notNull().default(false),
      // Existe avaria?
      damageDescription: text("damage_description"),
      // Detalhamento da avaria (opcional)
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      createdBy: varchar("created_by").references(() => adminUsers.id, { onDelete: "set null" })
      // ID do admin que criou
    });
    vehicleRequests = pgTable("vehicle_requests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ownerId: varchar("owner_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
      // ID do cliente/investidor que está solicitando
      name: text("name").notNull(),
      category: text("category").notNull(),
      brand: text("brand").notNull(),
      model: text("model").notNull(),
      year: integer("year").notNull(),
      pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }),
      // Opcional - admin define após aprovação
      monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
      transmission: text("transmission").notNull(),
      fuel: text("fuel").notNull(),
      seats: integer("seats").notNull(),
      imageUrl: text("image_url").notNull(),
      status: text("status").notNull().default("pending"),
      // pending, approved, rejected
      adminNotes: text("admin_notes"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      reviewedAt: timestamp("reviewed_at"),
      licensePlate: text("license_plate"),
      fipeValue: decimal("fipe_value", { precision: 10, scale: 2 }),
      // Valor FIPE do veículo
      // Fotos de vistoria de avaliação
      evaluationFrontImage: text("evaluation_front_image"),
      // Frente mostrando placa
      evaluationBackImage: text("evaluation_back_image"),
      // Fundo mostrando placa
      evaluationRightSideImage: text("evaluation_right_side_image"),
      // Lateral direita
      evaluationLeftSideImage: text("evaluation_left_side_image"),
      // Lateral esquerda
      evaluationMotorImage: text("evaluation_motor_image"),
      // Motor
      evaluationStepImage: text("evaluation_step_image"),
      // Step, macaco e triângulo
      evaluationTire1Image: text("evaluation_tire1_image"),
      // Pneu dianteiro esquerdo
      evaluationTire2Image: text("evaluation_tire2_image"),
      // Pneu dianteiro direito
      evaluationTire3Image: text("evaluation_tire3_image"),
      // Pneu traseiro esquerdo
      evaluationTire4Image: text("evaluation_tire4_image"),
      // Pneu traseiro direito
      evaluationChassiImage: text("evaluation_chassi_image"),
      // Chassi
      evaluationOdometroImage: text("evaluation_odometro_image"),
      // Odômetro
      evaluationNivelGasolinaImage: text("evaluation_nivel_gasolina_image"),
      // Nível de gasolina
      // Documentos do veículo
      crlvDocumentUrl: text("crlv_document_url"),
      // CRLV (Certificado de Registro e Licenciamento do Veículo)
      laudoCautelarUrl: text("laudo_cautelar_url"),
      // Laudo Cautelar
      laudoMecanicoUrl: text("laudo_mecanico_url")
      // Laudo Mecânico
    }, (table) => ({
      createdAtIdx: index("vehicle_requests_created_at_idx").on(table.createdAt.desc()),
      ownerIdIdx: index("vehicle_requests_owner_id_idx").on(table.ownerId)
    }));
    insertVehicleSchema = createInsertSchema(vehicles).omit({
      id: true
    }).extend({
      imageUrl: z.string().optional().nullable().refine(
        (val) => !val || val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:image/"),
        { message: "Deve ser uma URL v\xE1lida ou uma imagem em base64" }
      ),
      licensePlate: z.string().min(1, "Placa \xE9 obrigat\xF3ria")
    });
    updateVehicleSchema = insertVehicleSchema.partial().extend({
      imageUrl: z.string().optional().nullable().refine(
        (val) => !val || val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:image/") || val.startsWith("/"),
        { message: "Deve ser uma URL v\xE1lida ou uma imagem em base64" }
      )
    });
    insertVehicleRequestSchema = createInsertSchema(vehicleRequests).omit({
      id: true,
      createdAt: true,
      status: true,
      adminNotes: true,
      reviewedAt: true
    }).extend({
      ownerId: z.string().min(1, "ID do propriet\xE1rio \xE9 obrigat\xF3rio"),
      imageUrl: z.string().min(1, "Imagem \xE9 obrigat\xF3ria").refine(
        (val) => val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:image/"),
        { message: "Deve ser uma URL v\xE1lida ou uma imagem em base64" }
      ),
      licensePlate: z.string().min(1, "Placa \xE9 obrigat\xF3ria"),
      pricePerDay: z.string().optional().nullable()
      // Opcional - admin define após aprovação
    });
    insertRentalSchema = createInsertSchema(rentals).omit({
      id: true,
      createdAt: true,
      status: true,
      totalPrice: true,
      bonusDiscountUsed: true,
      priceBeforeDiscount: true
    }).extend({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      status: z.enum(["pending", "approved", "active", "completed", "cancelled"]).optional()
    });
    insertRentalInspectionItemSchema = createInsertSchema(rentalInspectionItems).omit({
      id: true,
      createdAt: true,
      createdBy: true
    }).extend({
      rentalId: z.string().min(1, "ID do aluguel \xE9 obrigat\xF3rio"),
      photoType: z.enum([
        "frontal",
        "fundo",
        "lateral_direita",
        "lateral_esquerda",
        "motor",
        "step_macaco_triangulo",
        "pneu",
        "chassi",
        "nivel_gasolina"
      ], { required_error: "Tipo de foto \xE9 obrigat\xF3rio" }),
      imageUrl: z.string().min(1, "Imagem \xE9 obrigat\xF3ria").refine(
        (val) => val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:image/"),
        { message: "Deve ser uma URL v\xE1lida ou uma imagem em base64" }
      ),
      hasDamage: z.boolean().default(false),
      damageDescription: z.string().optional().nullable()
    });
    customers = pgTable("customers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      number: text("number"),
      name: text("name").notNull(),
      email: text("email").notNull(),
      phone: text("phone").notNull(),
      cpf: text("cpf").notNull().unique(),
      rg: text("rg"),
      birthDate: text("birth_date"),
      // Data de nascimento
      rgImageUrl: text("rg_image_url"),
      // Foto do RG do investidor
      cnhImageUrl: text("cnh_image_url"),
      // Foto da CNH do investidor
      proofOfResidenceUrl: text("proof_of_residence_url"),
      // Comprovante de Residência do investidor
      password: text("password"),
      // Senha hash para autenticação de clientes públicos (opcional para clientes criados pelo admin)
      isNegativado: boolean("is_negativado").notNull().default(false),
      status: text("status").notNull().default("active"),
      // active, inactive, vip, blocked, pending, approved, rejected
      driverType: text("driver_type").notNull().default("principal"),
      // principal, dependente
      tags: text("tags").array(),
      notes: text("notes"),
      // Endereço
      street: text("street"),
      complement: text("complement"),
      neighborhood: text("neighborhood"),
      city: text("city"),
      state: text("state"),
      zipCode: text("zip_code"),
      // Campos específicos de investidor
      emergencyContact: text("emergency_contact"),
      driverLicense: text("driver_license"),
      isMainDriver: boolean("is_main_driver").default(true),
      paymentDate: text("payment_date"),
      // Dia(s) do mês para pagamento de dividendos - pode ter múltiplas datas (ex: "16/20/30")
      bonusPaymentDay: integer("bonus_payment_day"),
      // DEPRECATED - usar bonusDate
      bonusDate: text("bonus_date"),
      // Data específica do pagamento único do bônus (ex: "09/12/2025")
      bonusValue: decimal("bonus_value", { precision: 10, scale: 2 }),
      // Valor único do bônus a ser pago na data específica
      monthlyDividend: decimal("monthly_dividend", { precision: 10, scale: 2 }),
      // Valor fixo mensal de dividendo definido pelo admin
      totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
      reviewedAt: timestamp("reviewed_at"),
      // Dados bancários para investidores
      bankName: text("bank_name"),
      bankCode: text("bank_code"),
      agency: text("agency"),
      agencyDigit: text("agency_digit"),
      accountNumber: text("account_number"),
      accountDigit: text("account_digit"),
      accountType: text("account_type"),
      // conta_corrente, conta_poupanca, conta_pagamento
      accountHolder: text("account_holder"),
      accountHolderDocument: text("account_holder_document"),
      pixKeyType: text("pix_key_type"),
      // cpf, cnpj, email, telefone, aleatoria
      pixKey: text("pix_key"),
      // Estatísticas de cliente
      totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0"),
      totalRentals: integer("total_rentals").notNull().default(0),
      rating: integer("rating").default(0),
      // Queridômetro: avaliação do admin de 0 a 5 estrelas
      bonusBalance: decimal("bonus_balance", { precision: 10, scale: 2 }).notNull().default("0"),
      // Bonificação: saldo de desconto disponível para uso
      // Datas de Vendas
      firstContactDate: timestamp("first_contact_date"),
      // Data do primeiro contato com o cliente
      closingDate: timestamp("closing_date"),
      // Data de fechamento/conclusão da venda
      // Contrato de investidor (anexado pelo admin)
      investorContractUrl: text("investor_contract_url"),
      // Base64 ou URL do contrato
      investorContractFileName: text("investor_contract_file_name"),
      // Nome do arquivo do contrato
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      lastRentalAt: timestamp("last_rental_at")
    }, (table) => ({
      createdAtIdx: index("customers_created_at_idx").on(table.createdAt.desc())
    }));
    leads = pgTable("leads", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      cpf: text("cpf"),
      email: text("email").notNull(),
      phone: text("phone").notNull(),
      source: text("source").notNull(),
      status: text("status").notNull().default("new"),
      interest: text("interest").notNull(),
      vehicleId: varchar("vehicle_id").$type().references(() => vehicles.id, { onDelete: "set null" }),
      // Veículo de interesse
      vehicleName: text("vehicle_name"),
      // Nome do veículo de interesse
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      convertedAt: timestamp("converted_at")
    });
    interactions = pgTable("interactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      type: text("type").notNull(),
      customerId: varchar("customer_id").$type().references(() => customers.id, { onDelete: "set null" }),
      leadId: varchar("lead_id").$type().references(() => leads.id, { onDelete: "set null" }),
      subject: text("subject").notNull(),
      description: text("description").notNull(),
      contactMethod: text("contact_method").notNull(),
      performedBy: text("performed_by").notNull(),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    customerEvents = pgTable("customer_events", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }),
      rentalId: varchar("rental_id").references(() => rentals.id, { onDelete: "set null" }),
      vehicleId: varchar("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
      // Veículo associado ao evento
      type: text("type").notNull(),
      // sinistro, assistencia_24h, manutencao, multa, dano, etc
      title: text("title").notNull(),
      description: text("description").notNull(),
      status: text("status").notNull().default("aberto"),
      // aberto, em_andamento, resolvido
      severity: text("severity").notNull().default("baixa"),
      // baixa, media, alta, critica
      cost: decimal("cost", { precision: 10, scale: 2 }),
      attachments: text("attachments").array(),
      // URLs de documentos/fotos
      resolvedAt: timestamp("resolved_at"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      // Novos campos para gestão de incidentes
      incidentType: text("incident_type"),
      // roubo, furto, colisão, incêndio, oficina, assistência, etc
      paymentMethod: text("payment_method"),
      // franquia, direto_empresa, prejuizo_empresa, seguro
      insuranceClaim: boolean("insurance_claim").default(false),
      // Se teve acionamento de seguro
      franchiseValue: decimal("franchise_value", { precision: 10, scale: 2 }),
      // Valor da franquia paga
      insuranceCompany: text("insurance_company"),
      // Seguradora acionada
      claimNumber: text("claim_number"),
      // Número do sinistro na seguradora
      workshopStatus: text("workshop_status")
      // na_oficina, aguardando_pecas, em_reparo, concluido
    });
    insertLeadSchema = createInsertSchema(leads).omit({
      id: true,
      createdAt: true,
      convertedAt: true
    }).extend({
      status: z.string().optional()
    });
    insertInteractionSchema = createInsertSchema(interactions).omit({
      id: true,
      createdAt: true
    });
    insertCustomerSchema = createInsertSchema(customers).omit({
      id: true,
      createdAt: true,
      totalSpent: true,
      totalRentals: true,
      totalEarnings: true,
      lastRentalAt: true,
      reviewedAt: true
    }).extend({
      status: z.enum(["active", "inactive", "vip", "blocked", "pending", "approved", "rejected", "lead"]).optional(),
      paymentDate: z.string().nullable().optional()
      // Dia(s) do mês (ex: "16" ou "16/20/30")
    });
    updateCustomerSchema = insertCustomerSchema.partial().extend({
      status: z.enum(["active", "inactive", "vip", "blocked", "pending", "approved", "rejected", "lead"]).optional(),
      paymentDate: z.string().nullable().optional()
      // Dia(s) do mês (ex: "16" ou "16/20/30")
    });
    insertCustomerEventSchema = createInsertSchema(customerEvents).omit({
      id: true,
      createdAt: true
    });
    investorEvents = pgTable("investor_events", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ownerId: varchar("owner_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
      // ID do cliente/investidor proprietário
      vehicleId: varchar("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
      type: text("type").notNull(),
      // manutencao, documentacao, pagamento, inspecao, outro
      title: text("title").notNull(),
      description: text("description").notNull(),
      status: text("status").notNull().default("aberto"),
      // aberto, em_andamento, resolvido
      severity: text("severity").notNull().default("baixa"),
      // baixa, media, alta, critica
      cost: decimal("cost", { precision: 10, scale: 2 }),
      attachments: text("attachments").array(),
      // URLs de documentos/fotos
      resolvedAt: timestamp("resolved_at"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    insertInvestorEventSchema = createInsertSchema(investorEvents).omit({
      id: true,
      createdAt: true
    });
    investmentQuotas = pgTable("investment_quotas", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      category: text("category").notNull(),
      // Econômico, Sedan, SUV, Luxo, Esportivo
      minValue: decimal("min_value", { precision: 10, scale: 2 }).notNull(),
      maxValue: decimal("max_value", { precision: 10, scale: 2 }).notNull(),
      minDividend: decimal("min_dividend", { precision: 10, scale: 2 }).notNull(),
      // Dividendo mínimo em R$
      maxDividend: decimal("max_dividend", { precision: 10, scale: 2 }).notNull(),
      // Dividendo máximo em R$
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
    });
    investorPayments = pgTable("investor_payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      investorId: varchar("investor_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
      // ID do investidor (customer)
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      // Valor do pagamento
      referenceMonth: integer("reference_month").notNull(),
      // Mês de referência (1-12)
      referenceYear: integer("reference_year").notNull(),
      // Ano de referência
      paymentDate: timestamp("payment_date").notNull().default(sql`now()`),
      // Data do pagamento
      status: text("status").notNull().default("paid"),
      // paid, pending, cancelled
      notes: text("notes"),
      // Observações sobre o pagamento
      vehicleBreakdown: text("vehicle_breakdown"),
      // JSON com detalhamento por veículo
      attachments: text("attachments").array(),
      // URLs de comprovantes de pagamento (imagens, PDFs, etc)
      createdBy: varchar("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
      // ID do admin que registrou
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    insertInvestmentQuotaSchema = createInsertSchema(investmentQuotas).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      minValue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: "Valor m\xEDnimo deve ser um n\xFAmero v\xE1lido maior ou igual a 0"
      }),
      maxValue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Valor m\xE1ximo deve ser um n\xFAmero v\xE1lido maior que 0"
      }),
      minDividend: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: "Dividendo m\xEDnimo deve ser um n\xFAmero v\xE1lido maior ou igual a 0"
      }),
      maxDividend: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Dividendo m\xE1ximo deve ser um n\xFAmero v\xE1lido maior que 0"
      }),
      category: z.enum(["Econ\xF4mico", "Sedan", "SUV", "Luxo", "Esportivo"])
    });
    insertInvestorPaymentSchema = createInsertSchema(investorPayments).omit({
      id: true,
      createdAt: true,
      paymentDate: true
    }).extend({
      amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Valor do pagamento deve ser maior que 0"
      }),
      referenceMonth: z.number().int().min(1).max(12),
      referenceYear: z.number().int().min(2020).max(2100),
      status: z.enum(["paid", "pending", "cancelled"]).optional()
    });
    financings = pgTable("financings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "restrict" }),
      customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
      // Dados do cliente
      customerName: text("customer_name").notNull(),
      customerEmail: text("customer_email").notNull(),
      customerPhone: text("customer_phone").notNull(),
      customerCpf: text("customer_cpf").notNull(),
      customerRg: text("customer_rg"),
      customerDriverLicense: text("customer_driver_license"),
      customerEmergencyContact: text("customer_emergency_contact"),
      customerStreet: text("customer_street"),
      customerComplement: text("customer_complement"),
      customerNeighborhood: text("customer_neighborhood"),
      customerCity: text("customer_city"),
      customerState: text("customer_state"),
      customerZipCode: text("customer_zip_code"),
      customerPaymentDate: integer("customer_payment_date"),
      // Dia do mês para pagamento de dividendos
      customerBonusPaymentDay: integer("customer_bonus_payment_day"),
      // Dia do mês para pagamento de bônus
      // Dados do Avalista (opcional)
      hasGuarantor: boolean("has_guarantor").notNull().default(false),
      guarantorName: text("guarantor_name"),
      guarantorCpf: text("guarantor_cpf"),
      guarantorRg: text("guarantor_rg"),
      guarantorEmail: text("guarantor_email"),
      guarantorPhone: text("guarantor_phone"),
      guarantorDriverLicense: text("guarantor_driver_license"),
      guarantorDocumentUrl: text("guarantor_document_url"),
      // Foto do documento com foto (CNH/RG)
      guarantorDocumentFileName: text("guarantor_document_file_name"),
      guarantorResidenceUrl: text("guarantor_residence_url"),
      // Comprovante de residência do avalista
      guarantorResidenceFileName: text("guarantor_residence_file_name"),
      guarantorStreet: text("guarantor_street"),
      guarantorComplement: text("guarantor_complement"),
      guarantorNeighborhood: text("guarantor_neighborhood"),
      guarantorCity: text("guarantor_city"),
      guarantorState: text("guarantor_state"),
      guarantorZipCode: text("guarantor_zip_code"),
      // Valores do veículo e configuração do financiamento
      vehicleValue: decimal("vehicle_value", { precision: 10, scale: 2 }).notNull(),
      downPaymentType: text("down_payment_type").notNull().default("split"),
      // split ou full
      downPaymentTotal: decimal("down_payment_total", { precision: 10, scale: 2 }).notNull(),
      downPaymentCash: decimal("down_payment_cash", { precision: 10, scale: 2 }).notNull(),
      downPaymentFinanced: decimal("down_payment_financed", { precision: 10, scale: 2 }).notNull(),
      downPaymentInstallments: integer("down_payment_installments").notNull(),
      downPaymentInstallmentValue: decimal("down_payment_installment_value", { precision: 10, scale: 2 }).notNull(),
      principalAmount: decimal("principal_amount", { precision: 10, scale: 2 }).notNull(),
      interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
      installments: integer("installments").notNull().default(48),
      monthlyInstallment: decimal("monthly_installment", { precision: 10, scale: 2 }).notNull(),
      totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
      totalInterest: decimal("total_interest", { precision: 10, scale: 2 }).notNull(),
      simulationValidUntil: timestamp("simulation_valid_until"),
      // Documentação e Aprovação (Etapa 4)
      cnhDocumentUrl: text("cnh_document_url"),
      cnhDocumentFileName: text("cnh_document_file_name"),
      proofOfResidenceUrl: text("proof_of_residence_url"),
      proofOfResidenceFileName: text("proof_of_residence_file_name"),
      guaranteesUrls: text("guarantees_urls").array(),
      guaranteesFileNames: text("guarantees_file_names").array(),
      otherDocumentsUrls: text("other_documents_urls").array(),
      otherDocumentsFileNames: text("other_documents_file_names").array(),
      proposalGeneratedAt: timestamp("proposal_generated_at"),
      approvalStatus: text("approval_status").notNull().default("pending"),
      // pending, approved, rejected
      approvalNotes: text("approval_notes"),
      approvedAt: timestamp("approved_at"),
      rejectedAt: timestamp("rejected_at"),
      // Check-in (Etapa 5) - 4 fotos obrigatórias
      checkInPhotos: text("check_in_photos"),
      // JSON com URLs das 4 fotos
      checkInChecklist: text("check_in_checklist"),
      // JSON do checklist de vistoria de entrega
      checkInNotes: text("check_in_notes"),
      checkInCompletedAt: timestamp("check_in_completed_at"),
      // Checklist de Vistoria (Etapa 6) - 45 itens
      inspectionChecklist: text("inspection_checklist"),
      // JSON do checklist de vistoria
      inspectionPdfUrl: text("inspection_pdf_url"),
      // PDF de vistoria com assinaturas
      inspectionPdfFileName: text("inspection_pdf_file_name"),
      // Contrato (Etapa 8)
      contractUrl: text("contract_url"),
      contractFileName: text("contract_file_name"),
      // Nome original do arquivo do contrato legado
      contractGeneratedAt: timestamp("contract_generated_at"),
      generatedContracts: text("generated_contracts"),
      // JSON array de contratos gerados [{url, fileName, generatedAt}]
      // Pagamento (Etapa 8) - Pagamento da Entrada à Vista
      cashPaymentMethod: text("cash_payment_method"),
      // pix, transferencia, dinheiro, cartao, cheque
      cashPaymentDate: text("cash_payment_date"),
      cashProofUrl: text("cash_proof_url"),
      cashProofFileName: text("cash_proof_file_name"),
      // Pagamento da Entrada Parcelada (se aplicável)
      installmentPaymentMethod: text("installment_payment_method"),
      // cartao_credito, boleto, debito_automatico, cheque_pre
      installmentNotes: text("installment_notes"),
      // Observações Gerais de Pagamento
      generalPaymentNotes: text("general_payment_notes"),
      // Campos antigos mantidos para compatibilidade
      paymentMethod: text("payment_method"),
      paymentProofUrl: text("payment_proof_url"),
      paymentVerifiedAt: timestamp("payment_verified_at"),
      paymentNotes: text("payment_notes"),
      // Checkout - Vistoria de Devolução
      checkOutPhotos: text("check_out_photos"),
      // JSON com URLs das fotos do checkout
      checkOutChecklist: text("check_out_checklist"),
      // JSON do checklist de vistoria de checkout
      checkOutNotes: text("check_out_notes"),
      // Observações e avarias documentadas no checkout
      checkOutCompletedAt: timestamp("check_out_completed_at"),
      // Data de conclusão do checkout
      // Vídeo de Confissão de Ciência (opcional)
      confessionVideoUrl: text("confession_video_url"),
      // URL do vídeo de confissão do cliente
      confessionVideoRecordedAt: timestamp("confession_video_recorded_at"),
      // Data de gravação do vídeo
      // Status e datas
      status: text("status").notNull().default("pending"),
      // pending, approved, active, completed, rejected, cancelled
      startDate: timestamp("start_date"),
      dueDay: integer("due_day"),
      bonusPaymentDay: integer("bonus_payment_day"),
      // Dia do mês para pagamento de bônus (1-31)
      paymentStatus: text("payment_status").notNull().default("em_dia"),
      // em_dia, atrasado
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
    }, (table) => ({
      customerIdIdx: index("financings_customer_id_idx").on(table.customerId),
      vehicleIdIdx: index("financings_vehicle_id_idx").on(table.vehicleId)
    }));
    insertFinancingSchema = createInsertSchema(financings).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      proposalGeneratedAt: true,
      approvedAt: true,
      rejectedAt: true,
      checkInCompletedAt: true,
      contractGeneratedAt: true,
      paymentVerifiedAt: true,
      checkOutCompletedAt: true
    }).extend({
      startDate: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      simulationValidUntil: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      customerFirstContactDate: z.string().optional().nullable(),
      customerClosingDate: z.string().optional().nullable()
    });
    updateFinancingSchema = createInsertSchema(financings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      startDate: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      simulationValidUntil: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      approvedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      rejectedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      checkInCompletedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      contractGeneratedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      paymentVerifiedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      checkOutCompletedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      proposalGeneratedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
      confessionVideoRecordedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable()
    }).partial();
    vehicleInspections = pgTable("vehicle_inspections", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
      // Referência ao veículo
      rentalId: varchar("rental_id").references(() => rentals.id, { onDelete: "set null" }),
      // Opcional: referência ao aluguel (para check-in/out)
      type: text("type").notNull(),
      // 'evaluation', 'check-in', 'check-out'
      imageUrl: text("image_url").notNull(),
      // URL da foto
      imageType: text("image_type").notNull(),
      // 'front', 'back', 'right_side', 'left_side', 'dashboard', 'interior', 'other'
      notes: text("notes"),
      // Observações sobre esta foto
      uploadedBy: varchar("uploaded_by").references(() => adminUsers.id, { onDelete: "set null" }),
      // ID do usuário que fez upload (admin, customer, investor)
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
      // Timestamp preciso
    });
    insertVehicleInspectionSchema = createInsertSchema(vehicleInspections).omit({
      id: true,
      createdAt: true
    });
    adminUsers = pgTable("admin_users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      email: text("email").notNull(),
      cpf: text("cpf"),
      // CPF do usuário (obrigatório para INVESTIDOR e VENDEDOR)
      password: text("password").notNull(),
      // Hash bcrypt da senha
      role: text("role").notNull().default("ADMIN"),
      // ADMIN, VENDEDOR, INVESTIDOR
      isActive: boolean("is_active").notNull().default(true),
      salesGoal: integer("sales_goal").default(1),
      // Meta de vendas (para vendedores)
      goalPeriod: text("goal_period").default("daily"),
      // Período da meta: daily, weekly, monthly, yearly
      salesCount: integer("sales_count").default(0),
      // Total de vendas realizadas no período atual
      salesRevenue: decimal("sales_revenue", { precision: 10, scale: 2 }).default("0"),
      // Receita total gerada em vendas (R$)
      totalSales: integer("total_sales").default(0),
      // Histórico total de vendas (nunca reseta)
      totalGoalsAchieved: integer("total_goals_achieved").default(0),
      // Total de metas batidas (histórico permanente)
      lastSalesReset: timestamp("last_sales_reset"),
      // Data do último reset de vendas
      monthlyGoalsAchieved: integer("monthly_goals_achieved").default(0),
      // Quantas vezes bateu a meta este mês
      lastMonthReset: timestamp("last_month_reset"),
      // Data do último reset mensal
      goalAchievedToday: boolean("goal_achieved_today").default(false),
      // Se a meta de hoje já foi contabilizada
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      lastLoginAt: timestamp("last_login_at")
    });
    insertAdminUserSchema = createInsertSchema(adminUsers).omit({
      id: true,
      createdAt: true,
      lastLoginAt: true,
      lastSalesReset: true,
      monthlyGoalsAchieved: true,
      lastMonthReset: true
    }).extend({
      email: z.string().email("Email inv\xE1lido"),
      password: z.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres")
    });
    auditLogs = pgTable("audit_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      action: text("action").notNull(),
      // Tipo de ação: 'create', 'update', 'delete', 'approve', 'reject', etc.
      entity: text("entity").notNull(),
      // Entidade afetada: 'customer', 'vehicle', 'rental', 'investor', etc.
      entityId: varchar("entity_id"),
      // ID da entidade afetada
      entityName: text("entity_name"),
      // Nome da entidade afetada para exibição (ex: "Honda Civic 2023", "João da Silva")
      userId: varchar("user_id").references(() => adminUsers.id, { onDelete: "set null" }),
      // ID do usuário que executou a ação
      userName: text("user_name"),
      // Nome do usuário (para facilitar exibição)
      details: text("details"),
      // Detalhes da ação em JSON
      ipAddress: text("ip_address"),
      // IP de origem
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    insertAuditLogSchema = createInsertSchema(auditLogs).omit({
      id: true,
      createdAt: true
    });
    tradeInVehicles = pgTable("trade_in_vehicles", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      financingId: varchar("financing_id").notNull().references(() => financings.id, { onDelete: "cascade" }),
      // Referência ao financiamento
      customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }),
      // ID do cliente (se existir)
      // Dados do veículo de troca
      plate: text("plate"),
      // Placa do veículo (opcional)
      brand: text("brand").notNull(),
      // Marca
      model: text("model").notNull(),
      // Modelo
      year: text("year").notNull(),
      // Ano
      category: text("category"),
      // Categoria (Econômico, Sedan, etc)
      mileage: text("mileage"),
      // Quilometragem do veículo
      fipeValue: text("fipe_value"),
      // Valor FIPE consultado (ex: "R$ 45.000,00")
      acceptedValue: decimal("accepted_value", { precision: 10, scale: 2 }).notNull(),
      // Valor aceito como entrada
      // Documentação
      cautelarUrl: text("cautelar_url"),
      // URL do documento cautelar (opcional quando vem da frota existente)
      crlvUrl: text("crlv_url"),
      // URL do CRLV do veículo
      laudoMecanicoUrl: text("laudo_mecanico_url"),
      // URL do laudo mecânico
      photosUrls: text("photos_urls").array(),
      // URLs das fotos do veículo
      // Status
      status: text("status").notNull().default("accepted"),
      // accepted, rejected, pending
      // Informações adicionais (mesmos campos que vehicles)
      temDocumento: boolean("tem_documento"),
      // Tem documento?
      licenciamentoPago: boolean("licenciamento_pago"),
      // Licenciamento pago?
      eDeLeilao: boolean("e_de_leilao"),
      // É de leilão?
      temRastreador: boolean("tem_rastreador"),
      // Tem rastreador?
      // Timestamps
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    insertTradeInVehicleSchema = createInsertSchema(tradeInVehicles).omit({
      id: true,
      createdAt: true
    });
    contractTemplates = pgTable("contract_templates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      // Nome do template
      type: text("type").notNull(),
      // 'rental', 'financing', 'investment'
      content: text("content").notNull(),
      // Conteúdo do contrato (pode ter variáveis como {{customerName}}, {{vehicleName}}, etc)
      isActive: boolean("is_active").notNull().default(true),
      // Se está ativo para uso
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
    });
    insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      name: z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      type: z.enum(["rental", "financing", "investment"], {
        errorMap: () => ({ message: "Tipo deve ser rental, financing ou investment" })
      }),
      content: z.string().min(1, "Conte\xFAdo \xE9 obrigat\xF3rio")
    });
    updateContractTemplateSchema = insertContractTemplateSchema.partial();
    rentalPlans = pgTable("rental_plans", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      // Nome do serviço (ex: "Seguro Premium", "GPS", "Cadeirinha de Bebê")
      description: text("description").notNull(),
      // Descrição do serviço
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      // Valor adicional por dia/total
      isActive: boolean("is_active").notNull().default(true),
      // Se está disponível para escolha
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    insertRentalPlanSchema = createInsertSchema(rentalPlans).omit({
      id: true,
      createdAt: true
    }).extend({
      name: z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      description: z.string().min(1, "Descri\xE7\xE3o \xE9 obrigat\xF3ria"),
      price: z.string().min(1, "Pre\xE7o \xE9 obrigat\xF3rio")
    });
    updateRentalPlanSchema = insertRentalPlanSchema.partial();
    financingProposals = pgTable("financing_proposals", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      // Identificação
      sellerId: varchar("seller_id").notNull().references(() => adminUsers.id, { onDelete: "restrict" }),
      // Vendedor que criou a proposta
      adminReviewerId: varchar("admin_reviewer_id").references(() => adminUsers.id, { onDelete: "set null" }),
      // Admin que revisou
      // Dados do cliente (para identificação)
      customerName: text("customer_name").notNull(),
      customerCpf: text("customer_cpf").notNull(),
      customerPhone: text("customer_phone").notNull(),
      // Veículo selecionado
      vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "restrict" }),
      vehicleName: text("vehicle_name").notNull(),
      // Valores originais (calculados automaticamente)
      originalCalculation: text("original_calculation").notNull(),
      // JSON com cálculo original {vehicleValue, downPayment, financeAmount, monthlyPayment, etc}
      // Proposta do vendedor (valores negociados)
      proposedTerms: text("proposed_terms").notNull(),
      // JSON com valores propostos {vehicleValue, downPaymentCash, downPaymentInstallments, monthlyPayment, etc}
      proposalNotes: text("proposal_notes"),
      // Justificativa do vendedor
      // Valores aprovados pelo admin (após revisão)
      approvedValues: text("approved_values"),
      // JSON com valores aprovados (pode ser diferente da proposta)
      // Status e notas
      status: text("status").notNull().default("pending"),
      // pending, approved, rejected
      adminNotes: text("admin_notes"),
      // Notas do admin sobre a aprovação/rejeição
      dismissedAt: timestamp("dismissed_at"),
      // Quando o vendedor clicou em "Talvez Mais Tarde"
      // Timestamps
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      reviewedAt: timestamp("reviewed_at")
    }, (table) => ({
      sellerIdIdx: index("financing_proposals_seller_id_idx").on(table.sellerId),
      statusIdx: index("financing_proposals_status_idx").on(table.status),
      createdAtIdx: index("financing_proposals_created_at_idx").on(table.createdAt.desc())
    }));
    insertFinancingProposalSchema = createInsertSchema(financingProposals).omit({
      id: true,
      createdAt: true,
      reviewedAt: true,
      adminReviewerId: true,
      approvedValues: true,
      status: true
    }).extend({
      sellerId: z.string().min(1, "ID do vendedor \xE9 obrigat\xF3rio"),
      customerName: z.string().min(1, "Nome do cliente \xE9 obrigat\xF3rio"),
      customerCpf: z.string().min(1, "CPF do cliente \xE9 obrigat\xF3rio"),
      customerPhone: z.string().min(1, "Telefone do cliente \xE9 obrigat\xF3rio"),
      vehicleId: z.string().min(1, "ID do ve\xEDculo \xE9 obrigat\xF3rio"),
      vehicleName: z.string().min(1, "Nome do ve\xEDculo \xE9 obrigat\xF3rio"),
      originalCalculation: z.string().min(1, "C\xE1lculo original \xE9 obrigat\xF3rio"),
      proposedTerms: z.string().min(1, "Termos propostos s\xE3o obrigat\xF3rios"),
      proposalNotes: z.string().optional(),
      adminNotes: z.string().optional()
    });
    operationalExpenses = pgTable("operational_expenses", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      description: text("description").notNull(),
      // Descrição da despesa
      category: text("category").notNull(),
      // aluguel, salarios, manutencao, marketing, combustivel, outros
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      // Valor da despesa
      date: timestamp("date").notNull(),
      // Data da despesa
      paymentMethod: text("payment_method"),
      // Método de pagamento
      notes: text("notes"),
      // Observações adicionais
      receiptUrl: text("receipt_url"),
      // URL do comprovante/nota fiscal
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      createdBy: varchar("created_by").references(() => adminUsers.id, { onDelete: "set null" })
      // Admin que registrou
    }, (table) => ({
      dateIdx: index("operational_expenses_date_idx").on(table.date.desc()),
      categoryIdx: index("operational_expenses_category_idx").on(table.category)
    }));
    insertOperationalExpenseSchema = createInsertSchema(operationalExpenses).omit({
      id: true,
      createdAt: true
    }).extend({
      description: z.string().min(1, "Descri\xE7\xE3o \xE9 obrigat\xF3ria"),
      category: z.string().min(1, "Categoria \xE9 obrigat\xF3ria"),
      amount: z.string().min(1, "Valor \xE9 obrigat\xF3rio"),
      date: z.string().min(1, "Data \xE9 obrigat\xF3ria")
    });
    customerRegisterSchema = z.object({
      cpf: z.string().min(11, "CPF deve ter 11 d\xEDgitos").max(14, "CPF inv\xE1lido").regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inv\xE1lido"),
      password: z.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres"),
      name: z.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      email: z.string().email("Email inv\xE1lido"),
      phone: z.string().min(1, "Telefone \xE9 obrigat\xF3rio")
    });
    customerLoginSchema = z.object({
      cpf: z.string().min(11, "CPF deve ter 11 d\xEDgitos").max(14, "CPF inv\xE1lido").regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inv\xE1lido"),
      password: z.string().min(1, "Senha \xE9 obrigat\xF3ria")
    });
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { eq, and, desc, sql as sql2 } from "drizzle-orm";

// server/db.ts
init_schema();
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
init_schema();
var DatabaseStorage = class {
  // Vehicles
  async getVehicles() {
    return await db.select().from(vehicles);
  }
  async getVehicle(id) {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || void 0;
  }
  async getVehiclesByOwner(ownerId) {
    return await db.select().from(vehicles).where(eq(vehicles.ownerId, ownerId));
  }
  async createVehicle(insertVehicle) {
    const [vehicle] = await db.insert(vehicles).values({
      ...insertVehicle,
      imageUrl: insertVehicle.imageUrl || "",
      available: insertVehicle.available ?? true,
      isInvestorVehicle: insertVehicle.isInvestorVehicle ?? false,
      ownerId: insertVehicle.ownerId ?? null,
      investorPercentage: insertVehicle.investorPercentage ?? 70
    }).returning();
    return vehicle;
  }
  async updateVehicle(id, data) {
    const [updated] = await db.update(vehicles).set(data).where(eq(vehicles.id, id)).returning();
    return updated || void 0;
  }
  async deleteVehicle(id) {
    await db.delete(customerEvents).where(eq(customerEvents.vehicleId, id));
    await db.delete(vehicleInspections).where(eq(vehicleInspections.vehicleId, id));
    await db.update(rentals).set({ vehicleId: sql2`NULL` }).where(eq(rentals.vehicleId, id));
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return result.length > 0;
  }
  async getVehicleRentals(vehicleId) {
    return await db.select().from(rentals).where(eq(rentals.vehicleId, vehicleId)).orderBy(desc(rentals.startDate));
  }
  async getVehicleEvents(vehicleId) {
    return await db.select().from(customerEvents).where(eq(customerEvents.vehicleId, vehicleId)).orderBy(desc(customerEvents.createdAt));
  }
  // Rentals
  async getRentals() {
    return await db.select().from(rentals).orderBy(desc(rentals.createdAt)).limit(200);
  }
  async getRental(id) {
    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));
    return rental || void 0;
  }
  async createRental(data) {
    const [rental] = await db.insert(rentals).values({
      ...data,
      startDate: data.startDate || /* @__PURE__ */ new Date(),
      endDate: data.endDate || /* @__PURE__ */ new Date(),
      totalPrice: data.totalPrice.toString(),
      status: data.status || "pending",
      isNegativado: data.isNegativado ?? false
    }).returning();
    if (data.vehicleId) {
      await this.updateVehicle(data.vehicleId, { available: false });
    }
    return rental;
  }
  async updateRentalStatus(id, status) {
    const [updated] = await db.update(rentals).set({ status }).where(eq(rentals.id, id)).returning();
    return updated || void 0;
  }
  async updateRental(id, data) {
    const [updated] = await db.update(rentals).set(data).where(eq(rentals.id, id)).returning();
    return updated || void 0;
  }
  async deleteRental(id) {
    const result = await db.delete(rentals).where(eq(rentals.id, id));
    return true;
  }
  // Rental Inspection Items (Vistoria de Check-in)
  async getRentalInspectionItems(rentalId) {
    return await db.select().from(rentalInspectionItems).where(eq(rentalInspectionItems.rentalId, rentalId)).orderBy(desc(rentalInspectionItems.createdAt));
  }
  async getRentalInspectionItem(id) {
    const [item] = await db.select().from(rentalInspectionItems).where(eq(rentalInspectionItems.id, id));
    return item || void 0;
  }
  async createRentalInspectionItem(item) {
    const [created] = await db.insert(rentalInspectionItems).values(item).returning();
    return created;
  }
  async updateRentalInspectionItem(id, data) {
    const [updated] = await db.update(rentalInspectionItems).set(data).where(eq(rentalInspectionItems.id, id)).returning();
    return updated || void 0;
  }
  async deleteRentalInspectionItem(id) {
    const result = await db.delete(rentalInspectionItems).where(eq(rentalInspectionItems.id, id)).returning();
    return result.length > 0;
  }
  async getRentalApprovalStatus(rentalId) {
    const rental = await this.getRental(rentalId);
    if (!rental) {
      throw new Error("Aluguel n\xE3o encontrado");
    }
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
    const existingPhotoTypes = inspectionItems.map((item) => item.photoType);
    const missingPhotoTypes = requiredPhotoTypes.filter((type) => !existingPhotoTypes.includes(type));
    const checkinComplete = missingPhotoTypes.length === 0 && !!rental.checkinCompletedAt;
    const contractGenerated = !!rental.contractGeneratedAt;
    const paymentVerified = !!rental.paymentVerifiedAt && !!rental.paymentProofUrl;
    const missingItems = [];
    if (!checkinComplete) {
      if (missingPhotoTypes.length > 0) {
        missingItems.push(`Fotos de vistoria faltando: ${missingPhotoTypes.join(", ")}`);
      }
      if (!rental.checkinCompletedAt) {
        missingItems.push("Vistoria n\xE3o marcada como conclu\xEDda");
      }
    }
    if (!contractGenerated) {
      missingItems.push("Contrato n\xE3o gerado");
    }
    if (!paymentVerified) {
      if (!rental.paymentProofUrl) {
        missingItems.push("Comprovante de pagamento n\xE3o anexado");
      }
      if (!rental.paymentVerifiedAt) {
        missingItems.push("Pagamento n\xE3o verificado");
      }
    }
    return {
      checkinComplete,
      contractGenerated,
      paymentVerified,
      canApprove: checkinComplete && contractGenerated && paymentVerified,
      missingItems
    };
  }
  // Investors (now using customers table)
  async getInvestors() {
    const investorIds = /* @__PURE__ */ new Set();
    const investorVehicleRows = await db.select({ ownerId: vehicles.ownerId }).from(vehicles).where(eq(vehicles.isInvestorVehicle, true));
    for (const row of investorVehicleRows) {
      if (row.ownerId) investorIds.add(row.ownerId);
    }
    const pendingRequests = await db.select({ ownerId: vehicleRequests.ownerId }).from(vehicleRequests).where(sql2`${vehicleRequests.status} != 'rejected'`);
    for (const row of pendingRequests) {
      if (row.ownerId) investorIds.add(row.ownerId);
    }
    if (investorIds.size === 0) return [];
    const ids = Array.from(investorIds);
    return await db.select().from(customers).where(sql2`${customers.id} IN (${sql2.join(ids.map((id) => sql2`${id}`), sql2`, `)})`);
  }
  async getInvestor(id) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || void 0;
  }
  async createInvestor(insertCustomer) {
    const [customer] = await db.insert(customers).values({
      ...insertCustomer,
      totalSpent: "0",
      totalRentals: 0,
      totalEarnings: "0",
      status: insertCustomer.status || "pending",
      tags: insertCustomer.tags || [],
      notes: insertCustomer.notes || null,
      lastRentalAt: null
    }).returning();
    return customer;
  }
  async updateInvestor(id, data) {
    const [updated] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return updated || void 0;
  }
  async deleteInvestor(id) {
    const investor = await this.getInvestor(id);
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    if (result.length > 0 && investor?.cpf) {
      const adminUser = await this.getAdminUserByCpf(investor.cpf);
      if (adminUser && adminUser.role === "INVESTIDOR") {
        await this.deleteAdminUser(adminUser.id);
        console.log(`Deleted admin_user account for investor ${investor.name} (CPF: ${investor.cpf})`);
      }
    }
    return result.length > 0;
  }
  async updateInvestorEarnings(id, amount) {
    const customer = await this.getInvestor(id);
    if (!customer) return void 0;
    const currentEarnings = Number(customer.totalEarnings);
    const [updated] = await db.update(customers).set({ totalEarnings: (currentEarnings + amount).toString() }).where(eq(customers.id, id)).returning();
    return updated || void 0;
  }
  async approveInvestor(id, dailyPrice) {
    const [updated] = await db.update(customers).set({ status: "approved", reviewedAt: /* @__PURE__ */ new Date() }).where(eq(customers.id, id)).returning();
    if (!updated) return void 0;
    const pendingVehicles = await db.select().from(vehicleRequests).where(
      and(
        eq(vehicleRequests.ownerId, id),
        eq(vehicleRequests.status, "pending")
      )
    );
    if (dailyPrice && pendingVehicles.length > 0) {
      await db.update(vehicleRequests).set({ pricePerDay: dailyPrice }).where(eq(vehicleRequests.id, pendingVehicles[0].id));
    }
    for (const request of pendingVehicles) {
      const vehiclePricePerDay = request.pricePerDay || dailyPrice || "100";
      await this.approveVehicleRequest(request.id, vehiclePricePerDay);
    }
    return updated;
  }
  async rejectInvestor(id) {
    const [updated] = await db.update(customers).set({ status: "rejected", reviewedAt: /* @__PURE__ */ new Date() }).where(eq(customers.id, id)).returning();
    if (!updated) return void 0;
    await db.update(vehicleRequests).set({ status: "rejected", reviewedAt: /* @__PURE__ */ new Date() }).where(
      and(
        eq(vehicleRequests.ownerId, id),
        eq(vehicleRequests.status, "pending")
      )
    );
    return updated;
  }
  async getDuplicateInvestors() {
    const allCustomers = await db.select().from(customers);
    const cpfMap = /* @__PURE__ */ new Map();
    for (const customer of allCustomers) {
      const existing = cpfMap.get(customer.cpf) || [];
      existing.push(customer);
      cpfMap.set(customer.cpf, existing);
    }
    const duplicates = [];
    const entries = Array.from(cpfMap.entries());
    for (const [cpf, customerList] of entries) {
      if (customerList.length > 1) {
        duplicates.push({ cpf, investors: customerList });
      }
    }
    return duplicates;
  }
  async mergeInvestors(keepInvestorId, removeInvestorIds) {
    const keepCustomer = await this.getInvestor(keepInvestorId);
    if (!keepCustomer) return void 0;
    let totalEarningsToAdd = 0;
    for (const removeId of removeInvestorIds) {
      const removeCustomer = await this.getInvestor(removeId);
      if (!removeCustomer) continue;
      totalEarningsToAdd += Number(removeCustomer.totalEarnings);
      await db.update(vehicleRequests).set({ ownerId: keepInvestorId }).where(eq(vehicleRequests.ownerId, removeId));
      await db.update(vehicles).set({ ownerId: keepInvestorId }).where(eq(vehicles.ownerId, removeId));
      await db.delete(customers).where(eq(customers.id, removeId));
    }
    const newTotalEarnings = Number(keepCustomer.totalEarnings) + totalEarningsToAdd;
    const [updated] = await db.update(customers).set({ totalEarnings: newTotalEarnings.toString() }).where(eq(customers.id, keepInvestorId)).returning();
    return updated || void 0;
  }
  // Leads
  async getLeads() {
    return await db.select().from(leads).orderBy(desc(leads.id)).limit(200);
  }
  async getLead(id) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || void 0;
  }
  async createLead(insertLead) {
    const [lead] = await db.insert(leads).values({
      ...insertLead,
      status: insertLead.status || "new",
      notes: insertLead.notes || null,
      convertedAt: null
    }).returning();
    return lead;
  }
  async updateLead(id, data) {
    const [updated] = await db.update(leads).set(data).where(eq(leads.id, id)).returning();
    return updated || void 0;
  }
  async deleteLead(id) {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Interactions
  async getInteractions() {
    return await db.select().from(interactions);
  }
  async getInteraction(id) {
    const [interaction] = await db.select().from(interactions).where(eq(interactions.id, id));
    return interaction || void 0;
  }
  async createInteraction(insertInteraction) {
    const [interaction] = await db.insert(interactions).values({
      ...insertInteraction,
      customerId: insertInteraction.customerId || null,
      leadId: insertInteraction.leadId || null
    }).returning();
    return interaction;
  }
  // Vehicle Requests
  async getVehicleRequests() {
    const results = await db.select({
      vehicleRequest: vehicleRequests,
      investor: customers
    }).from(vehicleRequests).leftJoin(customers, eq(vehicleRequests.ownerId, customers.id)).orderBy(desc(vehicleRequests.createdAt)).limit(200);
    return results.map((row) => ({
      ...row.vehicleRequest,
      investor: row.investor || void 0
    }));
  }
  async getVehicleRequest(id) {
    const [request] = await db.select().from(vehicleRequests).where(eq(vehicleRequests.id, id));
    return request || void 0;
  }
  async createVehicleRequest(insertRequest) {
    const [request] = await db.insert(vehicleRequests).values({
      ...insertRequest,
      status: "pending",
      adminNotes: null,
      reviewedAt: null
    }).returning();
    return request;
  }
  async updateVehicleRequestStatus(id, status, adminNotes) {
    const [updated] = await db.update(vehicleRequests).set({
      status,
      adminNotes: adminNotes || null,
      reviewedAt: /* @__PURE__ */ new Date()
    }).where(eq(vehicleRequests.id, id)).returning();
    return updated || void 0;
  }
  async approveVehicleRequest(id, pricePerDay, monthlyPrice, customDividend) {
    const request = await this.getVehicleRequest(id);
    if (!request || request.status !== "pending") return void 0;
    const [vehicle] = await db.insert(vehicles).values({
      name: request.name,
      category: request.category,
      brand: request.brand,
      model: request.model,
      year: request.year,
      pricePerDay,
      // Admin define o pricePerDay na aprovação
      monthlyPrice: monthlyPrice || request.monthlyPrice,
      transmission: request.transmission,
      fuel: request.fuel,
      seats: request.seats,
      imageUrl: request.imageUrl,
      available: true,
      isInvestorVehicle: true,
      ownerId: request.ownerId,
      investorPercentage: null,
      // Não usamos mais percentual
      customDividend: customDividend || null,
      // Usar dividendo fixo fornecido pelo admin
      licensePlate: request.licensePlate,
      fipeValue: request.fipeValue
    }).returning();
    const inspectionsToCreate = [];
    if (request.evaluationFrontImage) {
      inspectionsToCreate.push({
        vehicleId: vehicle.id,
        type: "evaluation",
        imageUrl: request.evaluationFrontImage,
        imageType: "front",
        notes: "Foto frontal - avalia\xE7\xE3o inicial do investidor",
        uploadedBy: null
      });
    }
    if (request.evaluationBackImage) {
      inspectionsToCreate.push({
        vehicleId: vehicle.id,
        type: "evaluation",
        imageUrl: request.evaluationBackImage,
        imageType: "back",
        notes: "Foto traseira - avalia\xE7\xE3o inicial do investidor",
        uploadedBy: null
      });
    }
    if (request.evaluationRightSideImage) {
      inspectionsToCreate.push({
        vehicleId: vehicle.id,
        type: "evaluation",
        imageUrl: request.evaluationRightSideImage,
        imageType: "right_side",
        notes: "Lateral direita - avalia\xE7\xE3o inicial do investidor",
        uploadedBy: null
      });
    }
    if (request.evaluationLeftSideImage) {
      inspectionsToCreate.push({
        vehicleId: vehicle.id,
        type: "evaluation",
        imageUrl: request.evaluationLeftSideImage,
        imageType: "left_side",
        notes: "Lateral esquerda - avalia\xE7\xE3o inicial do investidor",
        uploadedBy: null
      });
    }
    if (inspectionsToCreate.length > 0) {
      await this.createBulkVehicleInspections(inspectionsToCreate);
    }
    await this.updateVehicleRequestStatus(id, "approved");
    if (customDividend && request.ownerId) {
      await this.updateInvestor(request.ownerId, {
        monthlyDividend: customDividend
      });
    }
    return vehicle;
  }
  // Customers
  async getCustomers() {
    return await db.select().from(customers).orderBy(desc(customers.createdAt)).limit(500);
  }
  async getCustomer(id) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || void 0;
  }
  async getCustomerByCpf(cpf) {
    const cleanCpf = cpf.replace(/\D/g, "");
    const [customer] = await db.select().from(customers).where(sql2`REPLACE(REPLACE(REPLACE(${customers.cpf}, '.', ''), '-', ''), '/', '') = ${cleanCpf}`);
    return customer || void 0;
  }
  async createCustomer(insertCustomer) {
    const [customer] = await db.insert(customers).values({
      ...insertCustomer,
      totalSpent: "0",
      totalRentals: 0,
      status: insertCustomer.status || "active",
      tags: insertCustomer.tags || [],
      notes: insertCustomer.notes || null,
      lastRentalAt: null
    }).returning();
    return customer;
  }
  async updateCustomer(id, data) {
    const [updated] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return updated || void 0;
  }
  async deleteCustomer(id) {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }
  async getCustomerRentals(customerId) {
    return await db.select().from(rentals).where(eq(rentals.customerId, customerId));
  }
  async updateCustomerStats(customerId) {
    const customerRentals = await this.getCustomerRentals(customerId);
    const totalSpent = customerRentals.reduce((sum, rental) => {
      return sum + Number(rental.totalPrice);
    }, 0);
    const lastRental = customerRentals.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    await this.updateCustomer(customerId, {
      totalSpent: totalSpent.toString(),
      totalRentals: customerRentals.length,
      lastRentalAt: lastRental ? lastRental.createdAt : null
    });
  }
  async getCurrentRental(customerId) {
    const [currentRental] = await db.select().from(rentals).where(
      and(
        eq(rentals.customerId, customerId),
        eq(rentals.status, "pending")
      )
    ).orderBy(desc(rentals.createdAt)).limit(1);
    return currentRental || void 0;
  }
  async getAverageRentalDuration(customerId) {
    const customerRentals = await this.getCustomerRentals(customerId);
    if (customerRentals.length === 0) return 0;
    const totalDays = customerRentals.reduce((sum, rental) => {
      const start = new Date(rental.startDate);
      const end = new Date(rental.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    return Math.round(totalDays / customerRentals.length);
  }
  // Customer Events
  async getAllCustomerEvents() {
    return await db.select().from(customerEvents).orderBy(desc(customerEvents.createdAt)).limit(1e3);
  }
  async getCustomerEvents(customerId) {
    return await db.select().from(customerEvents).where(eq(customerEvents.customerId, customerId)).orderBy(desc(customerEvents.createdAt));
  }
  async getCustomerEvent(id) {
    const [event] = await db.select().from(customerEvents).where(eq(customerEvents.id, id));
    return event || void 0;
  }
  async createCustomerEvent(insertEvent) {
    const [event] = await db.insert(customerEvents).values(insertEvent).returning();
    return event;
  }
  async updateCustomerEvent(id, data) {
    const [updated] = await db.update(customerEvents).set(data).where(eq(customerEvents.id, id)).returning();
    return updated || void 0;
  }
  async deleteCustomerEvent(id) {
    const result = await db.delete(customerEvents).where(eq(customerEvents.id, id)).returning();
    return result.length > 0;
  }
  // Investor Events - Returns both investor-specific events AND customer events for the investor
  async getInvestorEvents(investorId) {
    const invEvents = await db.select().from(investorEvents).where(eq(investorEvents.ownerId, investorId)).orderBy(desc(investorEvents.createdAt));
    const custEvents = await db.select().from(customerEvents).where(eq(customerEvents.customerId, investorId)).orderBy(desc(customerEvents.createdAt));
    const allEvents = [...invEvents, ...custEvents];
    allEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return allEvents;
  }
  async getInvestorEvent(id) {
    const [event] = await db.select().from(investorEvents).where(eq(investorEvents.id, id));
    return event || void 0;
  }
  async createInvestorEvent(insertEvent) {
    const [event] = await db.insert(investorEvents).values(insertEvent).returning();
    return event;
  }
  async updateInvestorEvent(id, data) {
    const [updated] = await db.update(investorEvents).set(data).where(eq(investorEvents.id, id)).returning();
    return updated || void 0;
  }
  async deleteInvestorEvent(id) {
    const result = await db.delete(investorEvents).where(eq(investorEvents.id, id)).returning();
    return result.length > 0;
  }
  async getInvestorVehicles(investorId) {
    return await db.select().from(vehicles).where(eq(vehicles.ownerId, investorId));
  }
  // Investment Quotas
  async getInvestmentQuotas() {
    return await db.select().from(investmentQuotas).orderBy(investmentQuotas.category, investmentQuotas.minValue);
  }
  async getInvestmentQuota(id) {
    const [quota] = await db.select().from(investmentQuotas).where(eq(investmentQuotas.id, id));
    return quota || void 0;
  }
  async createInvestmentQuota(insertQuota) {
    const [quota] = await db.insert(investmentQuotas).values(insertQuota).returning();
    return quota;
  }
  async updateInvestmentQuota(id, data) {
    const [updated] = await db.update(investmentQuotas).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(investmentQuotas.id, id)).returning();
    return updated || void 0;
  }
  async deleteInvestmentQuota(id) {
    const result = await db.delete(investmentQuotas).where(eq(investmentQuotas.id, id)).returning();
    return result.length > 0;
  }
  // Investor Payments
  async getAllInvestorPayments() {
    return await db.select().from(investorPayments).orderBy(desc(investorPayments.paymentDate));
  }
  async getInvestorPayments(investorId) {
    return await db.select().from(investorPayments).where(eq(investorPayments.investorId, investorId)).orderBy(desc(investorPayments.paymentDate));
  }
  async getInvestorPayment(id) {
    const [payment] = await db.select().from(investorPayments).where(eq(investorPayments.id, id));
    return payment || void 0;
  }
  async createInvestorPayment(insertPayment) {
    const [payment] = await db.insert(investorPayments).values(insertPayment).returning();
    const investorPaymentsList = await this.getInvestorPayments(insertPayment.investorId);
    const totalEarnings = investorPaymentsList.reduce((sum, p) => {
      if (p.status === "paid") {
        return sum + Number(p.amount);
      }
      return sum;
    }, 0);
    await this.updateCustomer(insertPayment.investorId, {
      totalEarnings: totalEarnings.toString()
    });
    return payment;
  }
  async updateInvestorPayment(id, data) {
    const [updated] = await db.update(investorPayments).set(data).where(eq(investorPayments.id, id)).returning();
    if (updated && (data.status || data.amount)) {
      const investorPaymentsList = await this.getInvestorPayments(updated.investorId);
      const totalEarnings = investorPaymentsList.reduce((sum, p) => {
        if (p.status === "paid") {
          return sum + Number(p.amount);
        }
        return sum;
      }, 0);
      await this.updateCustomer(updated.investorId, {
        totalEarnings: totalEarnings.toString()
      });
    }
    return updated || void 0;
  }
  async deleteInvestorPayment(id) {
    const payment = await this.getInvestorPayment(id);
    if (!payment) return false;
    const result = await db.delete(investorPayments).where(eq(investorPayments.id, id)).returning();
    if (result.length > 0) {
      const investorPaymentsList = await this.getInvestorPayments(payment.investorId);
      const totalEarnings = investorPaymentsList.reduce((sum, p) => {
        if (p.status === "paid") {
          return sum + Number(p.amount);
        }
        return sum;
      }, 0);
      await this.updateCustomer(payment.investorId, {
        totalEarnings: totalEarnings.toString()
      });
    }
    return result.length > 0;
  }
  // Financings
  async getFinancings() {
    return await db.select().from(financings).orderBy(desc(financings.createdAt)).limit(200);
  }
  async getFinancing(id) {
    const [financing] = await db.select().from(financings).where(eq(financings.id, id));
    return financing || void 0;
  }
  async createFinancing(insertFinancing) {
    const [financing] = await db.insert(financings).values(insertFinancing).returning();
    return financing;
  }
  async updateFinancing(id, data) {
    const [updated] = await db.update(financings).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(financings.id, id)).returning();
    return updated || void 0;
  }
  async deleteFinancing(id) {
    const result = await db.delete(financings).where(eq(financings.id, id)).returning();
    return result.length > 0;
  }
  async getCustomerFinancings(customerId) {
    return await db.select().from(financings).where(eq(financings.customerId, customerId)).orderBy(desc(financings.createdAt));
  }
  // Vehicle Inspections
  async getVehicleInspections(vehicleId) {
    return await db.select().from(vehicleInspections).where(eq(vehicleInspections.vehicleId, vehicleId)).orderBy(desc(vehicleInspections.createdAt));
  }
  async createVehicleInspection(inspection) {
    const [created] = await db.insert(vehicleInspections).values(inspection).returning();
    return created;
  }
  async createBulkVehicleInspections(inspections) {
    if (inspections.length === 0) return [];
    const created = await db.insert(vehicleInspections).values(inspections).returning();
    return created;
  }
  async getVehicleInspection(id) {
    const [inspection] = await db.select().from(vehicleInspections).where(eq(vehicleInspections.id, id));
    return inspection || void 0;
  }
  async updateVehicleInspection(id, data) {
    const [updated] = await db.update(vehicleInspections).set(data).where(eq(vehicleInspections.id, id)).returning();
    return updated || void 0;
  }
  async deleteVehicleInspection(id) {
    const result = await db.delete(vehicleInspections).where(eq(vehicleInspections.id, id)).returning();
    return result.length > 0;
  }
  // Audit Logs
  async getAuditLogs(limit = 100) {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
  async createAuditLog(log2) {
    const [created] = await db.insert(auditLogs).values(log2).returning();
    return created;
  }
  // Admin Users
  async getAdminUsers() {
    return await db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
  }
  async getAdminUser(id) {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user || void 0;
  }
  async getAdminUserByEmail(email) {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return user || void 0;
  }
  async getAdminUserByCpf(cpf) {
    const cleanCpf = cpf.replace(/\D/g, "");
    const [user] = await db.select().from(adminUsers).where(sql2`REPLACE(REPLACE(REPLACE(${adminUsers.cpf}, '.', ''), '-', ''), '/', '') = ${cleanCpf}`);
    return user || void 0;
  }
  async getInvestorByCpf(cpf) {
    const cleanCpf = cpf.replace(/\D/g, "");
    const [user] = await db.select().from(adminUsers).where(
      and(
        sql2`REPLACE(REPLACE(REPLACE(${adminUsers.cpf}, '.', ''), '-', ''), '/', '') = ${cleanCpf}`,
        eq(adminUsers.role, "INVESTIDOR")
      )
    );
    return user || void 0;
  }
  async createAdminUser(user) {
    const [created] = await db.insert(adminUsers).values(user).returning();
    return created;
  }
  async updateAdminUser(id, data) {
    const [updated] = await db.update(adminUsers).set(data).where(eq(adminUsers.id, id)).returning();
    return updated || void 0;
  }
  async deleteAdminUser(id) {
    const result = await db.delete(adminUsers).where(eq(adminUsers.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Contract Templates
  async getContractTemplates() {
    return await db.select().from(contractTemplates).orderBy(desc(contractTemplates.createdAt));
  }
  async getContractTemplate(id) {
    const [template] = await db.select().from(contractTemplates).where(eq(contractTemplates.id, id));
    return template || void 0;
  }
  async getContractTemplatesByType(type) {
    return await db.select().from(contractTemplates).where(eq(contractTemplates.type, type)).orderBy(desc(contractTemplates.createdAt));
  }
  async createContractTemplate(template) {
    const [created] = await db.insert(contractTemplates).values(template).returning();
    return created;
  }
  async updateContractTemplate(id, data) {
    const [updated] = await db.update(contractTemplates).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(contractTemplates.id, id)).returning();
    return updated || void 0;
  }
  async deleteContractTemplate(id) {
    const result = await db.delete(contractTemplates).where(eq(contractTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Trade-in Vehicles
  async getTradeInVehicles() {
    return await db.select().from(tradeInVehicles).orderBy(desc(tradeInVehicles.createdAt));
  }
  async getTradeInVehicle(id) {
    const [vehicle] = await db.select().from(tradeInVehicles).where(eq(tradeInVehicles.id, id));
    return vehicle || void 0;
  }
  async getTradeInVehicleByFinancingId(financingId) {
    const [vehicle] = await db.select().from(tradeInVehicles).where(eq(tradeInVehicles.financingId, financingId));
    return vehicle || void 0;
  }
  async createTradeInVehicle(vehicle) {
    const [created] = await db.insert(tradeInVehicles).values(vehicle).returning();
    return created;
  }
  async updateTradeInVehicle(id, data) {
    const [updated] = await db.update(tradeInVehicles).set(data).where(eq(tradeInVehicles.id, id)).returning();
    return updated || void 0;
  }
  async deleteTradeInVehicle(id) {
    const result = await db.delete(tradeInVehicles).where(eq(tradeInVehicles.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Rental Plans
  async getRentalPlans() {
    return await db.select().from(rentalPlans).orderBy(desc(rentalPlans.createdAt));
  }
  async getRentalPlan(id) {
    const [plan] = await db.select().from(rentalPlans).where(eq(rentalPlans.id, id));
    return plan || void 0;
  }
  async createRentalPlan(plan) {
    const [created] = await db.insert(rentalPlans).values(plan).returning();
    return created;
  }
  async updateRentalPlan(id, data) {
    const [updated] = await db.update(rentalPlans).set(data).where(eq(rentalPlans.id, id)).returning();
    return updated || void 0;
  }
  async deleteRentalPlan(id) {
    const result = await db.delete(rentalPlans).where(eq(rentalPlans.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Financing Proposals
  async getFinancingProposals() {
    return await db.select().from(financingProposals).orderBy(desc(financingProposals.createdAt));
  }
  async getFinancingProposal(id) {
    const [proposal] = await db.select().from(financingProposals).where(eq(financingProposals.id, id));
    return proposal || void 0;
  }
  async createFinancingProposal(proposal) {
    const [created] = await db.insert(financingProposals).values(proposal).returning();
    return created;
  }
  async approveFinancingProposal(id, adminReviewerId, approvedValues, adminNotes) {
    const proposal = await this.getFinancingProposal(id);
    if (!proposal || proposal.status !== "pending") return void 0;
    const [updated] = await db.update(financingProposals).set({
      status: "approved",
      adminReviewerId: adminReviewerId || null,
      approvedValues,
      adminNotes: adminNotes || null,
      reviewedAt: sql2`now()`
    }).where(eq(financingProposals.id, id)).returning();
    return updated || void 0;
  }
  async rejectFinancingProposal(id, adminReviewerId, adminNotes) {
    const proposal = await this.getFinancingProposal(id);
    if (!proposal || proposal.status !== "pending") return void 0;
    const [updated] = await db.update(financingProposals).set({
      status: "rejected",
      adminReviewerId,
      adminNotes,
      reviewedAt: sql2`now()`
    }).where(eq(financingProposals.id, id)).returning();
    return updated || void 0;
  }
  async getFinancingProposalsBySeller(sellerId) {
    return await db.select().from(financingProposals).where(eq(financingProposals.sellerId, sellerId)).orderBy(desc(financingProposals.createdAt));
  }
  async dismissFinancingProposal(id) {
    const proposal = await this.getFinancingProposal(id);
    if (!proposal) return void 0;
    const [updated] = await db.update(financingProposals).set({
      dismissedAt: sql2`now()`
    }).where(eq(financingProposals.id, id)).returning();
    return updated || void 0;
  }
  // Operational Expenses
  async getAllOperationalExpenses() {
    return await db.select().from(operationalExpenses).orderBy(desc(operationalExpenses.date));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
init_schema();
import { z as z2 } from "zod";
import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, PageBreak, ImageRun } from "docx";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import multer from "multer";
var uploadDir = path.join(process.cwd(), "uploads", "videos");
var chunksDir = path.join(process.cwd(), "uploads", "chunks");
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  if (!fs.existsSync(chunksDir)) {
    fs.mkdirSync(chunksDir, { recursive: true });
  }
} catch (err) {
  console.warn("Could not create upload directories (possibly read-only filesystem):", err);
}
var sanitizeUploadId = (id) => {
  return id.replace(/[^a-zA-Z0-9-]/g, "");
};
var sanitizeChunkIndex = (index2) => {
  const num = parseInt(index2, 10);
  return isNaN(num) || num < 0 ? 0 : num;
};
var chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rawUploadId = req.body.uploadId || "unknown";
    const uploadId = sanitizeUploadId(rawUploadId);
    const chunkDir = path.join(chunksDir, uploadId);
    const resolvedPath = path.resolve(chunkDir);
    if (!resolvedPath.startsWith(path.resolve(chunksDir))) {
      return cb(new Error("Invalid upload ID"), "");
    }
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }
    cb(null, chunkDir);
  },
  filename: (req, file, cb) => {
    const rawIndex = req.body.chunkIndex || "0";
    const chunkIndex = sanitizeChunkIndex(rawIndex);
    cb(null, `chunk-${chunkIndex}`);
  }
});
var chunkUpload = multer({
  storage: chunkStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB por chunk
});
var videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".mp4";
    cb(null, `confession-${uniqueSuffix}${ext}`);
  }
});
var videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});
async function registerRoutes(app2) {
  app2.post("/api/admin/auth", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("\u{1F510} Tentativa de login:", email);
      const adminUser = await storage.getAdminUserByEmail(email);
      if (adminUser) {
        console.log("\u2713 Usu\xE1rio encontrado no banco:", adminUser.email, "| Ativo:", adminUser.isActive);
        if (!adminUser.isActive) {
          console.log("\u2717 Usu\xE1rio inativo");
          return res.status(401).json({ success: false, error: "Usu\xE1rio inativo" });
        }
        const passwordMatch = await bcrypt.compare(password, adminUser.password);
        console.log("\u{1F511} Senha correta:", passwordMatch);
        if (passwordMatch) {
          let updatedUser = await checkAndResetSales(adminUser);
          const salesCount = updatedUser.salesCount || 0;
          const salesGoal = updatedUser.salesGoal || 1;
          if (salesCount >= salesGoal && !updatedUser.goalAchievedToday) {
            updatedUser = await storage.updateAdminUser(updatedUser.id, {
              monthlyGoalsAchieved: (updatedUser.monthlyGoalsAchieved || 0) + 1,
              goalAchievedToday: true
            });
          }
          updatedUser = await storage.updateAdminUser(updatedUser.id, {
            lastLoginAt: /* @__PURE__ */ new Date()
          });
          await storage.createAuditLog({
            action: "login",
            entity: "admin_user",
            entityId: updatedUser.id,
            userName: updatedUser.name,
            details: `${updatedUser.role === "VENDEDOR" ? "Vendedor" : "Admin"} fez login: ${updatedUser.email}`,
            ipAddress: req.ip
          });
          const { password: password2, ...userData } = updatedUser;
          return res.json({
            success: true,
            user: userData
          });
        }
      }
      if (process.env.NODE_ENV === "development") {
        const allAdminUsers = await storage.getAdminUsers();
        if (allAdminUsers.length === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
          const adminEmail = process.env.ADMIN_EMAIL;
          const adminPassword = process.env.ADMIN_PASSWORD;
          const emailMatch = email === adminEmail || email === `${adminEmail}@gmail.com` || adminEmail.includes("@") && email === adminEmail.split("@")[0];
          if (emailMatch && password === adminPassword) {
            console.warn("\u26A0\uFE0F  AVISO: Autentica\xE7\xE3o usando env vars. Crie um admin user em /api/admin/users");
            const fallbackUser = {
              id: "env-admin",
              name: "Admin (Env)",
              email: adminEmail,
              role: "ADMIN",
              isActive: true,
              salesGoal: null,
              salesCount: null,
              cpf: null,
              createdAt: /* @__PURE__ */ new Date(),
              lastLoginAt: /* @__PURE__ */ new Date()
            };
            return res.json({
              success: true,
              user: fallbackUser,
              warning: "Crie um admin user para seguran\xE7a"
            });
          }
        }
      }
      res.status(401).json({ success: false, error: "Email ou senha incorretos" });
    } catch (error) {
      console.error("Erro ao autenticar:", error);
      res.status(500).json({ success: false, error: "Erro ao autenticar" });
    }
  });
  app2.get("/api/admin/users", async (_req, res) => {
    try {
      const users = await storage.getAdminUsers();
      let sanitizedUsers = users.map(({ password, ...user }) => user);
      if (process.env.HIDE_INVESTORS === "true") {
        sanitizedUsers = sanitizedUsers.map((u) => ({
          ...u,
          name: "Usu\xE1rio Oculto",
          email: "oculto@projeto.car",
          cpf: "000.000.000-00"
        }));
      }
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar usu\xE1rios" });
    }
  });
  app2.post("/api/admin/users", async (req, res) => {
    try {
      const validated = insertAdminUserSchema.parse(req.body);
      const existingUser = await storage.getAdminUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email j\xE1 cadastrado" });
      }
      const hashedPassword = await bcrypt.hash(validated.password, 10);
      const user = await storage.createAdminUser({
        ...validated,
        password: hashedPassword
      });
      await storage.createAuditLog({
        action: "create",
        entity: "admin_user",
        entityId: user.id,
        userName: validated.name,
        details: `Usu\xE1rio administrador criado: ${validated.email}`,
        ipAddress: req.ip
      });
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar usu\xE1rio" });
    }
  });
  app2.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const updateSchema = insertAdminUserSchema.partial();
      const validated = updateSchema.parse(data);
      if (validated.email) {
        const existingUser = await storage.getAdminUserByEmail(validated.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "Email j\xE1 cadastrado para outro usu\xE1rio" });
        }
      }
      if (validated.password) {
        validated.password = await bcrypt.hash(validated.password, 10);
      }
      const user = await storage.updateAdminUser(id, validated);
      if (!user) {
        return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
      }
      await storage.createAuditLog({
        action: "update",
        entity: "admin_user",
        entityId: user.id,
        userName: user.name,
        details: `Usu\xE1rio administrador atualizado: ${user.email}`,
        ipAddress: req.ip
      });
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Erro ao atualizar usu\xE1rio:", error);
      res.status(500).json({ error: "Erro ao atualizar usu\xE1rio" });
    }
  });
  app2.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getAdminUsers();
      const userToDelete = user.find((u) => u.id === id);
      const success = await storage.deleteAdminUser(id);
      if (!success) {
        return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
      }
      if (userToDelete) {
        await storage.createAuditLog({
          action: "delete",
          entity: "admin_user",
          entityId: id,
          userName: userToDelete.name,
          details: `Usu\xE1rio administrador removido: ${userToDelete.email}`,
          ipAddress: req.ip
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar usu\xE1rio" });
    }
  });
  async function checkAndResetSales(user) {
    const now = /* @__PURE__ */ new Date();
    const updates = {};
    let needsUpdate = false;
    const goalPeriod = user.goalPeriod || "daily";
    if (user.lastSalesReset) {
      const lastReset = new Date(user.lastSalesReset);
      let shouldReset = false;
      if (goalPeriod === "daily") {
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1e3 * 60 * 60);
        shouldReset = hoursSinceReset >= 24;
      } else if (goalPeriod === "weekly") {
        const lastSunday = new Date(now);
        lastSunday.setHours(0, 0, 0, 0);
        const daysSinceSunday = now.getDay();
        lastSunday.setDate(lastSunday.getDate() - daysSinceSunday);
        shouldReset = lastReset < lastSunday;
      } else if (goalPeriod === "monthly") {
        shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
      } else if (goalPeriod === "yearly") {
        shouldReset = now.getFullYear() !== lastReset.getFullYear();
      }
      if (shouldReset) {
        updates.salesCount = 0;
        updates.lastSalesReset = now;
        updates.goalAchievedToday = false;
        needsUpdate = true;
      }
    } else {
      updates.lastSalesReset = now;
      updates.goalAchievedToday = false;
      needsUpdate = true;
    }
    if (user.lastMonthReset) {
      const lastMonthReset = new Date(user.lastMonthReset);
      if (now.getMonth() !== lastMonthReset.getMonth() || now.getFullYear() !== lastMonthReset.getFullYear()) {
        updates.monthlyGoalsAchieved = 0;
        updates.lastMonthReset = now;
        needsUpdate = true;
      }
    } else {
      updates.lastMonthReset = now;
      needsUpdate = true;
    }
    if (needsUpdate) {
      return await storage.updateAdminUser(user.id, updates);
    }
    return user;
  }
  app2.post("/api/admin/users/:id/sales", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, revenue } = req.body;
      if (amount === void 0 || amount === null || amount === 0) {
        return res.status(400).json({ error: "Quantidade inv\xE1lida - deve ser diferente de zero" });
      }
      const users = await storage.getAdminUsers();
      let user = users.find((u) => u.id === id);
      if (!user) {
        return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
      }
      const checkedUser = await checkAndResetSales(user);
      if (!checkedUser) {
        return res.status(500).json({ error: "Erro ao processar dados do usu\xE1rio" });
      }
      user = checkedUser;
      const currentCount = user.salesCount || 0;
      const newSalesCount = currentCount + amount;
      if (newSalesCount < 0) {
        return res.status(400).json({
          error: `Opera\xE7\xE3o inv\xE1lida - n\xE3o \xE9 poss\xEDvel remover ${Math.abs(amount)} vendas. O vendedor tem apenas ${currentCount} vendas no per\xEDodo atual.`
        });
      }
      const salesGoal = user.salesGoal || 1;
      const currentRevenue = parseFloat(user.salesRevenue || "0");
      const revenueToAdd = revenue ? parseFloat(revenue) : 0;
      const newSalesRevenue = (currentRevenue + revenueToAdd).toFixed(2);
      const newTotalSales = (user.totalSales || 0) + amount;
      const updates = {
        salesCount: newSalesCount,
        // Reseta baseado no goalPeriod (daily/weekly/monthly/yearly)
        salesRevenue: newSalesRevenue,
        // Acumula sempre
        totalSales: newTotalSales
        // NUNCA RESETA - histórico permanente
      };
      if (newSalesCount >= salesGoal && !user.goalAchievedToday) {
        updates.monthlyGoalsAchieved = (user.monthlyGoalsAchieved || 0) + 1;
        updates.goalAchievedToday = true;
        updates.totalGoalsAchieved = (user.totalGoalsAchieved || 0) + 1;
      }
      const updatedUser = await storage.updateAdminUser(id, updates);
      const amountSign = amount > 0 ? "+" : "";
      const revenueSign = revenue && parseFloat(revenue) > 0 ? "+" : "";
      const revenueInfo = revenue ? ` | Receita: ${revenueSign}R$ ${parseFloat(revenue).toFixed(2)}` : "";
      await storage.createAuditLog({
        action: "update",
        entity: "admin_user",
        entityId: id,
        userName: user.name,
        details: `Vendas ${amount > 0 ? "adicionadas" : "removidas"}: ${amountSign}${amount} (total: ${newSalesCount})${revenueInfo}`,
        ipAddress: req.ip
      });
      res.json(updatedUser);
    } catch (error) {
      console.error("Erro ao registrar vendas:", error);
      res.status(500).json({ error: "Erro ao registrar vendas" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    return res.status(403).json({
      error: "Cadastro p\xFAblico desabilitado. Apenas investidores ativos da Imobilicar podem acessar o portal. Se voc\xEA \xE9 um investidor, entre em contato com o suporte para configurar seu acesso."
    });
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { customerLoginSchema: customerLoginSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const validated = customerLoginSchema2.parse(req.body);
      const cleanCpf = validated.cpf.replace(/\D/g, "");
      const investorUser = await storage.getInvestorByCpf(validated.cpf);
      if (investorUser) {
        if (!investorUser.password) {
          return res.status(401).json({ error: "Cadastro incompleto. Entre em contato com o suporte." });
        }
        const passwordMatch2 = await bcrypt.compare(validated.password, investorUser.password);
        if (!passwordMatch2) {
          return res.status(401).json({ error: "CPF ou senha incorretos" });
        }
        if (!investorUser.isActive) {
          return res.status(401).json({ error: "Conta desativada. Entre em contato com o suporte." });
        }
        const customerData = await storage.getCustomerByCpf(cleanCpf);
        console.log("\u{1F50D} DEBUG - Investidor login:", {
          investorUserCpf: validated.cpf,
          cleanCpf,
          foundCustomerData: !!customerData,
          customerDataFields: customerData ? {
            id: customerData.id,
            paymentDate: customerData.paymentDate,
            bonusDate: customerData.bonusDate,
            bonusValue: customerData.bonusValue,
            monthlyDividend: customerData.monthlyDividend
          } : null
        });
        await storage.createAuditLog({
          action: "login",
          entity: "admin_user",
          entityId: investorUser.id,
          userName: investorUser.name,
          details: `Investidor fez login: ${investorUser.email}`,
          ipAddress: req.ip
        });
        const { password: password2, ...sanitizedUser } = investorUser;
        return res.json({
          success: true,
          customer: {
            ...sanitizedUser,
            role: "INVESTIDOR",
            // Garantir que role está presente
            // Adicionar dados complementares da tabela customers (se existir)
            ...customerData && {
              customerId: customerData.id,
              // ID da tabela customers (usado para buscar veículos)
              paymentDate: customerData.paymentDate,
              bonusDate: customerData.bonusDate,
              bonusValue: customerData.bonusValue,
              monthlyDividend: customerData.monthlyDividend,
              createdAt: customerData.createdAt
              // Data de cadastro original no CRM
            }
          }
        });
      }
      const customer = await storage.getCustomerByCpf(cleanCpf);
      if (!customer) {
        return res.status(401).json({ error: "CPF ou senha incorretos" });
      }
      if (!customer.password) {
        return res.status(401).json({ error: "Cadastro incompleto. Entre em contato com o suporte." });
      }
      const passwordMatch = await bcrypt.compare(validated.password, customer.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "CPF ou senha incorretos" });
      }
      if (customer.status === "blocked" || customer.status === "inactive") {
        return res.status(401).json({ error: "Conta bloqueada. Entre em contato com o suporte." });
      }
      const investorVehicles = await storage.getVehiclesByOwner(customer.id);
      const activeInvestorVehicles = investorVehicles.filter(
        (v) => v.isInvestorVehicle === true && v.available === true
      );
      if (activeInvestorVehicles.length === 0) {
        return res.status(403).json({
          error: "Acesso negado. Apenas investidores com ve\xEDculos ativos podem fazer login. Entre em contato com o suporte se voc\xEA \xE9 um investidor."
        });
      }
      await storage.createAuditLog({
        action: "login",
        entity: "customer",
        entityId: customer.id,
        userName: customer.name,
        details: `Investidor fez login: ${customer.email} (${activeInvestorVehicles.length} ve\xEDculo(s) ativo(s))`,
        ipAddress: req.ip
      });
      const { password, ...sanitizedCustomer } = customer;
      res.json({
        success: true,
        customer: {
          ...sanitizedCustomer,
          role: "INVESTIDOR"
          // Garantir que role está presente para investidores antigos
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Dados inv\xE1lidos", details: error.errors });
      }
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });
  app2.get("/api/contract-templates", async (_req, res) => {
    try {
      const templates = await storage.getContractTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar templates" });
    }
  });
  app2.get("/api/contract-templates/:id", async (req, res) => {
    try {
      const template = await storage.getContractTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template n\xE3o encontrado" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar template" });
    }
  });
  app2.get("/api/contract-templates/by-type/:type", async (req, res) => {
    try {
      const templates = await storage.getContractTemplatesByType(req.params.type);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar templates por tipo" });
    }
  });
  app2.post("/api/contract-templates", async (req, res) => {
    try {
      const validated = insertContractTemplateSchema.parse(req.body);
      const template = await storage.createContractTemplate(validated);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Dados inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar template" });
    }
  });
  app2.patch("/api/contract-templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validated = updateContractTemplateSchema.parse(req.body);
      const template = await storage.updateContractTemplate(id, validated);
      if (!template) {
        return res.status(404).json({ error: "Template n\xE3o encontrado" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Dados inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar template" });
    }
  });
  app2.delete("/api/contract-templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteContractTemplate(id);
      if (!success) {
        return res.status(404).json({ error: "Template n\xE3o encontrado" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar template" });
    }
  });
  app2.get("/api/rental-plans", async (_req, res) => {
    try {
      const plans = await storage.getRentalPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar planos" });
    }
  });
  app2.get("/api/rental-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getRentalPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: "Plano n\xE3o encontrado" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar plano" });
    }
  });
  app2.post("/api/rental-plans", async (req, res) => {
    try {
      const validated = insertRentalPlanSchema.parse(req.body);
      const plan = await storage.createRentalPlan(validated);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Dados inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar plano" });
    }
  });
  app2.patch("/api/rental-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validated = updateRentalPlanSchema.parse(req.body);
      const plan = await storage.updateRentalPlan(id, validated);
      if (!plan) {
        return res.status(404).json({ error: "Plano n\xE3o encontrado" });
      }
      res.json(plan);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Dados inv\xE1lidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar plano" });
    }
  });
  app2.delete("/api/rental-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteRentalPlan(id);
      if (!success) {
        return res.status(404).json({ error: "Plano n\xE3o encontrado" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar plano" });
    }
  });
  app2.get("/api/financing-proposals", async (_req, res) => {
    try {
      const proposals = await storage.getFinancingProposals();
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar propostas" });
    }
  });
  app2.get("/api/financing-proposals/seller/:sellerId", async (req, res) => {
    try {
      const { sellerId } = req.params;
      const proposals = await storage.getFinancingProposalsBySeller(sellerId);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar propostas do vendedor" });
    }
  });
  app2.get("/api/financing-proposals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const proposal = await storage.getFinancingProposal(id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposta n\xE3o encontrada" });
      }
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar proposta" });
    }
  });
  app2.post("/api/financing-proposals", async (req, res) => {
    try {
      const { userRole, ...proposalData } = req.body;
      const validated = insertFinancingProposalSchema.parse(proposalData);
      const proposal = await storage.createFinancingProposal(validated);
      const isAdmin = userRole === "ADMIN";
      if (isAdmin) {
        const approvedProposal = await storage.approveFinancingProposal(
          proposal.id,
          validated.sellerId,
          // O próprio admin é o revisor
          validated.proposedTerms,
          "Aprova\xE7\xE3o autom\xE1tica (usu\xE1rio administrador)"
        );
        res.status(201).json(approvedProposal || proposal);
      } else {
        res.status(201).json(proposal);
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Dados inv\xE1lidos", details: error.errors });
      }
      console.error("Error creating financing proposal:", error);
      res.status(500).json({ error: "Erro ao criar proposta" });
    }
  });
  app2.post("/api/financing-proposals/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminReviewerId, approvedValues, adminNotes } = req.body;
      const existingProposal = await storage.getFinancingProposal(id);
      if (!existingProposal) {
        return res.status(404).json({ error: "Proposta n\xE3o encontrada" });
      }
      const finalApprovedValues = approvedValues || existingProposal.proposedTerms;
      const finalAdminId = adminReviewerId || null;
      const proposal = await storage.approveFinancingProposal(
        id,
        finalAdminId,
        finalApprovedValues,
        adminNotes || "Aprovado via CRM"
      );
      if (!proposal) {
        return res.status(404).json({ error: "Proposta n\xE3o encontrada ou j\xE1 foi processada" });
      }
      res.json(proposal);
    } catch (error) {
      console.error("Error approving proposal:", error);
      res.status(500).json({ error: "Erro ao aprovar proposta", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.post("/api/financing-proposals/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminReviewerId, adminNotes } = req.body;
      const finalAdminId = adminReviewerId || "system";
      const finalNotes = adminNotes || "Rejeitado via CRM";
      const proposal = await storage.rejectFinancingProposal(id, finalAdminId, finalNotes);
      if (!proposal) {
        return res.status(404).json({ error: "Proposta n\xE3o encontrada ou j\xE1 foi processada" });
      }
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Erro ao rejeitar proposta" });
    }
  });
  app2.post("/api/financing-proposals/:id/dismiss", async (req, res) => {
    try {
      const { id } = req.params;
      const proposal = await storage.dismissFinancingProposal(id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposta n\xE3o encontrada" });
      }
      res.json(proposal);
    } catch (error) {
      console.error("Error dismissing proposal:", error);
      res.status(500).json({ error: "Erro ao marcar proposta como visualizada" });
    }
  });
  app2.get("/api/vehicles", async (_req, res) => {
    try {
      let vehicles2 = await storage.getVehicles();
      if (process.env.HIDE_INVESTORS === "true") {
        vehicles2 = vehicles2.map((v) => ({
          ...v,
          ownerId: null,
          customDividend: null,
          investorPercentage: null
        }));
      }
      res.json(vehicles2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });
  app2.get("/api/vehicles/investor/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      let vehicles2 = await storage.getVehiclesByOwner(customerId);
      if (vehicles2.length === 0) {
        const adminUser = await storage.getAdminUser(customerId);
        if (adminUser && adminUser.cpf) {
          const adminCpf = adminUser.cpf;
          const customers2 = await storage.getCustomers();
          const matchingCustomer = customers2.find(
            (c) => c.cpf && c.cpf.replace(/\D/g, "") === adminCpf.replace(/\D/g, "")
          );
          if (matchingCustomer) {
            vehicles2 = await storage.getVehiclesByOwner(matchingCustomer.id);
          }
        }
      }
      res.json(vehicles2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investor vehicles" });
    }
  });
  app2.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle" });
    }
  });
  app2.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.parse(req.body);
      const vehicleData = {
        ...validatedData,
        imageUrl: validatedData.imageUrl || "https://placehold.co/400x300/1a1a2e/ffffff?text=Sem+Imagem",
        pricePerDay: validatedData.pricePerDay ?? "0",
        monthlyPrice: validatedData.monthlyPrice ?? null,
        tradeInValue: validatedData.tradeInValue ?? null
      };
      const vehicle = await storage.createVehicle(vehicleData);
      const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
      await storage.createAuditLog({
        action: "create",
        entity: "vehicle",
        entityId: vehicle.id,
        entityName: vehicleName,
        userId: req.adminUser?.id || null,
        userName: req.adminUser?.name || "Sistema",
        details: JSON.stringify({
          placa: vehicle.licensePlate || "N/A",
          categoria: vehicle.category,
          cor: vehicle.color || "N/A",
          investidor: vehicle.isInvestorVehicle ? "Sim" : "N\xE3o"
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid vehicle data", details: error.errors });
      }
      console.error("[VEHICLE CREATE ERROR]", error);
      res.status(500).json({ error: "Failed to create vehicle" });
    }
  });
  app2.post("/api/vehicles/bulk", async (req, res) => {
    try {
      const bulkSchema = z2.object({
        vehicles: z2.array(insertVehicleSchema)
      });
      const validatedData = bulkSchema.parse(req.body);
      const createdVehicles = [];
      for (const vehicleData of validatedData.vehicles) {
        const vehicle = await storage.createVehicle(vehicleData);
        createdVehicles.push(vehicle);
      }
      res.status(201).json({
        success: true,
        count: createdVehicles.length,
        vehicles: createdVehicles
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid vehicles data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vehicles" });
    }
  });
  app2.patch("/api/vehicles/:id", async (req, res) => {
    try {
      const validationResult = updateVehicleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid vehicle data", details: validationResult.error });
      }
      const updateData = { ...validationResult.data };
      if (updateData.imageUrl === null) delete updateData.imageUrl;
      const vehicle = await storage.updateVehicle(req.params.id, updateData);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vehicle" });
    }
  });
  app2.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const allFinancings = await storage.getFinancings();
      const vehicleFinancings = allFinancings.filter((f) => f.vehicleId === req.params.id);
      if (vehicleFinancings.length > 0) {
        return res.status(400).json({
          error: "N\xE3o \xE9 poss\xEDvel deletar ve\xEDculo com financiamentos",
          details: `Este ve\xEDculo possui ${vehicleFinancings.length} financiamento(s) registrado(s)`
        });
      }
      const deleted = await storage.deleteVehicle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });
  app2.patch("/api/vehicles/:id/investment-contract", async (req, res) => {
    try {
      const { contractUrl, contractFileName } = req.body;
      const vehicle = await storage.updateVehicle(req.params.id, {
        investmentContractUrl: contractUrl,
        investmentContractFileName: contractFileName
      });
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vehicle investment contract" });
    }
  });
  app2.delete("/api/vehicles/:id/investment-contract", async (req, res) => {
    try {
      const vehicle = await storage.updateVehicle(req.params.id, {
        investmentContractUrl: null,
        investmentContractFileName: null
      });
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to remove vehicle investment contract" });
    }
  });
  app2.get("/api/vehicles/:vehicleId/rentals", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const rentals2 = await storage.getVehicleRentals(req.params.vehicleId);
      res.json(rentals2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle rentals" });
    }
  });
  app2.get("/api/vehicles/:vehicleId/events", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const events = await storage.getVehicleEvents(req.params.vehicleId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle events" });
    }
  });
  app2.get("/api/vehicles/:vehicleId/inspections", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const inspections = await storage.getVehicleInspections(req.params.vehicleId);
      res.json(inspections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle inspections" });
    }
  });
  app2.post("/api/vehicles/:vehicleId/inspections", async (req, res) => {
    try {
      console.log("POST /api/vehicles/:vehicleId/inspections - Body:", JSON.stringify({ type: req.body.type, imageType: req.body.imageType, hasImageUrl: !!req.body.imageUrl }));
      const vehicle = await storage.getVehicle(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const validatedData = insertVehicleInspectionSchema.parse({
        ...req.body,
        cost: (req.body.cost || 0).toString(),
        notes: req.body.notes || null,
        paymentDate: req.body.paymentDate || null,
        vehicleId: req.params.vehicleId
      });
      const inspection = await storage.createVehicleInspection(validatedData);
      console.log("Inspection created successfully:", inspection.id, "type:", inspection.type);
      res.status(201).json(inspection);
    } catch (error) {
      console.error("Failed to create inspection:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vehicle inspection" });
    }
  });
  app2.post("/api/vehicles/:vehicleId/inspections/bulk", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const bulkInspectionSchema = insertVehicleInspectionSchema.omit({ vehicleId: true });
      const bulkSchema = z2.object({
        inspections: z2.array(bulkInspectionSchema)
      });
      const validatedData = bulkSchema.parse(req.body);
      const inspectionsWithVehicleId = validatedData.inspections.map((inspection) => ({
        ...inspection,
        vehicleId: req.params.vehicleId
      }));
      const createdInspections = await storage.createBulkVehicleInspections(inspectionsWithVehicleId);
      res.status(201).json({
        success: true,
        count: createdInspections.length,
        inspections: createdInspections
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid inspections data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vehicle inspections" });
    }
  });
  app2.patch("/api/vehicle-inspections/:id", async (req, res) => {
    try {
      const inspection = await storage.getVehicleInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      const updateInspectionSchema = z2.object({
        imageType: z2.enum(["front", "back", "right_side", "left_side", "dashboard", "interior", "document", "damage_detail", "other"]).optional(),
        notes: z2.string().nullable().optional(),
        imageUrl: z2.string().optional()
      });
      const validatedData = updateInspectionSchema.parse(req.body);
      const updated = await storage.updateVehicleInspection(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update vehicle inspection" });
    }
  });
  app2.delete("/api/vehicle-inspections/:id", async (req, res) => {
    try {
      const inspection = await storage.getVehicleInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      const deleted = await storage.deleteVehicleInspection(req.params.id);
      if (deleted) {
        res.json({ success: true, message: "Inspection deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete inspection" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vehicle inspection" });
    }
  });
  app2.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });
  app2.get("/api/vehicles/:vehicleId/statistics", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const rentals2 = await storage.getVehicleRentals(req.params.vehicleId);
      const events = await storage.getVehicleEvents(req.params.vehicleId);
      const completedRentals = rentals2.filter((rental) => rental.status === "completed");
      const activeRentals = rentals2.filter((rental) => rental.status === "active");
      const approvedRentals = rentals2.filter((rental) => rental.status === "approved");
      const validRentals = [...completedRentals, ...activeRentals, ...approvedRentals];
      const totalRentals = validRentals.length;
      const totalRevenue = completedRentals.reduce((sum, rental) => sum + Number(rental.totalPrice), 0);
      const expectedRevenue = [...activeRentals, ...approvedRentals].reduce((sum, rental) => sum + Number(rental.totalPrice), 0);
      const totalEvents = events.length;
      res.json({
        totalRentals,
        totalRevenue,
        expectedRevenue,
        completedRentals: completedRentals.length,
        activeRentals: activeRentals.length,
        totalEvents
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle statistics" });
    }
  });
  app2.get("/api/rentals", async (_req, res) => {
    try {
      const rentals2 = await storage.getRentals();
      res.json(rentals2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rentals" });
    }
  });
  app2.get("/api/rentals/:id", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      res.json(rental);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rental" });
    }
  });
  app2.post("/api/rentals", async (req, res) => {
    try {
      console.log("Received rental data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertRentalSchema.parse(req.body);
      const totalPrice = req.body.totalPrice;
      const bonusDiscountUsed = req.body.bonusDiscountUsed || "0";
      const priceBeforeDiscount = req.body.priceBeforeDiscount || totalPrice;
      if (!totalPrice || totalPrice <= 0) {
        return res.status(400).json({ error: "Invalid total price" });
      }
      let customer = await storage.getCustomerByCpf(validatedData.customerCpf);
      if (!customer) {
        const customerStatus = validatedData.status === "approved" ? "active" : "lead";
        customer = await storage.createCustomer({
          name: validatedData.customerName,
          email: validatedData.customerEmail,
          phone: validatedData.customerPhone,
          cpf: validatedData.customerCpf,
          driverLicense: validatedData.driverLicense,
          emergencyContact: validatedData.emergencyContact,
          street: validatedData.street,
          complement: validatedData.complement,
          neighborhood: validatedData.neighborhood,
          city: validatedData.city,
          state: validatedData.state,
          zipCode: validatedData.zipCode,
          isNegativado: validatedData.isNegativado || false,
          status: customerStatus,
          driverType: "principal"
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: validatedData.customerName,
          email: validatedData.customerEmail,
          phone: validatedData.customerPhone,
          driverLicense: validatedData.driverLicense,
          emergencyContact: validatedData.emergencyContact,
          street: validatedData.street,
          complement: validatedData.complement,
          neighborhood: validatedData.neighborhood,
          city: validatedData.city,
          state: validatedData.state,
          zipCode: validatedData.zipCode
        });
        if (parseFloat(bonusDiscountUsed) > 0) {
          await storage.updateCustomer(customer.id, {
            bonusBalance: "0"
          });
        }
      }
      const rentalData = {
        ...validatedData,
        customerId: customer.id,
        totalPrice,
        bonusDiscountUsed,
        priceBeforeDiscount
      };
      const body = req.body;
      if (body.isMonthly && body.startMonth && body.endMonth) {
        rentalData.startDate = /* @__PURE__ */ new Date(body.startMonth + "-01");
        const endDateParts = body.endMonth.split("-");
        const endYear = parseInt(endDateParts[0]);
        const endMonth = parseInt(endDateParts[1]);
        rentalData.endDate = new Date(endYear, endMonth, 0);
      } else if (!rentalData.startDate) {
        rentalData.startDate = /* @__PURE__ */ new Date();
        rentalData.endDate = /* @__PURE__ */ new Date();
      }
      const rental = await storage.createRental(rentalData);
      if (validatedData.status === "approved") {
        await storage.updateCustomerStats(customer.id);
        const vehicle = await storage.getVehicle(validatedData.vehicleId || "");
        if (vehicle && vehicle.isInvestorVehicle && vehicle.ownerId) {
          const percentage = vehicle.investorPercentage || 70;
          const investorAmount = totalPrice * (percentage / 100);
          await storage.updateInvestorEarnings(vehicle.ownerId, investorAmount);
        }
      }
      res.status(201).json(rental);
    } catch (error) {
      console.error("Error creating rental:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid rental data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create rental" });
    }
  });
  app2.post("/api/rentals/complete", async (req, res) => {
    try {
      const { customerData, vehicleId, checkInPhotos, contractData, paymentData, startDate, endDate, selectedPlanIds } = req.body;
      if (!customerData || !vehicleId || !checkInPhotos || !contractData || !paymentData) {
        return res.status(400).json({ error: "Dados incompletos" });
      }
      let customer = await storage.getCustomerByCpf(customerData.cpf);
      if (!customer) {
        customer = await storage.createCustomer({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          cpf: customerData.cpf,
          driverLicense: customerData.driverLicense,
          emergencyContact: customerData.emergencyContact,
          street: customerData.street,
          complement: customerData.complement,
          neighborhood: customerData.neighborhood,
          city: customerData.city,
          state: customerData.state,
          zipCode: customerData.zipCode,
          status: "active",
          driverType: "principal"
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          driverLicense: customerData.driverLicense,
          emergencyContact: customerData.emergencyContact,
          street: customerData.street,
          complement: customerData.complement,
          neighborhood: customerData.neighborhood,
          city: customerData.city,
          state: customerData.state,
          zipCode: customerData.zipCode
        });
      }
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Ve\xEDculo n\xE3o encontrado" });
      }
      const totalPrice = paymentData.amount || vehicle.pricePerDay;
      const checkInImages = [];
      const photoKeys = [
        "frente",
        "fundo",
        "lateral_esquerda",
        "lateral_direita",
        "motor",
        "step_macaco_triangulo",
        "pneu_1",
        "pneu_2",
        "pneu_3",
        "pneu_4",
        "chassi",
        "odometro",
        "nivel_gasolina"
      ];
      photoKeys.forEach((key) => {
        if (checkInPhotos[key]) {
          checkInImages.push(checkInPhotos[key]);
        }
      });
      const rental = await storage.createRental({
        vehicleId,
        customerId: customer.id,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        customerCpf: customerData.cpf,
        startDate: new Date(startDate || /* @__PURE__ */ new Date()),
        endDate: new Date(endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)),
        // +30 dias default
        totalPrice,
        status: "approved",
        // Já aprovado pois passou por todo workflow
        hasCheckin: true,
        checkInImages,
        checkInNotes: checkInPhotos.notes || null,
        checkInDate: /* @__PURE__ */ new Date(),
        checkinCompletedAt: /* @__PURE__ */ new Date(),
        contractUrl: contractData.fileUrl,
        contractGeneratedAt: /* @__PURE__ */ new Date(),
        paymentMethod: paymentData.method,
        paymentProofUrl: paymentData.proofUrl,
        paymentVerifiedAt: /* @__PURE__ */ new Date(),
        selectedPlanIds: selectedPlanIds || null
      });
      await storage.updateCustomerStats(customer.id);
      if (vehicle.isInvestorVehicle && vehicle.ownerId) {
        const percentage = vehicle.investorPercentage || 70;
        const investorAmount = totalPrice * (percentage / 100);
        await storage.updateInvestorEarnings(vehicle.ownerId, investorAmount);
      }
      res.status(201).json(rental);
    } catch (error) {
      console.error("Erro ao criar rental completo:", error);
      res.status(500).json({ error: "Erro ao criar rental" });
    }
  });
  app2.patch("/api/rentals/:id/process", async (req, res) => {
    try {
      const rentalId = req.params.id;
      const { customerData, vehicleId, checkInPhotos, contractData, paymentData, startDate, endDate, selectedPlanIds } = req.body;
      const existingRental = await storage.getRental(rentalId);
      if (!existingRental) {
        return res.status(404).json({ error: "Solicita\xE7\xE3o n\xE3o encontrada" });
      }
      if (existingRental.status !== "pending") {
        return res.status(400).json({ error: "Apenas solicita\xE7\xF5es pendentes podem ser processadas" });
      }
      if (!customerData || !vehicleId || !checkInPhotos || !contractData || !paymentData) {
        return res.status(400).json({ error: "Dados incompletos" });
      }
      let customer = await storage.getCustomerByCpf(customerData.cpf);
      if (!customer) {
        customer = await storage.createCustomer({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          cpf: customerData.cpf,
          driverLicense: customerData.driverLicense,
          emergencyContact: customerData.emergencyContact,
          street: customerData.street,
          complement: customerData.complement,
          neighborhood: customerData.neighborhood,
          city: customerData.city,
          state: customerData.state,
          zipCode: customerData.zipCode,
          status: "active",
          driverType: "principal"
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          driverLicense: customerData.driverLicense,
          emergencyContact: customerData.emergencyContact,
          street: customerData.street,
          complement: customerData.complement,
          neighborhood: customerData.neighborhood,
          city: customerData.city,
          state: customerData.state,
          zipCode: customerData.zipCode
        });
      }
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Ve\xEDculo n\xE3o encontrado" });
      }
      const totalPrice = paymentData.amount || existingRental.totalPrice;
      const checkInImages = [];
      const photoKeys = [
        "frente",
        "fundo",
        "lateral_esquerda",
        "lateral_direita",
        "motor",
        "step_macaco_triangulo",
        "pneu_1",
        "pneu_2",
        "pneu_3",
        "pneu_4",
        "chassi",
        "odometro",
        "nivel_gasolina"
      ];
      photoKeys.forEach((key) => {
        if (checkInPhotos[key]) {
          checkInImages.push(checkInPhotos[key]);
        }
      });
      const updatedRental = await storage.updateRental(rentalId, {
        vehicleId,
        customerId: customer.id,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        customerCpf: customerData.cpf,
        startDate: new Date(startDate || existingRental.startDate),
        endDate: new Date(endDate || existingRental.endDate),
        totalPrice,
        status: "approved",
        // Aprovado após processar
        hasCheckin: true,
        checkInImages,
        checkInNotes: checkInPhotos.notes || null,
        checkInDate: /* @__PURE__ */ new Date(),
        checkinCompletedAt: /* @__PURE__ */ new Date(),
        contractUrl: contractData.fileUrl,
        contractGeneratedAt: /* @__PURE__ */ new Date(),
        paymentMethod: paymentData.method,
        paymentProofUrl: paymentData.proofUrl,
        paymentVerifiedAt: /* @__PURE__ */ new Date(),
        selectedPlanIds: selectedPlanIds || null
      });
      await storage.updateCustomerStats(customer.id);
      if (vehicle.isInvestorVehicle && vehicle.ownerId) {
        const percentage = vehicle.investorPercentage || 70;
        const investorAmount = totalPrice * (percentage / 100);
        await storage.updateInvestorEarnings(vehicle.ownerId, investorAmount);
      }
      res.json(updatedRental);
    } catch (error) {
      console.error("Erro ao processar solicita\xE7\xE3o:", error);
      res.status(500).json({ error: "Erro ao processar solicita\xE7\xE3o" });
    }
  });
  app2.patch("/api/rentals/:id", async (req, res) => {
    try {
      const { startDate, endDate, status, totalPrice } = req.body;
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      if (status) {
        if (status === "approved" && !rental.hasCheckin) {
          return res.status(400).json({
            error: "Cannot set status to 'approved' without check-in. Use /api/rentals/:id/checkin instead."
          });
        }
        if (status === "completed" && !rental.hasCheckin) {
          return res.status(400).json({
            error: "Cannot set status to 'completed' without check-in. Complete check-in first."
          });
        }
        if (status === "completed" && !rental.hasCheckout) {
          return res.status(400).json({
            error: "Cannot set status to 'completed' without check-out. Use /api/rentals/:id/checkout instead."
          });
        }
      }
      const updateData = {};
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (status) updateData.status = status;
      if (totalPrice) updateData.totalPrice = totalPrice;
      if (req.body.hasCheckout !== void 0) updateData.hasCheckout = req.body.hasCheckout;
      if (req.body.checkOutImages !== void 0) updateData.checkOutImages = req.body.checkOutImages;
      if (req.body.checkOutNotes !== void 0) updateData.checkOutNotes = req.body.checkOutNotes;
      if (req.body.checkoutCompletedAt !== void 0) updateData.checkoutCompletedAt = new Date(req.body.checkoutCompletedAt);
      if (req.body.checkpointTiresSame !== void 0) updateData.checkpointTiresSame = req.body.checkpointTiresSame;
      if (req.body.checkpointFuelSame !== void 0) updateData.checkpointFuelSame = req.body.checkpointFuelSame;
      if (req.body.checkpointHasDamages !== void 0) updateData.checkpointHasDamages = req.body.checkpointHasDamages;
      if (req.body.checkpointDamagesNotes !== void 0) updateData.checkpointDamagesNotes = req.body.checkpointDamagesNotes;
      if (req.body.checkpointRepairCost !== void 0) updateData.checkpointRepairCost = req.body.checkpointRepairCost;
      if (req.body.repairPaid !== void 0) updateData.repairPaid = req.body.repairPaid;
      if (req.body.finalizationDebtAmount !== void 0) updateData.finalizationDebtAmount = req.body.finalizationDebtAmount;
      if (req.body.finalizationPaymentMethod !== void 0) updateData.finalizationPaymentMethod = req.body.finalizationPaymentMethod;
      if (req.body.finalizedAt !== void 0) updateData.finalizedAt = new Date(req.body.finalizedAt);
      const updatedRental = await storage.updateRental(req.params.id, updateData);
      if (status && (status === "completed" || status === "cancelled" || status === "finalized")) {
        await storage.updateVehicle(rental.vehicleId || "", { available: true });
      }
      res.json(updatedRental);
    } catch (error) {
      console.error("Erro ao atualizar rental:", error);
      res.status(500).json({ error: "Failed to update rental" });
    }
  });
  app2.patch("/api/rentals/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      if (status === "approved" && !rental.hasCheckin) {
        return res.status(400).json({
          error: "Cannot set status to 'approved' without check-in. Use /api/rentals/:id/checkin instead."
        });
      }
      if (status === "completed") {
        if (!rental.hasCheckin) {
          return res.status(400).json({
            error: "Cannot set status to 'completed' without check-in. Complete check-in first."
          });
        }
        if (!rental.hasCheckout) {
          return res.status(400).json({
            error: "Cannot set status to 'completed' without check-out. Use /api/rentals/:id/checkout instead."
          });
        }
      }
      const updatedRental = await storage.updateRentalStatus(req.params.id, status);
      if (status === "completed" || status === "cancelled" || status === "finalized") {
        await storage.updateVehicle(rental.vehicleId || "", { available: true });
      }
      res.json(updatedRental);
    } catch (error) {
      res.status(500).json({ error: "Failed to update rental status" });
    }
  });
  app2.delete("/api/rentals/:id", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      await storage.updateVehicle(rental.vehicleId || "", { available: true });
      await storage.deleteRental(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rental" });
    }
  });
  app2.post("/api/rentals/:id/approve", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      if (rental.status !== "pending") {
        return res.status(400).json({ error: "Only pending rentals can be approved" });
      }
      if (!rental.hasCheckin) {
        return res.status(400).json({
          error: "Check-in is mandatory before approval. Please complete check-in first via /api/rentals/:id/checkin"
        });
      }
      let customer = await storage.getCustomerByCpf(rental.customerCpf);
      if (!customer) {
        customer = await storage.createCustomer({
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          cpf: rental.customerCpf,
          isNegativado: rental.isNegativado,
          status: "active",
          driverType: "principal"
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          isNegativado: rental.isNegativado
        });
      }
      const updatedRental = await storage.updateRental(req.params.id, {
        status: "approved",
        customerId: customer.id
      });
      await storage.updateCustomerStats(customer.id);
      await storage.updateVehicle(rental.vehicleId || "", { available: false });
      res.json({ rental: updatedRental, customer });
    } catch (error) {
      console.error("Failed to approve rental:", error);
      res.status(500).json({ error: "Failed to approve rental" });
    }
  });
  app2.post("/api/rentals/:id/checkin", async (req, res) => {
    try {
      const { images, notes } = req.body;
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      if (rental.status !== "pending" && rental.status !== "approved") {
        return res.status(400).json({ error: "Check-in can only be done for pending or approved rentals" });
      }
      if (!images || images.length === 0) {
        return res.status(400).json({ error: "At least one image is required for check-in" });
      }
      const imageUrls = images.map((img) => typeof img === "string" ? img : img.url);
      await storage.updateRental(req.params.id, {
        hasCheckin: true,
        checkInImages: imageUrls,
        checkInNotes: notes || null,
        checkInDate: /* @__PURE__ */ new Date()
      });
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageUrl = typeof image === "string" ? image : image.url;
        const imageType = typeof image === "string" ? i === 0 ? "front" : i === 1 ? "back" : i === 2 ? "right_side" : i === 3 ? "left_side" : "other" : image.type;
        await storage.createVehicleInspection({
          vehicleId: rental.vehicleId || "",
          rentalId: rental.id,
          type: "check-in",
          imageUrl,
          imageType,
          notes: i === 0 ? `Check-in - ${rental.customerName} - ${notes || ""}` : null,
          uploadedBy: "admin"
        });
      }
      let customer = await storage.getCustomerByCpf(rental.customerCpf);
      if (!customer) {
        customer = await storage.createCustomer({
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          cpf: rental.customerCpf,
          isNegativado: rental.isNegativado,
          status: "active",
          driverType: "principal"
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          isNegativado: rental.isNegativado
        });
      }
      const updatedRental = await storage.updateRental(req.params.id, {
        status: "approved",
        customerId: customer.id
      });
      await storage.updateCustomerStats(customer.id);
      await storage.updateVehicle(rental.vehicleId || "", { available: false });
      res.json({ rental: updatedRental, customer });
    } catch (error) {
      console.error("Failed to process check-in:", error);
      res.status(500).json({ error: "Failed to process check-in" });
    }
  });
  app2.post("/api/rentals/:id/checkout", async (req, res) => {
    try {
      const { images, notes } = req.body;
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      if (rental.status !== "approved") {
        return res.status(400).json({ error: "Check-out can only be done for approved rentals" });
      }
      if (!rental.hasCheckin) {
        return res.status(400).json({
          error: "Check-in must be completed before check-out. Cannot finalize a rental without check-in."
        });
      }
      if (!images || images.length === 0) {
        return res.status(400).json({ error: "At least one image is required for check-out" });
      }
      const imageUrls = images.map((img) => typeof img === "string" ? img : img.url);
      await storage.updateRental(req.params.id, {
        hasCheckout: true,
        checkOutImages: imageUrls,
        checkOutNotes: notes || null,
        checkOutDate: /* @__PURE__ */ new Date()
      });
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageUrl = typeof image === "string" ? image : image.url;
        const imageType = typeof image === "string" ? i === 0 ? "front" : i === 1 ? "back" : i === 2 ? "right_side" : i === 3 ? "left_side" : "other" : image.type;
        await storage.createVehicleInspection({
          vehicleId: rental.vehicleId || "",
          rentalId: rental.id,
          type: "check-out",
          imageUrl,
          imageType,
          notes: i === 0 ? `Check-out - ${rental.customerName} - ${notes || ""}` : null,
          uploadedBy: "admin"
        });
      }
      const updatedRental = await storage.updateRental(req.params.id, {
        status: "completed"
      });
      await storage.updateVehicle(rental.vehicleId || "", { available: true });
      res.json({ rental: updatedRental });
    } catch (error) {
      console.error("Failed to process check-out:", error);
      res.status(500).json({ error: "Failed to process check-out" });
    }
  });
  app2.get("/api/rentals/:id/inspection-items", async (req, res) => {
    try {
      const items = await storage.getRentalInspectionItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch inspection items:", error);
      res.status(500).json({ error: "Failed to fetch inspection items" });
    }
  });
  app2.post("/api/rentals/:id/inspection-items", async (req, res) => {
    try {
      const { photoType, imageUrl, hasDamage, damageDescription } = req.body;
      const validatedData = insertRentalInspectionItemSchema.parse({
        rentalId: req.params.id,
        photoType,
        imageUrl,
        hasDamage: hasDamage || false,
        damageDescription: damageDescription || null
      });
      const item = await storage.createRentalInspectionItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Failed to create inspection item:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create inspection item" });
    }
  });
  app2.post("/api/rentals/:id/checkin-complete", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      const items = await storage.getRentalInspectionItems(req.params.id);
      const requiredTypes = [
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
      const existingTypes = items.map((item) => item.photoType);
      const missingTypes = requiredTypes.filter((type) => !existingTypes.includes(type));
      if (missingTypes.length > 0) {
        return res.status(400).json({
          error: "Missing required inspection photos",
          missingTypes
        });
      }
      const updated = await storage.updateRental(req.params.id, {
        checkinCompletedAt: /* @__PURE__ */ new Date()
      });
      res.json(updated);
    } catch (error) {
      console.error("Failed to complete checkin:", error);
      res.status(500).json({ error: "Failed to complete checkin" });
    }
  });
  app2.post("/api/rentals/:id/contract-generate", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      if (!rental.checkinCompletedAt) {
        return res.status(400).json({
          error: "Checkin must be completed before generating contract"
        });
      }
      const updated = await storage.updateRental(req.params.id, {
        contractGeneratedAt: /* @__PURE__ */ new Date()
      });
      res.json(updated);
    } catch (error) {
      console.error("Failed to generate contract:", error);
      res.status(500).json({ error: "Failed to generate contract" });
    }
  });
  app2.post("/api/rentals/:id/payment-proof", async (req, res) => {
    try {
      const { proofUrl } = req.body;
      if (!proofUrl) {
        return res.status(400).json({ error: "Proof URL is required" });
      }
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      if (!rental.contractGeneratedAt) {
        return res.status(400).json({
          error: "Contract must be generated before submitting payment proof"
        });
      }
      const updated = await storage.updateRental(req.params.id, {
        paymentProofUrl: proofUrl,
        paymentVerifiedAt: /* @__PURE__ */ new Date()
      });
      res.json(updated);
    } catch (error) {
      console.error("Failed to upload payment proof:", error);
      res.status(500).json({ error: "Failed to upload payment proof" });
    }
  });
  app2.get("/api/rentals/:id/approval-status", async (req, res) => {
    try {
      const status = await storage.getRentalApprovalStatus(req.params.id);
      res.json(status);
    } catch (error) {
      console.error("Failed to get approval status:", error);
      res.status(500).json({ error: "Failed to get approval status" });
    }
  });
  app2.post("/api/rentals/:id/approve-final", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      const approvalStatus = await storage.getRentalApprovalStatus(req.params.id);
      if (!approvalStatus.canApprove) {
        return res.status(400).json({
          error: "Rental cannot be approved. Missing required steps.",
          missingItems: approvalStatus.missingItems
        });
      }
      let customer = await storage.getCustomerByCpf(rental.customerCpf);
      if (!customer) {
        customer = await storage.createCustomer({
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          cpf: rental.customerCpf,
          isNegativado: rental.isNegativado,
          status: "active",
          driverType: "principal"
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          isNegativado: rental.isNegativado
        });
      }
      const updatedRental = await storage.updateRental(req.params.id, {
        status: "approved",
        customerId: customer.id
      });
      await storage.updateCustomerStats(customer.id);
      await storage.updateVehicle(rental.vehicleId || "", { available: false });
      res.json({ rental: updatedRental, customer });
    } catch (error) {
      console.error("Failed to approve rental:", error);
      res.status(500).json({ error: "Failed to approve rental" });
    }
  });
  app2.get("/api/investors", async (_req, res) => {
    try {
      let investors = await storage.getInvestors();
      if (process.env.HIDE_INVESTORS === "true") {
        investors = investors.map((i) => ({
          ...i,
          name: "Investidor Oculto",
          cpf: "000.000.000-00",
          phone: "(00) 00000-0000",
          email: "oculto@projeto.car",
          totalSpent: "0.00",
          totalEarnings: "0.00",
          bankName: "Oculto",
          pixKey: "Oculto"
        }));
      }
      res.json(investors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investors" });
    }
  });
  app2.get("/api/investors/duplicates", async (_req, res) => {
    try {
      const duplicates = await storage.getDuplicateInvestors();
      res.json(duplicates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch duplicate investors" });
    }
  });
  app2.post("/api/investors/merge", async (req, res) => {
    try {
      const { keepInvestorId, removeInvestorIds } = req.body;
      if (!keepInvestorId || !Array.isArray(removeInvestorIds) || removeInvestorIds.length === 0) {
        return res.status(400).json({ error: "Invalid merge request. Provide keepInvestorId and removeInvestorIds array." });
      }
      const mergedInvestor = await storage.mergeInvestors(keepInvestorId, removeInvestorIds);
      if (!mergedInvestor) {
        return res.status(404).json({ error: "Investor to keep not found" });
      }
      res.json(mergedInvestor);
    } catch (error) {
      res.status(500).json({ error: "Failed to merge investors" });
    }
  });
  app2.get("/api/investors/:id", async (req, res) => {
    try {
      const investor = await storage.getInvestor(req.params.id);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.json(investor);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investor" });
    }
  });
  app2.post("/api/investors", async (req, res) => {
    try {
      console.log("POST /api/investors - birthDate received:", req.body.birthDate);
      console.log("POST /api/investors - All fields received:", Object.keys(req.body));
      let dataToValidate = { ...req.body };
      if (typeof req.body.bankData === "string") {
        try {
          const bankData = JSON.parse(req.body.bankData);
          dataToValidate = {
            ...dataToValidate,
            bankName: bankData.bankName,
            bankCode: bankData.bankCode,
            agency: bankData.agency,
            agencyDigit: bankData.agencyDigit || null,
            accountNumber: bankData.accountNumber,
            accountDigit: bankData.accountDigit,
            accountType: bankData.accountType,
            accountHolder: bankData.accountHolder,
            accountHolderDocument: bankData.accountHolderDocument,
            pixKeyType: bankData.pixKeyType || null,
            pixKey: bankData.pixKey || null
          };
          delete dataToValidate.bankData;
        } catch (e) {
          console.error("Failed to parse bankData JSON:", e);
        }
      }
      const validatedData = insertCustomerSchema.parse(dataToValidate);
      const investor = await storage.createInvestor(validatedData);
      res.status(201).json(investor);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid investor data", details: error.errors });
      }
      console.error("Error creating investor:", error);
      res.status(500).json({ error: "Failed to create investor", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/investors/:id", async (req, res) => {
    try {
      const validationResult = updateCustomerSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation error updating investor:", validationResult.error);
        return res.status(400).json({ error: "Invalid investor data", details: validationResult.error });
      }
      const investor = await storage.updateInvestor(req.params.id, validationResult.data);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.json(investor);
    } catch (error) {
      console.error("Error updating investor:", error);
      res.status(500).json({ error: "Failed to update investor", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.delete("/api/investors/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInvestor(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete investor" });
    }
  });
  app2.post("/api/investors/:id/cancel-investment", async (req, res) => {
    try {
      const investorId = req.params.id;
      const { adminPassword, vehicleIds } = req.body;
      if (!adminPassword) {
        return res.status(400).json({ error: "Admin password is required" });
      }
      const allAdminUsers = await storage.getAdminUsers();
      let isValidPassword = false;
      for (const adminUser of allAdminUsers) {
        if (adminUser.isActive) {
          const passwordMatch = await bcrypt.compare(adminPassword, adminUser.password);
          if (passwordMatch) {
            isValidPassword = true;
            break;
          }
        }
      }
      if (!isValidPassword) {
        return res.status(401).json({ error: "Senha de administrador inv\xE1lida" });
      }
      const investor = await storage.getInvestor(investorId);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      const investorVehicles = await storage.getInvestorVehicles(investorId);
      const investorVehicleIds = investorVehicles.filter((v) => v.isInvestorVehicle).map((v) => v.id);
      const vehiclesToDelete = vehicleIds && Array.isArray(vehicleIds) && vehicleIds.length > 0 ? vehicleIds.filter((id) => investorVehicleIds.includes(id)) : investorVehicleIds;
      const deletingAllVehicles = vehiclesToDelete.length === investorVehicleIds.length;
      for (const vehicleId of vehiclesToDelete) {
        await storage.deleteVehicle(vehicleId);
      }
      if (deletingAllVehicles) {
        const deleted = await storage.deleteInvestor(investorId);
        if (!deleted) {
          return res.status(500).json({ error: "Failed to delete investor" });
        }
        res.json({
          success: true,
          message: "Investment cancelled successfully",
          deletedVehicles: vehiclesToDelete.length,
          investorDeleted: true
        });
      } else {
        res.json({
          success: true,
          message: "Vehicles removed successfully",
          deletedVehicles: vehiclesToDelete.length,
          investorDeleted: false
        });
      }
    } catch (error) {
      console.error("Error cancelling investment:", error);
      res.status(500).json({ error: "Failed to cancel investment" });
    }
  });
  app2.post("/api/investor-with-vehicle", async (req, res) => {
    try {
      const { name, email, phone, cpf, rg, driverLicense, emergencyContact, street, complement, neighborhood, city, state, zipCode, paymentDate, vehicleName, category, brand, model, year, pricePerDay, transmission, fuel, seats, imageUrl, licensePlate, fipeValue, evaluationFrontImage, evaluationBackImage, evaluationRightSideImage, evaluationLeftSideImage, evaluationMotorImage, evaluationStepImage, evaluationTire1Image, evaluationTire2Image, evaluationTire3Image, evaluationTire4Image, evaluationChassiImage, evaluationOdometroImage, evaluationNivelGasolinaImage, isVehicleOwner, vehicleOwnerName } = req.body;
      let investor = await storage.getCustomerByCpf(cpf);
      if (!investor) {
        const investorData = insertCustomerSchema.parse({
          name,
          email,
          phone,
          cpf,
          rg,
          driverLicense,
          emergencyContact,
          street,
          complement,
          neighborhood,
          city,
          state,
          zipCode,
          paymentDate,
          status: "pending"
        });
        investor = await storage.createInvestor(investorData);
      } else {
        await storage.updateInvestor(investor.id, {
          name,
          email,
          phone,
          rg,
          driverLicense,
          emergencyContact,
          street,
          complement,
          neighborhood,
          city,
          state,
          zipCode,
          paymentDate
        });
      }
      const vehicleRequestData = insertVehicleRequestSchema.parse({
        ownerId: investor.id,
        name: vehicleName,
        category,
        brand,
        model,
        year,
        pricePerDay: pricePerDay || null,
        // Opcional - admin define após aprovação
        transmission,
        fuel,
        seats,
        imageUrl,
        licensePlate,
        fipeValue: fipeValue || null,
        evaluationFrontImage: evaluationFrontImage || null,
        evaluationBackImage: evaluationBackImage || null,
        evaluationRightSideImage: evaluationRightSideImage || null,
        evaluationLeftSideImage: evaluationLeftSideImage || null,
        evaluationMotorImage: evaluationMotorImage || null,
        evaluationStepImage: evaluationStepImage || null,
        evaluationTire1Image: evaluationTire1Image || null,
        evaluationTire2Image: evaluationTire2Image || null,
        evaluationTire3Image: evaluationTire3Image || null,
        evaluationTire4Image: evaluationTire4Image || null,
        evaluationChassiImage: evaluationChassiImage || null,
        evaluationOdometroImage: evaluationOdometroImage || null,
        evaluationNivelGasolinaImage: evaluationNivelGasolinaImage || null
      });
      await storage.createVehicleRequest(vehicleRequestData);
      res.status(201).json({ investor });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create investor with vehicle" });
    }
  });
  app2.post("/api/investors/:id/approve", async (req, res) => {
    try {
      const { dailyPrice } = req.body;
      const investor = await storage.approveInvestor(req.params.id, dailyPrice);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.status(201).json(investor);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve investor" });
    }
  });
  app2.post("/api/investors/:id/reject", async (req, res) => {
    try {
      const investor = await storage.rejectInvestor(req.params.id);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      res.status(200).json(investor);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject investor" });
    }
  });
  app2.get("/api/crm/dashboard", async (_req, res) => {
    try {
      const [
        leads2,
        rentals2,
        vehicles2,
        financings2,
        customers2,
        adminUsers2,
        templates,
        investmentQuotas2,
        investors,
        tradeInVehicles2,
        vehicleRequests2,
        plans
      ] = await Promise.all([
        storage.getLeads(),
        storage.getRentals(),
        storage.getVehicles(),
        storage.getFinancings(),
        storage.getCustomers(),
        storage.getAdminUsers(),
        storage.getContractTemplates(),
        storage.getInvestmentQuotas(),
        storage.getInvestors(),
        storage.getTradeInVehicles(),
        storage.getVehicleRequests(),
        storage.getRentalPlans()
      ]);
      res.json({
        leads: leads2,
        rentals: rentals2,
        vehicles: vehicles2,
        financings: financings2,
        customers: customers2,
        adminUsers: adminUsers2,
        templates,
        investmentQuotas: investmentQuotas2,
        investors,
        tradeInVehicles: tradeInVehicles2,
        vehicleRequests: vehicleRequests2,
        plans
      });
    } catch (e) {
      console.error("Dashboard DB fetch error:", e);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/api/leads", async (_req, res) => {
    try {
      const leads2 = await storage.getLeads();
      res.json(leads2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });
  app2.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });
  app2.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid lead data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create lead" });
    }
  });
  app2.patch("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.body);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });
  app2.delete("/api/leads/:id", async (req, res) => {
    try {
      const success = await storage.deleteLead(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json({ message: "Lead deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });
  app2.get("/api/interactions", async (_req, res) => {
    try {
      const interactions2 = await storage.getInteractions();
      res.json(interactions2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });
  app2.get("/api/interactions/:id", async (req, res) => {
    try {
      const interaction = await storage.getInteraction(req.params.id);
      if (!interaction) {
        return res.status(404).json({ error: "Interaction not found" });
      }
      res.json(interaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interaction" });
    }
  });
  app2.post("/api/interactions", async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(validatedData);
      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid interaction data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create interaction" });
    }
  });
  app2.get("/api/vehicle-requests", async (_req, res) => {
    try {
      let requests = await storage.getVehicleRequests();
      if (process.env.HIDE_INVESTORS === "true") {
        requests = requests.map((r) => ({
          ...r,
          investor: r.investor ? {
            ...r.investor,
            name: "Investidor Oculto",
            cpf: "000.000.000-00",
            email: "oculto@projeto.car"
          } : void 0
        }));
      }
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle requests" });
    }
  });
  app2.get("/api/vehicle-requests/:id", async (req, res) => {
    try {
      const request = await storage.getVehicleRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Vehicle request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle request" });
    }
  });
  app2.post("/api/vehicle-requests", async (req, res) => {
    try {
      const validatedData = insertVehicleRequestSchema.parse(req.body);
      const request = await storage.createVehicleRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid vehicle request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vehicle request" });
    }
  });
  app2.post("/api/vehicle-requests/:id/approve", async (req, res) => {
    try {
      const { pricePerDay, monthlyPrice, customDividend } = req.body;
      if (!pricePerDay) {
        return res.status(400).json({ error: "Valor da di\xE1ria \xE9 obrigat\xF3rio para aprovar ve\xEDculo" });
      }
      const requestDetails = await storage.getVehicleRequest(req.params.id);
      const vehicle = await storage.approveVehicleRequest(
        req.params.id,
        pricePerDay,
        monthlyPrice,
        customDividend
      );
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle request not found or already processed" });
      }
      const vehicleName = `${requestDetails?.brand || vehicle.brand} ${requestDetails?.model || vehicle.model} ${requestDetails?.year || vehicle.year}`;
      await storage.createAuditLog({
        action: "approve",
        entity: "vehicle_request",
        entityId: vehicle.id,
        entityName: vehicleName,
        userId: req.adminUser?.id || null,
        userName: req.adminUser?.name || "Admin",
        details: JSON.stringify({
          investidor: requestDetails?.investor?.name || "N/A",
          cpf_investidor: requestDetails?.investorCpf || "N/A",
          diaria: pricePerDay,
          mensal: monthlyPrice || "N/A",
          dividendo: customDividend || "N/A"
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("[APPROVE VEHICLE REQUEST ERROR]", error);
      res.status(500).json({ error: "Failed to approve vehicle request", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.post("/api/vehicle-requests/:id/reject", async (req, res) => {
    try {
      const { adminNotes } = req.body;
      const requestDetails = await storage.getVehicleRequest(req.params.id);
      const request = await storage.updateVehicleRequestStatus(req.params.id, "rejected", adminNotes);
      if (!request) {
        return res.status(404).json({ error: "Vehicle request not found" });
      }
      const vehicleName = `${requestDetails?.brand} ${requestDetails?.model} ${requestDetails?.year}`;
      await storage.createAuditLog({
        action: "reject",
        entity: "vehicle_request",
        entityId: req.params.id,
        entityName: vehicleName,
        userId: req.adminUser?.id || null,
        userName: req.adminUser?.name || "Admin",
        details: JSON.stringify({
          investidor: requestDetails?.investor?.name || "N/A",
          motivo: adminNotes || "N\xE3o especificado"
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject vehicle request" });
    }
  });
  app2.get("/api/customers", async (_req, res) => {
    try {
      const customers2 = await storage.getCustomers();
      const vehicles2 = await storage.getVehicles();
      let customersWithInvestorInfo = customers2.map((customer) => {
        const { password, ...sanitizedCustomer } = customer;
        return {
          ...sanitizedCustomer,
          hasInvestorVehicles: vehicles2.some((v) => v.ownerId === customer.id && v.isInvestorVehicle),
          hasPassword: !!password
        };
      });
      if (process.env.HIDE_INVESTORS === "true") {
        customersWithInvestorInfo = customersWithInvestorInfo.map((c) => {
          if (c.hasInvestorVehicles) {
            return {
              ...c,
              name: "Investidor Oculto",
              cpf: "000.000.000-00",
              phone: "(00) 00000-0000",
              email: "oculto@projeto.car"
            };
          }
          return c;
        });
      }
      res.json(customersWithInvestorInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });
  app2.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const { password, ...sanitizedCustomer } = customer;
      res.json(sanitizedCustomer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });
  app2.get("/api/customers/:id/rentals", async (req, res) => {
    try {
      const rentals2 = await storage.getCustomerRentals(req.params.id);
      res.json(rentals2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer rentals" });
    }
  });
  app2.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      await storage.createAuditLog({
        action: "create",
        entity: "customer",
        entityId: customer.id,
        entityName: customer.name,
        userId: req.adminUser?.id || null,
        userName: req.adminUser?.name || "Sistema",
        details: JSON.stringify({
          cpf: customer.cpf,
          email: customer.email,
          telefone: customer.phone || "N/A"
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });
      const { password, ...sanitizedCustomer } = customer;
      res.status(201).json(sanitizedCustomer);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid customer data", details: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });
  app2.patch("/api/customers/:id", async (req, res) => {
    try {
      const validationResult = insertCustomerSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid customer data", details: validationResult.error });
      }
      const updateData = validationResult.data;
      if (updateData.cpf) {
        const currentCustomer = await storage.getCustomer(req.params.id);
        if (!currentCustomer) {
          return res.status(404).json({ error: "Customer not found" });
        }
        if (updateData.cpf !== currentCustomer.cpf) {
          const existingCustomer = await storage.getCustomerByCpf(updateData.cpf);
          if (existingCustomer && existingCustomer.id !== req.params.id) {
            return res.status(400).json({
              error: "CPF j\xE1 cadastrado",
              details: "J\xE1 existe outro cliente cadastrado com este CPF"
            });
          }
        }
      }
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      const customer = await storage.updateCustomer(req.params.id, updateData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const { password, ...sanitizedCustomer } = customer;
      res.json(sanitizedCustomer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });
  app2.patch("/api/customers/:id/investor-contract", async (req, res) => {
    try {
      const { contractUrl, contractFileName } = req.body;
      if (!contractUrl || !contractFileName) {
        return res.status(400).json({ error: "contractUrl e contractFileName s\xE3o obrigat\xF3rios" });
      }
      const customer = await storage.updateCustomer(req.params.id, {
        investorContractUrl: contractUrl,
        investorContractFileName: contractFileName
      });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const { password, ...sanitizedCustomer } = customer;
      res.json(sanitizedCustomer);
    } catch (error) {
      console.error("Error uploading investor contract:", error);
      res.status(500).json({ error: "Failed to upload investor contract" });
    }
  });
  app2.delete("/api/customers/:id/investor-contract", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, {
        investorContractUrl: null,
        investorContractFileName: null
      });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const { password, ...sanitizedCustomer } = customer;
      res.json(sanitizedCustomer);
    } catch (error) {
      console.error("Error removing investor contract:", error);
      res.status(500).json({ error: "Failed to remove investor contract" });
    }
  });
  app2.delete("/api/customers/:id", async (req, res) => {
    try {
      const investorPayments2 = await storage.getInvestorPayments(req.params.id);
      if (investorPayments2.length > 0) {
        return res.status(400).json({
          error: "N\xE3o \xE9 poss\xEDvel deletar investidor com hist\xF3rico de pagamentos",
          details: `Este investidor possui ${investorPayments2.length} pagamento(s) registrado(s)`
        });
      }
      const allVehicleRequests = await storage.getVehicleRequests();
      const ownerRequests = allVehicleRequests.filter((r) => r.ownerId === req.params.id);
      const pendingRequests = ownerRequests.filter((r) => r.status === "pending");
      if (pendingRequests.length > 0) {
        return res.status(400).json({
          error: "N\xE3o \xE9 poss\xEDvel deletar cliente com solicita\xE7\xF5es pendentes",
          details: `Este cliente possui ${pendingRequests.length} solicita\xE7\xE3o(\xF5es) de ve\xEDculo pendente(s)`
        });
      }
      const deleted = await storage.deleteCustomer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });
  app2.get("/api/customers/:id/current-rental", async (req, res) => {
    try {
      const rental = await storage.getCurrentRental(req.params.id);
      res.json(rental || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current rental" });
    }
  });
  app2.get("/api/customers/:id/average-duration", async (req, res) => {
    try {
      const avgDays = await storage.getAverageRentalDuration(req.params.id);
      res.json({ averageDays: avgDays });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate average duration" });
    }
  });
  app2.get("/api/customer-events", async (req, res) => {
    try {
      const events = await storage.getAllCustomerEvents();
      res.json(events);
    } catch (error) {
      console.error("[customer-events] Error fetching all events:", error);
      res.status(500).json({ error: "Failed to fetch customer events" });
    }
  });
  app2.get("/api/operational-expenses", async (req, res) => {
    try {
      const expenses = await storage.getAllOperationalExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("[operational-expenses] Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch operational expenses" });
    }
  });
  app2.get("/api/customers/:customerId/events", async (req, res) => {
    try {
      const events = await storage.getCustomerEvents(req.params.customerId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer events" });
    }
  });
  app2.get("/api/customer-events/:id", async (req, res) => {
    try {
      const event = await storage.getCustomerEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  app2.post("/api/customer-events", async (req, res) => {
    try {
      const validatedData = insertCustomerEventSchema.parse(req.body);
      const event = await storage.createCustomerEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.error("[customer-events] Validation error:", error.errors);
        return res.status(400).json({ error: "Invalid event data", details: error.errors });
      }
      console.error("[customer-events] Error creating event:", error);
      res.status(500).json({ error: "Failed to create event", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/customer-events/:id", async (req, res) => {
    try {
      const validationResult = insertCustomerEventSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid event data", details: validationResult.error });
      }
      const event = await storage.updateCustomerEvent(req.params.id, validationResult.data);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });
  app2.delete("/api/customer-events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCustomerEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
  app2.get("/api/investors/:investorId/events", async (req, res) => {
    try {
      const events = await storage.getInvestorEvents(req.params.investorId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investor events" });
    }
  });
  app2.get("/api/investor-events/:id", async (req, res) => {
    try {
      const event = await storage.getInvestorEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  app2.post("/api/investor-events", async (req, res) => {
    try {
      const validatedData = insertInvestorEventSchema.parse(req.body);
      const event = await storage.createInvestorEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid event data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });
  app2.patch("/api/investor-events/:id", async (req, res) => {
    try {
      const validationResult = insertInvestorEventSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid event data", details: validationResult.error });
      }
      const event = await storage.updateInvestorEvent(req.params.id, validationResult.data);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });
  app2.delete("/api/investor-events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInvestorEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
  app2.get("/api/investors/:investorId/vehicles", async (req, res) => {
    try {
      const vehicles2 = await storage.getInvestorVehicles(req.params.investorId);
      res.json(vehicles2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investor vehicles" });
    }
  });
  app2.get("/api/contracts/:rentalId/pdf", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.rentalId);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      const customer = rental.customerId ? await storage.getCustomer(rental.customerId) : null;
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const vehicle = await storage.getVehicle(rental.vehicleId || "");
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 14.17,
          // 0.5cm in points
          bottom: 14.17,
          left: 28.35,
          // 1cm left/right
          right: 28.35
        }
      });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        const currentDate = format(/* @__PURE__ */ new Date(), "dd-MM-yyyy");
        const filename = `Contrato de locacao - ${currentDate}.pdf`;
        const encodedFilename = encodeURIComponent(`Contrato de loca\xE7\xE3o - ${currentDate}.pdf`);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
        res.send(pdfBuffer);
      });
      generateContractPdf(doc, customer, rental, vehicle);
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });
  app2.get("/api/contracts/:rentalId/docx", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.rentalId);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }
      const customer = rental.customerId ? await storage.getCustomer(rental.customerId) : null;
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const vehicle = await storage.getVehicle(rental.vehicleId || "");
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      const docxBuffer = await generateContractDocx(customer, rental, vehicle);
      const currentDate = format(/* @__PURE__ */ new Date(), "dd-MM-yyyy");
      const filename = `Contrato de locacao - ${currentDate}.docx`;
      const encodedFilename = encodeURIComponent(`Contrato de loca\xE7\xE3o - ${currentDate}.docx`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      res.send(docxBuffer);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      res.status(500).json({ error: "Failed to generate DOCX" });
    }
  });
  app2.get("/api/investor-contracts/:investorId/pdf", async (req, res) => {
    try {
      const investor = await storage.getInvestor(req.params.investorId);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      const vehicles2 = await storage.getInvestorVehicles(req.params.investorId);
      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 14.17,
          bottom: 14.17,
          left: 28.35,
          right: 28.35
        }
      });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        const currentDate = format(/* @__PURE__ */ new Date(), "dd-MM-yyyy");
        const filename = `Contrato de Parceria - ${currentDate}.pdf`;
        const encodedFilename = encodeURIComponent(`Contrato de Parceria - ${currentDate}.pdf`);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
        res.send(pdfBuffer);
      });
      generateInvestorContractPdf(doc, investor, vehicles2);
      doc.end();
    } catch (error) {
      console.error("Error generating investor PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });
  app2.get("/api/investor-contracts/:investorId/docx", async (req, res) => {
    try {
      const investor = await storage.getInvestor(req.params.investorId);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }
      const vehicles2 = await storage.getInvestorVehicles(req.params.investorId);
      const docxBuffer = await generateInvestorContractDocx(investor, vehicles2);
      const currentDate = format(/* @__PURE__ */ new Date(), "dd-MM-yyyy");
      const filename = `Contrato de Parceria - ${currentDate}.docx`;
      const encodedFilename = encodeURIComponent(`Contrato de Parceria - ${currentDate}.docx`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      res.send(docxBuffer);
    } catch (error) {
      console.error("Error generating investor DOCX:", error);
      res.status(500).json({ error: "Failed to generate DOCX" });
    }
  });
  app2.get("/api/investment-quotas", async (_req, res) => {
    try {
      const quotas = await storage.getInvestmentQuotas();
      res.json(quotas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investment quotas" });
    }
  });
  app2.get("/api/investment-quotas/:id", async (req, res) => {
    try {
      const quota = await storage.getInvestmentQuota(req.params.id);
      if (!quota) {
        return res.status(404).json({ error: "Investment quota not found" });
      }
      res.json(quota);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investment quota" });
    }
  });
  app2.post("/api/investment-quotas", async (req, res) => {
    try {
      const validatedData = insertInvestmentQuotaSchema.parse(req.body);
      const quota = await storage.createInvestmentQuota(validatedData);
      res.status(201).json(quota);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid quota data", details: error.errors });
      }
      console.error("[QUOTA ERROR]", error);
      res.status(500).json({ error: "Failed to create investment quota", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/investment-quotas/:id", async (req, res) => {
    try {
      const validationResult = insertInvestmentQuotaSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid quota data", details: validationResult.error });
      }
      const quota = await storage.updateInvestmentQuota(req.params.id, validationResult.data);
      if (!quota) {
        return res.status(404).json({ error: "Investment quota not found" });
      }
      res.json(quota);
    } catch (error) {
      res.status(500).json({ error: "Failed to update investment quota" });
    }
  });
  app2.delete("/api/investment-quotas/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInvestmentQuota(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Investment quota not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete investment quota" });
    }
  });
  app2.post("/api/admin/investments", async (req, res) => {
    try {
      const startTime = Date.now();
      const { customer, vehicle, vehicleInfo, inspectionPhotos, additionalDocs, bankData, contract, customDividend, vehicleBonus, investorDocuments, createInvestorAccount } = req.body;
      const inspectionPhotoSizes = {
        frente: inspectionPhotos?.frente?.length || 0,
        fundo: inspectionPhotos?.fundo?.length || 0,
        lateral_esquerda: inspectionPhotos?.lateral_esquerda?.length || 0,
        lateral_direita: inspectionPhotos?.lateral_direita?.length || 0
      };
      console.log(`[ADMIN INVESTMENT] Starting - Photo sizes: frente=${Math.round(inspectionPhotoSizes.frente / 1024)}KB, fundo=${Math.round(inspectionPhotoSizes.fundo / 1024)}KB, esq=${Math.round(inspectionPhotoSizes.lateral_esquerda / 1024)}KB, dir=${Math.round(inspectionPhotoSizes.lateral_direita / 1024)}KB`);
      const cleanCurrencyValue = (value) => {
        if (!value) return null;
        return value.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".").trim();
      };
      let customerId;
      const t1 = Date.now();
      const existingCustomer = await storage.getCustomerByCpf(customer.cpf);
      console.log(`[ADMIN INVESTMENT] getCustomerByCpf: ${Date.now() - t1}ms`);
      if (existingCustomer) {
        const t2 = Date.now();
        const updated = await storage.updateCustomer(existingCustomer.id, {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          rg: customer.rg,
          birthDate: customer.birthDate || null,
          driverLicense: customer.driverLicense,
          emergencyContact: customer.emergencyContact,
          street: customer.street,
          complement: customer.complement || null,
          neighborhood: customer.neighborhood,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zipCode,
          // Update bank data
          bankName: bankData.bankName,
          bankCode: bankData.bankCode,
          agency: bankData.agency,
          agencyDigit: bankData.agencyDigit || null,
          accountNumber: bankData.accountNumber,
          accountDigit: bankData.accountDigit,
          accountType: bankData.accountType,
          accountHolder: bankData.accountHolder,
          accountHolderDocument: bankData.accountHolderDocument,
          pixKeyType: bankData.pixKeyType || null,
          pixKey: bankData.pixKey || null,
          // Manter paymentDate existente - não sobrescrever
          paymentDate: existingCustomer.paymentDate || bankData.paymentDay,
          // Bônus único: data específica e valor
          bonusDate: bankData.bonusDate || existingCustomer.bonusDate || null,
          bonusValue: cleanCurrencyValue(bankData.bonusValue) || existingCustomer.bonusValue || null,
          monthlyDividend: cleanCurrencyValue(customDividend),
          // Update investor documents (frontend field names: comprovanteResidencia, cnh)
          proofOfResidenceUrl: investorDocuments?.comprovanteResidencia || existingCustomer.proofOfResidenceUrl || null,
          cnhImageUrl: investorDocuments?.cnh || existingCustomer.cnhImageUrl || null,
          rgImageUrl: investorDocuments?.rg || existingCustomer.rgImageUrl || null,
          // Investor contract from wizard
          investorContractUrl: contract?.fileUrl || existingCustomer.investorContractUrl || null,
          investorContractFileName: contract?.fileName || existingCustomer.investorContractFileName || null
        });
        console.log(`[ADMIN INVESTMENT] updateCustomer: ${Date.now() - t2}ms`);
        customerId = existingCustomer.id;
      } else {
        const t2 = Date.now();
        const newCustomer = await storage.createInvestor({
          name: customer.name,
          cpf: customer.cpf,
          email: customer.email,
          phone: customer.phone,
          rg: customer.rg || null,
          birthDate: customer.birthDate || null,
          driverLicense: customer.driverLicense,
          emergencyContact: customer.emergencyContact,
          street: customer.street,
          complement: customer.complement || null,
          neighborhood: customer.neighborhood,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zipCode,
          status: "active",
          // Bank data
          bankName: bankData.bankName,
          bankCode: bankData.bankCode,
          agency: bankData.agency,
          agencyDigit: bankData.agencyDigit || null,
          accountNumber: bankData.accountNumber,
          accountDigit: bankData.accountDigit,
          accountType: bankData.accountType,
          accountHolder: bankData.accountHolder,
          accountHolderDocument: bankData.accountHolderDocument,
          pixKeyType: bankData.pixKeyType || null,
          pixKey: bankData.pixKey || null,
          paymentDate: bankData.paymentDay,
          // Bônus único: data específica e valor
          bonusDate: bankData.bonusDate || null,
          bonusValue: cleanCurrencyValue(bankData.bonusValue) || null,
          monthlyDividend: cleanCurrencyValue(customDividend),
          // Investor documents (frontend field names: comprovanteResidencia, cnh)
          proofOfResidenceUrl: investorDocuments?.comprovanteResidencia || null,
          cnhImageUrl: investorDocuments?.cnh || null,
          rgImageUrl: investorDocuments?.rg || null,
          // Investor contract from wizard
          investorContractUrl: contract?.fileUrl || null,
          investorContractFileName: contract?.fileName || null
        });
        console.log(`[ADMIN INVESTMENT] createInvestor: ${Date.now() - t2}ms`);
        customerId = newCustomer.id;
      }
      const t3 = Date.now();
      const createdVehicle = await storage.createVehicle({
        name: `${vehicle.brand} ${vehicle.model}`,
        category: vehicle.category,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        pricePerDay: "0",
        // Admin can set later
        monthlyPrice: null,
        transmission: vehicle.transmission,
        fuel: vehicle.fuel,
        seats: vehicle.seats,
        imageUrl: inspectionPhotos.frente || "",
        // Use front photo as main image
        available: true,
        availableForFinancing: true,
        // Automatically available for financing
        isInvestorVehicle: true,
        ownerId: customerId,
        licensePlate: vehicle.plate,
        chassi: vehicle.chassi || null,
        fipeValue: cleanCurrencyValue(vehicle.fipeValue),
        customDividend: cleanCurrencyValue(customDividend),
        // Informações do veículo do wizard
        hasInsurance: vehicleInfo?.temSeguro || false,
        insuranceValue: cleanCurrencyValue(vehicleInfo?.valorSeguro),
        ipvaStatus: vehicleInfo?.ipvaPago || null,
        ipvaValue: cleanCurrencyValue(vehicleInfo?.valorIpva),
        temDocumento: vehicleInfo?.temDocumento || null,
        observacoesDocumento: vehicleInfo?.observacoesDocumento || null,
        licenciamentoPago: vehicleInfo?.licenciamentoPago || null,
        observacoesLicenciamento: vehicleInfo?.observacoesLicenciamento || null,
        taFinanciado: vehicleInfo?.taFinanciado || null,
        observacoesFinanciado: vehicleInfo?.observacoesFinanciado || null,
        eDeLeilao: vehicleInfo?.eDeLeilao || null,
        observacoesLeilao: vehicleInfo?.observacoesLeilao || null,
        temRastreador: vehicleInfo?.temRastreador || null,
        localizacaoRastreador: vehicleInfo?.localizacaoRastreador || null,
        problemaMecanico: vehicleInfo?.problemaMecanico || null,
        // Vehicle documents from additionalDocs
        crlvDocumentUrl: additionalDocs?.crlv || null,
        laudoCautelarUrl: additionalDocs?.laudoCautelar || null,
        laudoMecanicoUrl: additionalDocs?.laudoMecanico || null,
        otherDocumentsUrls: additionalDocs?.outros ? [JSON.stringify({ label: "Outros", fileUrl: additionalDocs.outros })] : null,
        // Investment contract per vehicle
        investmentContractUrl: contract?.fileUrl || null,
        investmentContractFileName: contract?.fileName || null,
        // Vehicle bonus (per vehicle bonus for adding to fleet)
        bonusDate: vehicleBonus?.bonusDate || null,
        bonusValue: cleanCurrencyValue(vehicleBonus?.bonusValue),
        // Damage information
        hasDamage: inspectionPhotos?.hasDamages || false,
        damageDescription: inspectionPhotos?.damageNotes || null
      });
      console.log(`[ADMIN INVESTMENT] createVehicle: ${Date.now() - t3}ms`);
      const t4 = Date.now();
      const inspectionsToCreate = [];
      if (inspectionPhotos.frente) {
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: inspectionPhotos.frente,
          imageType: "front",
          notes: "Foto frontal - avalia\xE7\xE3o inicial do investidor",
          uploadedBy: null
        });
      }
      if (inspectionPhotos.fundo) {
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: inspectionPhotos.fundo,
          imageType: "back",
          notes: "Foto traseira - avalia\xE7\xE3o inicial do investidor",
          uploadedBy: null
        });
      }
      if (inspectionPhotos.lateral_esquerda) {
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: inspectionPhotos.lateral_esquerda,
          imageType: "left_side",
          notes: "Lateral esquerda - avalia\xE7\xE3o inicial do investidor",
          uploadedBy: null
        });
      }
      if (inspectionPhotos.lateral_direita) {
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: inspectionPhotos.lateral_direita,
          imageType: "right_side",
          notes: "Lateral direita - avalia\xE7\xE3o inicial do investidor",
          uploadedBy: null
        });
      }
      if (inspectionPhotos.notes) {
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: "",
          imageType: "notes",
          notes: `Avarias: ${inspectionPhotos.notes}`,
          uploadedBy: null
        });
      }
      if (inspectionPhotos.damagePhotos && Array.isArray(inspectionPhotos.damagePhotos)) {
        for (let i = 0; i < inspectionPhotos.damagePhotos.length; i++) {
          const damagePhoto = inspectionPhotos.damagePhotos[i];
          if (damagePhoto) {
            inspectionsToCreate.push({
              vehicleId: createdVehicle.id,
              type: "damage",
              imageUrl: damagePhoto,
              imageType: "damage_detail",
              notes: inspectionPhotos.damageNotes || `Foto de avaria ${i + 1}`,
              uploadedBy: null
            });
          }
        }
      }
      if (inspectionsToCreate.length > 0) {
        await storage.createBulkVehicleInspections(inspectionsToCreate);
      }
      console.log(`[ADMIN INVESTMENT] createBulkInspections (${inspectionsToCreate.length} photos): ${Date.now() - t4}ms`);
      const t5 = Date.now();
      let adminUserId = null;
      if (createInvestorAccount && customer.cpf) {
        const cleanCpf = customer.cpf.replace(/\D/g, "");
        const existingAdminUserByCpf = await storage.getAdminUserByCpf(cleanCpf);
        if (existingAdminUserByCpf) {
          adminUserId = existingAdminUserByCpf.id;
          console.log(`[ADMIN INVESTMENT] Investor account already exists for CPF: ${cleanCpf}`);
        } else {
          let userEmail = customer.email || `investidor${cleanCpf}@imobilicar.com.br`;
          const existingAdminUserByEmail = await storage.getAdminUserByEmail(userEmail);
          if (existingAdminUserByEmail) {
            const existingCpfClean = existingAdminUserByEmail.cpf?.replace(/\D/g, "") || "";
            if (existingCpfClean === cleanCpf) {
              adminUserId = existingAdminUserByEmail.id;
              console.log(`[ADMIN INVESTMENT] Investor account already exists for email: ${userEmail} (same CPF), using existing account`);
            } else {
              userEmail = `investidor${cleanCpf}@imobilicar.com.br`;
              console.log(`[ADMIN INVESTMENT] Email ${customer.email} already in use by different CPF, using generated email: ${userEmail}`);
              const existingGeneratedEmail = await storage.getAdminUserByEmail(userEmail);
              if (existingGeneratedEmail) {
                adminUserId = existingGeneratedEmail.id;
                console.log(`[ADMIN INVESTMENT] Generated email also exists, using existing account`);
              } else {
                const defaultPassword = "Investicar@2025";
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                const newAdminUser = await storage.createAdminUser({
                  name: customer.name,
                  email: userEmail,
                  password: hashedPassword,
                  cpf: cleanCpf,
                  role: "INVESTIDOR",
                  isActive: true
                });
                adminUserId = newAdminUser.id;
                console.log(`[ADMIN INVESTMENT] Created investor account with generated email for CPF: ${cleanCpf}`);
              }
            }
          } else {
            const defaultPassword = "Investicar@2025";
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            const newAdminUser = await storage.createAdminUser({
              name: customer.name,
              email: userEmail,
              password: hashedPassword,
              cpf: cleanCpf,
              role: "INVESTIDOR",
              isActive: true
            });
            adminUserId = newAdminUser.id;
            console.log(`[ADMIN INVESTMENT] Created investor account for CPF: ${cleanCpf}`);
          }
        }
      }
      console.log(`[ADMIN INVESTMENT] adminAccountChecks: ${Date.now() - t5}ms`);
      console.log(`[ADMIN INVESTMENT] TOTAL TIME: ${Date.now() - startTime}ms`);
      res.status(201).json({
        success: true,
        vehicleId: createdVehicle.id,
        customerId,
        adminUserId
      });
    } catch (error) {
      console.error("[ADMIN INVESTMENT ERROR]", error);
      res.status(500).json({ error: "Failed to create investment", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.get("/api/admin/dividends/summary", async (req, res) => {
    try {
      const allPayments = await storage.getAllInvestorPayments();
      const allCustomers = await storage.getCustomers();
      const allVehicles = await storage.getVehicles();
      const customerMap = new Map(allCustomers.map((c) => [c.id, c]));
      const vehicleMap = new Map(allVehicles.map((v) => [v.id, v]));
      const now = /* @__PURE__ */ new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const investorVehicles = allVehicles.filter((v) => v.isInvestorVehicle);
      const monthlyDividendTotal = investorVehicles.reduce((sum, v) => {
        return sum + Number(v.customDividend || 0);
      }, 0);
      const investorBreakdownMap = /* @__PURE__ */ new Map();
      for (const vehicle of investorVehicles) {
        if (!vehicle.ownerId) continue;
        const investor = customerMap.get(vehicle.ownerId);
        if (!investor) continue;
        const existing = investorBreakdownMap.get(vehicle.ownerId);
        const vehicleInfo = {
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          licensePlate: vehicle.licensePlate || "",
          dividend: Number(vehicle.customDividend || 0)
        };
        if (existing) {
          existing.vehicles.push(vehicleInfo);
          existing.totalDividend += vehicleInfo.dividend;
        } else {
          investorBreakdownMap.set(vehicle.ownerId, {
            investorId: vehicle.ownerId,
            investorName: investor.name,
            vehicles: [vehicleInfo],
            totalDividend: vehicleInfo.dividend
          });
        }
      }
      const cumulativeBreakdownMap = /* @__PURE__ */ new Map();
      const investorIds = [...new Set(investorVehicles.map((v) => v.ownerId).filter(Boolean))];
      const today = /* @__PURE__ */ new Date();
      today.setHours(23, 59, 59, 999);
      for (const investorId of investorIds) {
        if (!investorId) continue;
        const investor = customerMap.get(investorId);
        if (!investor || !investor.createdAt) continue;
        const investorVehiclesList = investorVehicles.filter((v) => v.ownerId === investorId);
        const vehiclesByPaymentDay = /* @__PURE__ */ new Map();
        for (const vehicle of investorVehiclesList) {
          const paymentDayStr = vehicle.paymentDate || investor.paymentDate;
          if (!paymentDayStr) continue;
          const paymentDay = parseInt(paymentDayStr, 10);
          if (isNaN(paymentDay) || paymentDay < 1 || paymentDay > 31) continue;
          const existing = vehiclesByPaymentDay.get(paymentDay) || [];
          existing.push(vehicle);
          vehiclesByPaymentDay.set(paymentDay, existing);
        }
        if (vehiclesByPaymentDay.size === 0) continue;
        const paymentsByDate = [];
        let investorTotalPaid = 0;
        let investorTotalPaymentsCount = 0;
        let investorMonthlyDividend = 0;
        const allDetails = [];
        for (const [paymentDay, vehiclesOnDay] of vehiclesByPaymentDay) {
          const vehicleInfos = vehiclesOnDay.map((v) => ({
            vehicleId: v.id,
            vehicleName: v.name,
            licensePlate: v.licensePlate || "",
            dividend: Number(v.customDividend || 0)
          }));
          const totalForDate = vehicleInfos.reduce((sum, v) => sum + v.dividend, 0);
          if (totalForDate === 0) continue;
          investorMonthlyDividend += totalForDate;
          const createdDate = new Date(investor.createdAt);
          let currentDate = new Date(createdDate);
          currentDate.setHours(0, 0, 0, 0);
          if (currentDate.getDate() <= paymentDay) {
            currentDate.setDate(paymentDay);
          } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
            currentDate.setDate(paymentDay);
          }
          let paymentsCount = 0;
          const paymentDates = [];
          while (currentDate <= today) {
            paymentsCount++;
            const dateStr = `${String(paymentDay).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(2, "0")}/${currentDate.getFullYear()}`;
            paymentDates.push(dateStr);
            allDetails.push(dateStr);
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          const totalPaidForDate = paymentsCount * totalForDate;
          investorTotalPaid += totalPaidForDate;
          investorTotalPaymentsCount += paymentsCount;
          if (totalPaidForDate > 0) {
            paymentsByDate.push({
              paymentDay,
              vehicles: vehicleInfos,
              totalForDate,
              paymentDates,
              paymentsCount
            });
          }
        }
        paymentsByDate.sort((a, b) => b.paymentDay - a.paymentDay);
        if (investorTotalPaid > 0) {
          cumulativeBreakdownMap.set(investorId, {
            investorId,
            investorName: investor.name,
            paymentsCount: investorTotalPaymentsCount,
            monthlyDividend: investorMonthlyDividend,
            totalPaid: investorTotalPaid,
            details: allDetails,
            paymentsByDate
          });
        }
      }
      const cumulativeTotal = Array.from(cumulativeBreakdownMap.values()).reduce((sum, inv) => sum + inv.totalPaid, 0);
      const sortedCumulativeBreakdown = Array.from(cumulativeBreakdownMap.values()).sort((a, b) => {
        const aLastDay = a.paymentsByDate.length > 0 ? a.paymentsByDate[a.paymentsByDate.length - 1].paymentDay : 0;
        const bLastDay = b.paymentsByDate.length > 0 ? b.paymentsByDate[b.paymentsByDate.length - 1].paymentDay : 0;
        return bLastDay - aLastDay;
      });
      res.json({
        currentPeriod: {
          month: currentMonth,
          year: currentYear,
          total: monthlyDividendTotal,
          breakdown: Array.from(investorBreakdownMap.values()).sort((a, b) => b.totalDividend - a.totalDividend)
        },
        cumulative: {
          total: cumulativeTotal,
          breakdown: sortedCumulativeBreakdown
        }
      });
    } catch (error) {
      console.error("[DIVIDEND SUMMARY ERROR]", error);
      res.status(500).json({ error: "Failed to fetch dividend summary" });
    }
  });
  app2.get("/api/investors/:investorId/payments", async (req, res) => {
    try {
      const payments = await storage.getInvestorPayments(req.params.investorId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investor payments" });
    }
  });
  app2.get("/api/investor-payments/:id", async (req, res) => {
    try {
      const payment = await storage.getInvestorPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  });
  app2.post("/api/investor-payments", async (req, res) => {
    try {
      const validatedData = insertInvestorPaymentSchema.parse(req.body);
      const payment = await storage.createInvestorPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid payment data", details: error.errors });
      }
      console.error("[PAYMENT ERROR]", error);
      res.status(500).json({ error: "Failed to create payment", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/investor-payments/:id", async (req, res) => {
    try {
      const validationResult = insertInvestorPaymentSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid payment data", details: validationResult.error });
      }
      const payment = await storage.updateInvestorPayment(req.params.id, validationResult.data);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment" });
    }
  });
  app2.delete("/api/investor-payments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInvestorPayment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });
  app2.get("/api/trade-in-vehicles", async (_req, res) => {
    try {
      const tradeInVehicles2 = await storage.getTradeInVehicles();
      res.json(tradeInVehicles2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade-in vehicles" });
    }
  });
  app2.get("/api/trade-in-vehicles/:id", async (req, res) => {
    try {
      const tradeInVehicle = await storage.getTradeInVehicle(req.params.id);
      if (!tradeInVehicle) {
        return res.status(404).json({ error: "Trade-in vehicle not found" });
      }
      res.json(tradeInVehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade-in vehicle" });
    }
  });
  app2.get("/api/financings", async (_req, res) => {
    try {
      const financings2 = await storage.getFinancings();
      res.json(financings2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch financings" });
    }
  });
  app2.get("/api/financings/:id", async (req, res) => {
    try {
      const financing = await storage.getFinancing(req.params.id);
      if (!financing) {
        return res.status(404).json({ error: "Financing not found" });
      }
      res.json(financing);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch financing" });
    }
  });
  app2.post("/api/financings", async (req, res) => {
    try {
      const tradeInStatus = req.body.tradeInAcceptanceStatus;
      const tradeInData = req.body.tradeInVehicle;
      const vehicleChecklist = req.body.vehicleChecklist;
      const inspectionPdfData = req.body.inspectionPdfData;
      const { tradeInVehicle, tradeInAcceptanceStatus, vehicleChecklist: _checklist, inspectionPdfData: _pdfData, ...financingData } = req.body;
      const validatedData = insertFinancingSchema.parse(financingData);
      if (tradeInStatus && !["accepted", "rejected", "pending"].includes(tradeInStatus)) {
        return res.status(400).json({
          error: "Invalid trade-in acceptance status",
          details: "Status must be 'accepted', 'rejected', or 'pending'"
        });
      }
      if (tradeInStatus === "accepted" && !tradeInData) {
        return res.status(400).json({
          error: "Inconsistent trade-in data",
          details: "Trade-in marked as accepted but vehicle data is missing"
        });
      }
      if (tradeInData && !tradeInStatus) {
        return res.status(400).json({
          error: "Missing trade-in acceptance status",
          details: "Trade-in vehicle data provided but acceptance status is missing"
        });
      }
      if (tradeInData && tradeInStatus && tradeInStatus !== "accepted") {
        return res.status(400).json({
          error: "Inconsistent trade-in data",
          details: `Trade-in vehicle data provided but status is "${tradeInStatus}". Vehicle data is only allowed when status is "accepted"`
        });
      }
      if (tradeInStatus === "accepted" && tradeInData) {
        if (!tradeInData.brand || !tradeInData.model || !tradeInData.year || !tradeInData.acceptedValue) {
          return res.status(400).json({
            error: "Trade-in vehicle missing required fields",
            details: "brand, model, year, and acceptedValue are required for accepted trade-in vehicles"
          });
        }
      }
      let customerId = validatedData.customerId;
      if (validatedData.customerCpf) {
        const existingCustomer = await storage.getCustomerByCpf(validatedData.customerCpf);
        if (existingCustomer) {
          await storage.updateCustomer(existingCustomer.id, {
            name: validatedData.customerName,
            email: validatedData.customerEmail,
            phone: validatedData.customerPhone,
            rg: validatedData.customerRg || existingCustomer.rg,
            driverLicense: validatedData.customerDriverLicense || existingCustomer.driverLicense,
            emergencyContact: validatedData.customerEmergencyContact || existingCustomer.emergencyContact,
            street: validatedData.customerStreet || existingCustomer.street,
            complement: validatedData.customerComplement || existingCustomer.complement,
            neighborhood: validatedData.customerNeighborhood || existingCustomer.neighborhood,
            city: validatedData.customerCity || existingCustomer.city,
            state: validatedData.customerState || existingCustomer.state,
            zipCode: validatedData.customerZipCode || existingCustomer.zipCode,
            // Manter paymentDate e bônus do investidor existente
            paymentDate: existingCustomer.paymentDate,
            bonusDate: existingCustomer.bonusDate,
            bonusValue: existingCustomer.bonusValue,
            firstContactDate: validatedData.customerFirstContactDate ? new Date(validatedData.customerFirstContactDate) : existingCustomer.firstContactDate,
            closingDate: validatedData.customerClosingDate ? new Date(validatedData.customerClosingDate) : existingCustomer.closingDate
          });
          customerId = existingCustomer.id;
        } else {
          const newCustomer = await storage.createCustomer({
            name: validatedData.customerName,
            email: validatedData.customerEmail,
            phone: validatedData.customerPhone,
            cpf: validatedData.customerCpf,
            rg: validatedData.customerRg,
            driverLicense: validatedData.customerDriverLicense,
            emergencyContact: validatedData.customerEmergencyContact,
            street: validatedData.customerStreet,
            complement: validatedData.customerComplement,
            neighborhood: validatedData.customerNeighborhood,
            city: validatedData.customerCity,
            state: validatedData.customerState,
            zipCode: validatedData.customerZipCode,
            paymentDate: validatedData.customerPaymentDate?.toString(),
            // Bônus único - não definido no fluxo de financiamento
            bonusDate: null,
            bonusValue: null,
            firstContactDate: validatedData.customerFirstContactDate ? new Date(validatedData.customerFirstContactDate) : void 0,
            closingDate: validatedData.customerClosingDate ? new Date(validatedData.customerClosingDate) : void 0,
            status: "active"
          });
          customerId = newCustomer.id;
        }
      }
      const vehicleBeforeUpdate = await storage.getVehicle(validatedData.vehicleId);
      await storage.updateVehicle(validatedData.vehicleId, {
        isFinanced: true,
        available: false,
        availableForFinancing: false,
        ownerId: vehicleBeforeUpdate?.isInvestorVehicle && vehicleBeforeUpdate?.ownerId ? vehicleBeforeUpdate.ownerId : customerId
      });
      const financing = await storage.createFinancing({
        ...validatedData,
        customerId,
        // Adicionar checklist de vistoria e PDF se fornecidos
        inspectionChecklist: vehicleChecklist ? JSON.stringify(vehicleChecklist) : null,
        inspectionPdfUrl: inspectionPdfData?.fileUrl || null,
        inspectionPdfFileName: inspectionPdfData?.fileName || null
      });
      console.log("[TRADE-IN DEBUG] Status:", tradeInStatus, "| Has Data:", !!tradeInData);
      if (tradeInData) {
        console.log("[TRADE-IN DEBUG] Data:", JSON.stringify(tradeInData, null, 2));
      }
      if (tradeInStatus === "accepted" && tradeInData) {
        console.log("[TRADE-IN] Criando ve\xEDculo de troca para financiamento:", financing.id);
        await storage.createTradeInVehicle({
          financingId: financing.id,
          customerId,
          plate: tradeInData.plate || "N/A",
          brand: tradeInData.brand,
          model: tradeInData.model,
          year: tradeInData.year,
          category: tradeInData.category || null,
          fipeValue: tradeInData.fipeValue || null,
          acceptedValue: tradeInData.acceptedValue,
          cautelarUrl: tradeInData.cautelarUrl || null,
          crlvUrl: tradeInData.crlvUrl || null,
          laudoMecanicoUrl: tradeInData.laudoMecanicoUrl || null,
          photosUrls: tradeInData.photosUrls || [],
          status: "accepted"
        });
        console.log("[TRADE-IN] Ve\xEDculo de troca criado com sucesso!");
      } else {
        console.log("[TRADE-IN] N\xE3o criou ve\xEDculo de troca - Status:", tradeInStatus, "| Tem dados:", !!tradeInData);
      }
      const financedVehicle = await storage.getVehicle(validatedData.vehicleId);
      await storage.createAuditLog({
        action: "create",
        entity: "financing",
        entityId: financing.id,
        entityName: `${financing.customerName} - ${financedVehicle?.name || "Ve\xEDculo"}`,
        userId: req.adminUser?.id || req.sellerUser?.id || null,
        userName: req.adminUser?.name || req.sellerUser?.name || "Sistema",
        details: JSON.stringify({
          cliente: financing.customerName,
          cpf: financing.customerCpf,
          veiculo: financedVehicle?.name || "N/A",
          valor: `R$ ${Number(financing.vehicleValue).toLocaleString("pt-BR")}`,
          parcelas: financing.installments
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });
      res.status(201).json(financing);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid financing data", details: error.errors });
      }
      console.error("[FINANCING ERROR]", error);
      res.status(500).json({ error: "Failed to create financing", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.patch("/api/financings/:id", async (req, res) => {
    try {
      const validationResult = updateFinancingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid financing data", details: validationResult.error });
      }
      const existingFinancing = await storage.getFinancing(req.params.id);
      const financing = await storage.updateFinancing(req.params.id, validationResult.data);
      if (!financing) {
        return res.status(404).json({ error: "Financing not found" });
      }
      if (validationResult.data.approvalStatus === "approved" && financing.vehicleId) {
        await storage.updateVehicle(financing.vehicleId, {
          isFinanced: true,
          available: false
          // Marcar como indisponível também
        });
        await storage.createAuditLog({
          action: "approve",
          entity: "financing",
          entityId: financing.id,
          entityName: `${financing.customerName}`,
          userId: req.adminUser?.id || null,
          userName: req.adminUser?.name || "Admin",
          details: JSON.stringify({
            cliente: financing.customerName,
            cpf: financing.customerCpf,
            valor: `R$ ${Number(financing.vehicleValue).toLocaleString("pt-BR")}`
          }),
          ipAddress: req.ip || req.socket?.remoteAddress || null
        });
      } else if (validationResult.data.approvalStatus === "rejected") {
        await storage.createAuditLog({
          action: "reject",
          entity: "financing",
          entityId: financing.id,
          entityName: `${financing.customerName}`,
          userId: req.adminUser?.id || null,
          userName: req.adminUser?.name || "Admin",
          details: JSON.stringify({
            cliente: financing.customerName,
            motivo: validationResult.data.approvalNotes || "N\xE3o especificado"
          }),
          ipAddress: req.ip || req.socket?.remoteAddress || null
        });
      }
      res.json(financing);
    } catch (error) {
      console.error("[FINANCING ERROR]", error);
      res.status(500).json({ error: "Failed to update financing" });
    }
  });
  app2.post("/api/financings/:id/confession-video", (req, res, next) => {
    req.setTimeout(6e5);
    res.setTimeout(6e5);
    console.log("[VIDEO UPLOAD] Requisi\xE7\xE3o recebida para financingId:", req.params.id);
    console.log("[VIDEO UPLOAD] Content-Type:", req.headers["content-type"]);
    console.log("[VIDEO UPLOAD] Content-Length:", req.headers["content-length"]);
    videoUpload.single("video")(req, res, (err) => {
      if (err) {
        console.error("[VIDEO UPLOAD] Multer error:", err);
        return res.status(400).json({ error: err.message || "Erro no upload do arquivo" });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const financingId = req.params.id;
      const file = req.file;
      console.log("[VIDEO UPLOAD] Arquivo recebido:", file?.filename, "tamanho:", file?.size);
      if (!file) {
        console.error("[VIDEO UPLOAD] Nenhum arquivo no request");
        return res.status(400).json({ error: "Nenhum arquivo de v\xEDdeo enviado" });
      }
      const videoUrl = `/api/videos/${file.filename}`;
      const financing = await storage.updateFinancing(financingId, {
        confessionVideoUrl: videoUrl,
        confessionVideoRecordedAt: /* @__PURE__ */ new Date()
      });
      if (!financing) {
        fs.unlinkSync(file.path);
        return res.status(404).json({ error: "Financiamento n\xE3o encontrado" });
      }
      console.log("[VIDEO UPLOAD] Sucesso! URL:", videoUrl);
      res.json({
        success: true,
        videoUrl,
        message: "V\xEDdeo salvo com sucesso"
      });
    } catch (error) {
      console.error("[VIDEO UPLOAD ERROR]", error);
      res.status(500).json({ error: "Falha ao salvar v\xEDdeo" });
    }
  });
  app2.get("/api/videos/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadDir, filename);
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(uploadDir))) {
      return res.status(400).json({ error: "Nome de arquivo inv\xE1lido" });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "V\xEDdeo n\xE3o encontrado" });
    }
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4"
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4"
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });
  app2.post("/api/financings/:id/confession-video-chunk", chunkUpload.single("chunk"), async (req, res) => {
    try {
      const { uploadId, chunkIndex, totalChunks } = req.body;
      const file = req.file;
      console.log(`[CHUNK UPLOAD] Chunk ${chunkIndex}/${totalChunks} recebido para upload ${uploadId}`);
      if (!file) {
        return res.status(400).json({ error: "Chunk n\xE3o recebido" });
      }
      res.json({
        success: true,
        chunkIndex: parseInt(chunkIndex),
        received: true
      });
    } catch (error) {
      console.error("[CHUNK UPLOAD ERROR]", error);
      res.status(500).json({ error: "Falha ao salvar chunk" });
    }
  });
  app2.post("/api/financings/:id/confession-video-complete", async (req, res) => {
    try {
      const financingId = req.params.id;
      const { uploadId: rawUploadId, totalChunks: rawTotalChunks, fileName } = req.body;
      const uploadId = sanitizeUploadId(rawUploadId || "");
      const totalChunks = sanitizeChunkIndex(rawTotalChunks || "0");
      if (!uploadId || totalChunks <= 0) {
        return res.status(400).json({ error: "Par\xE2metros inv\xE1lidos" });
      }
      console.log(`[CHUNK COMPLETE] Finalizando upload ${uploadId} com ${totalChunks} chunks`);
      const chunkDir = path.join(chunksDir, uploadId);
      const resolvedChunkDir = path.resolve(chunkDir);
      if (!resolvedChunkDir.startsWith(path.resolve(chunksDir))) {
        return res.status(400).json({ error: "Upload ID inv\xE1lido" });
      }
      if (!fs.existsSync(chunkDir)) {
        return res.status(400).json({ error: "Chunks n\xE3o encontrados" });
      }
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(fileName || ".mp4") || ".mp4";
      const finalFileName = `confession-${uniqueSuffix}${ext}`;
      const finalPath = path.join(uploadDir, finalFileName);
      const writeStream = fs.createWriteStream(finalPath);
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `chunk-${i}`);
        if (!fs.existsSync(chunkPath)) {
          writeStream.close();
          if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
          return res.status(400).json({ error: `Chunk ${i} n\xE3o encontrado` });
        }
        const chunkData = fs.readFileSync(chunkPath);
        writeStream.write(chunkData);
      }
      writeStream.end();
      await new Promise((resolve2, reject) => {
        writeStream.on("finish", resolve2);
        writeStream.on("error", reject);
      });
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `chunk-${i}`);
        if (fs.existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath);
        }
      }
      if (fs.existsSync(chunkDir)) fs.rmdirSync(chunkDir);
      const videoUrl = `/api/videos/${finalFileName}`;
      const financing = await storage.updateFinancing(financingId, {
        confessionVideoUrl: videoUrl,
        confessionVideoRecordedAt: /* @__PURE__ */ new Date()
      });
      if (!financing) {
        fs.unlinkSync(finalPath);
        return res.status(404).json({ error: "Financiamento n\xE3o encontrado" });
      }
      console.log("[CHUNK COMPLETE] Sucesso! URL:", videoUrl);
      res.json({
        success: true,
        videoUrl,
        message: "V\xEDdeo salvo com sucesso"
      });
    } catch (error) {
      console.error("[CHUNK COMPLETE ERROR]", error);
      res.status(500).json({ error: "Falha ao finalizar upload" });
    }
  });
  app2.delete("/api/financings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFinancing(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Financing not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete financing" });
    }
  });
  app2.patch("/api/financings/:id/checkout", async (req, res) => {
    try {
      const {
        checkOutPhotos,
        checkOutChecklist,
        checkOutNotes,
        checkOutCompletedAt,
        checkInPhotos,
        checkInChecklist,
        checkInNotes,
        checkInCompletedAt
      } = req.body;
      const existing = await storage.getFinancing(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Financing not found" });
      }
      if (existing.approvalStatus !== "approved" && existing.approvalStatus !== "finalized") {
        return res.status(400).json({ error: "Checkout only available for approved or finalized financings" });
      }
      const updateData = {};
      if (checkInPhotos !== void 0) updateData.checkInPhotos = checkInPhotos;
      if (checkInChecklist !== void 0) updateData.checkInChecklist = checkInChecklist;
      if (checkInNotes !== void 0) updateData.checkInNotes = checkInNotes;
      if (checkInCompletedAt !== void 0) updateData.checkInCompletedAt = new Date(checkInCompletedAt);
      if (checkOutPhotos !== void 0) updateData.checkOutPhotos = checkOutPhotos;
      if (checkOutChecklist !== void 0) updateData.checkOutChecklist = checkOutChecklist;
      if (checkOutNotes !== void 0) updateData.checkOutNotes = checkOutNotes;
      if (checkOutCompletedAt !== void 0) updateData.checkOutCompletedAt = new Date(checkOutCompletedAt);
      const financing = await storage.updateFinancing(req.params.id, updateData);
      res.json(financing);
    } catch (error) {
      console.error("[CHECKOUT ERROR]", error);
      res.status(500).json({ error: "Failed to complete checkout" });
    }
  });
  app2.patch("/api/financings/:id/cancel", async (req, res) => {
    try {
      const { cancelNotes } = req.body;
      const existing = await storage.getFinancing(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Financing not found" });
      }
      const financing = await storage.updateFinancing(req.params.id, {
        approvalStatus: "cancelled",
        approvalNotes: cancelNotes || "Financiamento cancelado"
      });
      if (existing.vehicleId) {
        await storage.updateVehicle(existing.vehicleId, {
          available: true,
          isFinanced: false,
          availableForFinancing: true
        });
      }
      res.json(financing);
    } catch (error) {
      console.error("[CANCEL FINANCING ERROR]", error);
      res.status(500).json({ error: "Failed to cancel financing" });
    }
  });
  app2.get("/api/customers/:id/financings", async (req, res) => {
    try {
      const financings2 = await storage.getCustomerFinancings(req.params.id);
      res.json(financings2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer financings" });
    }
  });
  app2.get("/api/trade-in-vehicles", async (_req, res) => {
    try {
      const vehicles2 = await storage.getTradeInVehicles();
      res.json(vehicles2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade-in vehicles" });
    }
  });
  app2.get("/api/trade-in-vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getTradeInVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Trade-in vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade-in vehicle" });
    }
  });
  app2.get("/api/trade-in-vehicles/financing/:financingId", async (req, res) => {
    try {
      const vehicle = await storage.getTradeInVehicleByFinancingId(req.params.financingId);
      if (!vehicle) {
        return res.status(404).json({ error: "Trade-in vehicle not found for this financing" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade-in vehicle" });
    }
  });
  app2.patch("/api/trade-in-vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.updateTradeInVehicle(req.params.id, req.body);
      if (!vehicle) {
        return res.status(404).json({ error: "Trade-in vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating trade-in vehicle:", error);
      res.status(500).json({ error: "Failed to update trade-in vehicle" });
    }
  });
  app2.post("/api/financings/generate-proposal", async (req, res) => {
    try {
      const proposalData = req.body;
      const fs3 = await import("fs");
      const path3 = await import("path");
      const doc = new PDFDocument({ size: "A4", margin: 60 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=proposta-financiamento.pdf");
      doc.pipe(res);
      doc.fontSize(18).font("Helvetica-Bold").fillColor("#000000").text("PROPOSTA DE FINANCIAMENTO DE VE\xCDCULO", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").fillColor("#333333").text("Imobilicar - Locadora de Ve\xEDculos", { align: "center" });
      doc.fillColor("#000000");
      doc.moveDown(0.8);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).strokeColor("#000000").stroke();
      doc.moveDown(0.8);
      doc.fontSize(9).font("Helvetica");
      const infoY = doc.y;
      doc.text(`Proposta: ${Date.now().toString().slice(-8)}`, 60, infoY);
      doc.text(`Data: ${format(/* @__PURE__ */ new Date(), "dd/MM/yyyy", { locale: ptBR })}`, 250, infoY);
      doc.text(`Validade: 7 dias`, 420, infoY);
      doc.moveDown(1.5);
      doc.fontSize(11).font("Helvetica-Bold").text("1. DADOS DO CLIENTE", 60);
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const clientDataY = doc.y;
      doc.text(`Nome: `, 60, clientDataY, { continued: true });
      doc.font("Helvetica-Bold").text(proposalData.customer.name);
      doc.font("Helvetica").text(`CPF: `, 60, doc.y + 15, { continued: true });
      doc.text(proposalData.customer.cpf);
      doc.text(`Telefone: `, 60, doc.y + 15, { continued: true });
      doc.text(proposalData.customer.phone);
      doc.text(`Email: `, 60, doc.y + 15, { continued: true });
      doc.text(proposalData.customer.email);
      doc.moveDown(1.5);
      doc.fontSize(11).font("Helvetica-Bold").text("2. DADOS DO VE\xCDCULO", 60);
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const vehicleDataY = doc.y;
      if (proposalData.vehicle) {
        doc.text(`Ve\xEDculo: `, 60, vehicleDataY, { continued: true });
        doc.font("Helvetica-Bold").text(proposalData.vehicle.name);
        doc.font("Helvetica").text(`Marca/Modelo: `, 60, doc.y + 15, { continued: true });
        doc.text(`${proposalData.vehicle.brand} ${proposalData.vehicle.model}`);
        doc.text(`Ano: `, 60, doc.y + 15, { continued: true });
        doc.text(proposalData.vehicle.year.toString());
      }
      doc.text(`Valor do Ve\xEDculo: `, 60, doc.y + 15, { continued: true });
      doc.font("Helvetica-Bold").text(`R$ ${proposalData.vehicleValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      doc.font("Helvetica");
      doc.moveDown(1.5);
      doc.fontSize(11).font("Helvetica-Bold").text("3. CONDI\xC7\xD5ES DE FINANCIAMENTO", 60);
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const conditionsY = doc.y;
      doc.text(`Prazo: `, 60, conditionsY, { continued: true });
      doc.text(`${proposalData.term} meses`);
      doc.text(`Data de In\xEDcio: `, 60, doc.y + 15, { continued: true });
      doc.text(format(new Date(proposalData.startDate), "dd/MM/yyyy", { locale: ptBR }));
      doc.text(`Dia de Vencimento: `, 60, doc.y + 15, { continued: true });
      doc.text(`${proposalData.dueDay} de cada m\xEAs`);
      doc.moveDown(1.5);
      doc.fontSize(11).font("Helvetica-Bold").text("4. PLANO DE PAGAMENTO", 60);
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const paymentY = doc.y;
      doc.text("4.1 Entrada (20% do valor do ve\xEDculo)", 60, paymentY);
      doc.text(`     Valor Total: `, 60, paymentY + 18, { continued: true });
      doc.font("Helvetica-Bold").text(`R$ ${proposalData.summary.downPaymentTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      doc.font("Helvetica").text(`     - \xC0 vista: R$ ${proposalData.summary.downPaymentCash.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 60, paymentY + 33);
      doc.text(`     - Parcelado: R$ ${proposalData.summary.downPaymentFinanced.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${proposalData.summary.downPaymentInstallments}x de R$ ${proposalData.summary.downPaymentInstallmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 60, paymentY + 48);
      doc.y = paymentY + 75;
      doc.text("4.2 Financiamento do Saldo (80% do valor do ve\xEDculo)", 60);
      doc.moveDown(0.3);
      doc.text(`     Valor Financiado: `, 60, doc.y, { continued: true });
      doc.font("Helvetica-Bold").text(`R$ ${proposalData.summary.principal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      doc.font("Helvetica").text(`     N\xFAmero de Parcelas: 48 meses`, 60);
      doc.text(`     Valor da Parcela Mensal: `, 60, doc.y, { continued: true });
      doc.font("Helvetica-Bold").text(`R$ ${proposalData.summary.monthlyInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      doc.font("Helvetica").text(`     Total a Pagar no Financiamento: R$ ${(proposalData.summary.monthlyInstallment * 48).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 60);
      doc.moveDown(1.2);
      doc.text("4.3 Investimento Total", 60);
      doc.moveDown(0.3);
      doc.text(`     Entrada + Financiamento: `, 60, doc.y, { continued: true });
      doc.font("Helvetica-Bold").text(`R$ ${proposalData.summary.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      doc.font("Helvetica");
      doc.moveDown(1.5);
      doc.addPage();
      doc.fontSize(11).font("Helvetica-Bold").text("5. TABELA DE AMORTIZA\xC7\xC3O", 60);
      doc.moveDown(0.3);
      doc.fontSize(9).font("Helvetica").text("Proje\xE7\xE3o das 48 parcelas mensais com op\xE7\xE3o de desconto para antecipa\xE7\xE3o", 60);
      doc.moveDown(1);
      const tableTop = doc.y;
      const colWidths = [35, 70, 85, 105, 105];
      const colPositions = [60];
      for (let i = 0; i < colWidths.length - 1; i++) {
        colPositions.push(colPositions[i] + colWidths[i]);
      }
      doc.rect(60, tableTop, 475, 15).fillAndStroke("#e8e8e8", "#000000");
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#000000");
      doc.text("N\xBA", colPositions[0] + 2, tableTop + 4, { width: colWidths[0] - 4, align: "center" });
      doc.text("Vencimento", colPositions[1] + 2, tableTop + 4, { width: colWidths[1] - 4, align: "center" });
      doc.text("Amortiza\xE7\xE3o", colPositions[2] + 2, tableTop + 4, { width: colWidths[2] - 4, align: "center" });
      doc.text("Parcela Normal", colPositions[3] + 2, tableTop + 4, { width: colWidths[3] - 4, align: "center" });
      doc.text("Parcela Antecipada", colPositions[4] + 2, tableTop + 4, { width: colWidths[4] - 4, align: "center" });
      let currentY = tableTop + 15;
      doc.fontSize(7).font("Helvetica");
      for (const row of proposalData.amortizationTable) {
        if (currentY > 740) {
          doc.addPage();
          doc.fontSize(9).font("Helvetica").text("5. TABELA DE AMORTIZA\xC7\xC3O (continua\xE7\xE3o)", 60, 60);
          currentY = 85;
          doc.rect(60, currentY, 475, 15).fillAndStroke("#e8e8e8", "#000000");
          doc.fontSize(8).font("Helvetica-Bold");
          doc.text("N\xBA", colPositions[0] + 2, currentY + 4, { width: colWidths[0] - 4, align: "center" });
          doc.text("Vencimento", colPositions[1] + 2, currentY + 4, { width: colWidths[1] - 4, align: "center" });
          doc.text("Amortiza\xE7\xE3o", colPositions[2] + 2, currentY + 4, { width: colWidths[2] - 4, align: "center" });
          doc.text("Parcela Normal", colPositions[3] + 2, currentY + 4, { width: colWidths[3] - 4, align: "center" });
          doc.text("Parcela Antecipada", colPositions[4] + 2, currentY + 4, { width: colWidths[4] - 4, align: "center" });
          currentY += 15;
          doc.fontSize(7).font("Helvetica");
        }
        doc.rect(60, currentY, 475, 11).stroke("#cccccc");
        doc.fillColor("#000000");
        doc.text(`${row.installment}`, colPositions[0] + 2, currentY + 2, { width: colWidths[0] - 4, align: "center" });
        doc.text(format(new Date(row.dueDate), "dd/MM/yyyy", { locale: ptBR }), colPositions[1] + 2, currentY + 2, { width: colWidths[1] - 4, align: "center" });
        doc.text(`R$ ${row.amortization.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colPositions[2] + 2, currentY + 2, { width: colWidths[2] - 4, align: "right" });
        doc.text(`R$ ${row.payment.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colPositions[3] + 2, currentY + 2, { width: colWidths[3] - 4, align: "right" });
        doc.text(`R$ ${row.discountedPayment.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colPositions[4] + 2, currentY + 2, { width: colWidths[4] - 4, align: "right" });
        currentY += 11;
      }
      doc.addPage();
      doc.fontSize(11).font("Helvetica-Bold").text("6. INFORMA\xC7\xD5ES IMPORTANTES", 60);
      doc.moveDown(0.8);
      doc.fontSize(10).font("Helvetica");
      doc.text("6.1  Esta proposta de financiamento tem validade de 7 (sete) dias corridos a partir da data de", 60);
      doc.text("     emiss\xE3o.", 60);
      doc.moveDown(0.5);
      doc.text("6.2  Os valores apresentados s\xE3o estimativas e podem sofrer altera\xE7\xF5es at\xE9 a assinatura do", 60);
      doc.text("     contrato definitivo.", 60);
      doc.moveDown(0.5);
      doc.text("6.3  Para efetivar o financiamento, \xE9 necess\xE1rio apresentar toda a documenta\xE7\xE3o solicitada pela", 60);
      doc.text("     Imobilicar.", 60);
      doc.moveDown(0.5);
      doc.text("6.4  O desconto progressivo para antecipa\xE7\xE3o de pagamento aplica-se conforme demonstrado na", 60);
      doc.text('     coluna "Parcela Antecipada" da Tabela de Amortiza\xE7\xE3o.', 60);
      doc.moveDown(0.5);
      doc.text("6.5  Quanto mais antecipado for o pagamento da parcela, maior ser\xE1 o desconto concedido.", 60);
      doc.moveDown(0.5);
      doc.text("6.6  Esta proposta n\xE3o constitui um contrato definitivo de financiamento, servindo apenas como", 60);
      doc.text("     simula\xE7\xE3o e estimativa dos valores.", 60);
      doc.moveDown(4);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).strokeColor("#000000").stroke();
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica").fillColor("#000000");
      const brasiliaDate = new Date((/* @__PURE__ */ new Date()).getTime() - 3 * 60 * 60 * 1e3);
      doc.text(`Documento gerado em ${format(brasiliaDate, "dd/MM/yyyy '\xE0s' HH:mm", { locale: ptBR })}`, { align: "center" });
      doc.moveDown(0.8);
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("IMOBILICAR - LOCADORA DE VE\xCDCULOS", { align: "center" });
      doc.end();
    } catch (error) {
      console.error("Erro ao gerar proposta:", error);
      res.status(500).json({ error: "Erro ao gerar proposta de financiamento" });
    }
  });
  app2.post("/api/financings/generate-contract-docx", async (req, res) => {
    try {
      let financing;
      let vehicle;
      if (req.body.financingData && req.body.vehicleData) {
        financing = req.body.financingData;
        vehicle = req.body.vehicleData;
      } else if (req.body.financingId) {
        financing = await storage.getFinancing(req.body.financingId);
        if (!financing) {
          return res.status(404).json({ error: "Financiamento n\xE3o encontrado" });
        }
        vehicle = await storage.getVehicle(financing.vehicleId);
        if (!vehicle) {
          return res.status(404).json({ error: "Ve\xEDculo n\xE3o encontrado" });
        }
      } else {
        return res.status(400).json({ error: "Dados insuficientes para gerar contrato" });
      }
      const paymentProofSection = [];
      if (req.body.paymentProof && req.body.paymentProof.startsWith("data:image")) {
        try {
          const paymentProofDataUri = req.body.paymentProof;
          const base64Data = paymentProofDataUri.split(",")[1];
          const imageBuffer = Buffer.from(base64Data, "base64");
          const mimeMatch = paymentProofDataUri.match(/data:image\/([a-zA-Z]+);/);
          const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : "png";
          const imageType = mimeType === "jpeg" || mimeType === "jpg" ? "jpg" : "png";
          paymentProofSection.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "COMPROVANTE DE PAGAMENTO",
                  font: "Arial",
                  size: 24,
                  bold: true
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 800, after: 300 }
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 450,
                    height: 350
                  },
                  type: imageType
                })
              ],
              alignment: AlignmentType.CENTER
            })
          );
        } catch (e) {
          console.error("Erro ao processar comprovante de pagamento:", e);
        }
      }
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Título
            new Paragraph({
              children: [
                new TextRun({
                  text: "CONTRATO DE LOCA\xC7\xC3O DE VE\xCDCULO COM DIREITO A COMPRA",
                  font: "Arial",
                  size: 22,
                  // 11pt = 22 half-points
                  bold: true
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            // Qualificação das partes - LOCADOR
            new Paragraph({
              children: [
                new TextRun({
                  text: "Pelo presente instrumento, de um lado o ",
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "LOCADOR, IMOBILICAR LOCA\xC7\xC3O DE VE\xCDCULOS",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: ", inscrito no CNPJ sob o n\xBA 61.363.556/0001-37, localizada na Rua Ant\xF4nio Cardoso Franco, n\xBA 237 Casa Branca - Santo Andr\xE9/SP - CEP 09015-530. N\xFAmero para contato: 11 9 5190-5499 e e-mail administracao@imobilicar.com.br, e",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            // Qualificação das partes - LOCATÁRIO
            new Paragraph({
              children: [
                new TextRun({
                  text: "LOCAT\xC1RIO ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: `${financing.customerName || ""}, brasileiro, `,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: `inscrito no CPF sob o n\xBA ${financing.customerCpf || ""} e portador da c\xE9dula de identidade R.G. sob o n\xBA ${financing.customerRg || ""}, `,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: `residente e domiciliado \xE0 ${financing.customerStreet || ""}, ${financing.customerComplement ? financing.customerComplement + ", " : ""}${financing.customerNeighborhood || ""} - ${financing.customerCity || ""} - CEP ${financing.customerZipCode || ""}. `,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: `N\xFAmero para contato: ${financing.customerPhone || ""} e e-mail: ${financing.customerEmail || ""}`,
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            // Parágrafo introdutório
            new Paragraph({
              children: [
                new TextRun({
                  text: "Por este instrumento, as partes acima qualificadas resolvem de comum acordo e de livre e espont\xE2nea vontade, firmar o presente contrato de loca\xE7\xE3o de ve\xEDculo com direito a compra ao final do pagamento das parcelas, a reger-se pelas seguintes cl\xE1usulas e condi\xE7\xF5es:",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // CLÁUSULA 1 - DO OBJETO
            new Paragraph({
              children: [
                new TextRun({
                  text: "DO OBJETO DO CONTRATO",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 1\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: `O presente contrato tem por objeto a loca\xE7\xE3o com direito de compra, do ve\xEDculo da Marca ${vehicle.brand || ""} ${vehicle.model || ""} - Ano/Mod. ${vehicle.year || ""} - Placa ${vehicle.licensePlate || ""} - Cor ${vehicle.color || ""} - RENAVAM ${vehicle.renavam || ""} - CHASSI ${vehicle.chassisNumber || ""} - ${vehicle.mileage || ""}KM para uso pessoal e intransfer\xEDvel do(a) locat\xE1rio(a), no territ\xF3rio de S\xE3o Paulo durante o pagamento das parcelas inerentes a loca\xE7\xE3o.`,
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo \xFAnico. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O presente contrato tem car\xE1ter pessoal e intransfer\xEDvel, sendo vedado ao locat\xE1rio(a), o empr\xE9stimo, venda, subloca\xE7\xE3o, ou transmiss\xE3o do ve\xEDculo \xE0 terceiros, seja de forma parcial ou total.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // CLÁUSULA 2 - DA GARANTIA
            new Paragraph({
              children: [
                new TextRun({
                  text: "DA GARANTIA",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 2\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: `Como garantia para o contrato aqui firmado entre as partes, o locat\xE1rio apresenta como fiador(a) na qualidade de terceiro garantidor ${financing.guarantorName || ""}, brasileiro, inscrito no CPF sob o n\xBA ${financing.guarantorCpf || ""} e portador da c\xE9dula de identidade R.G. sob o n\xBA ${financing.guarantorRg || ""}, residente e domiciliado \xE0 ${financing.guarantorStreet || ""}, ${financing.guarantorComplement ? financing.guarantorComplement + ", " : ""}${financing.guarantorNeighborhood || ""} - ${financing.guarantorCity || ""} - CEP ${financing.guarantorZipCode || ""}. N\xFAmero para contato: ${financing.guarantorPhone || ""} e e-mail: ${financing.guarantorEmail || ""}.`,
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // CLÁUSULA 3 - DO PREÇO E FORMA DE PAGAMENTO
            new Paragraph({
              children: [
                new TextRun({
                  text: "DO PRE\xC7O E FORMA DE PAGAMENTO",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 3\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: `O valor da loca\xE7\xE3o do ve\xEDculo especificado na cl\xE1usula 1\xAA, \xE9 de 48 parcelas no importe de R$ ${(financing.monthlyPayment || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} mensais, durante a vig\xEAncia do contrato, a ser quitado mensalmente, com vencimento no dia ${financing.paymentDueDate || 10} de cada m\xEAs${vehicle.hasInsurance && vehicle.insuranceValue ? ` e o seguro veicular no valor de R$ ${Number(vehicle.insuranceValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} mensais.` : "."}`,
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 3.1. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: `Como valor de entrada foi estipulado o montante de R$ ${((financing.vehicleValue || 0) * 0.2).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` + (financing.tradeInVehicle && financing.tradeInAcceptanceStatus === "accepted" ? `, sendo que o LOCAT\xC1RIO apresentou como parte da entrada o ve\xEDculo ${financing.tradeInVehicle.brand || ""} ${financing.tradeInVehicle.model || ""} - Ano ${financing.tradeInVehicle.year || ""}${financing.tradeInVehicle.plate ? `, Placa ${financing.tradeInVehicle.plate}` : ""}${financing.tradeInVehicle.mileage ? `, com ${financing.tradeInVehicle.mileage} KM` : ""}, com valor FIPE de ${financing.tradeInVehicle.fipeValue || "N/A"}, aceito pelo LOCADOR pelo valor de R$ ${Number(financing.tradeInVehicle.acceptedValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. O saldo remanescente da entrada, no valor de R$ ${(financing.downPaymentCash || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}, ser\xE1 pago \xE0 vista e o restante parcelado conforme acordado entre as partes.` : `, sendo R$ ${(financing.downPaymentCash || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} \xE0 vista e o restante parcelado conforme acordado entre as partes.`),
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            // CLÁUSULA 3.2 - VÍDEO DO VEÍCULO
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 3.2. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O LOCAT\xC1RIO compromete-se a cada pagamento, enviar ao LOCADOR um v\xEDdeo do ve\xEDculo em que mostre o mesmo em 360\xBA e a quilometragem.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // CLÁUSULA 4 - DO ATRASO E INADIMPLEMENTO
            new Paragraph({
              children: [
                new TextRun({
                  text: "DO ATRASO E INADIMPLEMENTO",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 4\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O atraso no pagamento das parcelas, em prazo superior a 2 (Dois) dias corridos, dar\xE1 o direito do LOCADOR fazer o bloqueio do ve\xEDculo at\xE9 que sejam feitos os pagamentos pendentes.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O atraso no pagamento das parcelas, por prazo superior a 2 (Dois) dias, implicar\xE1 no direito da locadora em rescindir automaticamente o presente contrato, sem a necessidade de notifica\xE7\xE3o judicial ou extrajudicial do locat\xE1rio(a), reavendo o ve\xEDculo.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo segundo. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "As parcelas em atraso sofrer\xE3o incid\xEAncia de juros legais (10%) ao m\xEAs, acrescidos de atualiza\xE7\xE3o monet\xE1ria, na forma da lei.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // CLÁUSULA 5 - DO DIREITO A COMPRA
            new Paragraph({
              children: [
                new TextRun({
                  text: "DO DIREITO A COMPRA",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 5\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Ao final do prazo para pagamento das parcelas, fica assegurado ao LOCAT\xC1RIO, a compra do ve\xEDculo, desde que esteja em dia com suas obriga\xE7\xF5es contratuais.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo \xFAnico. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Fica o LOCAT\xC1RIO, ciente de que o ve\xEDculo permanecer\xE1 em nome do propriet\xE1rio atual ou da LOCADORA at\xE9 o final do pagamento das parcelas, sendo entregue recibo de compra e venda (CRV/CRV Digital), ap\xF3s a quita\xE7\xE3o total das parcelas e demais obriga\xE7\xF5es.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // CLÁUSULA 6 - DAS OBRIGAÇÕES
            new Paragraph({
              children: [
                new TextRun({
                  text: "DAS OBRIGA\xC7\xD5ES",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 6\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Durante o prazo da loca\xE7\xE3o, \xE9 permitido somente a utiliza\xE7\xE3o do ve\xEDculo no estado de S\xE3o Paulo, salvo autoriza\xE7\xE3o expressa da LOCADORA, e em vias que apresentem condi\xE7\xF5es normais de rodagem e adequadas \xE0 sua destina\xE7\xE3o.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo \xFAnico. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Passa a ser do locat\xE1rio as responsabilidades de natureza civil, criminal e administrativa acerca do uso do ve\xEDculo, a contar da data de assinatura do presente.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 7\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Obriga-se o(a) locat\xE1rio(a) em utilizar o ve\xEDculo de forma pessoal e intransfer\xEDvel, no prazo de dura\xE7\xE3o da loca\xE7\xE3o.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo \xFAnico. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Fica estipulado entre as partes que no caso de viola\xE7\xE3o contratual consistente na transfer\xEAncia indevida pelo locat\xE1rio da posse do ve\xEDculo a terceiros a incid\xEAncia de multa no patamar de 10% (Dez) com a respectiva e autom\xE1tica extin\xE7\xE3o contratual.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 8\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de furto ou roubo do ve\xEDculo, providenciar no prazo de 12 (Doze horas), a contar do evento, lavratura de Boletim de ocorr\xEAncia, bem como providenciar o encaminhamento documental \xE0 locadora.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de furto, roubo, inc\xEAndio, colis\xE3o, apreens\xE3o, perda, furto ou roubo de chaves, documentos, pane provocada por uso inadequado e demais sinistros, a locadora n\xE3o proceder\xE1 com a substitui\xE7\xE3o do ve\xEDculo por outro dispon\xEDvel em loja no momento, n\xE3o existe a previs\xE3o de empr\xE9stimo e/ou carro reserva em favor do locat\xE1rio.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 9\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: `IPVA e Licenciamento s\xE3o de inteira responsabilidade do(a) locat\xE1rio(a). D\xE9bitos do corrente ano e dos anos subsequentes, o pagamento dos d\xE9bitos do ve\xEDculo, como IPVA, DPVAT, licenciamento, multas, p\xE1tio/estacionamento e outras aven\xE7as que possam incidir, a partir desta data, s\xE3o de inteira responsabilidade do(a) locat\xE1rio(a), o n\xE3o pagamento dos d\xE9bitos acarreta quebra do contrato e devolu\xE7\xE3o do ve\xEDculo a locadora sem direito de devolu\xE7\xE3o dos valores j\xE1 pagos.${vehicle.ipvaStatus === "pago" && vehicle.ipvaValue ? ` O valor do IPVA do ve\xEDculo especificado na cl\xE1usula 1\xBA \xE9 no valor de R$ ${Number(vehicle.ipvaValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.` : ""}`,
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 9.1. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de ve\xEDculo encaminhado para p\xE1tio o locat\xE1rio est\xE1 ciente de que ser\xE1 cobrado um custo adicional referente \xE0s custas administrativas internas (uso de guincho e honor\xE1rios de despachante) no valor de R$1.500,00 mais custos pagos que forem de compet\xEAncia do locat\xE1rio.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 9.2. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "A responsabilidade das multas \xE9 do locat\xE1rio, sendo obrigat\xF3ria a transfer\xEAncia de pontua\xE7\xE3o, sendo assim, na primeira multa o LOCAT\xC1RIO ser\xE1 notificado para pagamento, na segunda o LOCAT\xC1RIO pagar\xE1 o valor dobrado da multa, na terceira pagar\xE1 o valor triplicado da multa, na quarta ir\xE1 acarretar na quebra do contrato e a locadora poder\xE1 tomar medidas cab\xEDveis e consequente rescis\xE3o contratual.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 9.3. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Fica acordado o pagamento das infra\xE7\xF5es, 5 (Cinco) dias ap\xF3s o recebimento das notifica\xE7\xF5es.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 9.4. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Caso o ve\xEDculo seja apreendido, o locat\xE1rio e o avalista t\xEAm responsabilidade de arcar com todos os d\xE9bitos e retirar o ve\xEDculo do p\xE1tio, uma vez que os d\xE9bitos com a locadora estejam em dia.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 10\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de penalidade de multa de tr\xE2nsito, o locat\xE1rio dever\xE1 informar \xE0 locadora imediatamente a respeito, quando do recebimento de notifica\xE7\xE3o, bem como providenciar a indica\xE7\xE3o do condutor perante o \xF3rg\xE3o competente.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 11\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "As despesas inerentes a avarias do ve\xEDculo, a partir da data de assinatura do presente contrato s\xE3o de responsabilidade do(a) locat\xE1rio(a).",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 12\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Fica o(a) locat\xE1rio(a) ciente de que o ve\xEDculo foi locado no estado em que se encontra, sem preju\xEDzo de que o locat\xE1rio ao tempo da contrata\xE7\xE3o acione mec\xE2nico de sua confian\xE7a para vistoriar/avaliar o ve\xEDculo, sendo certo que inexiste garantia do bem.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 13\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O Acionamento de colis\xF5es, tanto para uso do ve\xEDculo locado, quanto para utiliza\xE7\xE3o de Terceiros e assist\xEAncia 24h, \xE9 submetido \xE0s regras inerentes ao seguro/associa\xE7\xE3o contratada.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 14\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O locat\xE1rio concorda e se compromete a guardar o ve\xEDculo em local seguro e fechado, n\xE3o podendo ser deixado em via p\xFAblica ap\xF3s as 22:00 durante per\xEDodo de pernoite, at\xE9 as 6:00, devendo permanecer em garagem fechada ou estacionamento. O n\xE3o cumprimento desta cl\xE1usula autoriza a locadora a recolher o ve\xEDculo deixado em via p\xFAblica por entender que este est\xE1 em situa\xE7\xE3o de risco de roubo/furto e acarreta negativa de cobertura em um poss\xEDvel sinistro por parte da associa\xE7\xE3o.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O locat\xE1rio fica notificado quanto a proibi\xE7\xE3o no que se refere a estacionar ou deixar o ve\xEDculo instrumento deste contrato em via p\xFAblica, em qualquer hor\xE1rio/local, devendo pernoitar sempre em garagem, devidamente protegido. O n\xE3o cumprimento desta determina\xE7\xE3o acarretar\xE1, em caso de furto do ve\xEDculo, a n\xE3o cobertura do sinistro por parte da associa\xE7\xE3o de prote\xE7\xE3o, portanto, em caso de n\xE3o cobertura, fica o LOCAT\xC1RIO obrigado a restituir o valor do ve\xEDculo em sua integralidade, dada a sua responsabilidade ante ao ve\xEDculo.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // DAS OBRIGAÇÕES DO FIADOR
            new Paragraph({
              children: [
                new TextRun({
                  text: "DAS OBRIGA\xC7\xD5ES DO FIADOR",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 15\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O fiador, indicado e qualificado em cl\xE1usula 2\xAA do presente contrato, fica ciente de que em caso de inadimplemento ou descumprimento do(a) locat\xE1rio(a) quanto \xE0s suas obriga\xE7\xF5es, assume as responsabilidades e pagamentos por ele assumidos neste contrato de forma solid\xE1ria e ilimitada.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 16\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "A garantia \xE9 irrevog\xE1vel e irretrat\xE1vel, n\xE3o comportando faculdade de exonera\xE7\xE3o ou compensa\xE7\xE3o, em quaisquer hip\xF3teses, perdurando a responsabilidade do fiador, at\xE9 a quita\xE7\xE3o integral dos valores aven\xE7ados.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 17\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de morte, fal\xEAncia ou insolv\xEAncia do fiador, o(a) locat\xE1rio(a) obriga-se, no prazo de 15 (Quinze) dias a contar da ocorr\xEAncia do evento, apresentar substituto id\xF4neo.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 18\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Fica convencionado, que eventual morte ou desaparecimento do(a) locat\xE1rio(a), n\xE3o exonera o fiador das responsabilidades aqui assumidas, perdurando as obriga\xE7\xF5es at\xE9 a quita\xE7\xE3o integral dos valores.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo \xFAnico. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "N\xE3o ser\xE1 dado, no caso de \xF3bito do locat\xE1rio e/ou do fiador, \xE0 fam\xEDlia e/ou demais herdeiros do de cujus apropriar-se do bem locado, devendo comunicar a locadora acerca do evento morte para fins de recolhimento do bem m\xF3vel (ve\xEDculo). Com efeito, dever\xE1 o locat\xE1rio e/ou fiador comunicar a respectiva fam\xEDlia acerca da presente entabula\xE7\xE3o contratual visando o evento morte.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 19\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O(a) fiador(a) qualificado em cl\xE1usula 2\xAA, fica ciente da integralidade do presente contrato, assinando ao final.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // ESTIPULAÇÕES DIVERSAS
            new Paragraph({
              children: [
                new TextRun({
                  text: "DAS ESTIPULA\xC7\xD5ES DIVERSAS",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 20\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O contrato poder\xE1 ser rescindido pela locadora, de forma imediata e autom\xE1tica, independente de notifica\xE7\xE3o extrajudicial ou judicial, sem maiores formalidades, podendo, inclusive, proceder com a retomada do ve\xEDculo, inclusive \xE0s suas pr\xF3prias expensas, nos casos discriminados nas seguintes cl\xE1usulas:",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de inadimpl\xEAncia, pelo prazo superior a 2 (Dois) dias do vencimento da parcela, o presente contrato ser\xE1 rescindido automaticamente, por culpa do(a) locat\xE1rio(a).",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo segundo. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "A rescis\xE3o contratual, implica no direito de retomada do ve\xEDculo pela locadora, sem a necessidade de maiores formalidades, ou notifica\xE7\xE3o judicial ou extrajudicial.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo terceiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "A rescis\xE3o contratual por mora ou inadimplemento do(a) locat\xE1rio(a), ser\xE1 efetuada sem a devolu\xE7\xE3o ao locat\xE1rio(a) de parcelas eventualmente j\xE1 quitadas, ficando-as, como pagamento da loca\xE7\xE3o pelo uso do bem, assim como os valores pagos \xE0 t\xEDtulo de deprecia\xE7\xE3o do bem.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo quarto. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Configurada a mora/inadimplemento do(a) locat\xE1rio(a) pelo prazo especificado no par\xE1grafo primeiro, este dever\xE1 efetuar a imediata devolu\xE7\xE3o do ve\xEDculo, sob pena de retomada pela locadora e ajuizamento de a\xE7\xF5es pertinentes ao esbulho e apropria\xE7\xE3o ind\xE9bita, de maneira que em hip\xF3tese alguma contar\xE1 o per\xEDodo na posse do bem em situa\xE7\xE3o de inadimplemento e/ou de qualquer outra viola\xE7\xE3o contratual \xE0 t\xEDtulo de usucapi\xE3o do bem.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo quinto. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Sendo o ve\xEDculo objeto de reboque, acidente ou inc\xEAndio, a locadora apenas reconhecer\xE1 o encerramento da loca\xE7\xE3o e devolu\xE7\xE3o do bem, quando de fato, estiver de posse do ve\xEDculo.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo sexto. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de furto ou roubo do ve\xEDculo, a locadora apenas reconhecer\xE1 o encerramento da loca\xE7\xE3o, com a entrega imediata pelo(a) locat\xE1rio(a), do respectivo boletim de ocorr\xEAncia.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo s\xE9timo. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de desist\xEAncia do contrato de loca\xE7\xE3o por parte do(a) locat\xE1rio(a), este dever\xE1 comparecer \xE0s depend\xEAncias da locadora para assinatura de termo de devolu\xE7\xE3o do ve\xEDculo, bem como ficar\xE1 respons\xE1vel por eventuais parcelas em aberto e demais encargos do contrato de loca\xE7\xE3o em quest\xE3o.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo oitavo. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em qualquer hip\xF3tese de rescis\xE3o do contrato, seja ela por inadimplemento, por desist\xEAncia, falecimento, entre outras, ficar\xE1 o locat\xE1rio obrigado a reparar qualquer dano causado ao ve\xEDculo durante a contratualidade, n\xE3o sendo poss\xEDvel devolver o bem de maneira diversa daquela contratada.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo nono. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Ser\xE1 automaticamente rescindido o presente contrato em caso de pr\xE1tica de il\xEDcitos, seja ele do c\xF3digo civil ou criminal; qualquer conduta contr\xE1ria ao c\xF3digo de tr\xE2nsito, como conduzir ve\xEDculo sem CNH ou fornecer o ve\xEDculo a outro condutor n\xE3o habilitado, uso de bebida alco\xF3lica ou subst\xE2ncia entorpecente que causem a apreens\xE3o do carro a p\xE1tios, delegacias ou acidentes de tr\xE2nsito.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo d\xE9cimo. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Ap\xF3s 3 (Tr\xEAs) parcelas do contrato pagas, o LOCAT\xC1RIO tem a op\xE7\xE3o de trocar de ve\xEDculo, se houver disponibilidade, pagando uma taxa de troca no valor de R$1.500,00 (Hum mil e quinhentos reais), desde que, todas as pend\xEAncias com o LOCADOR estejam em dia, tais como, multas, parcelamento de entrada, IPVA do ve\xEDculo proporcional ao utilizado.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo d\xE9cimo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Caso o LOCAT\xC1RIO opte pelo cancelamento, o mesmo dever\xE1 pagar uma multa no valor de R$2.000,00 (Dois mil reais) para o LOCADOR, sendo poss\xEDvel o cancelamento em at\xE9 15 (Quinze) da assinatura do contrato.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo d\xE9cimo segundo. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O LOCAT\xC1RIO tem a op\xE7\xE3o de fazer uma devolu\xE7\xE3o amig\xE1vel em at\xE9 5 (Cinco) dias antes do vencimento da parcela mensal, podendo assim utilizar em outro ve\xEDculo a deprecia\xE7\xE3o apresentada na assinatura do contrato, em at\xE9 60 (sessenta) dias.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // CLÁUSULA 21 - BENFEITORIAS
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 21\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Quanto a eventuais benfeitorias realizadas no ve\xEDculo, estas ser\xE3o incorporadas no ve\xEDculo. Caso exercido o direito de compra as benfeitorias reverter\xE3o em favor do locat\xE1rio e em caso de devolu\xE7\xE3o, em favor da locadora.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // SUBSTITUIÇÃO DO VEÍCULO LOCADO
            new Paragraph({
              children: [
                new TextRun({
                  text: "SUBSTITUI\xC7\xC3O DO VE\xCDCULO LOCADO",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 22\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Caso o ve\xEDculo objeto do presente contrato venha a apresentar quaisquer tipo de restri\xE7\xE3o, bloqueio, impedimento legal, necessidade de manuten\xE7\xE3o prolongada ou qualquer outra situa\xE7\xE3o que impossibilite a continuidade da loca\xE7\xE3o, a LOCADORA se reserva o direito de substituir o ve\xEDculo por outro de caracter\xEDsticas semelhante, com o objetivo de garantir a continuidade do servi\xE7o ao LOCADOR, sem preju\xEDzos.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "A substitui\xE7\xE3o ser\xE1 obrigat\xF3ria e imediata, visando o bom andamento do contrato. Caso o LOCADOR se recuse a receber o ve\xEDculo substitu\xEDdo ofertado pela LOCADORA, este contrato poder\xE1 ser encerrado de forma unilateral pela LOCADORA sem penalidades, sendo considerado como desist\xEAncia por parte do LOCADOR.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // ENCERRAMENTO DE CONTRATO POR AÇÃO DE COBRANÇA
            new Paragraph({
              children: [
                new TextRun({
                  text: "ENCERRAMENTO DE CONTRATO POR A\xC7\xC3O DE COBRAN\xC7A",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 23\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de inadimpl\xEAncia ou descumprimento contratual que resulte na necessidade de a\xE7\xE3o de cobran\xE7a e devolu\xE7\xE3o for\xE7ada do ve\xEDculo por parte da LOCADORA, o LOCAT\xC1RIO reconhece que ser\xE1 respons\xE1vel pelo pagamento dos seguintes valores: Custos operacionais no valor de R$350,00 (Trezentos e cinquenta reais), taxa administrativa pelo encerramento contratual no valor de R$500,00 (Quinhentos reais) e todos os d\xE9bitos pendentes relacionados ao contrato, incluindo mensalidades, multas, encargos e eventuais danos ao ve\xEDculo;",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Par\xE1grafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O n\xE3o pagamento desses valores poder\xE1 resultar na negativa\xE7\xE3o do CPF do LOCAT\xC1RIO e em a\xE7\xF5es judiciais cab\xEDveis para ressarcimento dos preju\xEDzos.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // DISPOSIÇÕES FINAIS
            new Paragraph({
              children: [
                new TextRun({
                  text: "DISPOSI\xC7\xD5ES FINAIS",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 24\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "Em caso de ajuizamento de a\xE7\xE3o de cobran\xE7a, o(a) locat\xE1rio(a) arcar\xE1 com a multa de 10% (Dez), sobre o d\xE9bito em aberto.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 25\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "As partes, elegem o foro da Comarca de Santo Andr\xE9 para dirimir eventuais quest\xF5es em decorr\xEAncia do presente contrato.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "CL\xC1USULA 26\xAA. ",
                  bold: true,
                  font: "Arial",
                  size: 22
                }),
                new TextRun({
                  text: "O presente contrato tem car\xE1ter irrevog\xE1vel, irretrat\xE1vel e intransfer\xEDvel, obrigando as partes ao cumprimento, transmitindo-se \xE0s obriga\xE7\xF5es aos sucessores e herdeiros.",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 }
            }),
            // Data e Local
            new Paragraph({
              children: [
                new TextRun({
                  text: `S\xE3o Paulo, ${format(/* @__PURE__ */ new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 600, after: 600 }
            }),
            // Assinaturas
            new Paragraph({
              children: [
                new TextRun({
                  text: "_".repeat(60),
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "IMOBILICAR LOCA\xC7\xC3O DE VE\xCDCULOS",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "(LOCADOR)",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "_".repeat(60),
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: financing.customerName || "LOCAT\xC1RIO",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "(LOCAT\xC1RIO)",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "_".repeat(60),
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: financing.guarantorName || "AVALISTA/FIADOR",
                  font: "Arial",
                  size: 22,
                  bold: true
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "(AVALISTA/TERCEIRO GARANTIDOR)",
                  font: "Arial",
                  size: 22
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            // Adicionar comprovante de pagamento (se existir)
            ...paymentProofSection
          ]
        }]
      });
      const buffer = await Packer.toBuffer(doc);
      if (req.body.financingId) {
        try {
          const base64Contract = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${buffer.toString("base64")}`;
          const fileName = `contrato-financiamento-${financing.customerName?.replace(/\s+/g, "-") || "cliente"}.docx`;
          const existingFinancing = await storage.getFinancing(req.body.financingId);
          let generatedContracts = [];
          if (existingFinancing?.generatedContracts) {
            try {
              generatedContracts = JSON.parse(existingFinancing.generatedContracts);
            } catch (e) {
              generatedContracts = [];
            }
          }
          generatedContracts.push({
            url: base64Contract,
            fileName,
            generatedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          await storage.updateFinancing(req.body.financingId, {
            generatedContracts: JSON.stringify(generatedContracts),
            contractUrl: base64Contract,
            // Manter o último gerado aqui também
            contractGeneratedAt: /* @__PURE__ */ new Date()
          });
        } catch (saveError) {
          console.error("Erro ao salvar contrato no banco:", saveError);
        }
      }
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename=contrato-financiamento-${financing.customerName?.replace(/\s+/g, "-") || "cliente"}.docx`);
      res.send(buffer);
    } catch (error) {
      console.error("Erro ao gerar contrato:", error);
      res.status(500).json({ error: "Erro ao gerar contrato de financiamento" });
    }
  });
  app2.post("/api/generate-inspection-pdf", async (req, res) => {
    try {
      const { customerData, selectedVehicle, checkInPhotos, vehicleChecklist, customerSignature, inspectorSignature } = req.body;
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=vistoria-${selectedVehicle?.licensePlate || "veiculo"}.pdf`);
        res.send(pdfBuffer);
      });
      doc.fontSize(24).font("Helvetica-Bold").text("IMOBILICAR", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(18).text("Relat\xF3rio de Vistoria de Ve\xEDculo", { align: "center" });
      doc.moveDown(0.5);
      doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
      doc.moveDown(0.5);
      const brasiliaDate = new Date((/* @__PURE__ */ new Date()).getTime() - 3 * 60 * 60 * 1e3);
      doc.fontSize(10).font("Helvetica").text(`Data: ${format(brasiliaDate, "dd/MM/yyyy '\xE0s' HH:mm", { locale: ptBR })}`, { align: "center" });
      doc.fontSize(10).text(`Cliente: ${customerData?.name || "N\xE3o informado"}`, { align: "center" });
      doc.fontSize(10).text(`Ve\xEDculo: ${selectedVehicle?.brand || ""} ${selectedVehicle?.model || ""} - Placa: ${selectedVehicle?.licensePlate || "N/A"}`, { align: "center" });
      doc.moveDown(2);
      doc.fontSize(14).font("Helvetica-Bold").text("Informa\xE7\xF5es da Vistoria", { underline: true });
      doc.moveDown(0.8);
      const summaryX = 80;
      let summaryY = doc.y;
      const labelWidth = 150;
      const valueX = summaryX + labelWidth;
      const addSummaryLine = (label, value) => {
        doc.fontSize(10).font("Helvetica-Bold").text(label + ":", summaryX, summaryY, { width: labelWidth, continued: false });
        doc.fontSize(10).font("Helvetica").text(value, valueX, summaryY, { width: 300 });
        summaryY = doc.y + 5;
      };
      addSummaryLine("Cliente", customerData?.name || "N\xE3o informado");
      addSummaryLine("Telefone", customerData?.phone || "N\xE3o informado");
      addSummaryLine("CPF", customerData?.cpf || "N\xE3o informado");
      doc.moveDown(0.5);
      summaryY = doc.y;
      addSummaryLine("Marca/Modelo", `${selectedVehicle?.brand || ""} ${selectedVehicle?.model || ""}`);
      addSummaryLine("Placa", selectedVehicle?.licensePlate || "N\xE3o informado");
      addSummaryLine("Ano", selectedVehicle?.year?.toString() || "N\xE3o informado");
      addSummaryLine("Cor", selectedVehicle?.color || "N\xE3o informado");
      doc.moveDown(0.5);
      summaryY = doc.y;
      addSummaryLine("Tipo de Opera\xE7\xE3o", "Sa\xEDda (In\xEDcio de Financiamento)");
      addSummaryLine("Vistoriador", "Administrador Imobilicar");
      addSummaryLine("Status", "FINALIZADA");
      doc.moveDown(1);
      doc.fontSize(11).font("Helvetica-Bold").text("Observa\xE7\xF5es Principais:", summaryX);
      doc.moveDown(0.3);
      const damagedItems = Object.keys(vehicleChecklist || {}).filter((k) => !vehicleChecklist[k]?.checked && vehicleChecklist[k]?.notes);
      if (damagedItems.length > 0) {
        doc.fontSize(9).font("Helvetica");
        damagedItems.forEach((item) => {
          doc.text(`\u2022 ${item}: ${vehicleChecklist[item].notes}`, summaryX + 10);
        });
      } else {
        doc.fontSize(9).font("Helvetica").text("\u2022 Ve\xEDculo em perfeito estado, sem avarias identificadas.", summaryX + 10);
      }
      doc.addPage();
      doc.fontSize(14).font("Helvetica-Bold").text("Checklist Detalhado de Inspe\xE7\xE3o", { underline: true });
      doc.moveDown(0.8);
      const addChecklistCategory = (title, items) => {
        doc.fontSize(11).font("Helvetica-Bold").text(title, { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(9).font("Helvetica");
        items.forEach((item) => {
          const status = vehicleChecklist && vehicleChecklist[item]?.checked !== false ? "\u2713 OK" : "\u2717 PROBLEMA";
          const notes = vehicleChecklist && vehicleChecklist[item]?.notes ? ` \u2014 ${vehicleChecklist[item].notes}` : "";
          const symbol = vehicleChecklist && vehicleChecklist[item]?.checked !== false ? "  \u2611" : "  \u2610";
          doc.text(`${symbol}  ${item} \u2014 ${status}${notes}`);
        });
        doc.moveDown(0.7);
      };
      addChecklistCategory("CHECKLIST EXTERNO - ITENS DE LATARIA E ESTRUTURA", [
        "Antena",
        "Para-Choque Dianteiro",
        "Para-Choque Traseiro",
        "Cap\xF4",
        "Teto",
        "Porta Dianteira Direita",
        "Porta Traseira Direita",
        "Porta Dianteira Esquerda",
        "Porta Traseira Esquerda",
        "Retrovisor Direito",
        "Retrovisor Esquerdo",
        "Far\xF3is Dianteiros",
        "Lanternas Traseiras",
        "Para-Brisa Dianteiro",
        "Vidros Laterais",
        "Vidro Traseiro",
        "Pintura Geral"
      ]);
      addChecklistCategory("CHECKLIST EQUIPAMENTOS DE SINALIZA\xC7\xC3O E SEGURAN\xC7A", [
        "Chave De Roda",
        "Tri\xE2ngulo",
        "Documento Do Ve\xEDculo"
      ]);
      addChecklistCategory("CHECKLIST DE ITENS EL\xC9TRICOS", [
        "Far\xF3is Baixo/Alto",
        "Luz De R\xE9",
        "Luz De Freio",
        "Luzes De Seta",
        "Luz De Placa",
        "Limpador De Para-Brisa",
        "Lavador De Para-Brisa",
        "Painel De Instrumentos",
        "Ar-Condicionado / Ventila\xE7\xE3o"
      ]);
      addChecklistCategory("CHECKLIST INTERNO - ITENS DE ACABAMENTO E CONFORTO", [
        "Bancos (Dianteiros/Traseiros)",
        "Tapetes",
        "Painel",
        "Alavanca De C\xE2mbio",
        "Vidros El\xE9tricos",
        "Travas El\xE9tricas",
        "Espelhos Internos"
      ]);
      addChecklistCategory("CHECKLIST MEC\xC2NICA B\xC1SICA", [
        "N\xEDvel De \xD3leo",
        "N\xEDvel Da \xC1gua (Radiador)",
        "N\xEDvel Do Fluido De Freio",
        "N\xEDvel Do Fluido De Dire\xE7\xE3o",
        "Vazamentos Vis\xEDveis",
        "Funcionamento Do Motor",
        "Funcionamento Dos Freios",
        "Funcionamento Da Dire\xE7\xE3o",
        "Funcionamento Da Embreagem"
      ]);
      doc.addPage();
      doc.fontSize(14).font("Helvetica-Bold").text("Registro Fotogr\xE1fico do Ve\xEDculo", { underline: true });
      doc.moveDown(0.8);
      const photoLabels = [
        { key: "frente", label: "Vista Frontal" },
        { key: "fundo", label: "Vista Traseira" },
        { key: "lateral_esquerda", label: "Lateral Esquerda" },
        { key: "lateral_direita", label: "Lateral Direita" }
      ];
      const photoBoxWidth = 240;
      const photoBoxHeight = 180;
      const photoMargin = 50;
      const photoSpacing = 20;
      const startPhotoY = doc.y;
      for (let i = 0; i < 2; i++) {
        const photo = photoLabels[i];
        const photoX = photoMargin + i * (photoBoxWidth + photoSpacing);
        const photoY = startPhotoY;
        doc.fontSize(10).font("Helvetica-Bold").text(photo.label, photoX, photoY, { width: photoBoxWidth, align: "center" });
        doc.rect(photoX, photoY + 20, photoBoxWidth, photoBoxHeight).stroke();
        if (checkInPhotos && checkInPhotos[photo.key]) {
          try {
            const imageData = checkInPhotos[photo.key].replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(imageData, "base64");
            doc.image(buffer, photoX + 5, photoY + 25, { fit: [photoBoxWidth - 10, photoBoxHeight - 10], align: "center", valign: "center" });
          } catch (error) {
            console.error("Erro ao adicionar foto:", error);
            doc.fontSize(9).font("Helvetica").text("Imagem n\xE3o dispon\xEDvel", photoX + 60, photoY + 100);
          }
        } else {
          doc.fontSize(9).font("Helvetica").text("Foto n\xE3o fornecida", photoX + 70, photoY + 100);
        }
      }
      const secondRowY = startPhotoY + photoBoxHeight + 50;
      for (let i = 2; i < 4; i++) {
        const photo = photoLabels[i];
        const col = i - 2;
        const photoX = photoMargin + col * (photoBoxWidth + photoSpacing);
        const photoY = secondRowY;
        doc.fontSize(10).font("Helvetica-Bold").text(photo.label, photoX, photoY, { width: photoBoxWidth, align: "center" });
        doc.rect(photoX, photoY + 20, photoBoxWidth, photoBoxHeight).stroke();
        if (checkInPhotos && checkInPhotos[photo.key]) {
          try {
            const imageData = checkInPhotos[photo.key].replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(imageData, "base64");
            doc.image(buffer, photoX + 5, photoY + 25, { fit: [photoBoxWidth - 10, photoBoxHeight - 10], align: "center", valign: "center" });
          } catch (error) {
            console.error("Erro ao adicionar foto:", error);
            doc.fontSize(9).font("Helvetica").text("Imagem n\xE3o dispon\xEDvel", photoX + 60, photoY + 100);
          }
        } else {
          doc.fontSize(9).font("Helvetica").text("Foto n\xE3o fornecida", photoX + 70, photoY + 100);
        }
      }
      doc.y = secondRowY + photoBoxHeight + 50;
      if (damagedItems.length > 0) {
        doc.addPage();
        doc.fontSize(14).font("Helvetica-Bold").text("Registro de Avarias e Danos", { underline: true });
        doc.moveDown(0.8);
        damagedItems.forEach((item) => {
          doc.fontSize(10).font("Helvetica-Bold").text(`\u2022 ${item}`);
          doc.fontSize(9).font("Helvetica").text(`  Observa\xE7\xE3o: ${vehicleChecklist[item].notes}`, { indent: 20 });
          doc.moveDown(0.5);
        });
      }
      doc.addPage();
      doc.fontSize(14).font("Helvetica-Bold").text("Autentica\xE7\xE3o e Assinaturas", { underline: true });
      doc.moveDown(1);
      doc.fontSize(10).font("Helvetica").text("As partes abaixo assinam o presente relat\xF3rio de vistoria, atestando a veracidade das informa\xE7\xF5es:", { align: "left" });
      doc.moveDown(2);
      const signX = 80;
      const signY = doc.y;
      const signBoxWidth = 200;
      const signBoxHeight = 80;
      doc.rect(signX, signY, signBoxWidth, signBoxHeight).stroke();
      if (customerSignature) {
        try {
          const imageData = customerSignature.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(imageData, "base64");
          doc.image(buffer, signX + 25, signY + 5, { fit: [signBoxWidth - 50, signBoxHeight - 25], align: "center", valign: "center" });
        } catch (error) {
          console.error("Erro ao adicionar assinatura do cliente:", error);
          doc.fontSize(8).font("Helvetica").text("(Assinatura digital)", signX + 60, signY + 35);
        }
      }
      doc.fontSize(9).font("Helvetica-Bold").text("Assinatura do Cliente", signX + 30, signY + signBoxHeight + 8);
      doc.fontSize(8).font("Helvetica").text(customerData?.name || "Nome n\xE3o informado", signX + 20, signY + signBoxHeight + 22);
      doc.fontSize(8).text(`CPF: ${customerData?.cpf || "N/A"}`, signX + 20, signY + signBoxHeight + 35);
      const inspectorX = signX + signBoxWidth + 60;
      doc.rect(inspectorX, signY, signBoxWidth, signBoxHeight).stroke();
      if (inspectorSignature) {
        try {
          const imageData = inspectorSignature.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(imageData, "base64");
          doc.image(buffer, inspectorX + 25, signY + 5, { fit: [signBoxWidth - 50, signBoxHeight - 25], align: "center", valign: "center" });
        } catch (error) {
          console.error("Erro ao adicionar assinatura do vistoriador:", error);
          doc.fontSize(8).font("Helvetica").text("(Assinatura digital)", inspectorX + 60, signY + 35);
        }
      }
      doc.fontSize(9).font("Helvetica-Bold").text("Assinatura do Vistoriador", inspectorX + 20, signY + signBoxHeight + 8);
      doc.fontSize(8).font("Helvetica").text("Imobilicar - Locadora de Ve\xEDculos", inspectorX + 10, signY + signBoxHeight + 22);
      doc.fontSize(8).text(`Data: ${format(/* @__PURE__ */ new Date(), "dd/MM/yyyy", { locale: ptBR })}`, inspectorX + 10, signY + signBoxHeight + 35);
      doc.moveDown(8);
      doc.fontSize(8).font("Helvetica").text("_".repeat(100), { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(7).text("Este documento foi gerado digitalmente pela Imobilicar e possui validade legal.", { align: "center" });
      const brasiliaDateFooter = new Date((/* @__PURE__ */ new Date()).getTime() - 3 * 60 * 60 * 1e3);
      doc.text(`Documento gerado em ${format(brasiliaDateFooter, "dd/MM/yyyy '\xE0s' HH:mm", { locale: ptBR })}`, { align: "center" });
      doc.end();
    } catch (error) {
      console.error("Erro ao gerar PDF de vistoria:", error);
      res.status(500).json({ error: "Erro ao gerar PDF de vistoria" });
    }
  });
  app2.get("/sitemap.xml", (req, res) => {
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/vehicles</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/investor</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/customer</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  });
  app2.get("/robots.txt", (req, res) => {
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;
    const robotsTxt = `# Robots.txt para Imobilicar
# Permite que todos os motores de busca indexem o site

User-agent: *
Allow: /vehicles
Allow: /investor
Allow: /customer

# Bloquear \xE1reas administrativas e APIs
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*
Disallow: /crm

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;
    res.header("Content-Type", "text/plain");
    res.send(robotsTxt);
  });
  app2.post("/api/generate-investor-contract-docx", async (req, res) => {
    try {
      const { customer, vehicle, customDividend, bonusValue, debitosVeiculo, paymentDate } = req.body;
      const docxBuffer = await generateInvestorCessionContractDocx(customer, vehicle, customDividend || "0", bonusValue || "0", debitosVeiculo || "", paymentDate || "20");
      const filename = `Contrato de Cessao - ${customer.name || "Investidor"} - ${format(/* @__PURE__ */ new Date(), "dd-MM-yyyy")}.docx`;
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      res.send(docxBuffer);
    } catch (error) {
      console.error("Error generating investor contract DOCX:", error);
      res.status(500).json({ error: "Failed to generate contract" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function generateContractPdf(doc, customer, rental, vehicle) {
  const pageWidth = 595.28;
  const margin = 28.35;
  const topMargin = 14.17;
  const contentWidth = pageWidth - margin * 2;
  let currentY = topMargin + 18;
  doc.fontSize(16).font("Helvetica-Bold").text("CONTRATO DE LOCA\xC7\xC3O DE VE\xCDCULO", margin, currentY, {
    width: contentWidth,
    align: "center",
    lineGap: 2
  });
  currentY = doc.y + 8;
  doc.fontSize(10).font("Helvetica").text("Imobilicar - Locadora de Ve\xEDculos", margin, currentY, {
    width: contentWidth,
    align: "center",
    lineGap: 1
  });
  currentY = doc.y + 12;
  doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
  currentY += 15;
  doc.fontSize(11).font("Helvetica-Bold").text("LOCADOR: ", margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font("Helvetica").text("Imobilicar Locadora de Ve\xEDculos LTDA | CNPJ: 12.345.678/0001-90 | End: Rua das Locadoras, 123 - SP", { lineGap: 1.5 });
  currentY = doc.y + 14;
  doc.fontSize(11).font("Helvetica-Bold").text("LOCAT\xC1RIO: ", margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font("Helvetica").text(`${customer.name} | CPF: ${customer.cpf} | Tel: ${customer.phone}`, { lineGap: 1.5 });
  currentY = doc.y + 3;
  if (customer.street) {
    doc.fontSize(9).font("Helvetica").text(`End: ${customer.street}, ${customer.number} - ${customer.city}/${customer.state} - CEP: ${customer.zipCode}`, margin, currentY, {
      width: contentWidth,
      lineGap: 1.5
    });
    currentY = doc.y;
  }
  currentY += 14;
  doc.fontSize(11).font("Helvetica-Bold").text("VE\xCDCULO: ", margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font("Helvetica").text(`${vehicle.name} (${vehicle.brand} ${vehicle.model} ${vehicle.year}) | ${vehicle.category} | ${vehicle.transmission} | ${vehicle.fuel} | ${vehicle.seats} lugares`, { lineGap: 1.5 });
  currentY = doc.y + 14;
  doc.fontSize(11).font("Helvetica-Bold").text("PER\xCDODO: ", margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font("Helvetica").text(`${format(new Date(rental.startDate), "dd/MM/yyyy", { locale: ptBR })} a ${format(new Date(rental.endDate), "dd/MM/yyyy", { locale: ptBR })} | `, { continued: true, lineGap: 1.5 });
  doc.font("Helvetica-Bold").text("DI\xC1RIA: ", { continued: true, lineGap: 1.5 });
  doc.font("Helvetica").text(`R$ ${Number(vehicle.pricePerDay).toFixed(2)} | `, { continued: true, lineGap: 1.5 });
  doc.font("Helvetica-Bold").text("TOTAL: ", { continued: true, lineGap: 1.5 });
  doc.fontSize(10).font("Helvetica-Bold").text(`R$ ${Number(rental.totalPrice).toFixed(2)}`, { lineGap: 1.5 });
  currentY = doc.y + 16;
  doc.fontSize(12).font("Helvetica-Bold").text("CL\xC1USULAS CONTRATUAIS", margin, currentY, { lineGap: 1.5 });
  currentY = doc.y + 10;
  doc.fontSize(8).font("Helvetica");
  const clauses = [
    "CL\xC1USULA 1\xAA - DO OBJETO: O presente contrato tem por objeto a loca\xE7\xE3o do ve\xEDculo acima descrito, em perfeitas condi\xE7\xF5es de uso, conserva\xE7\xE3o e funcionamento.",
    "CL\xC1USULA 2\xAA - DO PRAZO: O prazo de loca\xE7\xE3o ser\xE1 conforme especificado acima, podendo ser prorrogado mediante acordo entre as partes.",
    "CL\xC1USULA 3\xAA - DO PAGAMENTO: O LOCAT\xC1RIO se compromete a efetuar o pagamento do valor total da loca\xE7\xE3o no ato da retirada do ve\xEDculo.",
    "CL\xC1USULA 4\xAA - DAS RESPONSABILIDADES: O LOCAT\xC1RIO assume total responsabilidade pelo ve\xEDculo durante o per\xEDodo de loca\xE7\xE3o, incluindo multas, danos e furtos.",
    "CL\xC1USULA 5\xAA - DA DEVOLU\xC7\xC3O: O ve\xEDculo dever\xE1 ser devolvido nas mesmas condi\xE7\xF5es em que foi retirado, com o tanque de combust\xEDvel no mesmo n\xEDvel.",
    "CL\xC1USULA 6\xAA - DA QUILOMETRAGEM: A loca\xE7\xE3o inclui quilometragem livre dentro do territ\xF3rio nacional."
  ];
  const col1Width = (contentWidth - 18) / 2;
  const col2X = margin + col1Width + 18;
  const clausesPerColumn = 3;
  const clauseStartY = currentY;
  let col1Y = clauseStartY;
  for (let i = 0; i < clausesPerColumn; i++) {
    doc.text(clauses[i], margin, col1Y, {
      width: col1Width,
      align: "justify",
      lineGap: 1.5
    });
    col1Y = doc.y + 7;
  }
  let col2Y = clauseStartY;
  for (let i = clausesPerColumn; i < clauses.length; i++) {
    doc.text(clauses[i], col2X, col2Y, {
      width: col1Width,
      align: "justify",
      lineGap: 1.5
    });
    col2Y = doc.y + 7;
  }
  currentY = Math.max(col1Y, col2Y) + 15;
  doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
  currentY += 45;
  const signatureWidth = (contentWidth - 55) / 2;
  doc.moveTo(margin, currentY).lineTo(margin + signatureWidth, currentY).stroke();
  doc.moveTo(pageWidth - margin - signatureWidth, currentY).lineTo(pageWidth - margin, currentY).stroke();
  currentY += 8;
  doc.fontSize(9).font("Helvetica-Bold").text("LOCADOR", margin, currentY, {
    width: signatureWidth,
    align: "center",
    lineGap: 1.5
  });
  doc.fontSize(8).font("Helvetica").text("Imobilicar Locadora", margin, doc.y + 3, {
    width: signatureWidth,
    align: "center",
    lineGap: 1.5
  });
  const rightSignX = pageWidth - margin - signatureWidth;
  doc.fontSize(9).font("Helvetica-Bold").text("LOCAT\xC1RIO", rightSignX, currentY, {
    width: signatureWidth,
    align: "center",
    lineGap: 1.5
  });
  doc.fontSize(8).font("Helvetica").text(customer.name, rightSignX, doc.y + 3, {
    width: signatureWidth,
    align: "center",
    lineGap: 1.5
  });
  currentY = doc.y + 20;
  doc.fontSize(8).font("Helvetica").text(
    `S\xE3o Paulo, ${format(/* @__PURE__ */ new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
    margin,
    currentY,
    {
      width: contentWidth,
      align: "center",
      lineGap: 1.5
    }
  );
}
async function generateContractDocx(customer, rental, vehicle) {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 540,
            // 0.375 inches - margem segura para impressão
            bottom: 540,
            // 0.375 inches - margem segura para impressão
            left: 900,
            // 0.625 inches - margem segura para impressão
            right: 900
            // 0.625 inches - margem segura para impressão
          }
        }
      },
      children: [
        // Cabeçalho
        new Paragraph({
          text: "CONTRATO DE LOCA\xC7\xC3O DE VE\xCDCULO",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: "Imobilicar - Locadora de Ve\xEDculos",
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 }
        }),
        // LOCADOR
        new Paragraph({
          children: [
            new TextRun({
              text: "LOCADOR: ",
              bold: true
            }),
            new TextRun({
              text: "Imobilicar Locadora de Ve\xEDculos LTDA"
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: "CNPJ: 12.345.678/0001-90",
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: "Endere\xE7o: Rua das Locadoras, 123 - S\xE3o Paulo - SP",
          spacing: { after: 180 }
        }),
        // LOCATÁRIO
        new Paragraph({
          children: [
            new TextRun({
              text: "LOCAT\xC1RIO: ",
              bold: true
            }),
            new TextRun({
              text: customer.name
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: `CPF: ${customer.cpf}`,
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: `Email: ${customer.email}`,
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: `Telefone: ${customer.phone}`,
          spacing: { after: 80 }
        }),
        ...customer.street ? [
          new Paragraph({
            text: `Endere\xE7o: ${customer.street}, ${customer.number}${customer.complement ? `, ${customer.complement}` : ""} - ${customer.neighborhood}`,
            spacing: { after: 80 }
          }),
          new Paragraph({
            text: `Cidade/UF: ${customer.city} - ${customer.state}`,
            spacing: { after: 80 }
          }),
          new Paragraph({
            text: `CEP: ${customer.zipCode}`,
            spacing: { after: 180 }
          })
        ] : [
          new Paragraph({
            text: "",
            spacing: { after: 180 }
          })
        ],
        // OBJETO DO CONTRATO
        new Paragraph({
          text: "OBJETO DO CONTRATO",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Ve\xEDculo: ",
              bold: true
            }),
            new TextRun({
              text: vehicle.name
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Marca/Modelo: ",
              bold: true
            }),
            new TextRun({
              text: `${vehicle.brand} ${vehicle.model}`
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Ano: ",
              bold: true
            }),
            new TextRun({
              text: String(vehicle.year)
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Categoria: ",
              bold: true
            }),
            new TextRun({
              text: vehicle.category
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Transmiss\xE3o: ",
              bold: true
            }),
            new TextRun({
              text: vehicle.transmission
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Combust\xEDvel: ",
              bold: true
            }),
            new TextRun({
              text: vehicle.fuel
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Lugares: ",
              bold: true
            }),
            new TextRun({
              text: `${vehicle.seats} pessoas`
            })
          ],
          spacing: { after: 180 }
        }),
        // PERÍODO E VALORES
        new Paragraph({
          text: "PER\xCDODO DE LOCA\xC7\xC3O",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Data de In\xEDcio: ",
              bold: true
            }),
            new TextRun({
              text: format(new Date(rental.startDate), "dd/MM/yyyy", { locale: ptBR })
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Data de T\xE9rmino: ",
              bold: true
            }),
            new TextRun({
              text: format(new Date(rental.endDate), "dd/MM/yyyy", { locale: ptBR })
            })
          ],
          spacing: { after: 180 }
        }),
        new Paragraph({
          text: "VALORES",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Di\xE1ria: ",
              bold: true
            }),
            new TextRun({
              text: `R$ ${Number(vehicle.pricePerDay).toFixed(2)}`
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Valor Total: ",
              bold: true
            }),
            new TextRun({
              text: `R$ ${Number(rental.totalPrice).toFixed(2)}`,
              bold: true
            })
          ],
          spacing: { after: 180 }
        }),
        // CLÁUSULAS CONTRATUAIS
        new Paragraph({
          text: "CL\xC1USULAS CONTRATUAIS",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 1\xAA - DO OBJETO: ",
              bold: true
            }),
            new TextRun({
              text: "O presente contrato tem por objeto a loca\xE7\xE3o do ve\xEDculo acima descrito, em perfeitas condi\xE7\xF5es de uso, conserva\xE7\xE3o e funcionamento."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 2\xAA - DO PRAZO: ",
              bold: true
            }),
            new TextRun({
              text: "O prazo de loca\xE7\xE3o ser\xE1 conforme especificado acima, podendo ser prorrogado mediante acordo entre as partes."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 3\xAA - DO PAGAMENTO: ",
              bold: true
            }),
            new TextRun({
              text: "O LOCAT\xC1RIO se compromete a efetuar o pagamento do valor total da loca\xE7\xE3o no ato da retirada do ve\xEDculo."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 4\xAA - DAS RESPONSABILIDADES: ",
              bold: true
            }),
            new TextRun({
              text: "O LOCAT\xC1RIO assume total responsabilidade pelo ve\xEDculo durante o per\xEDodo de loca\xE7\xE3o, incluindo multas, danos e furtos."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 5\xAA - DA DEVOLU\xC7\xC3O: ",
              bold: true
            }),
            new TextRun({
              text: "O ve\xEDculo dever\xE1 ser devolvido nas mesmas condi\xE7\xF5es em que foi retirado, com o tanque de combust\xEDvel no mesmo n\xEDvel."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 6\xAA - DA QUILOMETRAGEM: ",
              bold: true
            }),
            new TextRun({
              text: "A loca\xE7\xE3o inclui quilometragem livre dentro do territ\xF3rio nacional."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 180 }
        }),
        // ASSINATURAS
        new Paragraph({
          text: "",
          spacing: { before: 180 },
          border: {
            top: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }),
        // Tabela de assinaturas
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "",
                      spacing: { before: 350 }
                    }),
                    new Paragraph({
                      text: "________________________________",
                      alignment: AlignmentType.CENTER
                    }),
                    new Paragraph({
                      text: "LOCADOR",
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 50 }
                    }),
                    new Paragraph({
                      text: "Imobilicar Locadora",
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                  }
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "",
                      spacing: { before: 350 }
                    }),
                    new Paragraph({
                      text: "________________________________",
                      alignment: AlignmentType.CENTER
                    }),
                    new Paragraph({
                      text: "LOCAT\xC1RIO",
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 50 }
                    }),
                    new Paragraph({
                      text: customer.name,
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                  }
                })
              ]
            })
          ]
        }),
        new Paragraph({
          text: `S\xE3o Paulo, ${format(/* @__PURE__ */ new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 }
        })
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}
function generateInvestorContractPdf(doc, investor, vehicles2) {
  const pageWidth = 595.28;
  const margin = 28.35;
  const topMargin = 14.17;
  const contentWidth = pageWidth - margin * 2;
  let currentY = topMargin + 18;
  doc.fontSize(16).font("Helvetica-Bold").text("CONTRATO DE PARCERIA - INVESTIMENTO EM VE\xCDCULOS", margin, currentY, {
    width: contentWidth,
    align: "center",
    lineGap: 2
  });
  currentY = doc.y + 8;
  doc.fontSize(10).font("Helvetica").text("Imobilicar - Locadora de Ve\xEDculos", margin, currentY, {
    width: contentWidth,
    align: "center",
    lineGap: 1
  });
  currentY = doc.y + 12;
  doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
  currentY += 15;
  doc.fontSize(11).font("Helvetica-Bold").text("CONTRATANTE: ", margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font("Helvetica").text("Imobilicar Locadora de Ve\xEDculos LTDA | CNPJ: 12.345.678/0001-90 | End: Rua das Locadoras, 123 - S\xE3o Paulo - SP", { lineGap: 1.5 });
  currentY = doc.y + 14;
  doc.fontSize(11).font("Helvetica-Bold").text("INVESTIDOR PARCEIRO: ", margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font("Helvetica").text(`${investor.name} | CPF: ${investor.cpf} | Email: ${investor.email} | Tel: ${investor.phone}`, { lineGap: 1.5 });
  currentY = doc.y + 14;
  doc.fontSize(11).font("Helvetica-Bold").text("VE\xCDCULOS DO INVESTIDOR", margin, currentY, { lineGap: 1.5 });
  currentY = doc.y + 10;
  doc.fontSize(8).font("Helvetica");
  vehicles2.forEach((vehicle, index2) => {
    doc.text(`${index2 + 1}. ${vehicle.name} - ${vehicle.brand} ${vehicle.model} ${vehicle.year} | ${vehicle.category} | ${vehicle.transmission} | ${vehicle.fuel} | Di\xE1ria: R$ ${Number(vehicle.pricePerDay).toFixed(2)}`, margin, currentY, {
      width: contentWidth,
      lineGap: 1.5
    });
    currentY = doc.y + 5;
  });
  currentY += 8;
  doc.fontSize(11).font("Helvetica-Bold").text("ESTAT\xCDSTICAS: ", margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font("Helvetica").text(`Total Ganho: R$ ${Number(investor.totalEarnings || 0).toFixed(2)} | Total de Ve\xEDculos: ${vehicles2.length} | Percentual: 70% para o investidor`, { lineGap: 1.5 });
  currentY = doc.y + 16;
  doc.fontSize(12).font("Helvetica-Bold").text("CL\xC1USULAS CONTRATUAIS", margin, currentY, { lineGap: 1.5 });
  currentY = doc.y + 10;
  doc.fontSize(8).font("Helvetica");
  const clauses = [
    "CL\xC1USULA 1\xAA - DA PARCERIA: O presente contrato estabelece parceria entre CONTRATANTE e INVESTIDOR para investimento em ve\xEDculos destinados \xE0 loca\xE7\xE3o.",
    "CL\xC1USULA 2\xAA - DO PERCENTUAL: O INVESTIDOR ter\xE1 direito a 70% dos valores recebidos pelas loca\xE7\xF5es dos ve\xEDculos de sua propriedade.",
    "CL\xC1USULA 3\xAA - DOS PAGAMENTOS: Os pagamentos ser\xE3o realizados mensalmente at\xE9 o 5\xBA dia \xFAtil do m\xEAs subsequente \xE0s loca\xE7\xF5es.",
    "CL\xC1USULA 4\xAA - DA MANUTEN\xC7\xC3O: A CONTRATANTE ser\xE1 respons\xE1vel pela manuten\xE7\xE3o preventiva e corretiva dos ve\xEDculos.",
    "CL\xC1USULA 5\xAA - DO SEGURO: Todos os ve\xEDculos dever\xE3o possuir seguro contra terceiros e cobertura de danos, custeado pela CONTRATANTE.",
    "CL\xC1USULA 6\xAA - DA GEST\xC3O: A CONTRATANTE ser\xE1 respons\xE1vel pela gest\xE3o operacional, incluindo divulga\xE7\xE3o, reservas e entregas.",
    "CL\xC1USULA 7\xAA - DA RESCIS\xC3O: Qualquer das partes poder\xE1 rescindir o contrato mediante aviso pr\xE9vio de 30 dias.",
    "CL\xC1USULA 8\xAA - DA EXCLUSIVIDADE: Os ve\xEDculos objeto deste contrato ser\xE3o administrados exclusivamente pela CONTRATANTE durante a vig\xEAncia.",
    "CL\xC1USULA 9\xAA - DAS RESPONSABILIDADES: O INVESTIDOR \xE9 propriet\xE1rio dos ve\xEDculos e respons\xE1vel por sua documenta\xE7\xE3o e regulariza\xE7\xE3o."
  ];
  const col1Width = (contentWidth - 18) / 2;
  const col2X = margin + col1Width + 18;
  const clausesPerColumn = 5;
  const clauseStartY = currentY;
  let col1Y = clauseStartY;
  for (let i = 0; i < clausesPerColumn; i++) {
    doc.text(clauses[i], margin, col1Y, {
      width: col1Width,
      align: "justify",
      lineGap: 1.5
    });
    col1Y = doc.y + 7;
  }
  let col2Y = clauseStartY;
  for (let i = clausesPerColumn; i < clauses.length; i++) {
    doc.text(clauses[i], col2X, col2Y, {
      width: col1Width,
      align: "justify",
      lineGap: 1.5
    });
    col2Y = doc.y + 7;
  }
  currentY = Math.max(col1Y, col2Y) + 15;
  doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
  currentY += 45;
  const signatureWidth = (contentWidth - 55) / 2;
  doc.moveTo(margin, currentY).lineTo(margin + signatureWidth, currentY).stroke();
  doc.moveTo(pageWidth - margin - signatureWidth, currentY).lineTo(pageWidth - margin, currentY).stroke();
  currentY += 8;
  doc.fontSize(9).font("Helvetica-Bold").text("CONTRATANTE", margin, currentY, {
    width: signatureWidth,
    align: "center",
    lineGap: 1.5
  });
  doc.fontSize(8).font("Helvetica").text("Imobilicar Locadora", margin, doc.y + 3, {
    width: signatureWidth,
    align: "center",
    lineGap: 1.5
  });
  const rightSignX = pageWidth - margin - signatureWidth;
  doc.fontSize(9).font("Helvetica-Bold").text("INVESTIDOR PARCEIRO", rightSignX, currentY, {
    width: signatureWidth,
    align: "center",
    lineGap: 1.5
  });
  doc.fontSize(8).font("Helvetica").text(investor.name, rightSignX, doc.y + 3, {
    width: signatureWidth,
    align: "center",
    lineGap: 1.5
  });
  currentY = doc.y + 20;
  doc.fontSize(8).font("Helvetica").text(
    `S\xE3o Paulo, ${format(/* @__PURE__ */ new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
    margin,
    currentY,
    {
      width: contentWidth,
      align: "center",
      lineGap: 1.5
    }
  );
}
async function generateInvestorContractDocx(investor, vehicles2) {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 540,
            bottom: 540,
            left: 900,
            right: 900
          }
        }
      },
      children: [
        new Paragraph({
          text: "CONTRATO DE PARCERIA - INVESTIMENTO EM VE\xCDCULOS",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: "Imobilicar - Locadora de Ve\xEDculos",
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CONTRATANTE: ",
              bold: true
            }),
            new TextRun({
              text: "Imobilicar Locadora de Ve\xEDculos LTDA"
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: "CNPJ: 12.345.678/0001-90",
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: "Endere\xE7o: Rua das Locadoras, 123 - S\xE3o Paulo - SP",
          spacing: { after: 180 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "INVESTIDOR PARCEIRO: ",
              bold: true
            }),
            new TextRun({
              text: investor.name
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: `CPF: ${investor.cpf}`,
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: `Email: ${investor.email}`,
          spacing: { after: 80 }
        }),
        new Paragraph({
          text: `Telefone: ${investor.phone}`,
          spacing: { after: 180 }
        }),
        new Paragraph({
          text: "VE\xCDCULOS DO INVESTIDOR",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 }
        }),
        ...vehicles2.map(
          (vehicle, index2) => new Paragraph({
            text: `${index2 + 1}. ${vehicle.name} - ${vehicle.brand} ${vehicle.model} ${vehicle.year} | ${vehicle.category} | ${vehicle.transmission} | ${vehicle.fuel} | Di\xE1ria: R$ ${Number(vehicle.pricePerDay).toFixed(2)}`,
            spacing: { after: 80 }
          })
        ),
        new Paragraph({
          text: "ESTAT\xCDSTICAS",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Total Ganho: ",
              bold: true
            }),
            new TextRun({
              text: `R$ ${Number(investor.totalEarnings || 0).toFixed(2)}`
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Total de Ve\xEDculos: ",
              bold: true
            }),
            new TextRun({
              text: `${vehicles2.length}`
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Percentual: ",
              bold: true
            }),
            new TextRun({
              text: "70% para o investidor"
            })
          ],
          spacing: { after: 180 }
        }),
        new Paragraph({
          text: "CL\xC1USULAS CONTRATUAIS",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 1\xAA - DA PARCERIA: ",
              bold: true
            }),
            new TextRun({
              text: "O presente contrato estabelece parceria entre CONTRATANTE e INVESTIDOR para investimento em ve\xEDculos destinados \xE0 loca\xE7\xE3o."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 2\xAA - DO PERCENTUAL: ",
              bold: true
            }),
            new TextRun({
              text: "O INVESTIDOR ter\xE1 direito a 70% dos valores recebidos pelas loca\xE7\xF5es dos ve\xEDculos de sua propriedade."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 3\xAA - DOS PAGAMENTOS: ",
              bold: true
            }),
            new TextRun({
              text: "Os pagamentos ser\xE3o realizados mensalmente at\xE9 o 5\xBA dia \xFAtil do m\xEAs subsequente \xE0s loca\xE7\xF5es."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 4\xAA - DA MANUTEN\xC7\xC3O: ",
              bold: true
            }),
            new TextRun({
              text: "A CONTRATANTE ser\xE1 respons\xE1vel pela manuten\xE7\xE3o preventiva e corretiva dos ve\xEDculos."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 5\xAA - DO SEGURO: ",
              bold: true
            }),
            new TextRun({
              text: "Todos os ve\xEDculos dever\xE3o possuir seguro contra terceiros e cobertura de danos, custeado pela CONTRATANTE."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 6\xAA - DA GEST\xC3O: ",
              bold: true
            }),
            new TextRun({
              text: "A CONTRATANTE ser\xE1 respons\xE1vel pela gest\xE3o operacional, incluindo divulga\xE7\xE3o, reservas e entregas."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 7\xAA - DA RESCIS\xC3O: ",
              bold: true
            }),
            new TextRun({
              text: "Qualquer das partes poder\xE1 rescindir o contrato mediante aviso pr\xE9vio de 30 dias."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 8\xAA - DA EXCLUSIVIDADE: ",
              bold: true
            }),
            new TextRun({
              text: "Os ve\xEDculos objeto deste contrato ser\xE3o administrados exclusivamente pela CONTRATANTE durante a vig\xEAncia."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CL\xC1USULA 9\xAA - DAS RESPONSABILIDADES: ",
              bold: true
            }),
            new TextRun({
              text: "O INVESTIDOR \xE9 propriet\xE1rio dos ve\xEDculos e respons\xE1vel por sua documenta\xE7\xE3o e regulariza\xE7\xE3o."
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 180 }
        }),
        new Paragraph({
          text: "",
          spacing: { before: 180 },
          border: {
            top: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }),
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "",
                      spacing: { before: 350 }
                    }),
                    new Paragraph({
                      text: "________________________________",
                      alignment: AlignmentType.CENTER
                    }),
                    new Paragraph({
                      text: "CONTRATANTE",
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 50 }
                    }),
                    new Paragraph({
                      text: "Imobilicar Locadora",
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                  }
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "",
                      spacing: { before: 350 }
                    }),
                    new Paragraph({
                      text: "________________________________",
                      alignment: AlignmentType.CENTER
                    }),
                    new Paragraph({
                      text: "INVESTIDOR PARCEIRO",
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 50 }
                    }),
                    new Paragraph({
                      text: investor.name,
                      alignment: AlignmentType.CENTER
                    })
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                  }
                })
              ]
            })
          ]
        }),
        new Paragraph({
          text: `S\xE3o Paulo, ${format(/* @__PURE__ */ new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 }
        })
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}
async function generateInvestorCessionContractDocx(customer, vehicle, customDividend, bonusValue, debitosVeiculo, paymentDate) {
  const currentDate = format(/* @__PURE__ */ new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  let logoBuffer = null;
  try {
    const logoPath = path.join(process.cwd(), "client", "public", "logo-contract.png");
    if (fs.existsSync(logoPath)) {
      logoBuffer = fs.readFileSync(logoPath);
    } else {
      const fallbackPath = path.join(process.cwd(), "client", "public", "logo.png");
      if (fs.existsSync(fallbackPath)) {
        logoBuffer = fs.readFileSync(fallbackPath);
      }
    }
  } catch (error) {
    console.error("Error loading logo:", error);
  }
  const formatCurrency = (value) => {
    if (!value) return "0,00";
    const num = typeof value === "string" ? parseFloat(value.replace(/[^\d,.]/g, "").replace(",", ".")) : value;
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const numberToWords = (num) => {
    const units = ["", "um", "dois", "tr\xEAs", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    if (num === 0) return "zero";
    if (num === 100) return "cem";
    let words = "";
    if (num >= 1e3) {
      const thousands = Math.floor(num / 1e3);
      words += thousands === 1 ? "mil" : units[thousands] + " mil";
      num %= 1e3;
      if (num > 0) words += " e ";
    }
    if (num >= 100) {
      words += hundreds[Math.floor(num / 100)];
      num %= 100;
      if (num > 0) words += " e ";
    }
    if (num >= 20) {
      words += tens[Math.floor(num / 10)];
      num %= 10;
      if (num > 0) words += " e ";
    } else if (num >= 10) {
      words += teens[num - 10];
      num = 0;
    }
    if (num > 0) words += units[num];
    return words;
  };
  const dividendValue = parseFloat(customDividend?.replace(/[^\d,.]/g, "").replace(",", ".") || "0");
  const dividendWords = numberToWords(Math.floor(dividendValue)) + " reais";
  const bonusVal = parseFloat(bonusValue?.replace(/[^\d,.]/g, "").replace(",", ".") || "0");
  const bonusWords = numberToWords(Math.floor(bonusVal)) + " reais";
  const customerAddress = `${customer.street || ""}${customer.number ? `, n\xBA${customer.number}` : ""}${customer.neighborhood ? ` - ${customer.neighborhood}` : ""}${customer.city ? ` - ${customer.city}/${customer.state}` : ""}${customer.zipCode ? ` - CEP ${customer.zipCode}` : ""}`;
  const vehicleBrand = vehicle.brand || "";
  const vehicleModel = vehicle.model || vehicle.name || "";
  const vehicleYear = vehicle.year || "";
  const vehiclePlate = vehicle.licensePlate || vehicle.plate || "";
  const vehicleRenavam = vehicle.renavam || "";
  const vehicleChassi = vehicle.chassi || "";
  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
  };
  const thinBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
  };
  const investorContractDoc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 24 },
          paragraph: { spacing: { line: 276, after: 0 } }
        }
      },
      paragraphStyles: [{
        id: "Normal",
        name: "Normal",
        run: { font: "Times New Roman", size: 24 },
        paragraph: { spacing: { line: 276, after: 0 } }
      }]
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1134 },
          size: { width: 11906, height: 16838 }
        }
      },
      children: [
        // Logo da Imobilicar no topo (proporção 1:1 - quadrada)
        ...logoBuffer ? [
          new Paragraph({
            children: [
              new ImageRun({
                data: logoBuffer,
                transformation: { width: 120, height: 120 },
                type: "png"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          })
        ] : [],
        new Paragraph({
          children: [new TextRun({ text: "CONTRATO DE LOCA\xC7\xC3O DE VE\xCDCULO COM RESPONSABILIDADE EXCLUSIVA DA LOCADORA", bold: true, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 }
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CONTRATANTE: ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: `${customer.name?.toUpperCase() || ""}, brasileiro, inscrito no CPF sob o n\xBA ${customer.cpf}${customer.rg ? ` e portador da c\xE9dula de identidade R.G. sob o n\xBA ${customer.rg}` : ""}, residente e domiciliado \xE0 ${customerAddress}. N\xFAmero para contato: ${customer.phone || ""} e e-mail: ${customer.email || ""}`, font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CONTRATADA: ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "IMOBILICAR LOCA\xC7\xC3O DE VE\xCDCULOS, pessoa jur\xEDdica de direito privado, inscrito no CNPJ sob o n\xBA 61.363.556/0001-37, localizada na Rua Ant\xF4nio Cardoso Franco, n\xBA 237 Casa Branca - Santo Andr\xE9/SP - CEP 09015-530. N\xFAmero para contato: 11 9 5190-5499 e e-mail: administracao@imobilicar.com.br", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "as partes por livre e espont\xE2nea vontade resolvem celebrar o presente instrumento, que ser\xE1 regido pelas seguintes cl\xE1usulas e condi\xE7\xF5es, mutuamente outorgadas e aceitas, conforme descrito a seguir:", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "DO OBJETO DO CONTRATO", bold: true, font: "Times New Roman", size: 24 })]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 1\xBA - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O presente contrato tem por objeto a cess\xE3o tempor\xE1ria de uso do de propriedade do CONTRATANTE, para ser agregado \xE0 frota da CONTRATADA, que o destinar\xE1 \xE0 atividade de loca\xE7\xE3o para terceiros, notadamente motorista de aplicativo de carona compartilhada, e/ou outras atividades l\xEDcitas. Este contrato n\xE3o gera v\xEDnculo empregat\xEDcio, societ\xE1rio, associa\xE7\xE3o ou representa\xE7\xE3o comercial entre as partes, tendo natureza estritamente civil.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 1.1 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: `Para a realiza\xE7\xE3o da presta\xE7\xE3o dos servi\xE7os, o CONTRATANTE disponibilizar\xE1 \xE0 CONTRATADA o seguinte ve\xEDculo de sua propriedade para intermedia\xE7\xE3o da loca\xE7\xE3o: Marca ${vehicleBrand} ${vehicleModel} - Ano/Mod. ${vehicleYear} - Placa ${vehiclePlate}${vehicleRenavam ? ` - RENAVAM ${vehicleRenavam}` : ""}${vehicleChassi ? ` - CHASSI ${vehicleChassi}` : ""}`, font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "D\xC9BITOS DO VE\xCDCULO: ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: debitosVeiculo || "(A preencher)", font: "Times New Roman", size: 24 })
          ]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "Conforme fotos e vistoria feita pelo checkandoapp anexos a este instrumento, e vistoriado pela pr\xF3pria CONTRATADA, quando no ato da ades\xE3o entregue pelo CONTRATANTE", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 1.2 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O CONTRATANTE dever\xE1 fornecer \xE0 CONTRATADA os documentos de porte obrigat\xF3rio para a condu\xE7\xE3o do ve\xEDculo, incluindo as chaves, comprovante de pagamento do IPVA, licenciamento, al\xE9m de outros documentos pertinentes que a CONTRATADA vier a solicitar no in\xEDcio da contrata\xE7\xE3o, caso o ve\xEDculo esteja financiado, dever\xE1 enviar o comprovante de pagamento sempre que solicitado.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "DO REPASSE FINANCEIRO", bold: true, font: "Times New Roman", size: 24 })]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 2\xBA - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: `A CONTRATADA efetuar\xE1 ao CONTRATANTE um repasse mensal no valor de R$${formatCurrency(customDividend)} (${dividendWords.charAt(0).toUpperCase() + dividendWords.slice(1)}), dia ${paymentDate} (${numberToWords(parseInt(paymentDate)).charAt(0).toUpperCase() + numberToWords(parseInt(paymentDate)).slice(1)}) de cada m\xEAs vigente, conforme acordado previamente entre as partes para cess\xE3o do ve\xEDculo a frota.`, font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [new TextRun({ text: "O repasse ocorrer\xE1 independentemente do ve\xEDculo em quest\xE3o estar ou n\xE3o locado, salvo nas hip\xF3teses de sinistro com perda parcial ou total, roubo sem recupera\xE7\xE3o, indisponibilidade por mais de 15 (Quinze) dias ou por falta de procura na loca\xE7\xE3o do modelo do ve\xEDculo por mais de 30 (trinta) dias.", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({
          children: [new TextRun({ text: "O pagamento ser\xE1 realizado via PIX/Transfer\xEAncia Banc\xE1ria, na conta de titularidade do CONTRATANTE", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 2.1 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: `A CONTRATADA ir\xE1 pagar o valor de R$${formatCurrency(bonusValue)} (${bonusWords.charAt(0).toUpperCase() + bonusWords.slice(1)}) para o CONTRATANTE em forma de b\xF4nus por agregar o ve\xEDculo na frota, at\xE9 7 (Sete) dias \xFAteis ap\xF3s a assinatura do contrato`, font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 2.2. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O valor gasto pela CONTRATADA para prepara\xE7\xE3o do ve\xEDculo ser\xE1 abatido automaticamente do b\xF4nus por agregar e/ou do primeiro repasse ao CONTRATANTE, conforme tabela abaixo:", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ITENS VERIFICADOS", bold: true, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders, width: { size: 60, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "VALOR DE DESCONTO", bold: true, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders, width: { size: 40, type: WidthType.PERCENTAGE } })
              ]
            }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TROCA DE \xD3LEO + FILTRO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 250,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PNEU (UNIDADE)", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 120,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MANUTEN\xC7\xC3O SIMPLES DO AR-CONDICIONADO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 200,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "REPARO COMPLETO DO AR-CONDICIONADO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 500,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FREIO E PASTILHAS", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 500,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FUNILARIA (POR PE\xC7A)", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 300,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "EMBREAGEM", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 600,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MOTOR E C\xC2MBIO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "A AVALIAR", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "BATERIA", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 300,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CHAVE", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 50,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] })
          ]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "DAS RESPONSABILIDADES", bold: true, font: "Times New Roman", size: 24 })]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 3\xBA - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "A CONTRATADA compromete-se a gerenciar o ve\xEDculo durante toda a sua perman\xEAncia na sua frota, realizar a loca\xE7\xE3o do mesmo a terceiros, zelar pela conserva\xE7\xE3o do ve\xEDculo. Despesas como manuten\xE7\xE3o corretiva e preventiva (exceto se decorrentes de v\xEDcios ocultos anteriores \xE0 entrega), seguro total do bem (Contra roubo e/ou furto, colis\xF5es e danos a terceiros) e multas enquanto o presente contrato estiver vigente.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 3.1. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: 'A CONTRATADA ir\xE1 realizar o Check-in de entrada, com registros fotogr\xE1ficos e vistoria das condi\xE7\xF5es mec\xE2nicas, est\xE9ticas e documentais do ve\xEDculo no momento da entrega. O mesmo ser\xE1 feito pelo "APPCHECKANDO". Ao t\xE9rmino do contrato ser\xE1 efetuado o mesmo procedimento no Check-out, devendo ser devolvido o ve\xEDculo nas mesmas condi\xE7\xF5es, salvo o desgaste natural do uso.', font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 3.2 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O CONTRATANTE compromete-se a entregar o ve\xEDculo em perfeitas condi\xE7\xF5es de uso, manuten\xE7\xE3o e documenta\xE7\xE3o regularizada. Responsabiliza-se tamb\xE9m pelos encargos de propriedade (IPVA, licenciamento, multas e seguro) at\xE9 a data do presente contrato, bem como, livre de restri\xE7\xF5es administrativas e judiciais.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 3.3 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "\xC9 dever do CONTRATANTE pagar as despesas anuais como IPVA e Licenciamento, tendo a op\xE7\xE3o da CONTRATADA efetuar o pagamento e descontar do repasse mensal.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "DAS MULTAS E INFRA\xC7\xD5ES", bold: true, font: "Times New Roman", size: 24 })]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 4\xBA - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Quaisquer multas e/ou infra\xE7\xF5es de tr\xE2nsito e administrativas durante todo o per\xEDodo de agrega\xE7\xE3o junto a locadora, ser\xE1 de inteira responsabilidade da CONTRATADA e/ou motorista locat\xE1rio. A CONTRATADA se compromete a informar o \xF3rg\xE3o autuador sobre o condutor respons\xE1vel, bem como fazer a transfer\xEAncia de pontua\xE7\xE3o, quando notificada.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 4.1. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Multas retroativas e/ou anteriores a vig\xEAncia desse contrato, s\xE3o de exclusiva responsabilidade do CONTRATANTE", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "DO SINISTRO E AVARIAS", bold: true, font: "Times New Roman", size: 24 })]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 5\xBA - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Em caso de sinistro, a CONTRATADA tem o dever de informar imediatamente o ocorrido a associa\xE7\xE3o e tamb\xE9m ao CONTRATANTE.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 5.1. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Em caso de roubo/furto n\xE3o recuperado ou perda total, a CONTRATADA compromete-se a tomar a frente junto a associa\xE7\xE3o KONG para que o mesmo fa\xE7a o pagamento ao CONTRATANTE no valor integral da tabela FIPE do ve\xEDculo, na data do evento. Ser\xE1 descontado os valores de franquias, se aplic\xE1veis, conforme contrato com a associa\xE7\xE3o veicular. A indeniza\xE7\xE3o tem o prazo conforme contrato assinado com a associa\xE7\xE3o, a ser contado a partir da comunica\xE7\xE3o formal do sinistro.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 5.2. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Em caso de avarias parciais, a CONTRATADA ser\xE1 respons\xE1vel pelos reparos.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "DA MANUTEN\xC7\xC3O", bold: true, font: "Times New Roman", size: 24 })]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 6\xBA - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "As manuten\xE7\xF5es corretivas e preventivas decorrentes do uso normal, s\xE3o de responsabilidade da CONTRATADA. J\xE1 as manuten\xE7\xF5es estruturais de longo prazo, s\xE3o de responsabilidade do CONTRATANTE, salvo o uso decorrentes de mau uso ou avarias.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "VIG\xCANCIA E RESCIS\xC3O", bold: true, font: "Times New Roman", size: 24 })]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 7\xBA - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O presente contrato vigorar\xE1 por prazo indeterminado, podendo ser rescindido por qualquer das partes, mediante aviso pr\xE9vio de 30 (Trinta) dias. No caso de descumprimento por parte do CONTRATANTE, ser\xE1 acarretado uma multa no valor de R$1.900,00 (Hum mil e novecentos reais)", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 7.1. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Caso o CONTRATANTE necessite retirar o ve\xEDculo antes do prazo de 30 (Trinta) dias, ser\xE1 cobrado o valor de 2 (Duas) mensalidades, a taxa de remo\xE7\xE3o do ve\xEDculo no valor de R$500,00 (Quinhentos reais), o seguro e o valor do b\xF4nus por agregar.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 7.2. ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O contrato ser\xE1 imediatamente cancelado se a CONTRATADA descobrir informa\xE7\xF5es inver\xEDdicas por parte do CONTRATANTE, determina\xE7\xE3o judicial e/ou problemas mec\xE2nicos graves.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "DAS DISPOSI\xC7\xD5ES FINAIS E DO FORO", bold: true, font: "Times New Roman", size: 24 })]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "CL\xC1USULA 8\xBA - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O CONTRATANTE declara estar ciente e de acordo com todas as condi\xE7\xF5es acima citadas. O presente contrato obriga as partes seus herdeiros e sucessores.", font: "Times New Roman", size: 24 })
          ],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "As partes elegem o foro da comarca de Santo Andr\xE9/SP para dirimir quaisquer d\xFAvidas, lit\xEDgios decorrentes e/ou controv\xE9rsias deste contrato.", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "E, por assim justos e contratados firmam o presente contrato em 2 (Duas) vias de igual teor.", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: `Santo Andr\xE9, ${currentDate}`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "______________________________________", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: customer.name?.toUpperCase() || "CONTRATANTE", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: `CPF n\xBA ${customer.cpf}`, font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER })
                ],
                borders: noBorders,
                width: { size: 50, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "___________________________________", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "IMOBILICAR LOCA\xC7\xC3O DE VE\xCDCULOS", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "CNPJ n\xBA 61.363.556/0001-37", font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER })
                ],
                borders: noBorders,
                width: { size: 50, type: WidthType.PERCENTAGE }
              })
            ]
          })]
        }),
        new Paragraph({
          children: [new PageBreak()]
        }),
        new Paragraph({
          children: [new TextRun({ text: "TABELA M\xC9DIA DE VALORES DE PREPARA\xC7\xC3O", bold: true, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ITEM DE REVIS\xC3O/AJUSTE", bold: true, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders, width: { size: 60, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "VALOR DE REFER\xCANCIA", bold: true, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders, width: { size: 40, type: WidthType.PERCENTAGE } })
              ]
            }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TROCA DE \xD3LEO + FILTRO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$250,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PNEU (UNIDADE)", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$120,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MANUTEN\xC7\xC3O SIMPLES DO AR", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$200,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "REPARO COMPLETO DO AR", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$500,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PASTILHAS E REVIS\xC3O DE FREIO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$500,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FUNILARIA (POR PE\xC7A)", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$300,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TROCA DE EMBREAGEM", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$600,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MOTOR - DIAGN\xD3STICO E REPARO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "A AVALIAR - ESTIMATIVA DE GARANTIA DE 6 MESES", font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "INSTALA\xC7\xC3O DE RASTREADOR", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$79,90 MENSAL", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] })
          ]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: `Eu, ${customer.name?.toUpperCase() || "CONTRATANTE"}, brasileiro, inscrito no CPF sob o n\xBA ${customer.cpf}${customer.rg ? ` e portador da c\xE9dula de identidade R.G. sob o n\xBA ${customer.rg}` : ""}, residente e domiciliado \xE0 ${customerAddress}. N\xFAmero para contato: ${customer.phone || ""} e e-mail: ${customer.email || ""}, declaro que estou ciente e de acordo com os termos aqui dispostos, especialmente quando:`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "\xC0 eventual necessidade de reparos mec\xE2nicos e est\xE9ticos do ve\xEDculo, aos valores de refer\xEAncia acima citados para tal fim, \xE0 dedu\xE7\xE3o autom\xE1tica dos valores acima mencionados, ao prazo de at\xE9 7 (Sete) dias \xFAteis para o preparo do ve\xEDculo e da obrigatoriedade de instala\xE7\xE3o do rastreador.", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: `Santo Andr\xE9, ${currentDate}`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: "" }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "______________________________________", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: customer.name?.toUpperCase() || "CONTRATANTE", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: `CPF n\xBA ${customer.cpf}`, font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER })
                ],
                borders: noBorders,
                width: { size: 50, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "___________________________________", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "IMOBILICAR LOCA\xC7\xC3O DE VE\xCDCULOS", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "CNPJ n\xBA 61.363.556/0001-37", font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER })
                ],
                borders: noBorders,
                width: { size: 50, type: WidthType.PERCENTAGE }
              })
            ]
          })]
        }),
        new Paragraph({
          children: [new PageBreak()]
        }),
        new Paragraph({
          children: [new TextRun({ text: "PROCURA\xC7\xC3O PARTICULAR", bold: true, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: `Pelo presente instrumento particular de procura\xE7\xE3o, ${customer.name?.toUpperCase() || "CONTRATANTE"}, brasileiro, inscrito no CPF sob o n\xBA ${customer.cpf}${customer.rg ? ` e portador da c\xE9dula de identidade R.G. sob o n\xBA ${customer.rg}` : ""}, residente e domiciliado \xE0 ${customerAddress}. N\xFAmero para contato: ${customer.phone || ""} e e-mail: ${customer.email || ""}, nomeia e constitui seu bastante procurador WALLACE DA SILVA NASCIMENTO, brasileiro, inscrito no CPF sob o n\xBA 373.988.978-04 e portador da c\xE9dula de identidade R.G. sob o n\xBA 48.294.418-3, residente e domiciliado \xE0 Rua Ant\xF4nio Cardoso Franco, n\xBA237 - Casa Branca - Santo Andr\xE9/SP - CEP 09015-530, e, a quem concede plenos poderes a fim de que possa defender os direitos e interesses do(a) OUTORGANTE junto ao DETRAN, podendo solicitar libera\xE7\xE3o do p\xE1tio e do substabelecimento, solicitar 2\xAA via de CRLV, autorizar e acompanhar vistorias, efetuar pagamentos, formular requerimentos, interpor recursos, reclamar, desistir, solicitar c\xF3pias de processos, locar, al\xE9m de ter acesso a documentos de qualquer natureza, nos termos da Portaria Detran n\xBA 1680, Cap. II, Art. 8, Par\xE1grafo VI, referente ao VE\xCDCULO:`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "MARCA/MODELO: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: `${vehicleBrand.toUpperCase()} ${vehicleModel.toUpperCase()}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: "ANO/MODELO: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: String(vehicleYear), font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: "PLACA: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: vehiclePlate || "\u2014", font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: "CHASSI: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: vehicleChassi || "\u2014", font: "Times New Roman", size: 24 }), new TextRun({ text: " RENAVAM: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: vehicleRenavam || "\u2014", font: "Times New Roman", size: 24 })] }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "Obs: Procura\xE7\xE3o v\xE1lida por 1 (um) ano a partir da data do reconhecimento da declara\xE7\xE3o.", font: "Times New Roman", size: 24 })]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: `Santo Andr\xE9, ${currentDate}`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "________________________________________________________________", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `   ${customer.name?.toUpperCase() || "CONTRATANTE"} `, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })
      ]
    }]
  });
  return await Packer.toBuffer(investorContractDoc);
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
import { nanoid } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const react = (await import("@vitejs/plugin-react")).default;
  const viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path2.resolve(process.cwd(), "client", "src"),
        "@shared": path2.resolve(process.cwd(), "shared")
      }
    },
    root: path2.resolve(process.cwd(), "client"),
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        if (msg.includes("failed to load module")) return;
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        process.cwd(),
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(process.cwd(), "dist", "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "200mb" }));
app.use(express2.urlencoded({ extended: false, limit: "200mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });
  next();
});
var isInitialized = false;
var initializationPromise = (async () => {
  try {
    const server = await registerRoutes(app);
    app.use("/attached_assets", express2.static("attached_assets"));
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
      const port = parseInt(process.env.PORT || "5000", 10);
      server.listen({
        port,
        host: "0.0.0.0"
      }, () => {
        log(`serving on port ${port}`);
      });
    }
    isInitialized = true;
    return server;
  } catch (error) {
    log(`Initialization error: ${error}`);
    throw error;
  }
})();
var index_default = async (req, res) => {
  await initializationPromise;
  return app(req, res);
};
export {
  index_default as default
};
