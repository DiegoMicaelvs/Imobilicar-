import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tables must be defined before references - we'll add references after all tables are declared

export const vehicles = pgTable("vehicles", {
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
  ownerId: varchar("owner_id").$type<string | null>().references(() => customers.id, { onDelete: "set null" }), // ID do cliente/investidor proprietário
  investorPercentage: integer("investor_percentage").$type<number | null>().default(70),
  licensePlate: text("license_plate"),
  renavam: text("renavam"), // Registro Nacional de Veículos Automotores (11 dígitos)
  chassi: text("chassi"), // Número do Chassi do veículo (17 caracteres)
  fipeValue: decimal("fipe_value", { precision: 10, scale: 2 }), // Valor FIPE do veículo
  customDividend: decimal("custom_dividend", { precision: 10, scale: 2 }), // Dividendo customizado definido manualmente pelo admin (quando não há quota)
  isPubliclyVisible: boolean("is_publicly_visible").notNull().default(true), // Controla se o veículo é visível no frontend público
  // Campos para veículos de troca
  isTradeIn: boolean("is_trade_in").notNull().default(false), // Indica se o veículo veio de troca
  tradeInValue: decimal("trade_in_value", { precision: 10, scale: 2 }), // Valor aceito na troca
  tradeInCustomerName: text("trade_in_customer_name"), // Nome do cliente que fez a troca
  tradeInStatus: text("trade_in_status"), // Status: em_estoque, vendido, avaliacao
  // Quilometragem
  mileage: integer("mileage"), // Quilometragem atual do veículo (em KM)
  // Informações adicionais do veículo
  hasInsurance: boolean("has_insurance").notNull().default(false), // Possui seguro
  insuranceValue: decimal("insurance_value", { precision: 10, scale: 2 }), // Valor do seguro (quando possui)
  ipvaStatus: text("ipva_status"), // Status do IPVA: "pago", "nao_pago", "isento"
  ipvaValue: decimal("ipva_value", { precision: 10, scale: 2 }), // Valor do IPVA (quando pago)
  // Documentos do veículo (para veículos de investimento)
  crlvDocumentUrl: text("crlv_document_url"), // CRLV (Certificado de Registro e Licenciamento do Veículo)
  laudoCautelarUrl: text("laudo_cautelar_url"), // Laudo Cautelar
  laudoMecanicoUrl: text("laudo_mecanico_url"), // Laudo Mecânico
  otherDocumentsUrls: text("other_documents_urls").array(), // Outros documentos do veículo
  // Informações adicionais do veículo (wizard de investimento)
  temDocumento: boolean("tem_documento"), // Tem documento?
  observacoesDocumento: text("observacoes_documento"), // Observações sobre documentação
  licenciamentoPago: boolean("licenciamento_pago"), // Licenciamento pago?
  observacoesLicenciamento: text("observacoes_licenciamento"), // Observações sobre licenciamento
  taFinanciado: boolean("ta_financiado"), // Tá financiado?
  observacoesFinanciado: text("observacoes_financiado"), // Observações sobre financiamento
  eDeLeilao: boolean("e_de_leilao"), // É de leilão?
  observacoesLeilao: text("observacoes_leilao"), // Observações sobre leilão
  temRastreador: boolean("tem_rastreador"), // Tem rastreador?
  localizacaoRastreador: text("localizacao_rastreador"), // Localização do rastreador no veículo
  problemaMecanico: text("problema_mecanico"), // Descrição de problemas mecânicos ou elétricos
  // Contrato de cessão do investimento (por veículo)
  investmentContractUrl: text("investment_contract_url"), // URL/Base64 do contrato de cessão para este veículo
  investmentContractFileName: text("investment_contract_file_name"), // Nome do arquivo do contrato
  // Bônus por agregar (por veículo) - pagamento único pela adição do veículo à frota
  bonusDate: text("bonus_date"), // Data específica do pagamento do bônus (ex: "15/12/2025")
  bonusValue: decimal("bonus_value", { precision: 10, scale: 2 }), // Valor do bônus a ser pago
  // Data de pagamento individual do veículo - pode ter múltiplas datas (ex: "16/20/30")
  paymentDate: text("payment_date"), // Dia(s) do mês para pagamento de dividendos deste veículo
  // Avarias do veículo
  hasDamage: boolean("has_damage").notNull().default(false), // Existe avaria no veículo?
  damageDescription: text("damage_description"), // Descrição detalhada da avaria
});

export const rentals = pgTable("rentals", {
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
  guarantorDocumentUrl: text("guarantor_document_url"), // Foto do documento com foto (CNH/RG)
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
  hasCheckin: boolean("has_checkin").notNull().default(false), // Flag para indicar se check-in foi realizado
  hasCheckout: boolean("has_checkout").notNull().default(false), // Flag para indicar se check-out foi realizado
  checkInImages: text("check_in_images").array(), // URLs das imagens do check-in
  checkOutImages: text("check_out_images").array(), // URLs das imagens do check-out
  checkInDate: timestamp("check_in_date"),
  checkOutDate: timestamp("check_out_date"),
  checkInNotes: text("check_in_notes"),
  checkOutNotes: text("check_out_notes"),
  // Workflow de Aprovação
  checkinCompletedAt: timestamp("checkin_completed_at"), // Data de conclusão do check-in (9 fotos obrigatórias)
  contractGeneratedAt: timestamp("contract_generated_at"), // Data de geração do contrato
  contractUrl: text("contract_url"), // URL do contrato assinado
  paymentMethod: text("payment_method"), // Método de pagamento (dinheiro, pix, cartao_credito, etc)
  paymentProofUrl: text("payment_proof_url"), // URL do comprovante de pagamento
  paymentVerifiedAt: timestamp("payment_verified_at"), // Data de verificação do pagamento
  // Checkout/Devolução
  checkoutCompletedAt: timestamp("checkout_completed_at"), // Data de conclusão do checkout
  // Checkpoint - Análise Crítica
  checkpointTiresSame: boolean("checkpoint_tires_same"), // Os pneus são os mesmos do check-in?
  checkpointFuelSame: boolean("checkpoint_fuel_same"), // O combustível está igual ao check-in?
  checkpointHasDamages: boolean("checkpoint_has_damages"), // Tem avarias?
  checkpointDamagesNotes: text("checkpoint_damages_notes"), // Observações sobre avarias
  checkpointRepairCost: decimal("checkpoint_repair_cost", { precision: 10, scale: 2 }), // Custo de reparos
  repairPaid: boolean("repair_paid").default(false), // Status de pagamento do reparo
  // Encerramento
  finalizationDebtAmount: decimal("finalization_debt_amount", { precision: 10, scale: 2 }), // Valor de débitos pendentes
  finalizationPaymentMethod: text("finalization_payment_method"), // Método de pagamento dos débitos
  finalizationContractUrl: text("finalization_contract_url"), // URL do contrato de entrega
  finalizedAt: timestamp("finalized_at"), // Data de finalização do contrato
  selectedPlanIds: text("selected_plan_ids").array(), // IDs dos planos de aluguel selecionados
  // Bonificação/Desconto
  bonusDiscountUsed: decimal("bonus_discount_used", { precision: 10, scale: 2 }).default("0"), // Valor de bonificação usado neste aluguel
  priceBeforeDiscount: decimal("price_before_discount", { precision: 10, scale: 2 }), // Preço original antes do desconto de bonificação
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  createdAtIdx: index("rentals_created_at_idx").on(table.createdAt.desc()),
  customerIdIdx: index("rentals_customer_id_idx").on(table.customerId),
  vehicleIdIdx: index("rentals_vehicle_id_idx").on(table.vehicleId),
}));

export const rentalInspectionItems = pgTable("rental_inspection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalId: varchar("rental_id").notNull().references(() => rentals.id, { onDelete: "cascade" }), // FK para rentals
  photoType: text("photo_type").notNull(), // frontal, fundo, lateral_direita, lateral_esquerda, motor, step_macaco_triangulo, pneu, chassi, nivel_gasolina
  imageUrl: text("image_url").notNull(),
  hasDamage: boolean("has_damage").notNull().default(false), // Existe avaria?
  damageDescription: text("damage_description"), // Detalhamento da avaria (opcional)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => adminUsers.id, { onDelete: "set null" }), // ID do admin que criou
});

// DEPRECATED: Tabela investors foi unificada em customers
// Mantida aqui apenas para referência durante a migração
// export const investors = pgTable("investors", { ... });

export const vehicleRequests = pgTable("vehicle_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => customers.id, { onDelete: "restrict" }), // ID do cliente/investidor que está solicitando
  name: text("name").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }), // Opcional - admin define após aprovação
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
  transmission: text("transmission").notNull(),
  fuel: text("fuel").notNull(),
  seats: integer("seats").notNull(),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  reviewedAt: timestamp("reviewed_at"),
  licensePlate: text("license_plate"),
  fipeValue: decimal("fipe_value", { precision: 10, scale: 2 }), // Valor FIPE do veículo
  // Fotos de vistoria de avaliação
  evaluationFrontImage: text("evaluation_front_image"), // Frente mostrando placa
  evaluationBackImage: text("evaluation_back_image"), // Fundo mostrando placa
  evaluationRightSideImage: text("evaluation_right_side_image"), // Lateral direita
  evaluationLeftSideImage: text("evaluation_left_side_image"), // Lateral esquerda
  evaluationMotorImage: text("evaluation_motor_image"), // Motor
  evaluationStepImage: text("evaluation_step_image"), // Step, macaco e triângulo
  evaluationTire1Image: text("evaluation_tire1_image"), // Pneu dianteiro esquerdo
  evaluationTire2Image: text("evaluation_tire2_image"), // Pneu dianteiro direito
  evaluationTire3Image: text("evaluation_tire3_image"), // Pneu traseiro esquerdo
  evaluationTire4Image: text("evaluation_tire4_image"), // Pneu traseiro direito
  evaluationChassiImage: text("evaluation_chassi_image"), // Chassi
  evaluationOdometroImage: text("evaluation_odometro_image"), // Odômetro
  evaluationNivelGasolinaImage: text("evaluation_nivel_gasolina_image"), // Nível de gasolina
  // Documentos do veículo
  crlvDocumentUrl: text("crlv_document_url"), // CRLV (Certificado de Registro e Licenciamento do Veículo)
  laudoCautelarUrl: text("laudo_cautelar_url"), // Laudo Cautelar
  laudoMecanicoUrl: text("laudo_mecanico_url"), // Laudo Mecânico
}, (table) => ({
  createdAtIdx: index("vehicle_requests_created_at_idx").on(table.createdAt.desc()),
  ownerIdIdx: index("vehicle_requests_owner_id_idx").on(table.ownerId),
}));

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
}).extend({
  imageUrl: z.string().optional().nullable().refine(
    (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
    { message: "Deve ser uma URL válida ou uma imagem em base64" }
  ),
  licensePlate: z.string().min(1, "Placa é obrigatória"),
});

export const updateVehicleSchema = insertVehicleSchema.partial().extend({
  imageUrl: z.string().optional().nullable().refine(
    (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/') || val.startsWith('/'),
    { message: "Deve ser uma URL válida ou uma imagem em base64" }
  ),
});

export const insertVehicleRequestSchema = createInsertSchema(vehicleRequests).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true,
  reviewedAt: true,
}).extend({
  ownerId: z.string().min(1, "ID do proprietário é obrigatório"),
  imageUrl: z.string().min(1, "Imagem é obrigatória").refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
    { message: "Deve ser uma URL válida ou uma imagem em base64" }
  ),
  licensePlate: z.string().min(1, "Placa é obrigatória"),
  pricePerDay: z.string().optional().nullable(), // Opcional - admin define após aprovação
});

export const insertRentalSchema = createInsertSchema(rentals).omit({
  id: true,
  createdAt: true,
  status: true,
  totalPrice: true,
  bonusDiscountUsed: true,
  priceBeforeDiscount: true,
}).extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["pending", "approved", "active", "completed", "cancelled"]).optional(),
});

export const insertRentalInspectionItemSchema = createInsertSchema(rentalInspectionItems).omit({
  id: true,
  createdAt: true,
  createdBy: true,
}).extend({
  rentalId: z.string().min(1, "ID do aluguel é obrigatório"),
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
  ], { required_error: "Tipo de foto é obrigatório" }),
  imageUrl: z.string().min(1, "Imagem é obrigatória").refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
    { message: "Deve ser uma URL válida ou uma imagem em base64" }
  ),
  hasDamage: z.boolean().default(false),
  damageDescription: z.string().optional().nullable(),
});

// DEPRECATED: Investor schemas removidos - usar insertCustomerSchema e updateCustomerSchema

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertRental = z.infer<typeof insertRentalSchema>;
export type Rental = typeof rentals.$inferSelect;

export type InsertRentalInspectionItem = z.infer<typeof insertRentalInspectionItemSchema>;
export type RentalInspectionItem = typeof rentalInspectionItems.$inferSelect;

// DEPRECATED: Investor types removidos - usar Customer
// export type InsertInvestor = ...
// export type Investor = ...

export type InsertVehicleRequest = z.infer<typeof insertVehicleRequestSchema>;
export type VehicleRequest = typeof vehicleRequests.$inferSelect;

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  cpf: text("cpf").notNull().unique(),
  rg: text("rg"),
  birthDate: text("birth_date"), // Data de nascimento
  rgImageUrl: text("rg_image_url"), // Foto do RG do investidor
  cnhImageUrl: text("cnh_image_url"), // Foto da CNH do investidor
  proofOfResidenceUrl: text("proof_of_residence_url"), // Comprovante de Residência do investidor
  password: text("password"), // Senha hash para autenticação de clientes públicos (opcional para clientes criados pelo admin)
  isNegativado: boolean("is_negativado").notNull().default(false),
  status: text("status").notNull().default("active"), // active, inactive, vip, blocked, pending, approved, rejected
  driverType: text("driver_type").notNull().default("principal"), // principal, dependente
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
  paymentDate: text("payment_date"), // Dia(s) do mês para pagamento de dividendos - pode ter múltiplas datas (ex: "16/20/30")
  bonusPaymentDay: integer("bonus_payment_day"), // DEPRECATED - usar bonusDate
  bonusDate: text("bonus_date"), // Data específica do pagamento único do bônus (ex: "09/12/2025")
  bonusValue: decimal("bonus_value", { precision: 10, scale: 2 }), // Valor único do bônus a ser pago na data específica
  monthlyDividend: decimal("monthly_dividend", { precision: 10, scale: 2 }), // Valor fixo mensal de dividendo definido pelo admin
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  reviewedAt: timestamp("reviewed_at"),
  // Dados bancários para investidores
  bankName: text("bank_name"),
  bankCode: text("bank_code"),
  agency: text("agency"),
  agencyDigit: text("agency_digit"),
  accountNumber: text("account_number"),
  accountDigit: text("account_digit"),
  accountType: text("account_type"), // conta_corrente, conta_poupanca, conta_pagamento
  accountHolder: text("account_holder"),
  accountHolderDocument: text("account_holder_document"),
  pixKeyType: text("pix_key_type"), // cpf, cnpj, email, telefone, aleatoria
  pixKey: text("pix_key"),
  // Estatísticas de cliente
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0"),
  totalRentals: integer("total_rentals").notNull().default(0),
  rating: integer("rating").default(0), // Queridômetro: avaliação do admin de 0 a 5 estrelas
  bonusBalance: decimal("bonus_balance", { precision: 10, scale: 2 }).notNull().default("0"), // Bonificação: saldo de desconto disponível para uso
  // Datas de Vendas
  firstContactDate: timestamp("first_contact_date"), // Data do primeiro contato com o cliente
  closingDate: timestamp("closing_date"), // Data de fechamento/conclusão da venda
  // Contrato de investidor (anexado pelo admin)
  investorContractUrl: text("investor_contract_url"), // Base64 ou URL do contrato
  investorContractFileName: text("investor_contract_file_name"), // Nome do arquivo do contrato
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  lastRentalAt: timestamp("last_rental_at"),
}, (table) => ({
  createdAtIdx: index("customers_created_at_idx").on(table.createdAt.desc()),
}));

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cpf: text("cpf"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull().default("new"),
  interest: text("interest").notNull(),
  vehicleId: varchar("vehicle_id").$type<string | null>().references(() => vehicles.id, { onDelete: "set null" }), // Veículo de interesse
  vehicleName: text("vehicle_name"), // Nome do veículo de interesse
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  convertedAt: timestamp("converted_at"),
});

export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  customerId: varchar("customer_id").$type<string | null>().references(() => customers.id, { onDelete: "set null" }),
  leadId: varchar("lead_id").$type<string | null>().references(() => leads.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  contactMethod: text("contact_method").notNull(),
  performedBy: text("performed_by").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const customerEvents = pgTable("customer_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  rentalId: varchar("rental_id").references(() => rentals.id, { onDelete: "set null" }),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }), // Veículo associado ao evento
  type: text("type").notNull(), // sinistro, assistencia_24h, manutencao, multa, dano, etc
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("aberto"), // aberto, em_andamento, resolvido
  severity: text("severity").notNull().default("baixa"), // baixa, media, alta, critica
  cost: decimal("cost", { precision: 10, scale: 2 }),
  attachments: text("attachments").array(), // URLs de documentos/fotos
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  // Novos campos para gestão de incidentes
  incidentType: text("incident_type"), // roubo, furto, colisão, incêndio, oficina, assistência, etc
  paymentMethod: text("payment_method"), // franquia, direto_empresa, prejuizo_empresa, seguro
  insuranceClaim: boolean("insurance_claim").default(false), // Se teve acionamento de seguro
  franchiseValue: decimal("franchise_value", { precision: 10, scale: 2 }), // Valor da franquia paga
  insuranceCompany: text("insurance_company"), // Seguradora acionada
  claimNumber: text("claim_number"), // Número do sinistro na seguradora
  workshopStatus: text("workshop_status"), // na_oficina, aguardando_pecas, em_reparo, concluido
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  convertedAt: true,
}).extend({
  status: z.string().optional(),
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactions.$inferSelect;

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  totalSpent: true,
  totalRentals: true,
  totalEarnings: true,
  lastRentalAt: true,
  reviewedAt: true,
}).extend({
  status: z.enum(["active", "inactive", "vip", "blocked", "pending", "approved", "rejected", "lead"]).optional(),
  paymentDate: z.string().nullable().optional(), // Dia(s) do mês (ex: "16" ou "16/20/30")
});

export const updateCustomerSchema = insertCustomerSchema.partial().extend({
  status: z.enum(["active", "inactive", "vip", "blocked", "pending", "approved", "rejected", "lead"]).optional(),
  paymentDate: z.string().nullable().optional(), // Dia(s) do mês (ex: "16" ou "16/20/30")
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export const insertCustomerEventSchema = createInsertSchema(customerEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomerEvent = z.infer<typeof insertCustomerEventSchema>;
export type CustomerEvent = typeof customerEvents.$inferSelect;

export const investorEvents = pgTable("investor_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => customers.id, { onDelete: "cascade" }), // ID do cliente/investidor proprietário
  vehicleId: varchar("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  type: text("type").notNull(), // manutencao, documentacao, pagamento, inspecao, outro
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("aberto"), // aberto, em_andamento, resolvido
  severity: text("severity").notNull().default("baixa"), // baixa, media, alta, critica
  cost: decimal("cost", { precision: 10, scale: 2 }),
  attachments: text("attachments").array(), // URLs de documentos/fotos
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertInvestorEventSchema = createInsertSchema(investorEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertInvestorEvent = z.infer<typeof insertInvestorEventSchema>;
export type InvestorEvent = typeof investorEvents.$inferSelect;

export const investmentQuotas = pgTable("investment_quotas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // Econômico, Sedan, SUV, Luxo, Esportivo
  minValue: decimal("min_value", { precision: 10, scale: 2 }).notNull(),
  maxValue: decimal("max_value", { precision: 10, scale: 2 }).notNull(),
  minDividend: decimal("min_dividend", { precision: 10, scale: 2 }).notNull(), // Dividendo mínimo em R$
  maxDividend: decimal("max_dividend", { precision: 10, scale: 2 }).notNull(), // Dividendo máximo em R$
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const investorPayments = pgTable("investor_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investorId: varchar("investor_id").notNull().references(() => customers.id, { onDelete: "restrict" }), // ID do investidor (customer)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Valor do pagamento
  referenceMonth: integer("reference_month").notNull(), // Mês de referência (1-12)
  referenceYear: integer("reference_year").notNull(), // Ano de referência
  paymentDate: timestamp("payment_date").notNull().default(sql`now()`), // Data do pagamento
  status: text("status").notNull().default("paid"), // paid, pending, cancelled
  notes: text("notes"), // Observações sobre o pagamento
  vehicleBreakdown: text("vehicle_breakdown"), // JSON com detalhamento por veículo
  attachments: text("attachments").array(), // URLs de comprovantes de pagamento (imagens, PDFs, etc)
  createdBy: varchar("created_by").references(() => adminUsers.id, { onDelete: "set null" }), // ID do admin que registrou
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertInvestmentQuotaSchema = createInsertSchema(investmentQuotas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  minValue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Valor mínimo deve ser um número válido maior ou igual a 0",
  }),
  maxValue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Valor máximo deve ser um número válido maior que 0",
  }),
  minDividend: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Dividendo mínimo deve ser um número válido maior ou igual a 0",
  }),
  maxDividend: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Dividendo máximo deve ser um número válido maior que 0",
  }),
  category: z.enum(["Econômico", "Sedan", "SUV", "Luxo", "Esportivo"]),
});

export type InsertInvestmentQuota = z.infer<typeof insertInvestmentQuotaSchema>;
export type InvestmentQuota = typeof investmentQuotas.$inferSelect;

export const insertInvestorPaymentSchema = createInsertSchema(investorPayments).omit({
  id: true,
  createdAt: true,
  paymentDate: true,
}).extend({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Valor do pagamento deve ser maior que 0",
  }),
  referenceMonth: z.number().int().min(1).max(12),
  referenceYear: z.number().int().min(2020).max(2100),
  status: z.enum(["paid", "pending", "cancelled"]).optional(),
});

export type InsertInvestorPayment = z.infer<typeof insertInvestorPaymentSchema>;
export type InvestorPayment = typeof investorPayments.$inferSelect;

export const financings = pgTable("financings", {
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
  customerPaymentDate: integer("customer_payment_date"), // Dia do mês para pagamento de dividendos
  customerBonusPaymentDay: integer("customer_bonus_payment_day"), // Dia do mês para pagamento de bônus
  
  // Dados do Avalista (opcional)
  hasGuarantor: boolean("has_guarantor").notNull().default(false),
  guarantorName: text("guarantor_name"),
  guarantorCpf: text("guarantor_cpf"),
  guarantorRg: text("guarantor_rg"),
  guarantorEmail: text("guarantor_email"),
  guarantorPhone: text("guarantor_phone"),
  guarantorDriverLicense: text("guarantor_driver_license"),
  guarantorDocumentUrl: text("guarantor_document_url"), // Foto do documento com foto (CNH/RG)
  guarantorDocumentFileName: text("guarantor_document_file_name"),
  guarantorResidenceUrl: text("guarantor_residence_url"), // Comprovante de residência do avalista
  guarantorResidenceFileName: text("guarantor_residence_file_name"),
  guarantorStreet: text("guarantor_street"),
  guarantorComplement: text("guarantor_complement"),
  guarantorNeighborhood: text("guarantor_neighborhood"),
  guarantorCity: text("guarantor_city"),
  guarantorState: text("guarantor_state"),
  guarantorZipCode: text("guarantor_zip_code"),
  
  // Valores do veículo e configuração do financiamento
  vehicleValue: decimal("vehicle_value", { precision: 10, scale: 2 }).notNull(),
  downPaymentType: text("down_payment_type").notNull().default("split"), // split ou full
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
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  approvalNotes: text("approval_notes"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  
  // Check-in (Etapa 5) - 4 fotos obrigatórias
  checkInPhotos: text("check_in_photos"), // JSON com URLs das 4 fotos
  checkInChecklist: text("check_in_checklist"), // JSON do checklist de vistoria de entrega
  checkInNotes: text("check_in_notes"),
  checkInCompletedAt: timestamp("check_in_completed_at"),
  
  // Checklist de Vistoria (Etapa 6) - 45 itens
  inspectionChecklist: text("inspection_checklist"), // JSON do checklist de vistoria
  inspectionPdfUrl: text("inspection_pdf_url"), // PDF de vistoria com assinaturas
  inspectionPdfFileName: text("inspection_pdf_file_name"),
  
  // Contrato (Etapa 8)
  contractUrl: text("contract_url"),
  contractFileName: text("contract_file_name"), // Nome original do arquivo do contrato legado
  contractGeneratedAt: timestamp("contract_generated_at"),
  generatedContracts: text("generated_contracts"), // JSON array de contratos gerados [{url, fileName, generatedAt}]
  
  // Pagamento (Etapa 8) - Pagamento da Entrada à Vista
  cashPaymentMethod: text("cash_payment_method"), // pix, transferencia, dinheiro, cartao, cheque
  cashPaymentDate: text("cash_payment_date"),
  cashProofUrl: text("cash_proof_url"),
  cashProofFileName: text("cash_proof_file_name"),
  
  // Pagamento da Entrada Parcelada (se aplicável)
  installmentPaymentMethod: text("installment_payment_method"), // cartao_credito, boleto, debito_automatico, cheque_pre
  installmentNotes: text("installment_notes"),
  
  // Observações Gerais de Pagamento
  generalPaymentNotes: text("general_payment_notes"),
  
  // Campos antigos mantidos para compatibilidade
  paymentMethod: text("payment_method"),
  paymentProofUrl: text("payment_proof_url"),
  paymentVerifiedAt: timestamp("payment_verified_at"),
  paymentNotes: text("payment_notes"),
  
  // Checkout - Vistoria de Devolução
  checkOutPhotos: text("check_out_photos"), // JSON com URLs das fotos do checkout
  checkOutChecklist: text("check_out_checklist"), // JSON do checklist de vistoria de checkout
  checkOutNotes: text("check_out_notes"), // Observações e avarias documentadas no checkout
  checkOutCompletedAt: timestamp("check_out_completed_at"), // Data de conclusão do checkout
  
  // Vídeo de Confissão de Ciência (opcional)
  confessionVideoUrl: text("confession_video_url"), // URL do vídeo de confissão do cliente
  confessionVideoRecordedAt: timestamp("confession_video_recorded_at"), // Data de gravação do vídeo
  
  // Status e datas
  status: text("status").notNull().default("pending"), // pending, approved, active, completed, rejected, cancelled
  startDate: timestamp("start_date"),
  dueDay: integer("due_day"),
  bonusPaymentDay: integer("bonus_payment_day"), // Dia do mês para pagamento de bônus (1-31)
  paymentStatus: text("payment_status").notNull().default("em_dia"), // em_dia, atrasado
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  customerIdIdx: index("financings_customer_id_idx").on(table.customerId),
  vehicleIdIdx: index("financings_vehicle_id_idx").on(table.vehicleId),
}));

export const insertFinancingSchema = createInsertSchema(financings).omit({
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
  checkOutCompletedAt: true,
}).extend({
  startDate: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
  simulationValidUntil: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
  customerFirstContactDate: z.string().optional().nullable(),
  customerClosingDate: z.string().optional().nullable(),
});

export const updateFinancingSchema = createInsertSchema(financings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  confessionVideoRecordedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional().nullable(),
}).partial();

export type InsertFinancing = z.infer<typeof insertFinancingSchema>;
export type Financing = typeof financings.$inferSelect;

// Vehicle Inspections - Registro detalhado de vistorias
export const vehicleInspections = pgTable("vehicle_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }), // Referência ao veículo
  rentalId: varchar("rental_id").references(() => rentals.id, { onDelete: "set null" }), // Opcional: referência ao aluguel (para check-in/out)
  type: text("type").notNull(), // 'evaluation', 'check-in', 'check-out'
  imageUrl: text("image_url").notNull(), // URL da foto
  imageType: text("image_type").notNull(), // 'front', 'back', 'right_side', 'left_side', 'dashboard', 'interior', 'other'
  notes: text("notes"), // Observações sobre esta foto
  uploadedBy: varchar("uploaded_by").references(() => adminUsers.id, { onDelete: "set null" }), // ID do usuário que fez upload (admin, customer, investor)
  createdAt: timestamp("created_at").notNull().default(sql`now()`), // Timestamp preciso
});

export const insertVehicleInspectionSchema = createInsertSchema(vehicleInspections).omit({
  id: true,
  createdAt: true,
});

export type InsertVehicleInspection = z.infer<typeof insertVehicleInspectionSchema>;
export type VehicleInspection = typeof vehicleInspections.$inferSelect;

// Admin Users - Usuários administradores do sistema
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  cpf: text("cpf"), // CPF do usuário (obrigatório para INVESTIDOR e VENDEDOR)
  password: text("password").notNull(), // Hash bcrypt da senha
  role: text("role").notNull().default("ADMIN"), // ADMIN, VENDEDOR, INVESTIDOR
  isActive: boolean("is_active").notNull().default(true),
  salesGoal: integer("sales_goal").default(1), // Meta de vendas (para vendedores)
  goalPeriod: text("goal_period").default("daily"), // Período da meta: daily, weekly, monthly, yearly
  salesCount: integer("sales_count").default(0), // Total de vendas realizadas no período atual
  salesRevenue: decimal("sales_revenue", { precision: 10, scale: 2 }).default("0"), // Receita total gerada em vendas (R$)
  totalSales: integer("total_sales").default(0), // Histórico total de vendas (nunca reseta)
  totalGoalsAchieved: integer("total_goals_achieved").default(0), // Total de metas batidas (histórico permanente)
  lastSalesReset: timestamp("last_sales_reset"), // Data do último reset de vendas
  monthlyGoalsAchieved: integer("monthly_goals_achieved").default(0), // Quantas vezes bateu a meta este mês
  lastMonthReset: timestamp("last_month_reset"), // Data do último reset mensal
  goalAchievedToday: boolean("goal_achieved_today").default(false), // Se a meta de hoje já foi contabilizada
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
  lastSalesReset: true,
  monthlyGoalsAchieved: true,
  lastMonthReset: true,
}).extend({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Audit Logs - Logs de auditoria do sistema
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(), // Tipo de ação: 'create', 'update', 'delete', 'approve', 'reject', etc.
  entity: text("entity").notNull(), // Entidade afetada: 'customer', 'vehicle', 'rental', 'investor', etc.
  entityId: varchar("entity_id"), // ID da entidade afetada
  entityName: text("entity_name"), // Nome da entidade afetada para exibição (ex: "Honda Civic 2023", "João da Silva")
  userId: varchar("user_id").references(() => adminUsers.id, { onDelete: "set null" }), // ID do usuário que executou a ação
  userName: text("user_name"), // Nome do usuário (para facilitar exibição)
  details: text("details"), // Detalhes da ação em JSON
  ipAddress: text("ip_address"), // IP de origem
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Trade-in Vehicles - Veículos dados como entrada em financiamentos
export const tradeInVehicles = pgTable("trade_in_vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  financingId: varchar("financing_id").notNull().references(() => financings.id, { onDelete: "cascade" }), // Referência ao financiamento
  customerId: varchar("customer_id").references(() => customers.id, { onDelete: "set null" }), // ID do cliente (se existir)
  
  // Dados do veículo de troca
  plate: text("plate"), // Placa do veículo (opcional)
  brand: text("brand").notNull(), // Marca
  model: text("model").notNull(), // Modelo
  year: text("year").notNull(), // Ano
  category: text("category"), // Categoria (Econômico, Sedan, etc)
  mileage: text("mileage"), // Quilometragem do veículo
  fipeValue: text("fipe_value"), // Valor FIPE consultado (ex: "R$ 45.000,00")
  acceptedValue: decimal("accepted_value", { precision: 10, scale: 2 }).notNull(), // Valor aceito como entrada
  
  // Documentação
  cautelarUrl: text("cautelar_url"), // URL do documento cautelar (opcional quando vem da frota existente)
  crlvUrl: text("crlv_url"), // URL do CRLV do veículo
  laudoMecanicoUrl: text("laudo_mecanico_url"), // URL do laudo mecânico
  photosUrls: text("photos_urls").array(), // URLs das fotos do veículo
  
  // Status
  status: text("status").notNull().default("accepted"), // accepted, rejected, pending
  
  // Informações adicionais (mesmos campos que vehicles)
  temDocumento: boolean("tem_documento"), // Tem documento?
  licenciamentoPago: boolean("licenciamento_pago"), // Licenciamento pago?
  eDeLeilao: boolean("e_de_leilao"), // É de leilão?
  temRastreador: boolean("tem_rastreador"), // Tem rastreador?
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertTradeInVehicleSchema = createInsertSchema(tradeInVehicles).omit({
  id: true,
  createdAt: true,
});

export type InsertTradeInVehicle = z.infer<typeof insertTradeInVehicleSchema>;
export type TradeInVehicle = typeof tradeInVehicles.$inferSelect;

// Contract Templates - Templates de contratos para locação, financiamento e investimento
export const contractTemplates = pgTable("contract_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Nome do template
  type: text("type").notNull(), // 'rental', 'financing', 'investment'
  content: text("content").notNull(), // Conteúdo do contrato (pode ter variáveis como {{customerName}}, {{vehicleName}}, etc)
  isActive: boolean("is_active").notNull().default(true), // Se está ativo para uso
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["rental", "financing", "investment"], {
    errorMap: () => ({ message: "Tipo deve ser rental, financing ou investment" })
  }),
  content: z.string().min(1, "Conteúdo é obrigatório"),
});

export const updateContractTemplateSchema = insertContractTemplateSchema.partial();

export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractTemplate = typeof contractTemplates.$inferSelect;

// Rental Plans - Serviços adicionais que podem ser contratados junto com o aluguel
export const rentalPlans = pgTable("rental_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Nome do serviço (ex: "Seguro Premium", "GPS", "Cadeirinha de Bebê")
  description: text("description").notNull(), // Descrição do serviço
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Valor adicional por dia/total
  isActive: boolean("is_active").notNull().default(true), // Se está disponível para escolha
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertRentalPlanSchema = createInsertSchema(rentalPlans).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.string().min(1, "Preço é obrigatório"),
});

export const updateRentalPlanSchema = insertRentalPlanSchema.partial();

export type InsertRentalPlan = z.infer<typeof insertRentalPlanSchema>;
export type RentalPlan = typeof rentalPlans.$inferSelect;

// Financing Proposals - Contra propostas de financiamento solicitadas por vendedores
export const financingProposals = pgTable("financing_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Identificação
  sellerId: varchar("seller_id").notNull().references(() => adminUsers.id, { onDelete: "restrict" }), // Vendedor que criou a proposta
  adminReviewerId: varchar("admin_reviewer_id").references(() => adminUsers.id, { onDelete: "set null" }), // Admin que revisou
  
  // Dados do cliente (para identificação)
  customerName: text("customer_name").notNull(),
  customerCpf: text("customer_cpf").notNull(),
  customerPhone: text("customer_phone").notNull(),
  
  // Veículo selecionado
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "restrict" }),
  vehicleName: text("vehicle_name").notNull(),
  
  // Valores originais (calculados automaticamente)
  originalCalculation: text("original_calculation").notNull(), // JSON com cálculo original {vehicleValue, downPayment, financeAmount, monthlyPayment, etc}
  
  // Proposta do vendedor (valores negociados)
  proposedTerms: text("proposed_terms").notNull(), // JSON com valores propostos {vehicleValue, downPaymentCash, downPaymentInstallments, monthlyPayment, etc}
  proposalNotes: text("proposal_notes"), // Justificativa do vendedor
  
  // Valores aprovados pelo admin (após revisão)
  approvedValues: text("approved_values"), // JSON com valores aprovados (pode ser diferente da proposta)
  
  // Status e notas
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  adminNotes: text("admin_notes"), // Notas do admin sobre a aprovação/rejeição
  dismissedAt: timestamp("dismissed_at"), // Quando o vendedor clicou em "Talvez Mais Tarde"
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => ({
  sellerIdIdx: index("financing_proposals_seller_id_idx").on(table.sellerId),
  statusIdx: index("financing_proposals_status_idx").on(table.status),
  createdAtIdx: index("financing_proposals_created_at_idx").on(table.createdAt.desc()),
}));

export const insertFinancingProposalSchema = createInsertSchema(financingProposals).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  adminReviewerId: true,
  approvedValues: true,
  status: true,
}).extend({
  sellerId: z.string().min(1, "ID do vendedor é obrigatório"),
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerCpf: z.string().min(1, "CPF do cliente é obrigatório"),
  customerPhone: z.string().min(1, "Telefone do cliente é obrigatório"),
  vehicleId: z.string().min(1, "ID do veículo é obrigatório"),
  vehicleName: z.string().min(1, "Nome do veículo é obrigatório"),
  originalCalculation: z.string().min(1, "Cálculo original é obrigatório"),
  proposedTerms: z.string().min(1, "Termos propostos são obrigatórios"),
  proposalNotes: z.string().optional(),
  adminNotes: z.string().optional(),
});

export type InsertFinancingProposal = z.infer<typeof insertFinancingProposalSchema>;
export type FinancingProposal = typeof financingProposals.$inferSelect;

// Operational Expenses - Despesas operacionais da Imobilicar
export const operationalExpenses = pgTable("operational_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(), // Descrição da despesa
  category: text("category").notNull(), // aluguel, salarios, manutencao, marketing, combustivel, outros
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Valor da despesa
  date: timestamp("date").notNull(), // Data da despesa
  paymentMethod: text("payment_method"), // Método de pagamento
  notes: text("notes"), // Observações adicionais
  receiptUrl: text("receipt_url"), // URL do comprovante/nota fiscal
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  createdBy: varchar("created_by").references(() => adminUsers.id, { onDelete: "set null" }), // Admin que registrou
}, (table) => ({
  dateIdx: index("operational_expenses_date_idx").on(table.date.desc()),
  categoryIdx: index("operational_expenses_category_idx").on(table.category),
}));

export const insertOperationalExpenseSchema = createInsertSchema(operationalExpenses).omit({
  id: true,
  createdAt: true,
}).extend({
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
});

export type InsertOperationalExpense = z.infer<typeof insertOperationalExpenseSchema>;
export type OperationalExpense = typeof operationalExpenses.$inferSelect;

// Customer Authentication Schemas
export const customerRegisterSchema = z.object({
  cpf: z.string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido")
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido"),
  password: z.string()
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
});

export const customerLoginSchema = z.object({
  cpf: z.string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido")
    .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type CustomerRegister = z.infer<typeof customerRegisterSchema>;
export type CustomerLogin = z.infer<typeof customerLoginSchema>;
