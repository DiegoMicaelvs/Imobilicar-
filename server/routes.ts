import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, updateVehicleSchema, insertRentalSchema, insertRentalInspectionItemSchema, insertLeadSchema, insertInteractionSchema, insertVehicleRequestSchema, insertCustomerSchema, updateCustomerSchema, insertCustomerEventSchema, insertInvestorEventSchema, insertInvestmentQuotaSchema, insertInvestorPaymentSchema, insertFinancingSchema, updateFinancingSchema, insertVehicleInspectionSchema, insertAdminUserSchema, insertContractTemplateSchema, updateContractTemplateSchema, insertRentalPlanSchema, updateRentalPlanSchema, insertFinancingProposalSchema, type VehicleRequest } from "@shared/schema";
import { z } from "zod";
import PDFDocument from "pdfkit";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, VerticalAlign, PageBreak, Header, ImageRun } from "docx";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import multer from "multer";

const uploadDir = path.join(process.cwd(), 'uploads', 'videos');
const chunksDir = path.join(process.cwd(), 'uploads', 'chunks');

// Ensure directories exist (wrapped in try-catch for read-only filesystems like Vercel)
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

// Sanitiza uploadId para evitar path traversal
const sanitizeUploadId = (id: string): string => {
  // Permite apenas alfanuméricos e hífens
  return id.replace(/[^a-zA-Z0-9-]/g, '');
};

// Sanitiza chunkIndex para garantir que é um número válido
const sanitizeChunkIndex = (index: string): number => {
  const num = parseInt(index, 10);
  return isNaN(num) || num < 0 ? 0 : num;
};

// Storage para chunks
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rawUploadId = req.body.uploadId || 'unknown';
    const uploadId = sanitizeUploadId(rawUploadId);

    // Verificar se o path está contido no diretório de chunks
    const chunkDir = path.join(chunksDir, uploadId);
    const resolvedPath = path.resolve(chunkDir);

    if (!resolvedPath.startsWith(path.resolve(chunksDir))) {
      return cb(new Error('Invalid upload ID'), '');
    }

    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }
    cb(null, chunkDir);
  },
  filename: (req, file, cb) => {
    const rawIndex = req.body.chunkIndex || '0';
    const chunkIndex = sanitizeChunkIndex(rawIndex);
    cb(null, `chunk-${chunkIndex}`);
  }
});

const chunkUpload = multer({
  storage: chunkStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB por chunk
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `confession-${uniqueSuffix}${ext}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Liberar todos os formatos apenas para garantir que não é filtro do multer
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log("🔐 Tentativa de login:", email);

      // Primeiro tentar autenticar com tabela admin_users
      const adminUser = await storage.getAdminUserByEmail(email);

      if (adminUser) {
        console.log("✓ Usuário encontrado no banco:", adminUser.email, "| Ativo:", adminUser.isActive);

        // Verificar se o usuário está ativo
        if (!adminUser.isActive) {
          console.log("✗ Usuário inativo");
          return res.status(401).json({ success: false, error: "Usuário inativo" });
        }

        // Verificar senha com bcrypt
        const passwordMatch = await bcrypt.compare(password, adminUser.password);
        console.log("🔑 Senha correta:", passwordMatch);

        if (passwordMatch) {
          // Verificar e aplicar resets automáticos (usa a mesma função definida abaixo)
          let updatedUser = await checkAndResetSales(adminUser);

          // Verificar se atingiu a meta hoje mas ainda não foi contabilizada
          const salesCount = updatedUser.salesCount || 0;
          const salesGoal = updatedUser.salesGoal || 1;

          if (salesCount >= salesGoal && !updatedUser.goalAchievedToday) {
            updatedUser = await storage.updateAdminUser(updatedUser.id, {
              monthlyGoalsAchieved: (updatedUser.monthlyGoalsAchieved || 0) + 1,
              goalAchievedToday: true,
            });
          }

          // Atualizar lastLoginAt
          updatedUser = await storage.updateAdminUser(updatedUser.id, {
            lastLoginAt: new Date(),
          });

          await storage.createAuditLog({
            action: 'login',
            entity: 'admin_user',
            entityId: updatedUser.id,
            userName: updatedUser.name,
            details: `${updatedUser.role === 'VENDEDOR' ? 'Vendedor' : 'Admin'} fez login: ${updatedUser.email}`,
            ipAddress: req.ip,
          });

          // Retornar dados do usuário sem a senha
          const { password, ...userData } = updatedUser;
          return res.json({
            success: true,
            user: userData
          });
        }
      }

      // Fallback para desenvolvimento: Permitir env vars SOMENTE se não houver admin users
      if (process.env.NODE_ENV === 'development') {
        const allAdminUsers = await storage.getAdminUsers();

        // Se não houver admin users, permitir env vars como fallback temporário
        if (allAdminUsers.length === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
          const adminEmail = process.env.ADMIN_EMAIL;
          const adminPassword = process.env.ADMIN_PASSWORD;

          const emailMatch =
            email === adminEmail ||
            email === `${adminEmail}@gmail.com` ||
            (adminEmail.includes('@') && email === adminEmail.split('@')[0]);

          if (emailMatch && password === adminPassword) {
            console.warn("⚠️  AVISO: Autenticação usando env vars. Crie um admin user em /api/admin/users");
            const fallbackUser = {
              id: 'env-admin',
              name: 'Admin (Env)',
              email: adminEmail,
              role: 'ADMIN' as const,
              isActive: true,
              salesGoal: null,
              salesCount: null,
              cpf: null,
              createdAt: new Date(),
              lastLoginAt: new Date(),
            };
            return res.json({
              success: true,
              user: fallbackUser,
              warning: "Crie um admin user para segurança"
            });
          }
        }
      }

      // Nenhuma autenticação válida
      res.status(401).json({ success: false, error: "Email ou senha incorretos" });
    } catch (error) {
      console.error("Erro ao autenticar:", error);
      res.status(500).json({ success: false, error: "Erro ao autenticar" });
    }
  });

  // Admin Users Management
  app.get("/api/admin/users", async (_req, res) => {
    try {
      const users = await storage.getAdminUsers();
      // Remover senhas antes de enviar
      let sanitizedUsers = users.map(({ password, ...user }) => user);

      if (process.env.HIDE_INVESTORS === 'true') {
        sanitizedUsers = sanitizedUsers.map((u: any) => ({
          ...u,
          name: "Usuário Oculto",
          email: "oculto@projeto.car",
          cpf: "000.000.000-00"
        }));
      }

      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar usuários" });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      const validated = insertAdminUserSchema.parse(req.body);

      // Verificar se email já existe
      const existingUser = await storage.getAdminUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(validated.password, 10);

      const user = await storage.createAdminUser({
        ...validated,
        password: hashedPassword,
      });

      // Criar log de auditoria
      await storage.createAuditLog({
        action: 'create',
        entity: 'admin_user',
        entityId: user.id,
        userName: validated.name,
        details: `Usuário administrador criado: ${validated.email}`,
        ipAddress: req.ip,
      });

      // Remover senha antes de enviar
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Validar dados com schema parcial
      const updateSchema = insertAdminUserSchema.partial();
      const validated = updateSchema.parse(data);

      // Se estiver atualizando o email, verificar se já existe outro usuário com esse email
      if (validated.email) {
        const existingUser = await storage.getAdminUserByEmail(validated.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "Email já cadastrado para outro usuário" });
        }
      }

      // Se estiver atualizando a senha, fazer hash
      if (validated.password) {
        validated.password = await bcrypt.hash(validated.password, 10);
      }

      const user = await storage.updateAdminUser(id, validated);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Criar log de auditoria
      await storage.createAuditLog({
        action: 'update',
        entity: 'admin_user',
        entityId: user.id,
        userName: user.name,
        details: `Usuário administrador atualizado: ${user.email}`,
        ipAddress: req.ip,
      });

      // Remover senha antes de enviar
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Buscar usuário antes de deletar para o log
      const user = await storage.getAdminUsers();
      const userToDelete = user.find(u => u.id === id);

      const success = await storage.deleteAdminUser(id);

      if (!success) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Criar log de auditoria
      if (userToDelete) {
        await storage.createAuditLog({
          action: 'delete',
          entity: 'admin_user',
          entityId: id,
          userName: userToDelete.name,
          details: `Usuário administrador removido: ${userToDelete.email}`,
          ipAddress: req.ip,
        });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar usuário" });
    }
  });

  // Função helper para verificar e resetar vendas baseado no período configurado
  async function checkAndResetSales(user: any) {
    const now = new Date();
    const updates: any = {};
    let needsUpdate = false;
    const goalPeriod = user.goalPeriod || 'daily';

    // Verificar reset baseado no período da meta
    if (user.lastSalesReset) {
      const lastReset = new Date(user.lastSalesReset);
      let shouldReset = false;

      if (goalPeriod === 'daily') {
        // Resetar a cada 24 horas
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        shouldReset = hoursSinceReset >= 24;
      } else if (goalPeriod === 'weekly') {
        // Resetar todo domingo (dia 0)
        // Se o último reset foi antes do domingo mais recente
        const lastSunday = new Date(now);
        lastSunday.setHours(0, 0, 0, 0);
        const daysSinceSunday = now.getDay(); // 0 = domingo, 1 = segunda, etc
        lastSunday.setDate(lastSunday.getDate() - daysSinceSunday);

        shouldReset = lastReset < lastSunday;
      } else if (goalPeriod === 'monthly') {
        // Resetar todo dia 1 de cada mês
        shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
      } else if (goalPeriod === 'yearly') {
        // Resetar todo 1 de janeiro
        shouldReset = now.getFullYear() !== lastReset.getFullYear();
      }

      if (shouldReset) {
        // Resetar vendas do período
        updates.salesCount = 0;
        updates.lastSalesReset = now;
        updates.goalAchievedToday = false; // Resetar flag de meta atingida
        needsUpdate = true;
      }
    } else {
      // Primeira vez, inicializar lastSalesReset
      updates.lastSalesReset = now;
      updates.goalAchievedToday = false;
      needsUpdate = true;
    }

    // Verificar reset mensal (para o contador de metas atingidas no mês)
    if (user.lastMonthReset) {
      const lastMonthReset = new Date(user.lastMonthReset);
      // Se mudou de mês, resetar contador mensal
      if (now.getMonth() !== lastMonthReset.getMonth() || now.getFullYear() !== lastMonthReset.getFullYear()) {
        updates.monthlyGoalsAchieved = 0;
        updates.lastMonthReset = now;
        needsUpdate = true;
      }
    } else {
      // Primeira vez, inicializar lastMonthReset
      updates.lastMonthReset = now;
      needsUpdate = true;
    }

    // Aplicar atualizações se necessário
    if (needsUpdate) {
      return await storage.updateAdminUser(user.id, updates);
    }

    return user;
  }

  app.post("/api/admin/users/:id/sales", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, revenue } = req.body;

      // Validar que amount não é zero ou nulo
      if (amount === undefined || amount === null || amount === 0) {
        return res.status(400).json({ error: "Quantidade inválida - deve ser diferente de zero" });
      }

      // Buscar usuário
      const users = await storage.getAdminUsers();
      let user = users.find(u => u.id === id);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Verificar e aplicar resets automáticos
      const checkedUser = await checkAndResetSales(user);
      if (!checkedUser) {
        return res.status(500).json({ error: "Erro ao processar dados do usuário" });
      }
      user = checkedUser;

      // Atualizar contador de vendas e receita
      const currentCount = (user as any).salesCount || 0;
      const newSalesCount = currentCount + amount;

      // Validar que não vai ficar negativo
      if (newSalesCount < 0) {
        return res.status(400).json({
          error: `Operação inválida - não é possível remover ${Math.abs(amount)} vendas. O vendedor tem apenas ${currentCount} vendas no período atual.`
        });
      }

      const salesGoal = (user as any).salesGoal || 1;

      // Atualizar receita total (acumula sempre, não reseta diariamente)
      const currentRevenue = parseFloat((user as any).salesRevenue || "0");
      const revenueToAdd = revenue ? parseFloat(revenue) : 0;
      const newSalesRevenue = (currentRevenue + revenueToAdd).toFixed(2);

      // Incrementar histórico total de vendas (NUNCA RESETA - permanente)
      // Este campo mantém o histórico completo de todas as vendas do vendedor
      const newTotalSales = ((user as any).totalSales || 0) + amount;

      // Verificar se atingiu a meta pela primeira vez no período atual
      const updates: any = {
        salesCount: newSalesCount, // Reseta baseado no goalPeriod (daily/weekly/monthly/yearly)
        salesRevenue: newSalesRevenue, // Acumula sempre
        totalSales: newTotalSales // NUNCA RESETA - histórico permanente
      };

      if (newSalesCount >= salesGoal && !(user as any).goalAchievedToday) {
        updates.monthlyGoalsAchieved = ((user as any).monthlyGoalsAchieved || 0) + 1;
        updates.goalAchievedToday = true;
        // Incrementar histórico de metas batidas
        updates.totalGoalsAchieved = ((user as any).totalGoalsAchieved || 0) + 1;
      }

      const updatedUser = await storage.updateAdminUser(id, updates);

      // Criar log de auditoria com sinal apropriado
      const amountSign = amount > 0 ? '+' : '';
      const revenueSign = revenue && parseFloat(revenue) > 0 ? '+' : '';
      const revenueInfo = revenue ? ` | Receita: ${revenueSign}R$ ${parseFloat(revenue).toFixed(2)}` : '';
      await storage.createAuditLog({
        action: 'update',
        entity: 'admin_user',
        entityId: id,
        userName: (user as any).name,
        details: `Vendas ${amount > 0 ? 'adicionadas' : 'removidas'}: ${amountSign}${amount} (total: ${newSalesCount})${revenueInfo}`,
        ipAddress: req.ip,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Erro ao registrar vendas:", error);
      res.status(500).json({ error: "Erro ao registrar vendas" });
    }
  });

  // Customer Authentication Routes
  // ROTA DESABILITADA: Cadastro público não é mais permitido
  // Apenas investidores ativos com veículos registrados podem ter acesso ao portal
  app.post("/api/auth/register", async (req, res) => {
    return res.status(403).json({
      error: "Cadastro público desabilitado. Apenas investidores ativos da Imobilicar podem acessar o portal. Se você é um investidor, entre em contato com o suporte para configurar seu acesso."
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { customerLoginSchema } = await import("@shared/schema");
      const validated = customerLoginSchema.parse(req.body);

      // Remover formatação do CPF
      const cleanCpf = validated.cpf.replace(/\D/g, '');

      // PRIMEIRO: Tentar buscar admin_user com role INVESTIDOR usando CPF formatado
      const investorUser = await storage.getInvestorByCpf(validated.cpf);

      if (investorUser) {
        // Login de investidor via admin_users
        if (!investorUser.password) {
          return res.status(401).json({ error: "Cadastro incompleto. Entre em contato com o suporte." });
        }

        // Verificar senha
        const passwordMatch = await bcrypt.compare(validated.password, investorUser.password);

        if (!passwordMatch) {
          return res.status(401).json({ error: "CPF ou senha incorretos" });
        }

        // Verificar se está ativo
        if (!investorUser.isActive) {
          return res.status(401).json({ error: "Conta desativada. Entre em contato com o suporte." });
        }

        // IMPORTANTE: Buscar dados complementares da tabela customers pelo CPF
        // Isso traz paymentDate, bonusDate, bonusValue, monthlyDividend e o ID correto para buscar veículos
        const customerData = await storage.getCustomerByCpf(cleanCpf);

        console.log("🔍 DEBUG - Investidor login:", {
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

        // Criar log de auditoria
        await storage.createAuditLog({
          action: 'login',
          entity: 'admin_user',
          entityId: investorUser.id,
          userName: investorUser.name,
          details: `Investidor fez login: ${investorUser.email}`,
          ipAddress: req.ip,
        });

        // Retornar investidor sem senha, mesclando dados de admin_users e customers
        const { password, ...sanitizedUser } = investorUser;
        return res.json({
          success: true,
          customer: {
            ...sanitizedUser,
            role: 'INVESTIDOR', // Garantir que role está presente
            // Adicionar dados complementares da tabela customers (se existir)
            ...(customerData && {
              customerId: customerData.id, // ID da tabela customers (usado para buscar veículos)
              paymentDate: customerData.paymentDate,
              bonusDate: customerData.bonusDate,
              bonusValue: customerData.bonusValue,
              monthlyDividend: customerData.monthlyDividend,
              createdAt: customerData.createdAt, // Data de cadastro original no CRM
            })
          }
        });
      }

      // SEGUNDO: Buscar cliente por CPF (investidores antigos)
      const customer = await storage.getCustomerByCpf(cleanCpf);

      if (!customer) {
        return res.status(401).json({ error: "CPF ou senha incorretos" });
      }

      // Verificar se tem senha cadastrada
      if (!customer.password) {
        return res.status(401).json({ error: "Cadastro incompleto. Entre em contato com o suporte." });
      }

      // Verificar senha
      const passwordMatch = await bcrypt.compare(validated.password, customer.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: "CPF ou senha incorretos" });
      }

      // Verificar se está bloqueado
      if (customer.status === "blocked" || customer.status === "inactive") {
        return res.status(401).json({ error: "Conta bloqueada. Entre em contato com o suporte." });
      }

      // VALIDAÇÃO: Verificar se é investidor ativo com veículos aprovados
      const investorVehicles = await storage.getVehiclesByOwner(customer.id);
      const activeInvestorVehicles = investorVehicles.filter(
        (v: any) => v.isInvestorVehicle === true && v.available === true
      );

      if (activeInvestorVehicles.length === 0) {
        return res.status(403).json({
          error: "Acesso negado. Apenas investidores com veículos ativos podem fazer login. Entre em contato com o suporte se você é um investidor."
        });
      }

      // Criar log de auditoria
      await storage.createAuditLog({
        action: 'login',
        entity: 'customer',
        entityId: customer.id,
        userName: customer.name,
        details: `Investidor fez login: ${customer.email} (${activeInvestorVehicles.length} veículo(s) ativo(s))`,
        ipAddress: req.ip,
      });

      // Retornar cliente sem senha, garantindo que role está presente (investidor antigo)
      const { password, ...sanitizedCustomer } = customer;
      res.json({
        success: true,
        customer: {
          ...sanitizedCustomer,
          role: 'INVESTIDOR' // Garantir que role está presente para investidores antigos
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });



  // Contract Templates Routes
  app.get("/api/contract-templates", async (_req, res) => {
    try {
      const templates = await storage.getContractTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar templates" });
    }
  });

  app.get("/api/contract-templates/:id", async (req, res) => {
    try {
      const template = await storage.getContractTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template não encontrado" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar template" });
    }
  });

  app.get("/api/contract-templates/by-type/:type", async (req, res) => {
    try {
      const templates = await storage.getContractTemplatesByType(req.params.type);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar templates por tipo" });
    }
  });

  app.post("/api/contract-templates", async (req, res) => {
    try {
      const validated = insertContractTemplateSchema.parse(req.body);
      const template = await storage.createContractTemplate(validated);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar template" });
    }
  });

  app.patch("/api/contract-templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validated = updateContractTemplateSchema.parse(req.body);
      const template = await storage.updateContractTemplate(id, validated);

      if (!template) {
        return res.status(404).json({ error: "Template não encontrado" });
      }

      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar template" });
    }
  });

  app.delete("/api/contract-templates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteContractTemplate(id);

      if (!success) {
        return res.status(404).json({ error: "Template não encontrado" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar template" });
    }
  });

  // Rental Plans Routes
  app.get("/api/rental-plans", async (_req, res) => {
    try {
      const plans = await storage.getRentalPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar planos" });
    }
  });

  app.get("/api/rental-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getRentalPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: "Plano não encontrado" });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar plano" });
    }
  });

  app.post("/api/rental-plans", async (req, res) => {
    try {
      const validated = insertRentalPlanSchema.parse(req.body);
      const plan = await storage.createRentalPlan(validated);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar plano" });
    }
  });

  app.patch("/api/rental-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validated = updateRentalPlanSchema.parse(req.body);
      const plan = await storage.updateRentalPlan(id, validated);

      if (!plan) {
        return res.status(404).json({ error: "Plano não encontrado" });
      }

      res.json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar plano" });
    }
  });

  app.delete("/api/rental-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteRentalPlan(id);

      if (!success) {
        return res.status(404).json({ error: "Plano não encontrado" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar plano" });
    }
  });

  // Financing Proposals Routes
  app.get("/api/financing-proposals", async (_req, res) => {
    try {
      const proposals = await storage.getFinancingProposals();
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar propostas" });
    }
  });

  app.get("/api/financing-proposals/seller/:sellerId", async (req, res) => {
    try {
      const { sellerId } = req.params;
      const proposals = await storage.getFinancingProposalsBySeller(sellerId);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar propostas do vendedor" });
    }
  });

  app.get("/api/financing-proposals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const proposal = await storage.getFinancingProposal(id);

      if (!proposal) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }

      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar proposta" });
    }
  });

  app.post("/api/financing-proposals", async (req, res) => {
    try {
      const { userRole, ...proposalData } = req.body;
      const validated = insertFinancingProposalSchema.parse(proposalData);

      // Criar a proposta
      const proposal = await storage.createFinancingProposal(validated);

      // Se o usuário é ADMIN, aprovar automaticamente
      const isAdmin = userRole === "ADMIN";

      if (isAdmin) {
        // Aprovar imediatamente a proposta
        const approvedProposal = await storage.approveFinancingProposal(
          proposal.id,
          validated.sellerId, // O próprio admin é o revisor
          validated.proposedTerms,
          "Aprovação automática (usuário administrador)"
        );

        res.status(201).json(approvedProposal || proposal);
      } else {
        // Vendedores: retornar proposta pendente (fluxo normal)
        res.status(201).json(proposal);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Error creating financing proposal:", error);
      res.status(500).json({ error: "Erro ao criar proposta" });
    }
  });

  app.post("/api/financing-proposals/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminReviewerId, approvedValues, adminNotes } = req.body;

      // Get the proposal first to use its proposed terms as approved values
      const existingProposal = await storage.getFinancingProposal(id);
      if (!existingProposal) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }

      // Use proposed terms as approved values if not provided
      const finalApprovedValues = approvedValues || existingProposal.proposedTerms;
      // Use null if no admin ID provided (allows system approval without specific admin)
      const finalAdminId = adminReviewerId || null;

      const proposal = await storage.approveFinancingProposal(
        id,
        finalAdminId,
        finalApprovedValues,
        adminNotes || "Aprovado via CRM"
      );

      if (!proposal) {
        return res.status(404).json({ error: "Proposta não encontrada ou já foi processada" });
      }

      res.json(proposal);
    } catch (error) {
      console.error("Error approving proposal:", error);
      res.status(500).json({ error: "Erro ao aprovar proposta", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/financing-proposals/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminReviewerId, adminNotes } = req.body;

      const finalAdminId = adminReviewerId || "system";
      const finalNotes = adminNotes || "Rejeitado via CRM";

      const proposal = await storage.rejectFinancingProposal(id, finalAdminId, finalNotes);

      if (!proposal) {
        return res.status(404).json({ error: "Proposta não encontrada ou já foi processada" });
      }

      res.json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Erro ao rejeitar proposta" });
    }
  });

  app.post("/api/financing-proposals/:id/dismiss", async (req, res) => {
    try {
      const { id } = req.params;

      const proposal = await storage.dismissFinancingProposal(id);

      if (!proposal) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }

      res.json(proposal);
    } catch (error) {
      console.error("Error dismissing proposal:", error);
      res.status(500).json({ error: "Erro ao marcar proposta como visualizada" });
    }
  });

  app.get("/api/vehicles", async (_req, res) => {
    try {
      let vehicles = await storage.getVehicles();

      if (process.env.HIDE_INVESTORS === 'true') {
        vehicles = vehicles.map((v: any) => ({
          ...v,
          ownerId: null,
          customDividend: null,
          investorPercentage: null,
        }));
      }

      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/investor/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      let vehicles = await storage.getVehiclesByOwner(customerId);

      // Se não encontrou veículos, tentar buscar pelo CPF (para investidores em admin_users)
      if (vehicles.length === 0) {
        // Verificar se o ID é de um admin_user
        const adminUser = await storage.getAdminUser(customerId);
        if (adminUser && adminUser.cpf) {
          const adminCpf = adminUser.cpf;
          // Buscar o customer correspondente pelo CPF
          const customers = await storage.getCustomers();
          const matchingCustomer = customers.find(c =>
            c.cpf && c.cpf.replace(/\D/g, '') === adminCpf.replace(/\D/g, '')
          );
          if (matchingCustomer) {
            vehicles = await storage.getVehiclesByOwner(matchingCustomer.id);
          }
        }
      }

      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investor vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
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

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.parse(req.body);

      // Set default values for optional fields
      const vehicleData = {
        ...validatedData,
        imageUrl: validatedData.imageUrl || "https://placehold.co/400x300/1a1a2e/ffffff?text=Sem+Imagem",
        pricePerDay: validatedData.pricePerDay ?? "0",
        monthlyPrice: validatedData.monthlyPrice ?? null,
        tradeInValue: validatedData.tradeInValue ?? null,
      };

      const vehicle = await storage.createVehicle(vehicleData);

      // Log vehicle creation with detailed info
      const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
      await storage.createAuditLog({
        action: 'create',
        entity: 'vehicle',
        entityId: vehicle.id,
        entityName: vehicleName,
        userId: (req as any).adminUser?.id || null,
        userName: (req as any).adminUser?.name || 'Sistema',
        details: JSON.stringify({
          placa: vehicle.licensePlate || 'N/A',
          categoria: vehicle.category,
          cor: (vehicle as any).color || 'N/A',
          investidor: vehicle.isInvestorVehicle ? 'Sim' : 'Não'
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });

      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid vehicle data", details: error.errors });
      }
      console.error("[VEHICLE CREATE ERROR]", error);
      res.status(500).json({ error: "Failed to create vehicle" });
    }
  });

  app.post("/api/vehicles/bulk", async (req, res) => {
    try {
      const bulkSchema = z.object({
        vehicles: z.array(insertVehicleSchema)
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid vehicles data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vehicles" });
    }
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    try {
      const validationResult = updateVehicleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid vehicle data", details: validationResult.error });
      }

      const updateData = { ...validationResult.data };
      if (updateData.imageUrl === null) delete updateData.imageUrl;
      const vehicle = await storage.updateVehicle(req.params.id, updateData as any);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      // Permitir deleção mesmo com histórico de aluguéis
      // const rentals = await storage.getVehicleRentals(req.params.id);
      // if (rentals.length > 0) {
      //   return res.status(400).json({ 
      //     error: "Não é possível deletar veículo com histórico de aluguéis",
      //     details: `Este veículo possui ${rentals.length} aluguel(is) registrado(s)` 
      //   });
      // }

      // Verificar financiamentos
      const allFinancings = await storage.getFinancings();
      const vehicleFinancings = allFinancings.filter(f => f.vehicleId === req.params.id);
      if (vehicleFinancings.length > 0) {
        return res.status(400).json({
          error: "Não é possível deletar veículo com financiamentos",
          details: `Este veículo possui ${vehicleFinancings.length} financiamento(s) registrado(s)`
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

  // Upload investment contract to vehicle
  app.patch("/api/vehicles/:id/investment-contract", async (req, res) => {
    try {
      const { contractUrl, contractFileName } = req.body;
      const vehicle = await storage.updateVehicle(req.params.id, {
        investmentContractUrl: contractUrl,
        investmentContractFileName: contractFileName,
      });
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vehicle investment contract" });
    }
  });

  // Remove investment contract from vehicle
  app.delete("/api/vehicles/:id/investment-contract", async (req, res) => {
    try {
      const vehicle = await storage.updateVehicle(req.params.id, {
        investmentContractUrl: null,
        investmentContractFileName: null,
      });
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to remove vehicle investment contract" });
    }
  });

  app.get("/api/vehicles/:vehicleId/rentals", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      const rentals = await storage.getVehicleRentals(req.params.vehicleId);
      res.json(rentals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle rentals" });
    }
  });

  app.get("/api/vehicles/:vehicleId/events", async (req, res) => {
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

  app.get("/api/vehicles/:vehicleId/inspections", async (req, res) => {
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

  app.post("/api/vehicles/:vehicleId/inspections", async (req, res) => {
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
        vehicleId: req.params.vehicleId,
      });

      const inspection = await storage.createVehicleInspection(validatedData);
      console.log("Inspection created successfully:", inspection.id, "type:", inspection.type);
      res.status(201).json(inspection);
    } catch (error) {
      console.error("Failed to create inspection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vehicle inspection" });
    }
  });

  app.post("/api/vehicles/:vehicleId/inspections/bulk", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      // Create schema without vehicleId requirement (will be injected from path)
      const bulkInspectionSchema = insertVehicleInspectionSchema.omit({ vehicleId: true });
      const bulkSchema = z.object({
        inspections: z.array(bulkInspectionSchema)
      });

      const validatedData = bulkSchema.parse(req.body);

      // Add vehicleId to all inspections
      const inspectionsWithVehicleId = validatedData.inspections.map(inspection => ({
        ...inspection,
        vehicleId: req.params.vehicleId,
      }));

      const createdInspections = await storage.createBulkVehicleInspections(inspectionsWithVehicleId);

      res.status(201).json({
        success: true,
        count: createdInspections.length,
        inspections: createdInspections
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid inspections data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vehicle inspections" });
    }
  });

  app.patch("/api/vehicle-inspections/:id", async (req, res) => {
    try {
      const inspection = await storage.getVehicleInspection(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }

      // Allow updating imageType, notes, and imageUrl (for photo replacement)
      // Immutable: vehicleId, type, createdAt, uploadedBy, rentalId
      const updateInspectionSchema = z.object({
        imageType: z.enum(['front', 'back', 'right_side', 'left_side', 'dashboard', 'interior', 'document', 'damage_detail', 'other']).optional(),
        notes: z.string().nullable().optional(),
        imageUrl: z.string().optional(),
      });

      const validatedData = updateInspectionSchema.parse(req.body);

      const updated = await storage.updateVehicleInspection(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid inspection data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update vehicle inspection" });
    }
  });

  app.delete("/api/vehicle-inspections/:id", async (req, res) => {
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

  // Audit Logs
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/vehicles/:vehicleId/statistics", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      const rentals = await storage.getVehicleRentals(req.params.vehicleId);
      const events = await storage.getVehicleEvents(req.params.vehicleId);

      // Separate rentals by status
      const completedRentals = rentals.filter(rental => rental.status === "completed");
      const activeRentals = rentals.filter(rental => rental.status === "active");
      const approvedRentals = rentals.filter(rental => rental.status === "approved");

      // Count completed, active, and approved rentals (exclude only pending and cancelled)
      const validRentals = [...completedRentals, ...activeRentals, ...approvedRentals];
      const totalRentals = validRentals.length;

      // Calculate revenue only from completed rentals (actual finalized earnings)
      const totalRevenue = completedRentals.reduce((sum, rental) => sum + Number(rental.totalPrice), 0);

      // Revenue from active and approved rentals (expected but not finalized)
      const expectedRevenue = [...activeRentals, ...approvedRentals].reduce((sum, rental) => sum + Number(rental.totalPrice), 0);

      const totalEvents = events.length;

      res.json({
        totalRentals,
        totalRevenue,
        expectedRevenue,
        completedRentals: completedRentals.length,
        activeRentals: activeRentals.length,
        totalEvents,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle statistics" });
    }
  });

  app.get("/api/rentals", async (_req, res) => {
    try {
      const rentals = await storage.getRentals();
      res.json(rentals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rentals" });
    }
  });

  app.get("/api/rentals/:id", async (req, res) => {
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

  app.post("/api/rentals", async (req, res) => {
    try {
      console.log("Received rental data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertRentalSchema.parse(req.body);
      const totalPrice = req.body.totalPrice;
      const bonusDiscountUsed = req.body.bonusDiscountUsed || "0";
      const priceBeforeDiscount = req.body.priceBeforeDiscount || totalPrice;

      if (!totalPrice || totalPrice <= 0) {
        return res.status(400).json({ error: "Invalid total price" });
      }

      // Sempre buscar cliente existente por CPF
      let customer = await storage.getCustomerByCpf(validatedData.customerCpf);

      // Se não encontrar, criar novo cliente
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
          driverType: "principal",
        });
      } else {
        // Atualizar dados do cliente existente
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
          zipCode: validatedData.zipCode,
        });

        // Se usou bonificação, zerar o saldo
        if (parseFloat(bonusDiscountUsed) > 0) {
          await storage.updateCustomer(customer.id, {
            bonusBalance: "0",
          });
        }
      }

      // Criar aluguel vinculado ao cliente
      // Para aluguéis mensais, usar as datas baseadas nos meses selecionados
      const rentalData: any = {
        ...validatedData,
        customerId: customer.id,
        totalPrice,
        bonusDiscountUsed,
        priceBeforeDiscount,
      };

      // Se for aluguel mensal, converter startMonth/endMonth para startDate/endDate
      const body = req.body as any;
      if (body.isMonthly && body.startMonth && body.endMonth) {
        // Converter "2025-01" para Date (primeiro dia do mês)
        rentalData.startDate = new Date(body.startMonth + "-01");
        // Converter "2025-05" para Date (último dia do mês)
        const endDateParts = body.endMonth.split("-");
        const endYear = parseInt(endDateParts[0]);
        const endMonth = parseInt(endDateParts[1]);
        rentalData.endDate = new Date(endYear, endMonth, 0); // Dia 0 = último dia do mês anterior
      } else if (!rentalData.startDate) {
        // Fallback: usar data atual se não tiver nenhuma data
        rentalData.startDate = new Date();
        rentalData.endDate = new Date();
      }

      const rental = await storage.createRental(rentalData);

      // Atualizar estatísticas se aprovado
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid rental data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create rental" });
    }
  });

  // Rota completa para criar rental com workflow de 5 etapas
  app.post("/api/rentals/complete", async (req, res) => {
    try {
      const { customerData, vehicleId, checkInPhotos, contractData, paymentData, startDate, endDate, selectedPlanIds } = req.body;

      // Validar dados obrigatórios
      if (!customerData || !vehicleId || !checkInPhotos || !contractData || !paymentData) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      // 1. Criar ou atualizar cliente
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
          driverType: "principal",
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
          zipCode: customerData.zipCode,
        });
      }

      // 2. Buscar veículo para calcular preço
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }

      // Calcular total price (assumindo que paymentData.amount contém o valor)
      const totalPrice = paymentData.amount || vehicle.pricePerDay;

      // 3. Preparar array de imagens do check-in (conversão do objeto para array)
      const checkInImages: string[] = [];
      const photoKeys = [
        "frente", "fundo", "lateral_esquerda", "lateral_direita", "motor",
        "step_macaco_triangulo", "pneu_1", "pneu_2", "pneu_3", "pneu_4",
        "chassi", "odometro", "nivel_gasolina"
      ];
      photoKeys.forEach(key => {
        if (checkInPhotos[key]) {
          checkInImages.push(checkInPhotos[key]);
        }
      });

      // 4. Criar rental com todos os dados
      const rental = await storage.createRental({
        vehicleId,
        customerId: customer.id,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        customerCpf: customerData.cpf,
        startDate: new Date(startDate || new Date()),
        endDate: new Date(endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 dias default
        totalPrice,
        status: "approved", // Já aprovado pois passou por todo workflow
        hasCheckin: true,
        checkInImages,
        checkInNotes: checkInPhotos.notes || null,
        checkInDate: new Date(),
        checkinCompletedAt: new Date(),
        contractUrl: contractData.fileUrl,
        contractGeneratedAt: new Date(),
        paymentMethod: paymentData.method,
        paymentProofUrl: paymentData.proofUrl,
        paymentVerifiedAt: new Date(),
        selectedPlanIds: selectedPlanIds || null,
      });

      // 5. Atualizar estatísticas do cliente
      await storage.updateCustomerStats(customer.id);

      // 6. Atualizar earnings do investidor se o veículo for de investidor
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

  // Rota para processar solicitações pendentes (pré-preenchidas do frontend)
  app.patch("/api/rentals/:id/process", async (req, res) => {
    try {
      const rentalId = req.params.id;
      const { customerData, vehicleId, checkInPhotos, contractData, paymentData, startDate, endDate, selectedPlanIds } = req.body;

      // Buscar rental existente
      const existingRental = await storage.getRental(rentalId);
      if (!existingRental) {
        return res.status(404).json({ error: "Solicitação não encontrada" });
      }

      if (existingRental.status !== "pending") {
        return res.status(400).json({ error: "Apenas solicitações pendentes podem ser processadas" });
      }

      // Validar dados obrigatórios
      if (!customerData || !vehicleId || !checkInPhotos || !contractData || !paymentData) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      // 1. Criar ou atualizar cliente
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
          driverType: "principal",
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
          zipCode: customerData.zipCode,
        });
      }

      // 2. Buscar veículo para calcular preço
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }

      // Calcular total price (assumindo que paymentData.amount contém o valor)
      const totalPrice = paymentData.amount || existingRental.totalPrice;

      // 3. Preparar array de imagens do check-in (conversão do objeto para array)
      const checkInImages: string[] = [];
      const photoKeys = [
        "frente", "fundo", "lateral_esquerda", "lateral_direita", "motor",
        "step_macaco_triangulo", "pneu_1", "pneu_2", "pneu_3", "pneu_4",
        "chassi", "odometro", "nivel_gasolina"
      ];
      photoKeys.forEach(key => {
        if (checkInPhotos[key]) {
          checkInImages.push(checkInPhotos[key]);
        }
      });

      // 4. Atualizar rental com todos os dados
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
        status: "approved", // Aprovado após processar
        hasCheckin: true,
        checkInImages,
        checkInNotes: checkInPhotos.notes || null,
        checkInDate: new Date(),
        checkinCompletedAt: new Date(),
        contractUrl: contractData.fileUrl,
        contractGeneratedAt: new Date(),
        paymentMethod: paymentData.method,
        paymentProofUrl: paymentData.proofUrl,
        paymentVerifiedAt: new Date(),
        selectedPlanIds: selectedPlanIds || null,
      });

      // 5. Atualizar estatísticas do cliente
      await storage.updateCustomerStats(customer.id);

      // 6. Atualizar earnings do investidor se o veículo for de investidor
      if (vehicle.isInvestorVehicle && vehicle.ownerId) {
        const percentage = vehicle.investorPercentage || 70;
        const investorAmount = totalPrice * (percentage / 100);
        await storage.updateInvestorEarnings(vehicle.ownerId, investorAmount);
      }

      res.json(updatedRental);
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
      res.status(500).json({ error: "Erro ao processar solicitação" });
    }
  });

  app.patch("/api/rentals/:id", async (req, res) => {
    try {
      const { startDate, endDate, status, totalPrice } = req.body;

      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      // MANDATORY: Validate status transitions require check-in/check-out
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

      const updateData: any = {};
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (status) updateData.status = status;
      if (totalPrice) updateData.totalPrice = totalPrice;

      // Adicionar campos de checkout e finalização se presentes
      if (req.body.hasCheckout !== undefined) updateData.hasCheckout = req.body.hasCheckout;
      if (req.body.checkOutImages !== undefined) updateData.checkOutImages = req.body.checkOutImages;
      if (req.body.checkOutNotes !== undefined) updateData.checkOutNotes = req.body.checkOutNotes;
      if (req.body.checkoutCompletedAt !== undefined) updateData.checkoutCompletedAt = new Date(req.body.checkoutCompletedAt);
      if (req.body.checkpointTiresSame !== undefined) updateData.checkpointTiresSame = req.body.checkpointTiresSame;
      if (req.body.checkpointFuelSame !== undefined) updateData.checkpointFuelSame = req.body.checkpointFuelSame;
      if (req.body.checkpointHasDamages !== undefined) updateData.checkpointHasDamages = req.body.checkpointHasDamages;
      if (req.body.checkpointDamagesNotes !== undefined) updateData.checkpointDamagesNotes = req.body.checkpointDamagesNotes;
      if (req.body.checkpointRepairCost !== undefined) updateData.checkpointRepairCost = req.body.checkpointRepairCost;
      if (req.body.repairPaid !== undefined) updateData.repairPaid = req.body.repairPaid;
      if (req.body.finalizationDebtAmount !== undefined) updateData.finalizationDebtAmount = req.body.finalizationDebtAmount;
      if (req.body.finalizationPaymentMethod !== undefined) updateData.finalizationPaymentMethod = req.body.finalizationPaymentMethod;
      if (req.body.finalizedAt !== undefined) updateData.finalizedAt = new Date(req.body.finalizedAt);

      const updatedRental = await storage.updateRental(req.params.id, updateData);

      // Disponibilizar veículo quando contrato for concluído, cancelado ou finalizado
      if (status && (status === "completed" || status === "cancelled" || status === "finalized")) {
        await storage.updateVehicle(rental.vehicleId || "", { available: true });
      }

      res.json(updatedRental);
    } catch (error) {
      console.error("Erro ao atualizar rental:", error);
      res.status(500).json({ error: "Failed to update rental" });
    }
  });

  app.patch("/api/rentals/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Fetch rental BEFORE mutation to validate current state
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      // MANDATORY: Validate status transitions require check-in/check-out BEFORE mutation
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

      // Only update status after all validations pass
      const updatedRental = await storage.updateRentalStatus(req.params.id, status);

      // Disponibilizar veículo quando contrato for concluído, cancelado ou finalizado
      if (status === "completed" || status === "cancelled" || status === "finalized") {
        await storage.updateVehicle(rental.vehicleId || "", { available: true });
      }

      res.json(updatedRental);
    } catch (error) {
      res.status(500).json({ error: "Failed to update rental status" });
    }
  });

  app.delete("/api/rentals/:id", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      // Mark vehicle as available when rental is deleted
      await storage.updateVehicle(rental.vehicleId || "", { available: true });

      await storage.deleteRental(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rental" });
    }
  });

  // DEPRECATED: Use /api/rentals/:id/checkin instead
  // This endpoint is kept for backwards compatibility but now requires check-in to be completed first
  app.post("/api/rentals/:id/approve", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      if (rental.status !== "pending") {
        return res.status(400).json({ error: "Only pending rentals can be approved" });
      }

      // MANDATORY: Check-in must be completed before approval
      if (!rental.hasCheckin) {
        return res.status(400).json({
          error: "Check-in is mandatory before approval. Please complete check-in first via /api/rentals/:id/checkin"
        });
      }

      // Create or update customer based on CPF
      let customer = await storage.getCustomerByCpf(rental.customerCpf);

      if (!customer) {
        customer = await storage.createCustomer({
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          cpf: rental.customerCpf,
          isNegativado: rental.isNegativado,
          status: "active",
          driverType: "principal",
        });
      } else {
        // Update customer info if needed
        await storage.updateCustomer(customer.id, {
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          isNegativado: rental.isNegativado,
        });
      }

      // Update rental status and link to customer
      const updatedRental = await storage.updateRental(req.params.id, {
        status: "approved",
        customerId: customer.id,
      });

      // Update customer stats
      await storage.updateCustomerStats(customer.id);

      // Update vehicle availability (mark as unavailable)
      await storage.updateVehicle(rental.vehicleId || "", { available: false });

      // NOTA: Earnings de investidores agora são calculados via pagamentos mensais fixos
      // baseados nas investment_quotas, não mais percentuais de aluguéis
      // Ver tabela investor_payments para registro de pagamentos mensais

      res.json({ rental: updatedRental, customer });
    } catch (error) {
      console.error("Failed to approve rental:", error);
      res.status(500).json({ error: "Failed to approve rental" });
    }
  });

  // Check-in endpoint - Obrigatório para aprovar aluguel
  app.post("/api/rentals/:id/checkin", async (req, res) => {
    try {
      const { images, notes } = req.body;
      const rental = await storage.getRental(req.params.id);

      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      // Allow check-in for pending OR approved rentals (for legacy rentals approved before check-in system)
      if (rental.status !== "pending" && rental.status !== "approved") {
        return res.status(400).json({ error: "Check-in can only be done for pending or approved rentals" });
      }

      if (!images || images.length === 0) {
        return res.status(400).json({ error: "At least one image is required for check-in" });
      }

      // Extract image URLs for rental record
      const imageUrls = images.map((img: any) => typeof img === 'string' ? img : img.url);

      // Update rental with check-in data
      await storage.updateRental(req.params.id, {
        hasCheckin: true,
        checkInImages: imageUrls,
        checkInNotes: notes || null,
        checkInDate: new Date(),
      });

      // Save inspection photos in vehicle_inspections with customer name and correct types
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageUrl = typeof image === 'string' ? image : image.url;
        const imageType = typeof image === 'string' ?
          (i === 0 ? 'front' : i === 1 ? 'back' : i === 2 ? 'right_side' : i === 3 ? 'left_side' : 'other') :
          image.type;

        await storage.createVehicleInspection({
          vehicleId: rental.vehicleId || "",
          rentalId: rental.id,
          type: 'check-in',
          imageUrl: imageUrl,
          imageType: imageType,
          notes: i === 0 ? `Check-in - ${rental.customerName} - ${notes || ''}` : null,
          uploadedBy: 'admin',
        });
      }

      // Create or update customer based on CPF
      let customer = await storage.getCustomerByCpf(rental.customerCpf);

      if (!customer) {
        customer = await storage.createCustomer({
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          cpf: rental.customerCpf,
          isNegativado: rental.isNegativado,
          status: "active",
          driverType: "principal",
        });
      } else {
        // Update customer info if needed
        await storage.updateCustomer(customer.id, {
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          isNegativado: rental.isNegativado,
        });
      }

      // Approve rental automatically after check-in
      const updatedRental = await storage.updateRental(req.params.id, {
        status: "approved",
        customerId: customer.id,
      });

      // Update customer stats
      await storage.updateCustomerStats(customer.id);

      // Update vehicle availability (mark as unavailable)
      await storage.updateVehicle(rental.vehicleId || "", { available: false });

      res.json({ rental: updatedRental, customer });
    } catch (error) {
      console.error("Failed to process check-in:", error);
      res.status(500).json({ error: "Failed to process check-in" });
    }
  });

  // Check-out endpoint - Obrigatório para finalizar aluguel
  app.post("/api/rentals/:id/checkout", async (req, res) => {
    try {
      const { images, notes } = req.body;
      const rental = await storage.getRental(req.params.id);

      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      if (rental.status !== "approved") {
        return res.status(400).json({ error: "Check-out can only be done for approved rentals" });
      }

      // MANDATORY: Check-in must have been completed before check-out
      if (!rental.hasCheckin) {
        return res.status(400).json({
          error: "Check-in must be completed before check-out. Cannot finalize a rental without check-in."
        });
      }

      if (!images || images.length === 0) {
        return res.status(400).json({ error: "At least one image is required for check-out" });
      }

      // Extract image URLs for rental record
      const imageUrls = images.map((img: any) => typeof img === 'string' ? img : img.url);

      // Update rental with check-out data
      await storage.updateRental(req.params.id, {
        hasCheckout: true,
        checkOutImages: imageUrls,
        checkOutNotes: notes || null,
        checkOutDate: new Date(),
      });

      // Save inspection photos in vehicle_inspections with customer name and correct types
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const imageUrl = typeof image === 'string' ? image : image.url;
        const imageType = typeof image === 'string' ?
          (i === 0 ? 'front' : i === 1 ? 'back' : i === 2 ? 'right_side' : i === 3 ? 'left_side' : 'other') :
          image.type;

        await storage.createVehicleInspection({
          vehicleId: rental.vehicleId || "",
          rentalId: rental.id,
          type: 'check-out',
          imageUrl: imageUrl,
          imageType: imageType,
          notes: i === 0 ? `Check-out - ${rental.customerName} - ${notes || ''}` : null,
          uploadedBy: 'admin',
        });
      }

      // Complete rental automatically after check-out
      const updatedRental = await storage.updateRental(req.params.id, {
        status: "completed",
      });

      // Update vehicle availability (mark as available)
      await storage.updateVehicle(rental.vehicleId || "", { available: true });

      res.json({ rental: updatedRental });
    } catch (error) {
      console.error("Failed to process check-out:", error);
      res.status(500).json({ error: "Failed to process check-out" });
    }
  });

  // ==============================================================
  // NOVO SISTEMA DE APROVAÇÃO EM 3 ETAPAS
  // ==============================================================

  // Etapa 1: Vistoria (Check-in) - Itens individuais

  // Listar itens de vistoria de um aluguel
  app.get("/api/rentals/:id/inspection-items", async (req, res) => {
    try {
      const items = await storage.getRentalInspectionItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch inspection items:", error);
      res.status(500).json({ error: "Failed to fetch inspection items" });
    }
  });

  // Criar item de vistoria
  app.post("/api/rentals/:id/inspection-items", async (req, res) => {
    try {
      const { photoType, imageUrl, hasDamage, damageDescription } = req.body;

      // Validar dados
      const validatedData = insertRentalInspectionItemSchema.parse({
        rentalId: req.params.id,
        photoType,
        imageUrl,
        hasDamage: hasDamage || false,
        damageDescription: damageDescription || null,
      });

      const item = await storage.createRentalInspectionItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Failed to create inspection item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create inspection item" });
    }
  });

  // Marcar vistoria como concluída
  app.post("/api/rentals/:id/checkin-complete", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      // Verificar se todas as 9 fotos foram enviadas
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

      const existingTypes = items.map(item => item.photoType);
      const missingTypes = requiredTypes.filter(type => !existingTypes.includes(type));

      if (missingTypes.length > 0) {
        return res.status(400).json({
          error: "Missing required inspection photos",
          missingTypes
        });
      }

      // Marcar como concluída
      const updated = await storage.updateRental(req.params.id, {
        checkinCompletedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to complete checkin:", error);
      res.status(500).json({ error: "Failed to complete checkin" });
    }
  });

  // Etapa 2: Gerar/marcar contrato como gerado
  app.post("/api/rentals/:id/contract-generate", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      // Verificar se vistoria foi concluída
      if (!rental.checkinCompletedAt) {
        return res.status(400).json({
          error: "Checkin must be completed before generating contract"
        });
      }

      const updated = await storage.updateRental(req.params.id, {
        contractGeneratedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to generate contract:", error);
      res.status(500).json({ error: "Failed to generate contract" });
    }
  });

  // Etapa 3: Upload de comprovante de pagamento
  app.post("/api/rentals/:id/payment-proof", async (req, res) => {
    try {
      const { proofUrl } = req.body;

      if (!proofUrl) {
        return res.status(400).json({ error: "Proof URL is required" });
      }

      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      // Verificar se contrato foi gerado
      if (!rental.contractGeneratedAt) {
        return res.status(400).json({
          error: "Contract must be generated before submitting payment proof"
        });
      }

      const updated = await storage.updateRental(req.params.id, {
        paymentProofUrl: proofUrl,
        paymentVerifiedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to upload payment proof:", error);
      res.status(500).json({ error: "Failed to upload payment proof" });
    }
  });

  // Status de aprovação
  app.get("/api/rentals/:id/approval-status", async (req, res) => {
    try {
      const status = await storage.getRentalApprovalStatus(req.params.id);
      res.json(status);
    } catch (error) {
      console.error("Failed to get approval status:", error);
      res.status(500).json({ error: "Failed to get approval status" });
    }
  });

  // Aprovação final (com validações)
  app.post("/api/rentals/:id/approve-final", async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ error: "Rental not found" });
      }

      // Verificar status de aprovação
      const approvalStatus = await storage.getRentalApprovalStatus(req.params.id);

      if (!approvalStatus.canApprove) {
        return res.status(400).json({
          error: "Rental cannot be approved. Missing required steps.",
          missingItems: approvalStatus.missingItems
        });
      }

      // Criar ou atualizar cliente
      let customer = await storage.getCustomerByCpf(rental.customerCpf);

      if (!customer) {
        customer = await storage.createCustomer({
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          cpf: rental.customerCpf,
          isNegativado: rental.isNegativado,
          status: "active",
          driverType: "principal",
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: rental.customerName,
          email: rental.customerEmail,
          phone: rental.customerPhone,
          isNegativado: rental.isNegativado,
        });
      }

      // Aprovar aluguel
      const updatedRental = await storage.updateRental(req.params.id, {
        status: "approved",
        customerId: customer.id,
      });

      // Update customer stats
      await storage.updateCustomerStats(customer.id);

      // Update vehicle availability (mark as unavailable)
      await storage.updateVehicle(rental.vehicleId || "", { available: false });

      res.json({ rental: updatedRental, customer });
    } catch (error) {
      console.error("Failed to approve rental:", error);
      res.status(500).json({ error: "Failed to approve rental" });
    }
  });

  // ==============================================================

  app.get("/api/investors", async (_req, res) => {
    try {
      let investors = await storage.getInvestors();
      
      if (process.env.HIDE_INVESTORS === 'true') {
        investors = investors.map(i => ({
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

  app.get("/api/investors/duplicates", async (_req, res) => {
    try {
      const duplicates = await storage.getDuplicateInvestors();
      res.json(duplicates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch duplicate investors" });
    }
  });

  app.post("/api/investors/merge", async (req, res) => {
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

  app.get("/api/investors/:id", async (req, res) => {
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

  app.post("/api/investors", async (req, res) => {
    try {
      console.log("POST /api/investors - birthDate received:", req.body.birthDate);
      console.log("POST /api/investors - All fields received:", Object.keys(req.body));
      // Parse bankData if it's a JSON string
      let dataToValidate = { ...req.body };
      if (typeof req.body.bankData === 'string') {
        try {
          const bankData = JSON.parse(req.body.bankData);
          // Extract bank fields into the main object
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
            pixKey: bankData.pixKey || null,
          };
          delete dataToValidate.bankData; // Remove the original JSON string
        } catch (e) {
          console.error("Failed to parse bankData JSON:", e);
        }
      }

      const validatedData = insertCustomerSchema.parse(dataToValidate);
      const investor = await storage.createInvestor(validatedData);
      res.status(201).json(investor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid investor data", details: error.errors });
      }
      console.error("Error creating investor:", error);
      res.status(500).json({ error: "Failed to create investor", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/investors/:id", async (req, res) => {
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

  app.delete("/api/investors/:id", async (req, res) => {
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

  // Cancel investment - delete investor and all their vehicles OR just selected vehicles (requires admin password)
  app.post("/api/investors/:id/cancel-investment", async (req, res) => {
    try {
      const investorId = req.params.id;
      const { adminPassword, vehicleIds } = req.body;

      // Validate admin password
      if (!adminPassword) {
        return res.status(400).json({ error: "Admin password is required" });
      }

      // Get current admin user from session or verify against any admin
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
        return res.status(401).json({ error: "Senha de administrador inválida" });
      }

      // Check if investor exists
      const investor = await storage.getInvestor(investorId);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }

      // Get all investor vehicles
      const investorVehicles = await storage.getInvestorVehicles(investorId);
      const investorVehicleIds = investorVehicles.filter(v => v.isInvestorVehicle).map(v => v.id);

      // Determine which vehicles to delete
      const vehiclesToDelete = vehicleIds && Array.isArray(vehicleIds) && vehicleIds.length > 0
        ? vehicleIds.filter((id: string) => investorVehicleIds.includes(id))
        : investorVehicleIds;

      // Check if we're deleting all vehicles (should also delete investor)
      const deletingAllVehicles = vehiclesToDelete.length === investorVehicleIds.length;

      // Delete selected vehicles
      for (const vehicleId of vehiclesToDelete) {
        await storage.deleteVehicle(vehicleId);
      }

      // If deleting all vehicles, also delete the investor
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
        // Partial deletion - only vehicles removed, investor remains
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

  app.post("/api/investor-with-vehicle", async (req, res) => {
    try {
      const { name, email, phone, cpf, rg, driverLicense, emergencyContact, street, complement, neighborhood, city, state, zipCode, paymentDate, vehicleName, category, brand, model, year, pricePerDay, transmission, fuel, seats, imageUrl, licensePlate, fipeValue, evaluationFrontImage, evaluationBackImage, evaluationRightSideImage, evaluationLeftSideImage, evaluationMotorImage, evaluationStepImage, evaluationTire1Image, evaluationTire2Image, evaluationTire3Image, evaluationTire4Image, evaluationChassiImage, evaluationOdometroImage, evaluationNivelGasolinaImage, isVehicleOwner, vehicleOwnerName } = req.body;

      // Verificar se já existe investidor com esse CPF
      let investor = await storage.getCustomerByCpf(cpf);

      if (!investor) {
        // Criar novo investidor se não existir
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
        // Atualizar dados do investidor existente
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
          paymentDate,
        });
      }

      // Validar e criar solicitação de veículo com fotos de vistoria
      const vehicleRequestData = insertVehicleRequestSchema.parse({
        ownerId: investor.id,
        name: vehicleName,
        category,
        brand,
        model,
        year,
        pricePerDay: pricePerDay || null, // Opcional - admin define após aprovação
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
        evaluationNivelGasolinaImage: evaluationNivelGasolinaImage || null,
      });

      await storage.createVehicleRequest(vehicleRequestData);

      res.status(201).json({ investor });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create investor with vehicle" });
    }
  });

  app.post("/api/investors/:id/approve", async (req, res) => {
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

  app.post("/api/investors/:id/reject", async (req, res) => {
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

  app.get("/api/leads", async (_req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
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

  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid lead data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
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

  app.delete("/api/leads/:id", async (req, res) => {
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

  app.get("/api/interactions", async (_req, res) => {
    try {
      const interactions = await storage.getInteractions();
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });

  app.get("/api/interactions/:id", async (req, res) => {
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

  app.post("/api/interactions", async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(validatedData);
      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid interaction data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create interaction" });
    }
  });

  // Vehicle Requests
  app.get("/api/vehicle-requests", async (_req, res) => {
    try {
      let requests = await storage.getVehicleRequests();

      if (process.env.HIDE_INVESTORS === 'true') {
        requests = requests.map(r => ({
          ...r,
          investor: r.investor ? {
            ...r.investor,
            name: "Investidor Oculto",
            cpf: "000.000.000-00",
            email: "oculto@projeto.car"
          } : undefined
        }));
      }

      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle requests" });
    }
  });

  app.get("/api/vehicle-requests/:id", async (req, res) => {
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

  app.post("/api/vehicle-requests", async (req, res) => {
    try {
      const validatedData = insertVehicleRequestSchema.parse(req.body);
      const request = await storage.createVehicleRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid vehicle request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vehicle request" });
    }
  });

  app.post("/api/vehicle-requests/:id/approve", async (req, res) => {
    try {
      const { pricePerDay, monthlyPrice, customDividend } = req.body;
      if (!pricePerDay) {
        return res.status(400).json({ error: "Valor da diária é obrigatório para aprovar veículo" });
      }

      // Get request details before approval
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

      // Log approval with detailed info
      const vehicleName = `${requestDetails?.brand || vehicle.brand} ${requestDetails?.model || vehicle.model} ${requestDetails?.year || vehicle.year}`;
      await storage.createAuditLog({
        action: 'approve',
        entity: 'vehicle_request',
        entityId: vehicle.id,
        entityName: vehicleName,
        userId: (req as any).adminUser?.id || null,
        userName: (req as any).adminUser?.name || 'Admin',
        details: JSON.stringify({
          investidor: (requestDetails as any)?.investor?.name || 'N/A',
          cpf_investidor: (requestDetails as any)?.investorCpf || 'N/A',
          diaria: pricePerDay,
          mensal: monthlyPrice || 'N/A',
          dividendo: customDividend || 'N/A'
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });

      res.status(201).json(vehicle);
    } catch (error) {
      console.error("[APPROVE VEHICLE REQUEST ERROR]", error);
      res.status(500).json({ error: "Failed to approve vehicle request", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/vehicle-requests/:id/reject", async (req, res) => {
    try {
      const { adminNotes } = req.body;

      // Get request details before rejection
      const requestDetails = await storage.getVehicleRequest(req.params.id);

      const request = await storage.updateVehicleRequestStatus(req.params.id, "rejected", adminNotes);
      if (!request) {
        return res.status(404).json({ error: "Vehicle request not found" });
      }

      // Log rejection
      const vehicleName = `${requestDetails?.brand} ${requestDetails?.model} ${requestDetails?.year}`;
      await storage.createAuditLog({
        action: 'reject',
        entity: 'vehicle_request',
        entityId: req.params.id,
        entityName: vehicleName,
        userId: (req as any).adminUser?.id || null,
        userName: (req as any).adminUser?.name || 'Admin',
        details: JSON.stringify({
          investidor: (requestDetails as any)?.investor?.name || 'N/A',
          motivo: adminNotes || 'Não especificado'
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });

      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject vehicle request" });
    }
  });

  // Customers
  app.get("/api/customers", async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      const vehicles = await storage.getVehicles();

      // Adicionar campo calculado hasInvestorVehicles, hasPassword e remover senha
      let customersWithInvestorInfo = customers.map(customer => {
        const { password, ...sanitizedCustomer } = customer;
        return {
          ...sanitizedCustomer,
          hasInvestorVehicles: vehicles.some(v => v.ownerId === customer.id && v.isInvestorVehicle),
          hasPassword: !!password,
        };
      });

      if (process.env.HIDE_INVESTORS === 'true') {
        customersWithInvestorInfo = customersWithInvestorInfo.map((c: any) => {
          if (c.hasInvestorVehicles) {
            return {
              ...c,
              name: "Investidor Oculto",
              cpf: "000.000.000-00",
              phone: "(00) 00000-0000",
              email: "oculto@projeto.car",
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

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      // Remover senha antes de retornar
      const { password, ...sanitizedCustomer } = customer;
      res.json(sanitizedCustomer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.get("/api/customers/:id/rentals", async (req, res) => {
    try {
      const rentals = await storage.getCustomerRentals(req.params.id);
      res.json(rentals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer rentals" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);

      // Log customer creation
      await storage.createAuditLog({
        action: 'create',
        entity: 'customer',
        entityId: customer.id,
        entityName: customer.name,
        userId: (req as any).adminUser?.id || null,
        userName: (req as any).adminUser?.name || 'Sistema',
        details: JSON.stringify({
          cpf: customer.cpf,
          email: customer.email,
          telefone: customer.phone || 'N/A'
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });

      // Remover senha antes de retornar
      const { password, ...sanitizedCustomer } = customer;
      res.status(201).json(sanitizedCustomer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid customer data", details: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const validationResult = insertCustomerSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid customer data", details: validationResult.error });
      }

      const updateData = validationResult.data;

      // Se estiver atualizando o CPF, verificar se não existe outro cliente com o mesmo CPF
      if (updateData.cpf) {
        const currentCustomer = await storage.getCustomer(req.params.id);
        if (!currentCustomer) {
          return res.status(404).json({ error: "Customer not found" });
        }

        // Se o CPF foi alterado, verificar se já existe outro cliente com esse CPF
        if (updateData.cpf !== currentCustomer.cpf) {
          const existingCustomer = await storage.getCustomerByCpf(updateData.cpf);
          if (existingCustomer && existingCustomer.id !== req.params.id) {
            return res.status(400).json({
              error: "CPF já cadastrado",
              details: "Já existe outro cliente cadastrado com este CPF"
            });
          }
        }
      }

      // Se estiver atualizando a senha, fazer hash
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const customer = await storage.updateCustomer(req.params.id, updateData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      // Remover senha antes de retornar
      const { password, ...sanitizedCustomer } = customer;
      res.json(sanitizedCustomer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Upload de contrato de investidor (pelo admin no "Ver Painel")
  app.patch("/api/customers/:id/investor-contract", async (req, res) => {
    try {
      const { contractUrl, contractFileName } = req.body;

      if (!contractUrl || !contractFileName) {
        return res.status(400).json({ error: "contractUrl e contractFileName são obrigatórios" });
      }

      const customer = await storage.updateCustomer(req.params.id, {
        investorContractUrl: contractUrl,
        investorContractFileName: contractFileName,
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

  // Remover contrato de investidor
  app.delete("/api/customers/:id/investor-contract", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, {
        investorContractUrl: null,
        investorContractFileName: null,
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

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      // Verificar dependências antes de deletar
      const investorPayments = await storage.getInvestorPayments(req.params.id);
      if (investorPayments.length > 0) {
        return res.status(400).json({
          error: "Não é possível deletar investidor com histórico de pagamentos",
          details: `Este investidor possui ${investorPayments.length} pagamento(s) registrado(s)`
        });
      }

      const allVehicleRequests = await storage.getVehicleRequests();
      const ownerRequests = allVehicleRequests.filter((r: VehicleRequest) => r.ownerId === req.params.id);
      const pendingRequests = ownerRequests.filter((r: VehicleRequest) => r.status === 'pending');
      if (pendingRequests.length > 0) {
        return res.status(400).json({
          error: "Não é possível deletar cliente com solicitações pendentes",
          details: `Este cliente possui ${pendingRequests.length} solicitação(ões) de veículo pendente(s)`
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

  // Customer stats endpoints
  app.get("/api/customers/:id/current-rental", async (req, res) => {
    try {
      const rental = await storage.getCurrentRental(req.params.id);
      res.json(rental || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current rental" });
    }
  });

  app.get("/api/customers/:id/average-duration", async (req, res) => {
    try {
      const avgDays = await storage.getAverageRentalDuration(req.params.id);
      res.json({ averageDays: avgDays });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate average duration" });
    }
  });

  // Customer Events endpoints
  app.get("/api/customer-events", async (req, res) => {
    try {
      const events = await storage.getAllCustomerEvents();
      res.json(events);
    } catch (error) {
      console.error("[customer-events] Error fetching all events:", error);
      res.status(500).json({ error: "Failed to fetch customer events" });
    }
  });

  app.get("/api/operational-expenses", async (req, res) => {
    try {
      const expenses = await storage.getAllOperationalExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("[operational-expenses] Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch operational expenses" });
    }
  });

  app.get("/api/customers/:customerId/events", async (req, res) => {
    try {
      const events = await storage.getCustomerEvents(req.params.customerId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer events" });
    }
  });

  app.get("/api/customer-events/:id", async (req, res) => {
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

  app.post("/api/customer-events", async (req, res) => {
    try {
      const validatedData = insertCustomerEventSchema.parse(req.body);
      const event = await storage.createCustomerEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[customer-events] Validation error:", error.errors);
        return res.status(400).json({ error: "Invalid event data", details: error.errors });
      }
      console.error("[customer-events] Error creating event:", error);
      res.status(500).json({ error: "Failed to create event", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/customer-events/:id", async (req, res) => {
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

  app.delete("/api/customer-events/:id", async (req, res) => {
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

  // Investor Events endpoints
  app.get("/api/investors/:investorId/events", async (req, res) => {
    try {
      const events = await storage.getInvestorEvents(req.params.investorId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investor events" });
    }
  });

  app.get("/api/investor-events/:id", async (req, res) => {
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

  app.post("/api/investor-events", async (req, res) => {
    try {
      const validatedData = insertInvestorEventSchema.parse(req.body);
      const event = await storage.createInvestorEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid event data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/investor-events/:id", async (req, res) => {
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

  app.delete("/api/investor-events/:id", async (req, res) => {
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

  // Investor Vehicles endpoint
  app.get("/api/investors/:investorId/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getInvestorVehicles(req.params.investorId);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investor vehicles" });
    }
  });

  app.get("/api/contracts/:rentalId/pdf", async (req, res) => {
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
        size: 'A4',
        margins: {
          top: 14.17, // 0.5cm in points
          bottom: 14.17,
          left: 28.35, // 1cm left/right
          right: 28.35
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const currentDate = format(new Date(), "dd-MM-yyyy");
        const filename = `Contrato de locacao - ${currentDate}.pdf`;
        const encodedFilename = encodeURIComponent(`Contrato de locação - ${currentDate}.pdf`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
        res.send(pdfBuffer);
      });

      generateContractPdf(doc, customer, rental, vehicle);
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  app.get("/api/contracts/:rentalId/docx", async (req, res) => {
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

      const currentDate = format(new Date(), "dd-MM-yyyy");
      const filename = `Contrato de locacao - ${currentDate}.docx`;
      const encodedFilename = encodeURIComponent(`Contrato de locação - ${currentDate}.docx`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      res.send(docxBuffer);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      res.status(500).json({ error: "Failed to generate DOCX" });
    }
  });

  // Investor Contract endpoints
  app.get("/api/investor-contracts/:investorId/pdf", async (req, res) => {
    try {
      const investor = await storage.getInvestor(req.params.investorId);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }

      const vehicles = await storage.getInvestorVehicles(req.params.investorId);

      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 14.17,
          bottom: 14.17,
          left: 28.35,
          right: 28.35
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const currentDate = format(new Date(), "dd-MM-yyyy");
        const filename = `Contrato de Parceria - ${currentDate}.pdf`;
        const encodedFilename = encodeURIComponent(`Contrato de Parceria - ${currentDate}.pdf`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
        res.send(pdfBuffer);
      });

      generateInvestorContractPdf(doc, investor, vehicles);
      doc.end();
    } catch (error) {
      console.error('Error generating investor PDF:', error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  app.get("/api/investor-contracts/:investorId/docx", async (req, res) => {
    try {
      const investor = await storage.getInvestor(req.params.investorId);
      if (!investor) {
        return res.status(404).json({ error: "Investor not found" });
      }

      const vehicles = await storage.getInvestorVehicles(req.params.investorId);
      const docxBuffer = await generateInvestorContractDocx(investor, vehicles);

      const currentDate = format(new Date(), "dd-MM-yyyy");
      const filename = `Contrato de Parceria - ${currentDate}.docx`;
      const encodedFilename = encodeURIComponent(`Contrato de Parceria - ${currentDate}.docx`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      res.send(docxBuffer);
    } catch (error) {
      console.error('Error generating investor DOCX:', error);
      res.status(500).json({ error: "Failed to generate DOCX" });
    }
  });

  // Investment Quotas
  app.get("/api/investment-quotas", async (_req, res) => {
    try {
      const quotas = await storage.getInvestmentQuotas();
      res.json(quotas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investment quotas" });
    }
  });

  app.get("/api/investment-quotas/:id", async (req, res) => {
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

  app.post("/api/investment-quotas", async (req, res) => {
    try {
      const validatedData = insertInvestmentQuotaSchema.parse(req.body);
      const quota = await storage.createInvestmentQuota(validatedData);
      res.status(201).json(quota);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quota data", details: error.errors });
      }
      console.error("[QUOTA ERROR]", error);
      res.status(500).json({ error: "Failed to create investment quota", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/investment-quotas/:id", async (req, res) => {
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

  app.delete("/api/investment-quotas/:id", async (req, res) => {
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

  // Admin Investment Creation (bypasses approval)
  app.post("/api/admin/investments", async (req, res) => {
    try {
      const startTime = Date.now();
      const { customer, vehicle, vehicleInfo, inspectionPhotos, additionalDocs, bankData, contract, customDividend, vehicleBonus, investorDocuments, createInvestorAccount } = req.body;

      // Log payload sizes for debugging
      const inspectionPhotoSizes = {
        frente: inspectionPhotos?.frente?.length || 0,
        fundo: inspectionPhotos?.fundo?.length || 0,
        lateral_esquerda: inspectionPhotos?.lateral_esquerda?.length || 0,
        lateral_direita: inspectionPhotos?.lateral_direita?.length || 0,
      };
      console.log(`[ADMIN INVESTMENT] Starting - Photo sizes: frente=${Math.round(inspectionPhotoSizes.frente / 1024)}KB, fundo=${Math.round(inspectionPhotoSizes.fundo / 1024)}KB, esq=${Math.round(inspectionPhotoSizes.lateral_esquerda / 1024)}KB, dir=${Math.round(inspectionPhotoSizes.lateral_direita / 1024)}KB`);

      // Helper function to clean formatted currency values
      const cleanCurrencyValue = (value: string | null | undefined): string | null => {
        if (!value) return null;
        // Remove "R$", spaces, dots (thousand separators) and replace comma with dot
        return value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim();
      };

      // Create or update customer
      let customerId: string;
      const t1 = Date.now();
      const existingCustomer = await storage.getCustomerByCpf(customer.cpf);
      console.log(`[ADMIN INVESTMENT] getCustomerByCpf: ${Date.now() - t1}ms`);

      if (existingCustomer) {
        // Update existing customer with new data
        // IMPORTANTE: Não atualizar paymentDate se já existir
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
          investorContractFileName: contract?.fileName || existingCustomer.investorContractFileName || null,
        });
        console.log(`[ADMIN INVESTMENT] updateCustomer: ${Date.now() - t2}ms`);
        customerId = existingCustomer.id;
      } else {
        const t2 = Date.now();
        // Create new customer
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
          investorContractFileName: contract?.fileName || null,
        });
        console.log(`[ADMIN INVESTMENT] createInvestor: ${Date.now() - t2}ms`);
        customerId = newCustomer.id;
      }

      // Create vehicle directly (bypass approval)
      const t3 = Date.now();
      const createdVehicle = await storage.createVehicle({
        name: `${vehicle.brand} ${vehicle.model}`,
        category: vehicle.category,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        pricePerDay: "0", // Admin can set later
        monthlyPrice: null,
        transmission: vehicle.transmission,
        fuel: vehicle.fuel,
        seats: vehicle.seats,
        imageUrl: inspectionPhotos.frente || "", // Use front photo as main image
        available: true,
        availableForFinancing: true, // Automatically available for financing
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
        otherDocumentsUrls: additionalDocs?.outros ? [JSON.stringify({ label: 'Outros', fileUrl: additionalDocs.outros })] : null,
        // Investment contract per vehicle
        investmentContractUrl: contract?.fileUrl || null,
        investmentContractFileName: contract?.fileName || null,
        // Vehicle bonus (per vehicle bonus for adding to fleet)
        bonusDate: vehicleBonus?.bonusDate || null,
        bonusValue: cleanCurrencyValue(vehicleBonus?.bonusValue),
        // Damage information
        hasDamage: inspectionPhotos?.hasDamages || false,
        damageDescription: inspectionPhotos?.damageNotes || null,
      });
      console.log(`[ADMIN INVESTMENT] createVehicle: ${Date.now() - t3}ms`);

      // Save inspection photos
      const t4 = Date.now();
      const inspectionsToCreate = [];
      if (inspectionPhotos.frente) {
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: inspectionPhotos.frente,
          imageType: "front",
          notes: "Foto frontal - avaliação inicial do investidor",
          uploadedBy: null,
        });
      }
      if (inspectionPhotos.fundo) {
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: inspectionPhotos.fundo,
          imageType: "back",
          notes: "Foto traseira - avaliação inicial do investidor",
          uploadedBy: null,
        });
      }
      if (inspectionPhotos.lateral_esquerda) {
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: inspectionPhotos.lateral_esquerda,
          imageType: "left_side",
          notes: "Lateral esquerda - avaliação inicial do investidor",
          uploadedBy: null,
        });
      }
      if (inspectionPhotos.lateral_direita) {
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: inspectionPhotos.lateral_direita,
          imageType: "right_side",
          notes: "Lateral direita - avaliação inicial do investidor",
          uploadedBy: null,
        });
      }
      if (inspectionPhotos.notes) {
        // Add notes as a separate inspection entry
        inspectionsToCreate.push({
          vehicleId: createdVehicle.id,
          type: "evaluation",
          imageUrl: "",
          imageType: "notes",
          notes: `Avarias: ${inspectionPhotos.notes}`,
          uploadedBy: null,
        });
      }

      // Save damage photos if any
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
              uploadedBy: null,
            });
          }
        }
      }

      if (inspectionsToCreate.length > 0) {
        await storage.createBulkVehicleInspections(inspectionsToCreate);
      }
      console.log(`[ADMIN INVESTMENT] createBulkInspections (${inspectionsToCreate.length} photos): ${Date.now() - t4}ms`);

      // Create investor account if requested
      const t5 = Date.now();
      let adminUserId = null;
      if (createInvestorAccount && customer.cpf) {
        const cleanCpf = customer.cpf.replace(/\D/g, '');

        // Check if admin user already exists with this CPF
        const existingAdminUserByCpf = await storage.getAdminUserByCpf(cleanCpf);

        if (existingAdminUserByCpf) {
          adminUserId = existingAdminUserByCpf.id;
          console.log(`[ADMIN INVESTMENT] Investor account already exists for CPF: ${cleanCpf}`);
        } else {
          // Determine email to use
          let userEmail = customer.email || `investidor${cleanCpf}@imobilicar.com.br`;

          // Check if email is already in use
          const existingAdminUserByEmail = await storage.getAdminUserByEmail(userEmail);

          if (existingAdminUserByEmail) {
            // Email is in use - check if it's the same CPF (normalized)
            const existingCpfClean = existingAdminUserByEmail.cpf?.replace(/\D/g, '') || '';

            if (existingCpfClean === cleanCpf) {
              // Same person, use existing account
              adminUserId = existingAdminUserByEmail.id;
              console.log(`[ADMIN INVESTMENT] Investor account already exists for email: ${userEmail} (same CPF), using existing account`);
            } else {
              // Different person with same email - generate unique email with CPF
              userEmail = `investidor${cleanCpf}@imobilicar.com.br`;
              console.log(`[ADMIN INVESTMENT] Email ${customer.email} already in use by different CPF, using generated email: ${userEmail}`);

              // Check if this generated email also exists
              const existingGeneratedEmail = await storage.getAdminUserByEmail(userEmail);
              if (existingGeneratedEmail) {
                adminUserId = existingGeneratedEmail.id;
                console.log(`[ADMIN INVESTMENT] Generated email also exists, using existing account`);
              } else {
                // Create new user with generated email
                const defaultPassword = "Investicar@2025";
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);

                const newAdminUser = await storage.createAdminUser({
                  name: customer.name,
                  email: userEmail,
                  password: hashedPassword,
                  cpf: cleanCpf,
                  role: "INVESTIDOR",
                  isActive: true,
                });

                adminUserId = newAdminUser.id;
                console.log(`[ADMIN INVESTMENT] Created investor account with generated email for CPF: ${cleanCpf}`);
              }
            }
          } else {
            // Email doesn't exist, create new user
            const defaultPassword = "Investicar@2025";
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            // Create admin user with INVESTIDOR role
            const newAdminUser = await storage.createAdminUser({
              name: customer.name,
              email: userEmail,
              password: hashedPassword,
              cpf: cleanCpf,
              role: "INVESTIDOR",
              isActive: true,
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
        customerId: customerId,
        adminUserId: adminUserId,
      });
    } catch (error) {
      console.error("[ADMIN INVESTMENT ERROR]", error);
      res.status(500).json({ error: "Failed to create investment", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Dividend Summary Endpoint
  app.get("/api/admin/dividends/summary", async (req, res) => {
    try {
      const allPayments = await storage.getAllInvestorPayments();
      const allCustomers = await storage.getCustomers();
      const allVehicles = await storage.getVehicles();

      // Create maps for fast lookup
      const customerMap = new Map(allCustomers.map(c => [c.id, c]));
      const vehicleMap = new Map(allVehicles.map(v => [v.id, v]));

      // Current month filter
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Calculate current period total (monthly dividend obligations)
      // This is the sum of customDividend from all investor vehicles
      // Note: Dividends should be paid regardless of vehicle availability status
      const investorVehicles = allVehicles.filter(v => v.isInvestorVehicle);
      const monthlyDividendTotal = investorVehicles.reduce((sum, v) => {
        return sum + Number(v.customDividend || 0);
      }, 0);

      // Create breakdown by investor for current period (monthly obligations)
      const investorBreakdownMap = new Map<string, {
        investorId: string;
        investorName: string;
        vehicles: { vehicleId: string; vehicleName: string; licensePlate: string; dividend: number }[];
        totalDividend: number;
      }>();

      for (const vehicle of investorVehicles) {
        if (!vehicle.ownerId) continue;

        const investor = customerMap.get(vehicle.ownerId);
        if (!investor) continue;

        const existing = investorBreakdownMap.get(vehicle.ownerId);
        const vehicleInfo = {
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          licensePlate: vehicle.licensePlate || '',
          dividend: Number(vehicle.customDividend || 0),
        };

        if (existing) {
          existing.vehicles.push(vehicleInfo);
          existing.totalDividend += vehicleInfo.dividend;
        } else {
          investorBreakdownMap.set(vehicle.ownerId, {
            investorId: vehicle.ownerId,
            investorName: investor.name,
            vehicles: [vehicleInfo],
            totalDividend: vehicleInfo.dividend,
          });
        }
      }

      // Calculate cumulative total using automatic accrual logic
      // Group by investor, then by payment day (each vehicle can have a different payment day)
      const cumulativeBreakdownMap = new Map<string, {
        investorId: string;
        investorName: string;
        paymentsCount: number;
        monthlyDividend: number;
        totalPaid: number;
        details: string[];
        paymentsByDate: {
          paymentDay: number;
          vehicles: { vehicleId: string; vehicleName: string; licensePlate: string; dividend: number }[];
          totalForDate: number;
          paymentDates: string[];
          paymentsCount: number;
        }[];
      }>();

      // Get unique investors with vehicles
      const investorIds = [...new Set(investorVehicles.map(v => v.ownerId).filter(Boolean))];
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      for (const investorId of investorIds) {
        if (!investorId) continue;

        const investor = customerMap.get(investorId);
        if (!investor || !investor.createdAt) continue;

        const investorVehiclesList = investorVehicles.filter(v => v.ownerId === investorId);

        // Group vehicles by payment day
        const vehiclesByPaymentDay = new Map<number, typeof investorVehiclesList>();

        for (const vehicle of investorVehiclesList) {
          // Use vehicle's paymentDate if available, otherwise use investor's paymentDate
          const paymentDayStr = vehicle.paymentDate || investor.paymentDate;
          if (!paymentDayStr) continue;

          const paymentDay = parseInt(paymentDayStr, 10);
          if (isNaN(paymentDay) || paymentDay < 1 || paymentDay > 31) continue;

          const existing = vehiclesByPaymentDay.get(paymentDay) || [];
          existing.push(vehicle);
          vehiclesByPaymentDay.set(paymentDay, existing);
        }

        if (vehiclesByPaymentDay.size === 0) continue;

        const paymentsByDate: {
          paymentDay: number;
          vehicles: { vehicleId: string; vehicleName: string; licensePlate: string; dividend: number }[];
          totalForDate: number;
          paymentDates: string[];
          paymentsCount: number;
        }[] = [];

        let investorTotalPaid = 0;
        let investorTotalPaymentsCount = 0;
        let investorMonthlyDividend = 0;
        const allDetails: string[] = [];

        // Calculate for each payment day
        for (const [paymentDay, vehiclesOnDay] of vehiclesByPaymentDay) {
          const vehicleInfos = vehiclesOnDay.map(v => ({
            vehicleId: v.id,
            vehicleName: v.name,
            licensePlate: v.licensePlate || '',
            dividend: Number(v.customDividend || 0),
          }));

          const totalForDate = vehicleInfos.reduce((sum, v) => sum + v.dividend, 0);
          if (totalForDate === 0) continue;

          investorMonthlyDividend += totalForDate;

          // Calculate how many payment cycles have passed for this payment day
          const createdDate = new Date(investor.createdAt);
          let currentDate = new Date(createdDate);
          currentDate.setHours(0, 0, 0, 0);

          // Adjust to first payment day
          if (currentDate.getDate() <= paymentDay) {
            currentDate.setDate(paymentDay);
          } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
            currentDate.setDate(paymentDay);
          }

          let paymentsCount = 0;
          const paymentDates: string[] = [];

          while (currentDate <= today) {
            paymentsCount++;
            const dateStr = `${String(paymentDay).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
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
              paymentsCount,
            });
          }
        }

        // Sort paymentsByDate by payment day (descending - most recent first)
        paymentsByDate.sort((a, b) => b.paymentDay - a.paymentDay);

        if (investorTotalPaid > 0) {
          cumulativeBreakdownMap.set(investorId, {
            investorId: investorId,
            investorName: investor.name,
            paymentsCount: investorTotalPaymentsCount,
            monthlyDividend: investorMonthlyDividend,
            totalPaid: investorTotalPaid,
            details: allDetails,
            paymentsByDate,
          });
        }
      }

      // Calculate cumulative total
      const cumulativeTotal = Array.from(cumulativeBreakdownMap.values()).reduce((sum, inv) => sum + inv.totalPaid, 0);

      // Sort cumulative breakdown by latest payment day first (descending)
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
          breakdown: Array.from(investorBreakdownMap.values()).sort((a, b) => b.totalDividend - a.totalDividend),
        },
        cumulative: {
          total: cumulativeTotal,
          breakdown: sortedCumulativeBreakdown,
        },
      });
    } catch (error) {
      console.error("[DIVIDEND SUMMARY ERROR]", error);
      res.status(500).json({ error: "Failed to fetch dividend summary" });
    }
  });

  // Investor Payments
  app.get("/api/investors/:investorId/payments", async (req, res) => {
    try {
      const payments = await storage.getInvestorPayments(req.params.investorId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investor payments" });
    }
  });

  app.get("/api/investor-payments/:id", async (req, res) => {
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

  app.post("/api/investor-payments", async (req, res) => {
    try {
      const validatedData = insertInvestorPaymentSchema.parse(req.body);
      const payment = await storage.createInvestorPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid payment data", details: error.errors });
      }
      console.error("[PAYMENT ERROR]", error);
      res.status(500).json({ error: "Failed to create payment", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/investor-payments/:id", async (req, res) => {
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

  app.delete("/api/investor-payments/:id", async (req, res) => {
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

  // Trade-in Vehicles
  app.get("/api/trade-in-vehicles", async (_req, res) => {
    try {
      const tradeInVehicles = await storage.getTradeInVehicles();
      res.json(tradeInVehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade-in vehicles" });
    }
  });

  app.get("/api/trade-in-vehicles/:id", async (req, res) => {
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

  // Financings
  app.get("/api/financings", async (_req, res) => {
    try {
      const financings = await storage.getFinancings();
      res.json(financings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch financings" });
    }
  });

  app.get("/api/financings/:id", async (req, res) => {
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

  app.post("/api/financings", async (req, res) => {
    try {
      // 1. Extrair dados extras ANTES da validação do schema
      const tradeInStatus = req.body.tradeInAcceptanceStatus;
      const tradeInData = req.body.tradeInVehicle;
      const vehicleChecklist = req.body.vehicleChecklist;
      const inspectionPdfData = req.body.inspectionPdfData;

      // Criar cópia do body sem campos extras para validação do schema
      const { tradeInVehicle, tradeInAcceptanceStatus, vehicleChecklist: _checklist, inspectionPdfData: _pdfData, ...financingData } = req.body;
      const validatedData = insertFinancingSchema.parse(financingData);

      // Validar status do trade-in (se fornecido)
      if (tradeInStatus && !["accepted", "rejected", "pending"].includes(tradeInStatus)) {
        return res.status(400).json({
          error: "Invalid trade-in acceptance status",
          details: "Status must be 'accepted', 'rejected', or 'pending'"
        });
      }

      // Validar consistência entre status e dados do veículo
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

      // Rejeitar se houver dados de trade-in quando status NÃO é "accepted"
      if (tradeInData && tradeInStatus && tradeInStatus !== "accepted") {
        return res.status(400).json({
          error: "Inconsistent trade-in data",
          details: `Trade-in vehicle data provided but status is "${tradeInStatus}". Vehicle data is only allowed when status is "accepted"`
        });
      }

      // Se houver trade-in aceito, validar campos obrigatórios
      if (tradeInStatus === "accepted" && tradeInData) {
        if (!tradeInData.brand || !tradeInData.model ||
          !tradeInData.year || !tradeInData.acceptedValue) {
          return res.status(400).json({
            error: "Trade-in vehicle missing required fields",
            details: "brand, model, year, and acceptedValue are required for accepted trade-in vehicles"
          });
        }
      }

      // 2. Criar ou atualizar o cliente
      let customerId = validatedData.customerId;

      if (validatedData.customerCpf) {
        const existingCustomer = await storage.getCustomerByCpf(validatedData.customerCpf);

        if (existingCustomer) {
          // Atualizar cliente existente com dados do financiamento
          // IMPORTANTE: Não sobrescrever paymentDate e bônus de investidores existentes
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
            closingDate: validatedData.customerClosingDate ? new Date(validatedData.customerClosingDate) : existingCustomer.closingDate,
          });
          customerId = existingCustomer.id;
        } else {
          // Criar novo cliente
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
            paymentDate: (validatedData as any).customerPaymentDate?.toString(),
            // Bônus único - não definido no fluxo de financiamento
            bonusDate: null,
            bonusValue: null,
            firstContactDate: validatedData.customerFirstContactDate ? new Date(validatedData.customerFirstContactDate) : undefined,
            closingDate: validatedData.customerClosingDate ? new Date(validatedData.customerClosingDate) : undefined,
            status: "active",
          });
          customerId = newCustomer.id;
        }
      }

      // 3. Marcar veículo como financiado
      const vehicleBeforeUpdate = await storage.getVehicle(validatedData.vehicleId);
      await storage.updateVehicle(validatedData.vehicleId, {
        isFinanced: true,
        available: false,
        availableForFinancing: false,
        ownerId: (vehicleBeforeUpdate?.isInvestorVehicle && vehicleBeforeUpdate?.ownerId)
          ? vehicleBeforeUpdate.ownerId
          : customerId,
      });

      // 4. Criar financiamento com customerId atualizado
      const financing = await storage.createFinancing({
        ...validatedData,
        customerId,
        // Adicionar checklist de vistoria e PDF se fornecidos
        inspectionChecklist: vehicleChecklist ? JSON.stringify(vehicleChecklist) : null,
        inspectionPdfUrl: inspectionPdfData?.fileUrl || null,
        inspectionPdfFileName: inspectionPdfData?.fileName || null,
      });

      // 5. Criar registro do veículo de troca se aceito
      console.log("[TRADE-IN DEBUG] Status:", tradeInStatus, "| Has Data:", !!tradeInData);
      if (tradeInData) {
        console.log("[TRADE-IN DEBUG] Data:", JSON.stringify(tradeInData, null, 2));
      }

      if (tradeInStatus === "accepted" && tradeInData) {
        console.log("[TRADE-IN] Criando veículo de troca para financiamento:", financing.id);
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
          status: "accepted",
        });
        console.log("[TRADE-IN] Veículo de troca criado com sucesso!");
      } else {
        console.log("[TRADE-IN] Não criou veículo de troca - Status:", tradeInStatus, "| Tem dados:", !!tradeInData);
      }

      // Log financing creation
      const financedVehicle = await storage.getVehicle(validatedData.vehicleId);
      await storage.createAuditLog({
        action: 'create',
        entity: 'financing',
        entityId: financing.id,
        entityName: `${financing.customerName} - ${financedVehicle?.name || 'Veículo'}`,
        userId: (req as any).adminUser?.id || (req as any).sellerUser?.id || null,
        userName: (req as any).adminUser?.name || (req as any).sellerUser?.name || 'Sistema',
        details: JSON.stringify({
          cliente: financing.customerName,
          cpf: financing.customerCpf,
          veiculo: financedVehicle?.name || 'N/A',
          valor: `R$ ${Number(financing.vehicleValue).toLocaleString('pt-BR')}`,
          parcelas: financing.installments
        }),
        ipAddress: req.ip || req.socket?.remoteAddress || null
      });

      res.status(201).json(financing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid financing data", details: error.errors });
      }
      console.error("[FINANCING ERROR]", error);
      res.status(500).json({ error: "Failed to create financing", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/financings/:id", async (req, res) => {
    try {
      const validationResult = updateFinancingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid financing data", details: validationResult.error });
      }

      // Get existing financing for comparison
      const existingFinancing = await storage.getFinancing(req.params.id);

      const financing = await storage.updateFinancing(req.params.id, validationResult.data);
      if (!financing) {
        return res.status(404).json({ error: "Financing not found" });
      }

      // Se o financiamento foi aprovado, marcar o veículo como financiado
      if (validationResult.data.approvalStatus === "approved" && financing.vehicleId) {
        await storage.updateVehicle(financing.vehicleId, {
          isFinanced: true,
          available: false // Marcar como indisponível também
        });

        // Log approval
        await storage.createAuditLog({
          action: 'approve',
          entity: 'financing',
          entityId: financing.id,
          entityName: `${financing.customerName}`,
          userId: (req as any).adminUser?.id || null,
          userName: (req as any).adminUser?.name || 'Admin',
          details: JSON.stringify({
            cliente: financing.customerName,
            cpf: financing.customerCpf,
            valor: `R$ ${Number(financing.vehicleValue).toLocaleString('pt-BR')}`
          }),
          ipAddress: req.ip || req.socket?.remoteAddress || null
        });
      } else if (validationResult.data.approvalStatus === "rejected") {
        // Log rejection
        await storage.createAuditLog({
          action: 'reject',
          entity: 'financing',
          entityId: financing.id,
          entityName: `${financing.customerName}`,
          userId: (req as any).adminUser?.id || null,
          userName: (req as any).adminUser?.name || 'Admin',
          details: JSON.stringify({
            cliente: financing.customerName,
            motivo: validationResult.data.approvalNotes || 'Não especificado'
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

  // Middleware para aumentar limite especificamente para upload de vídeo
  app.post("/api/financings/:id/confession-video", (req, res, next) => {
    // Aumentar limite de timeout para uploads grandes
    req.setTimeout(600000); // 10 minutos
    res.setTimeout(600000);

    console.log("[VIDEO UPLOAD] Requisição recebida para financingId:", req.params.id);
    console.log("[VIDEO UPLOAD] Content-Type:", req.headers['content-type']);
    console.log("[VIDEO UPLOAD] Content-Length:", req.headers['content-length']);

    videoUpload.single('video')(req, res, (err) => {
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
        return res.status(400).json({ error: "Nenhum arquivo de vídeo enviado" });
      }

      const videoUrl = `/api/videos/${file.filename}`;

      const financing = await storage.updateFinancing(financingId, {
        confessionVideoUrl: videoUrl,
        confessionVideoRecordedAt: new Date(),
      });

      if (!financing) {
        fs.unlinkSync(file.path);
        return res.status(404).json({ error: "Financiamento não encontrado" });
      }

      console.log("[VIDEO UPLOAD] Sucesso! URL:", videoUrl);

      res.json({
        success: true,
        videoUrl,
        message: "Vídeo salvo com sucesso"
      });
    } catch (error) {
      console.error("[VIDEO UPLOAD ERROR]", error);
      res.status(500).json({ error: "Falha ao salvar vídeo" });
    }
  });

  app.get("/api/videos/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadDir, filename);
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(path.resolve(uploadDir))) {
      return res.status(400).json({ error: "Nome de arquivo inválido" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Vídeo não encontrado" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // Endpoint para upload de chunk individual
  app.post("/api/financings/:id/confession-video-chunk", chunkUpload.single('chunk'), async (req, res) => {
    try {
      const { uploadId, chunkIndex, totalChunks } = req.body;
      const file = req.file;

      console.log(`[CHUNK UPLOAD] Chunk ${chunkIndex}/${totalChunks} recebido para upload ${uploadId}`);

      if (!file) {
        return res.status(400).json({ error: "Chunk não recebido" });
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

  // Endpoint para finalizar e juntar todos os chunks
  app.post("/api/financings/:id/confession-video-complete", async (req, res) => {
    try {
      const financingId = req.params.id;
      const { uploadId: rawUploadId, totalChunks: rawTotalChunks, fileName } = req.body;

      // Sanitizar inputs
      const uploadId = sanitizeUploadId(rawUploadId || '');
      const totalChunks = sanitizeChunkIndex(rawTotalChunks || '0');

      if (!uploadId || totalChunks <= 0) {
        return res.status(400).json({ error: "Parâmetros inválidos" });
      }

      console.log(`[CHUNK COMPLETE] Finalizando upload ${uploadId} com ${totalChunks} chunks`);

      const chunkDir = path.join(chunksDir, uploadId);
      const resolvedChunkDir = path.resolve(chunkDir);

      // Verificar path traversal
      if (!resolvedChunkDir.startsWith(path.resolve(chunksDir))) {
        return res.status(400).json({ error: "Upload ID inválido" });
      }

      if (!fs.existsSync(chunkDir)) {
        return res.status(400).json({ error: "Chunks não encontrados" });
      }

      // Criar arquivo final
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(fileName || '.mp4') || '.mp4';
      const finalFileName = `confession-${uniqueSuffix}${ext}`;
      const finalPath = path.join(uploadDir, finalFileName);

      // Juntar todos os chunks em ordem
      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `chunk-${i}`);
        if (!fs.existsSync(chunkPath)) {
          writeStream.close();
          if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
          return res.status(400).json({ error: `Chunk ${i} não encontrado` });
        }

        const chunkData = fs.readFileSync(chunkPath);
        writeStream.write(chunkData);
      }

      writeStream.end();

      // Aguardar o arquivo ser escrito completamente
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Limpar chunks temporários
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, `chunk-${i}`);
        if (fs.existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath);
        }
      }
      if (fs.existsSync(chunkDir)) fs.rmdirSync(chunkDir);

      // Atualizar o financiamento com o URL do vídeo
      const videoUrl = `/api/videos/${finalFileName}`;

      const financing = await storage.updateFinancing(financingId, {
        confessionVideoUrl: videoUrl,
        confessionVideoRecordedAt: new Date(),
      });

      if (!financing) {
        fs.unlinkSync(finalPath);
        return res.status(404).json({ error: "Financiamento não encontrado" });
      }

      console.log("[CHUNK COMPLETE] Sucesso! URL:", videoUrl);

      res.json({
        success: true,
        videoUrl,
        message: "Vídeo salvo com sucesso"
      });
    } catch (error) {
      console.error("[CHUNK COMPLETE ERROR]", error);
      res.status(500).json({ error: "Falha ao finalizar upload" });
    }
  });

  app.delete("/api/financings/:id", async (req, res) => {
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

  // Checkout/Checkin de Financiamento (Vistoria de Entrega e Devolução)
  app.patch("/api/financings/:id/checkout", async (req, res) => {
    try {
      const {
        checkOutPhotos, checkOutChecklist, checkOutNotes, checkOutCompletedAt,
        checkInPhotos, checkInChecklist, checkInNotes, checkInCompletedAt
      } = req.body;

      // Validar que o financiamento existe e está aprovado
      const existing = await storage.getFinancing(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Financing not found" });
      }

      if (existing.approvalStatus !== "approved" && existing.approvalStatus !== "finalized") {
        return res.status(400).json({ error: "Checkout only available for approved or finalized financings" });
      }

      // Preparar dados para atualização - suporta tanto CheckIn (entrega) quanto CheckOut (devolução)
      const updateData: any = {};

      // Campos de CheckIn (Vistoria de Entrega)
      if (checkInPhotos !== undefined) updateData.checkInPhotos = checkInPhotos;
      if (checkInChecklist !== undefined) updateData.checkInChecklist = checkInChecklist;
      if (checkInNotes !== undefined) updateData.checkInNotes = checkInNotes;
      if (checkInCompletedAt !== undefined) updateData.checkInCompletedAt = new Date(checkInCompletedAt);

      // Campos de CheckOut (Vistoria de Devolução)
      if (checkOutPhotos !== undefined) updateData.checkOutPhotos = checkOutPhotos;
      if (checkOutChecklist !== undefined) updateData.checkOutChecklist = checkOutChecklist;
      if (checkOutNotes !== undefined) updateData.checkOutNotes = checkOutNotes;
      if (checkOutCompletedAt !== undefined) updateData.checkOutCompletedAt = new Date(checkOutCompletedAt);

      const financing = await storage.updateFinancing(req.params.id, updateData);

      res.json(financing);
    } catch (error) {
      console.error("[CHECKOUT ERROR]", error);
      res.status(500).json({ error: "Failed to complete checkout" });
    }
  });

  app.patch("/api/financings/:id/cancel", async (req, res) => {
    try {
      const { cancelNotes } = req.body;

      // Validar que o financiamento existe
      const existing = await storage.getFinancing(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Financing not found" });
      }

      // Atualizar o status do financiamento para cancelado
      const financing = await storage.updateFinancing(req.params.id, {
        approvalStatus: "cancelled",
        approvalNotes: cancelNotes || "Financiamento cancelado",
      });

      // Marcar o veículo como disponível para aluguel e financiamento novamente
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

  app.get("/api/customers/:id/financings", async (req, res) => {
    try {
      const financings = await storage.getCustomerFinancings(req.params.id);
      res.json(financings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer financings" });
    }
  });

  // Trade-in Vehicles
  app.get("/api/trade-in-vehicles", async (_req, res) => {
    try {
      const vehicles = await storage.getTradeInVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade-in vehicles" });
    }
  });

  app.get("/api/trade-in-vehicles/:id", async (req, res) => {
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

  app.get("/api/trade-in-vehicles/financing/:financingId", async (req, res) => {
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

  app.patch("/api/trade-in-vehicles/:id", async (req, res) => {
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

  app.post("/api/financings/generate-proposal", async (req, res) => {
    try {
      const proposalData = req.body;
      const fs = await import('fs');
      const path = await import('path');

      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=proposta-financiamento.pdf');

      doc.pipe(res);

      // Cabeçalho formal sem logo
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000')
        .text('PROPOSTA DE FINANCIAMENTO DE VEÍCULO', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#333333')
        .text('Imobilicar - Locadora de Veículos', { align: 'center' });
      doc.fillColor('#000000');
      doc.moveDown(0.8);

      // Linha separadora
      doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).strokeColor('#000000').stroke();
      doc.moveDown(0.8);

      // Informações do documento em linha
      doc.fontSize(9).font('Helvetica');
      const infoY = doc.y;
      doc.text(`Proposta: ${Date.now().toString().slice(-8)}`, 60, infoY);
      doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, 250, infoY);
      doc.text(`Validade: 7 dias`, 420, infoY);
      doc.moveDown(1.5);

      // Seção 1: Dados do Cliente
      doc.fontSize(11).font('Helvetica-Bold').text('1. DADOS DO CLIENTE', 60);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      const clientDataY = doc.y;
      doc.text(`Nome: `, 60, clientDataY, { continued: true });
      doc.font('Helvetica-Bold').text(proposalData.customer.name);
      doc.font('Helvetica').text(`CPF: `, 60, doc.y + 15, { continued: true });
      doc.text(proposalData.customer.cpf);
      doc.text(`Telefone: `, 60, doc.y + 15, { continued: true });
      doc.text(proposalData.customer.phone);
      doc.text(`Email: `, 60, doc.y + 15, { continued: true });
      doc.text(proposalData.customer.email);

      doc.moveDown(1.5);

      // Seção 2: Dados do Veículo
      doc.fontSize(11).font('Helvetica-Bold').text('2. DADOS DO VEÍCULO', 60);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      const vehicleDataY = doc.y;
      if (proposalData.vehicle) {
        doc.text(`Veículo: `, 60, vehicleDataY, { continued: true });
        doc.font('Helvetica-Bold').text(proposalData.vehicle.name);
        doc.font('Helvetica').text(`Marca/Modelo: `, 60, doc.y + 15, { continued: true });
        doc.text(`${proposalData.vehicle.brand} ${proposalData.vehicle.model}`);
        doc.text(`Ano: `, 60, doc.y + 15, { continued: true });
        doc.text(proposalData.vehicle.year.toString());
      }
      doc.text(`Valor do Veículo: `, 60, doc.y + 15, { continued: true });
      doc.font('Helvetica-Bold').text(`R$ ${proposalData.vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      doc.font('Helvetica');

      doc.moveDown(1.5);

      // Seção 3: Condições de Financiamento
      doc.fontSize(11).font('Helvetica-Bold').text('3. CONDIÇÕES DE FINANCIAMENTO', 60);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      const conditionsY = doc.y;
      doc.text(`Prazo: `, 60, conditionsY, { continued: true });
      doc.text(`${proposalData.term} meses`);
      doc.text(`Data de Início: `, 60, doc.y + 15, { continued: true });
      doc.text(format(new Date(proposalData.startDate), 'dd/MM/yyyy', { locale: ptBR }));
      doc.text(`Dia de Vencimento: `, 60, doc.y + 15, { continued: true });
      doc.text(`${proposalData.dueDay} de cada mês`);

      doc.moveDown(1.5);

      // Seção 4: Plano de Pagamento
      doc.fontSize(11).font('Helvetica-Bold').text('4. PLANO DE PAGAMENTO', 60);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      const paymentY = doc.y;

      // Entrada
      doc.text('4.1 Entrada (20% do valor do veículo)', 60, paymentY);
      doc.text(`     Valor Total: `, 60, paymentY + 18, { continued: true });
      doc.font('Helvetica-Bold').text(`R$ ${proposalData.summary.downPaymentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      doc.font('Helvetica').text(`     - À vista: R$ ${proposalData.summary.downPaymentCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 60, paymentY + 33);
      doc.text(`     - Parcelado: R$ ${proposalData.summary.downPaymentFinanced.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${proposalData.summary.downPaymentInstallments}x de R$ ${proposalData.summary.downPaymentInstallmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 60, paymentY + 48);

      doc.y = paymentY + 75;

      // Financiamento
      doc.text('4.2 Financiamento do Saldo (80% do valor do veículo)', 60);
      doc.moveDown(0.3);
      doc.text(`     Valor Financiado: `, 60, doc.y, { continued: true });
      doc.font('Helvetica-Bold').text(`R$ ${proposalData.summary.principal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      doc.font('Helvetica').text(`     Número de Parcelas: 48 meses`, 60);
      doc.text(`     Valor da Parcela Mensal: `, 60, doc.y, { continued: true });
      doc.font('Helvetica-Bold').text(`R$ ${proposalData.summary.monthlyInstallment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      doc.font('Helvetica').text(`     Total a Pagar no Financiamento: R$ ${(proposalData.summary.monthlyInstallment * 48).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 60);

      doc.moveDown(1.2);

      // Total
      doc.text('4.3 Investimento Total', 60);
      doc.moveDown(0.3);
      doc.text(`     Entrada + Financiamento: `, 60, doc.y, { continued: true });
      doc.font('Helvetica-Bold').text(`R$ ${proposalData.summary.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      doc.font('Helvetica');

      doc.moveDown(1.5);

      // Nova página para tabela de amortização
      doc.addPage();

      // Cabeçalho da segunda página
      doc.fontSize(11).font('Helvetica-Bold').text('5. TABELA DE AMORTIZAÇÃO', 60);
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica').text('Projeção das 48 parcelas mensais com opção de desconto para antecipação', 60);
      doc.moveDown(1);

      // Cabeçalho da tabela
      const tableTop = doc.y;
      const colWidths = [35, 70, 85, 105, 105];
      const colPositions = [60];
      for (let i = 0; i < colWidths.length - 1; i++) {
        colPositions.push(colPositions[i] + colWidths[i]);
      }

      // Header da tabela
      doc.rect(60, tableTop, 475, 15).fillAndStroke('#e8e8e8', '#000000');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Nº', colPositions[0] + 2, tableTop + 4, { width: colWidths[0] - 4, align: 'center' });
      doc.text('Vencimento', colPositions[1] + 2, tableTop + 4, { width: colWidths[1] - 4, align: 'center' });
      doc.text('Amortização', colPositions[2] + 2, tableTop + 4, { width: colWidths[2] - 4, align: 'center' });
      doc.text('Parcela Normal', colPositions[3] + 2, tableTop + 4, { width: colWidths[3] - 4, align: 'center' });
      doc.text('Parcela Antecipada', colPositions[4] + 2, tableTop + 4, { width: colWidths[4] - 4, align: 'center' });

      let currentY = tableTop + 15;

      // Linhas da tabela
      doc.fontSize(7).font('Helvetica');
      for (const row of proposalData.amortizationTable) {
        if (currentY > 740) {
          doc.addPage();
          doc.fontSize(9).font('Helvetica').text('5. TABELA DE AMORTIZAÇÃO (continuação)', 60, 60);
          currentY = 85;

          // Repetir header
          doc.rect(60, currentY, 475, 15).fillAndStroke('#e8e8e8', '#000000');
          doc.fontSize(8).font('Helvetica-Bold');
          doc.text('Nº', colPositions[0] + 2, currentY + 4, { width: colWidths[0] - 4, align: 'center' });
          doc.text('Vencimento', colPositions[1] + 2, currentY + 4, { width: colWidths[1] - 4, align: 'center' });
          doc.text('Amortização', colPositions[2] + 2, currentY + 4, { width: colWidths[2] - 4, align: 'center' });
          doc.text('Parcela Normal', colPositions[3] + 2, currentY + 4, { width: colWidths[3] - 4, align: 'center' });
          doc.text('Parcela Antecipada', colPositions[4] + 2, currentY + 4, { width: colWidths[4] - 4, align: 'center' });
          currentY += 15;
          doc.fontSize(7).font('Helvetica');
        }

        // Linha da tabela
        doc.rect(60, currentY, 475, 11).stroke('#cccccc');
        doc.fillColor('#000000');
        doc.text(`${row.installment}`, colPositions[0] + 2, currentY + 2, { width: colWidths[0] - 4, align: 'center' });
        doc.text(format(new Date(row.dueDate), 'dd/MM/yyyy', { locale: ptBR }), colPositions[1] + 2, currentY + 2, { width: colWidths[1] - 4, align: 'center' });
        doc.text(`R$ ${row.amortization.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colPositions[2] + 2, currentY + 2, { width: colWidths[2] - 4, align: 'right' });
        doc.text(`R$ ${row.payment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colPositions[3] + 2, currentY + 2, { width: colWidths[3] - 4, align: 'right' });
        doc.text(`R$ ${row.discountedPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colPositions[4] + 2, currentY + 2, { width: colWidths[4] - 4, align: 'right' });

        currentY += 11;
      }

      // Nova página para observações
      doc.addPage();

      // Seção 6: Informações Importantes
      doc.fontSize(11).font('Helvetica-Bold').text('6. INFORMAÇÕES IMPORTANTES', 60);
      doc.moveDown(0.8);

      doc.fontSize(10).font('Helvetica');
      doc.text('6.1  Esta proposta de financiamento tem validade de 7 (sete) dias corridos a partir da data de', 60);
      doc.text('     emissão.', 60);
      doc.moveDown(0.5);
      doc.text('6.2  Os valores apresentados são estimativas e podem sofrer alterações até a assinatura do', 60);
      doc.text('     contrato definitivo.', 60);
      doc.moveDown(0.5);
      doc.text('6.3  Para efetivar o financiamento, é necessário apresentar toda a documentação solicitada pela', 60);
      doc.text('     Imobilicar.', 60);
      doc.moveDown(0.5);
      doc.text('6.4  O desconto progressivo para antecipação de pagamento aplica-se conforme demonstrado na', 60);
      doc.text('     coluna "Parcela Antecipada" da Tabela de Amortização.', 60);
      doc.moveDown(0.5);
      doc.text('6.5  Quanto mais antecipado for o pagamento da parcela, maior será o desconto concedido.', 60);
      doc.moveDown(0.5);
      doc.text('6.6  Esta proposta não constitui um contrato definitivo de financiamento, servindo apenas como', 60);
      doc.text('     simulação e estimativa dos valores.', 60);

      doc.moveDown(4);

      // Rodapé formal
      doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).strokeColor('#000000').stroke();
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').fillColor('#000000');
      // Converter para horário de Brasília (UTC-3)
      const brasiliaDate = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
      doc.text(`Documento gerado em ${format(brasiliaDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, { align: 'center' });
      doc.moveDown(0.8);
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('IMOBILICAR - LOCADORA DE VEÍCULOS', { align: 'center' });

      doc.end();
    } catch (error) {
      console.error('Erro ao gerar proposta:', error);
      res.status(500).json({ error: "Erro ao gerar proposta de financiamento" });
    }
  });

  // Gerar Contrato de Financiamento em Word
  app.post("/api/financings/generate-contract-docx", async (req, res) => {
    try {
      // Aceitar dados do body ou buscar financing existente
      let financing: any;
      let vehicle: any;

      if (req.body.financingData && req.body.vehicleData) {
        // Usar dados fornecidos diretamente
        financing = req.body.financingData;
        vehicle = req.body.vehicleData;
      } else if (req.body.financingId) {
        // Buscar financing existente
        financing = await storage.getFinancing(req.body.financingId);
        if (!financing) {
          return res.status(404).json({ error: "Financiamento não encontrado" });
        }

        vehicle = await storage.getVehicle(financing.vehicleId);
        if (!vehicle) {
          return res.status(404).json({ error: "Veículo não encontrado" });
        }
      } else {
        return res.status(400).json({ error: "Dados insuficientes para gerar contrato" });
      }

      // Preparar seção de comprovante de pagamento (se existir)
      const paymentProofSection: any[] = [];
      if (req.body.paymentProof && req.body.paymentProof.startsWith('data:image')) {
        try {
          const paymentProofDataUri = req.body.paymentProof;
          const base64Data = paymentProofDataUri.split(',')[1];
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Detectar tipo de imagem a partir do data URI
          const mimeMatch = paymentProofDataUri.match(/data:image\/([a-zA-Z]+);/);
          const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : 'png';
          const imageType = mimeType === 'jpeg' || mimeType === 'jpg' ? 'jpg' : 'png';

          paymentProofSection.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "COMPROVANTE DE PAGAMENTO",
                  font: "Arial",
                  size: 24,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 800, after: 300 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 450,
                    height: 350,
                  },
                  type: imageType as 'jpg' | 'png' | 'gif' | 'bmp',
                }),
              ],
              alignment: AlignmentType.CENTER,
            })
          );
        } catch (e) {
          console.error('Erro ao processar comprovante de pagamento:', e);
        }
      }

      // Criar documento Word
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Título
            new Paragraph({
              children: [
                new TextRun({
                  text: "CONTRATO DE LOCAÇÃO DE VEÍCULO COM DIREITO A COMPRA",
                  font: "Arial",
                  size: 22, // 11pt = 22 half-points
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Qualificação das partes - LOCADOR
            new Paragraph({
              children: [
                new TextRun({
                  text: "Pelo presente instrumento, de um lado o ",
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "LOCADOR, IMOBILICAR LOCAÇÃO DE VEÍCULOS",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: ", inscrito no CNPJ sob o nº 61.363.556/0001-37, localizada na Rua Antônio Cardoso Franco, nº 237 Casa Branca - Santo André/SP - CEP 09015-530. Número para contato: 11 9 5190-5499 e e-mail administracao@imobilicar.com.br, e",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            // Qualificação das partes - LOCATÁRIO
            new Paragraph({
              children: [
                new TextRun({
                  text: "LOCATÁRIO ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: `${financing.customerName || ''}, brasileiro, `,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: `inscrito no CPF sob o nº ${financing.customerCpf || ''} e portador da cédula de identidade R.G. sob o nº ${financing.customerRg || ''}, `,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: `residente e domiciliado à ${financing.customerStreet || ''}, ${financing.customerComplement ? financing.customerComplement + ', ' : ''}${financing.customerNeighborhood || ''} - ${financing.customerCity || ''} - CEP ${financing.customerZipCode || ''}. `,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: `Número para contato: ${financing.customerPhone || ''} e e-mail: ${financing.customerEmail || ''}`,
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            // Parágrafo introdutório
            new Paragraph({
              children: [
                new TextRun({
                  text: "Por este instrumento, as partes acima qualificadas resolvem de comum acordo e de livre e espontânea vontade, firmar o presente contrato de locação de veículo com direito a compra ao final do pagamento das parcelas, a reger-se pelas seguintes cláusulas e condições:",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // CLÁUSULA 1 - DO OBJETO
            new Paragraph({
              children: [
                new TextRun({
                  text: "DO OBJETO DO CONTRATO",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 1ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: `O presente contrato tem por objeto a locação com direito de compra, do veículo da Marca ${vehicle.brand || ''} ${vehicle.model || ''} - Ano/Mod. ${vehicle.year || ''} - Placa ${vehicle.licensePlate || ''} - Cor ${vehicle.color || ''} - RENAVAM ${vehicle.renavam || ''} - CHASSI ${vehicle.chassisNumber || ''} - ${vehicle.mileage || ''}KM para uso pessoal e intransferível do(a) locatário(a), no território de São Paulo durante o pagamento das parcelas inerentes a locação.`,
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo único. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O presente contrato tem caráter pessoal e intransferível, sendo vedado ao locatário(a), o empréstimo, venda, sublocação, ou transmissão do veículo à terceiros, seja de forma parcial ou total.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // CLÁUSULA 2 - DA GARANTIA
            new Paragraph({
              children: [
                new TextRun({
                  text: "DA GARANTIA",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 2ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: `Como garantia para o contrato aqui firmado entre as partes, o locatário apresenta como fiador(a) na qualidade de terceiro garantidor ${financing.guarantorName || ''}, brasileiro, inscrito no CPF sob o nº ${financing.guarantorCpf || ''} e portador da cédula de identidade R.G. sob o nº ${financing.guarantorRg || ''}, residente e domiciliado à ${financing.guarantorStreet || ''}, ${financing.guarantorComplement ? financing.guarantorComplement + ', ' : ''}${financing.guarantorNeighborhood || ''} - ${financing.guarantorCity || ''} - CEP ${financing.guarantorZipCode || ''}. Número para contato: ${financing.guarantorPhone || ''} e e-mail: ${financing.guarantorEmail || ''}.`,
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // CLÁUSULA 3 - DO PREÇO E FORMA DE PAGAMENTO
            new Paragraph({
              children: [
                new TextRun({
                  text: "DO PREÇO E FORMA DE PAGAMENTO",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 3ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: `O valor da locação do veículo especificado na cláusula 1ª, é de 48 parcelas no importe de R$ ${(financing.monthlyPayment || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} mensais, durante a vigência do contrato, a ser quitado mensalmente, com vencimento no dia ${financing.paymentDueDate || 10} de cada mês${vehicle.hasInsurance && vehicle.insuranceValue ? ` e o seguro veicular no valor de R$ ${Number(vehicle.insuranceValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} mensais.` : '.'}`,
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 3.1. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: `Como valor de entrada foi estipulado o montante de R$ ${((financing.vehicleValue || 0) * 0.20).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` +
                    (financing.tradeInVehicle && financing.tradeInAcceptanceStatus === "accepted"
                      ? `, sendo que o LOCATÁRIO apresentou como parte da entrada o veículo ${financing.tradeInVehicle.brand || ''} ${financing.tradeInVehicle.model || ''} - Ano ${financing.tradeInVehicle.year || ''}${financing.tradeInVehicle.plate ? `, Placa ${financing.tradeInVehicle.plate}` : ''}${financing.tradeInVehicle.mileage ? `, com ${financing.tradeInVehicle.mileage} KM` : ''}, com valor FIPE de ${financing.tradeInVehicle.fipeValue || 'N/A'}, aceito pelo LOCADOR pelo valor de R$ ${Number(financing.tradeInVehicle.acceptedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. O saldo remanescente da entrada, no valor de R$ ${(financing.downPaymentCash || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, será pago à vista e o restante parcelado conforme acordado entre as partes.`
                      : `, sendo R$ ${(financing.downPaymentCash || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} à vista e o restante parcelado conforme acordado entre as partes.`),
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            // CLÁUSULA 3.2 - VÍDEO DO VEÍCULO
            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 3.2. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O LOCATÁRIO compromete-se a cada pagamento, enviar ao LOCADOR um vídeo do veículo em que mostre o mesmo em 360º e a quilometragem.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // CLÁUSULA 4 - DO ATRASO E INADIMPLEMENTO
            new Paragraph({
              children: [
                new TextRun({
                  text: "DO ATRASO E INADIMPLEMENTO",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 4ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O atraso no pagamento das parcelas, em prazo superior a 2 (Dois) dias corridos, dará o direito do LOCADOR fazer o bloqueio do veículo até que sejam feitos os pagamentos pendentes.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O atraso no pagamento das parcelas, por prazo superior a 2 (Dois) dias, implicará no direito da locadora em rescindir automaticamente o presente contrato, sem a necessidade de notificação judicial ou extrajudicial do locatário(a), reavendo o veículo.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo segundo. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "As parcelas em atraso sofrerão incidência de juros legais (10%) ao mês, acrescidos de atualização monetária, na forma da lei.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // CLÁUSULA 5 - DO DIREITO A COMPRA
            new Paragraph({
              children: [
                new TextRun({
                  text: "DO DIREITO A COMPRA",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 5ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Ao final do prazo para pagamento das parcelas, fica assegurado ao LOCATÁRIO, a compra do veículo, desde que esteja em dia com suas obrigações contratuais.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo único. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Fica o LOCATÁRIO, ciente de que o veículo permanecerá em nome do proprietário atual ou da LOCADORA até o final do pagamento das parcelas, sendo entregue recibo de compra e venda (CRV/CRV Digital), após a quitação total das parcelas e demais obrigações.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // CLÁUSULA 6 - DAS OBRIGAÇÕES
            new Paragraph({
              children: [
                new TextRun({
                  text: "DAS OBRIGAÇÕES",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 6ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Durante o prazo da locação, é permitido somente a utilização do veículo no estado de São Paulo, salvo autorização expressa da LOCADORA, e em vias que apresentem condições normais de rodagem e adequadas à sua destinação.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo único. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Passa a ser do locatário as responsabilidades de natureza civil, criminal e administrativa acerca do uso do veículo, a contar da data de assinatura do presente.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 7ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Obriga-se o(a) locatário(a) em utilizar o veículo de forma pessoal e intransferível, no prazo de duração da locação.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo único. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Fica estipulado entre as partes que no caso de violação contratual consistente na transferência indevida pelo locatário da posse do veículo a terceiros a incidência de multa no patamar de 10% (Dez) com a respectiva e automática extinção contratual.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 8ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de furto ou roubo do veículo, providenciar no prazo de 12 (Doze horas), a contar do evento, lavratura de Boletim de ocorrência, bem como providenciar o encaminhamento documental à locadora.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de furto, roubo, incêndio, colisão, apreensão, perda, furto ou roubo de chaves, documentos, pane provocada por uso inadequado e demais sinistros, a locadora não procederá com a substituição do veículo por outro disponível em loja no momento, não existe a previsão de empréstimo e/ou carro reserva em favor do locatário.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 9ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: `IPVA e Licenciamento são de inteira responsabilidade do(a) locatário(a). Débitos do corrente ano e dos anos subsequentes, o pagamento dos débitos do veículo, como IPVA, DPVAT, licenciamento, multas, pátio/estacionamento e outras avenças que possam incidir, a partir desta data, são de inteira responsabilidade do(a) locatário(a), o não pagamento dos débitos acarreta quebra do contrato e devolução do veículo a locadora sem direito de devolução dos valores já pagos.${vehicle.ipvaStatus === 'pago' && vehicle.ipvaValue ? ` O valor do IPVA do veículo especificado na cláusula 1º é no valor de R$ ${Number(vehicle.ipvaValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.` : ''}`,
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 9.1. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de veículo encaminhado para pátio o locatário está ciente de que será cobrado um custo adicional referente às custas administrativas internas (uso de guincho e honorários de despachante) no valor de R$1.500,00 mais custos pagos que forem de competência do locatário.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 9.2. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "A responsabilidade das multas é do locatário, sendo obrigatória a transferência de pontuação, sendo assim, na primeira multa o LOCATÁRIO será notificado para pagamento, na segunda o LOCATÁRIO pagará o valor dobrado da multa, na terceira pagará o valor triplicado da multa, na quarta irá acarretar na quebra do contrato e a locadora poderá tomar medidas cabíveis e consequente rescisão contratual.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 9.3. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Fica acordado o pagamento das infrações, 5 (Cinco) dias após o recebimento das notificações.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 9.4. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Caso o veículo seja apreendido, o locatário e o avalista têm responsabilidade de arcar com todos os débitos e retirar o veículo do pátio, uma vez que os débitos com a locadora estejam em dia.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 10ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de penalidade de multa de trânsito, o locatário deverá informar à locadora imediatamente a respeito, quando do recebimento de notificação, bem como providenciar a indicação do condutor perante o órgão competente.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 11ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "As despesas inerentes a avarias do veículo, a partir da data de assinatura do presente contrato são de responsabilidade do(a) locatário(a).",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 12ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Fica o(a) locatário(a) ciente de que o veículo foi locado no estado em que se encontra, sem prejuízo de que o locatário ao tempo da contratação acione mecânico de sua confiança para vistoriar/avaliar o veículo, sendo certo que inexiste garantia do bem.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 13ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O Acionamento de colisões, tanto para uso do veículo locado, quanto para utilização de Terceiros e assistência 24h, é submetido às regras inerentes ao seguro/associação contratada.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 14ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O locatário concorda e se compromete a guardar o veículo em local seguro e fechado, não podendo ser deixado em via pública após as 22:00 durante período de pernoite, até as 6:00, devendo permanecer em garagem fechada ou estacionamento. O não cumprimento desta cláusula autoriza a locadora a recolher o veículo deixado em via pública por entender que este está em situação de risco de roubo/furto e acarreta negativa de cobertura em um possível sinistro por parte da associação.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O locatário fica notificado quanto a proibição no que se refere a estacionar ou deixar o veículo instrumento deste contrato em via pública, em qualquer horário/local, devendo pernoitar sempre em garagem, devidamente protegido. O não cumprimento desta determinação acarretará, em caso de furto do veículo, a não cobertura do sinistro por parte da associação de proteção, portanto, em caso de não cobertura, fica o LOCATÁRIO obrigado a restituir o valor do veículo em sua integralidade, dada a sua responsabilidade ante ao veículo.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // DAS OBRIGAÇÕES DO FIADOR
            new Paragraph({
              children: [
                new TextRun({
                  text: "DAS OBRIGAÇÕES DO FIADOR",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 15ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O fiador, indicado e qualificado em cláusula 2ª do presente contrato, fica ciente de que em caso de inadimplemento ou descumprimento do(a) locatário(a) quanto às suas obrigações, assume as responsabilidades e pagamentos por ele assumidos neste contrato de forma solidária e ilimitada.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 16ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "A garantia é irrevogável e irretratável, não comportando faculdade de exoneração ou compensação, em quaisquer hipóteses, perdurando a responsabilidade do fiador, até a quitação integral dos valores avençados.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 17ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de morte, falência ou insolvência do fiador, o(a) locatário(a) obriga-se, no prazo de 15 (Quinze) dias a contar da ocorrência do evento, apresentar substituto idôneo.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 18ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Fica convencionado, que eventual morte ou desaparecimento do(a) locatário(a), não exonera o fiador das responsabilidades aqui assumidas, perdurando as obrigações até a quitação integral dos valores.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo único. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Não será dado, no caso de óbito do locatário e/ou do fiador, à família e/ou demais herdeiros do de cujus apropriar-se do bem locado, devendo comunicar a locadora acerca do evento morte para fins de recolhimento do bem móvel (veículo). Com efeito, deverá o locatário e/ou fiador comunicar a respectiva família acerca da presente entabulação contratual visando o evento morte.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 19ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O(a) fiador(a) qualificado em cláusula 2ª, fica ciente da integralidade do presente contrato, assinando ao final.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // ESTIPULAÇÕES DIVERSAS
            new Paragraph({
              children: [
                new TextRun({
                  text: "DAS ESTIPULAÇÕES DIVERSAS",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 20ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O contrato poderá ser rescindido pela locadora, de forma imediata e automática, independente de notificação extrajudicial ou judicial, sem maiores formalidades, podendo, inclusive, proceder com a retomada do veículo, inclusive às suas próprias expensas, nos casos discriminados nas seguintes cláusulas:",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de inadimplência, pelo prazo superior a 2 (Dois) dias do vencimento da parcela, o presente contrato será rescindido automaticamente, por culpa do(a) locatário(a).",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo segundo. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "A rescisão contratual, implica no direito de retomada do veículo pela locadora, sem a necessidade de maiores formalidades, ou notificação judicial ou extrajudicial.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo terceiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "A rescisão contratual por mora ou inadimplemento do(a) locatário(a), será efetuada sem a devolução ao locatário(a) de parcelas eventualmente já quitadas, ficando-as, como pagamento da locação pelo uso do bem, assim como os valores pagos à título de depreciação do bem.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo quarto. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Configurada a mora/inadimplemento do(a) locatário(a) pelo prazo especificado no parágrafo primeiro, este deverá efetuar a imediata devolução do veículo, sob pena de retomada pela locadora e ajuizamento de ações pertinentes ao esbulho e apropriação indébita, de maneira que em hipótese alguma contará o período na posse do bem em situação de inadimplemento e/ou de qualquer outra violação contratual à título de usucapião do bem.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo quinto. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Sendo o veículo objeto de reboque, acidente ou incêndio, a locadora apenas reconhecerá o encerramento da locação e devolução do bem, quando de fato, estiver de posse do veículo.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo sexto. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de furto ou roubo do veículo, a locadora apenas reconhecerá o encerramento da locação, com a entrega imediata pelo(a) locatário(a), do respectivo boletim de ocorrência.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo sétimo. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de desistência do contrato de locação por parte do(a) locatário(a), este deverá comparecer às dependências da locadora para assinatura de termo de devolução do veículo, bem como ficará responsável por eventuais parcelas em aberto e demais encargos do contrato de locação em questão.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo oitavo. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em qualquer hipótese de rescisão do contrato, seja ela por inadimplemento, por desistência, falecimento, entre outras, ficará o locatário obrigado a reparar qualquer dano causado ao veículo durante a contratualidade, não sendo possível devolver o bem de maneira diversa daquela contratada.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo nono. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Será automaticamente rescindido o presente contrato em caso de prática de ilícitos, seja ele do código civil ou criminal; qualquer conduta contrária ao código de trânsito, como conduzir veículo sem CNH ou fornecer o veículo a outro condutor não habilitado, uso de bebida alcoólica ou substância entorpecente que causem a apreensão do carro a pátios, delegacias ou acidentes de trânsito.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo décimo. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Após 3 (Três) parcelas do contrato pagas, o LOCATÁRIO tem a opção de trocar de veículo, se houver disponibilidade, pagando uma taxa de troca no valor de R$1.500,00 (Hum mil e quinhentos reais), desde que, todas as pendências com o LOCADOR estejam em dia, tais como, multas, parcelamento de entrada, IPVA do veículo proporcional ao utilizado.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo décimo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Caso o LOCATÁRIO opte pelo cancelamento, o mesmo deverá pagar uma multa no valor de R$2.000,00 (Dois mil reais) para o LOCADOR, sendo possível o cancelamento em até 15 (Quinze) da assinatura do contrato.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo décimo segundo. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O LOCATÁRIO tem a opção de fazer uma devolução amigável em até 5 (Cinco) dias antes do vencimento da parcela mensal, podendo assim utilizar em outro veículo a depreciação apresentada na assinatura do contrato, em até 60 (sessenta) dias.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // CLÁUSULA 21 - BENFEITORIAS
            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 21ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Quanto a eventuais benfeitorias realizadas no veículo, estas serão incorporadas no veículo. Caso exercido o direito de compra as benfeitorias reverterão em favor do locatário e em caso de devolução, em favor da locadora.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // SUBSTITUIÇÃO DO VEÍCULO LOCADO
            new Paragraph({
              children: [
                new TextRun({
                  text: "SUBSTITUIÇÃO DO VEÍCULO LOCADO",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 22ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Caso o veículo objeto do presente contrato venha a apresentar quaisquer tipo de restrição, bloqueio, impedimento legal, necessidade de manutenção prolongada ou qualquer outra situação que impossibilite a continuidade da locação, a LOCADORA se reserva o direito de substituir o veículo por outro de características semelhante, com o objetivo de garantir a continuidade do serviço ao LOCADOR, sem prejuízos.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "A substituição será obrigatória e imediata, visando o bom andamento do contrato. Caso o LOCADOR se recuse a receber o veículo substituído ofertado pela LOCADORA, este contrato poderá ser encerrado de forma unilateral pela LOCADORA sem penalidades, sendo considerado como desistência por parte do LOCADOR.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // ENCERRAMENTO DE CONTRATO POR AÇÃO DE COBRANÇA
            new Paragraph({
              children: [
                new TextRun({
                  text: "ENCERRAMENTO DE CONTRATO POR AÇÃO DE COBRANÇA",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 23ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de inadimplência ou descumprimento contratual que resulte na necessidade de ação de cobrança e devolução forçada do veículo por parte da LOCADORA, o LOCATÁRIO reconhece que será responsável pelo pagamento dos seguintes valores: Custos operacionais no valor de R$350,00 (Trezentos e cinquenta reais), taxa administrativa pelo encerramento contratual no valor de R$500,00 (Quinhentos reais) e todos os débitos pendentes relacionados ao contrato, incluindo mensalidades, multas, encargos e eventuais danos ao veículo;",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Parágrafo primeiro. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O não pagamento desses valores poderá resultar na negativação do CPF do LOCATÁRIO e em ações judiciais cabíveis para ressarcimento dos prejuízos.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // DISPOSIÇÕES FINAIS
            new Paragraph({
              children: [
                new TextRun({
                  text: "DISPOSIÇÕES FINAIS",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 24ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "Em caso de ajuizamento de ação de cobrança, o(a) locatário(a) arcará com a multa de 10% (Dez), sobre o débito em aberto.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 25ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "As partes, elegem o foro da Comarca de Santo André para dirimir eventuais questões em decorrência do presente contrato.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "CLÁUSULA 26ª. ",
                  bold: true,
                  font: "Arial",
                  size: 22,
                }),
                new TextRun({
                  text: "O presente contrato tem caráter irrevogável, irretratável e intransferível, obrigando as partes ao cumprimento, transmitindo-se às obrigações aos sucessores e herdeiros.",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 400 },
            }),

            // Data e Local
            new Paragraph({
              children: [
                new TextRun({
                  text: `São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 600, after: 600 },
            }),

            // Assinaturas
            new Paragraph({
              children: [
                new TextRun({
                  text: "_".repeat(60),
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "IMOBILICAR LOCAÇÃO DE VEÍCULOS",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "(LOCADOR)",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "_".repeat(60),
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: financing.customerName || "LOCATÁRIO",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "(LOCATÁRIO)",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "_".repeat(60),
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: financing.guarantorName || "AVALISTA/FIADOR",
                  font: "Arial",
                  size: 22,
                  bold: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "(AVALISTA/TERCEIRO GARANTIDOR)",
                  font: "Arial",
                  size: 22,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),

            // Adicionar comprovante de pagamento (se existir)
            ...paymentProofSection,
          ],
        }],
      });

      // Gerar o buffer do documento
      const buffer = await Packer.toBuffer(doc);

      // Se temos um financingId, salvar o contrato no banco de dados
      if (req.body.financingId) {
        try {
          // Converter buffer para base64
          const base64Contract = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${buffer.toString('base64')}`;
          const fileName = `contrato-financiamento-${financing.customerName?.replace(/\s+/g, '-') || 'cliente'}.docx`;

          // Buscar contratos existentes
          const existingFinancing = await storage.getFinancing(req.body.financingId);
          let generatedContracts = [];

          if (existingFinancing?.generatedContracts) {
            try {
              generatedContracts = JSON.parse(existingFinancing.generatedContracts);
            } catch (e) {
              generatedContracts = [];
            }
          }

          // Adicionar novo contrato
          generatedContracts.push({
            url: base64Contract,
            fileName: fileName,
            generatedAt: new Date().toISOString()
          });

          // Atualizar financiamento
          await storage.updateFinancing(req.body.financingId, {
            generatedContracts: JSON.stringify(generatedContracts),
            contractUrl: base64Contract, // Manter o último gerado aqui também
            contractGeneratedAt: new Date()
          });
        } catch (saveError) {
          console.error('Erro ao salvar contrato no banco:', saveError);
          // Continuar mesmo se falhar ao salvar, pois o download ainda funcionará
        }
      }

      // Configurar headers e enviar o arquivo
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=contrato-financiamento-${financing.customerName?.replace(/\s+/g, '-') || 'cliente'}.docx`);
      res.send(buffer);

    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      res.status(500).json({ error: "Erro ao gerar contrato de financiamento" });
    }
  });

  // Gerar PDF de Vistoria
  app.post("/api/generate-inspection-pdf", async (req, res) => {
    try {
      const { customerData, selectedVehicle, checkInPhotos, vehicleChecklist, customerSignature, inspectorSignature } = req.body;

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=vistoria-${selectedVehicle?.licensePlate || 'veiculo'}.pdf`);
        res.send(pdfBuffer);
      });

      // Cabeçalho
      doc.fontSize(24).font('Helvetica-Bold').text('IMOBILICAR', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(18).text('Relatório de Vistoria de Veículo', { align: 'center' });
      doc.moveDown(0.5);

      // Linha separadora
      doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke();
      doc.moveDown(0.5);

      // Converter para horário de Brasília (UTC-3)
      const brasiliaDate = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
      doc.fontSize(10).font('Helvetica').text(`Data: ${format(brasiliaDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, { align: 'center' });
      doc.fontSize(10).text(`Cliente: ${customerData?.name || 'Não informado'}`, { align: 'center' });
      doc.fontSize(10).text(`Veículo: ${selectedVehicle?.brand || ''} ${selectedVehicle?.model || ''} - Placa: ${selectedVehicle?.licensePlate || 'N/A'}`, { align: 'center' });
      doc.moveDown(2);

      // Sumário em formato de tabela
      doc.fontSize(14).font('Helvetica-Bold').text('Informações da Vistoria', { underline: true });
      doc.moveDown(0.8);

      const summaryX = 80;
      let summaryY = doc.y;
      const labelWidth = 150;
      const valueX = summaryX + labelWidth;

      // Função helper para linhas do sumário
      const addSummaryLine = (label: string, value: string) => {
        doc.fontSize(10).font('Helvetica-Bold').text(label + ':', summaryX, summaryY, { width: labelWidth, continued: false });
        doc.fontSize(10).font('Helvetica').text(value, valueX, summaryY, { width: 300 });
        summaryY = doc.y + 5;
      };

      addSummaryLine('Cliente', customerData?.name || 'Não informado');
      addSummaryLine('Telefone', customerData?.phone || 'Não informado');
      addSummaryLine('CPF', customerData?.cpf || 'Não informado');

      doc.moveDown(0.5);
      summaryY = doc.y;

      addSummaryLine('Marca/Modelo', `${selectedVehicle?.brand || ''} ${selectedVehicle?.model || ''}`);
      addSummaryLine('Placa', selectedVehicle?.licensePlate || 'Não informado');
      addSummaryLine('Ano', selectedVehicle?.year?.toString() || 'Não informado');
      addSummaryLine('Cor', selectedVehicle?.color || 'Não informado');

      doc.moveDown(0.5);
      summaryY = doc.y;

      addSummaryLine('Tipo de Operação', 'Saída (Início de Financiamento)');
      addSummaryLine('Vistoriador', 'Administrador Imobilicar');
      addSummaryLine('Status', 'FINALIZADA');

      doc.moveDown(1);

      // Observações principais
      doc.fontSize(11).font('Helvetica-Bold').text('Observações Principais:', summaryX);
      doc.moveDown(0.3);

      const damagedItems = Object.keys(vehicleChecklist || {}).filter(k => !vehicleChecklist[k]?.checked && vehicleChecklist[k]?.notes);
      if (damagedItems.length > 0) {
        doc.fontSize(9).font('Helvetica');
        damagedItems.forEach(item => {
          doc.text(`• ${item}: ${vehicleChecklist[item].notes}`, summaryX + 10);
        });
      } else {
        doc.fontSize(9).font('Helvetica').text('• Veículo em perfeito estado, sem avarias identificadas.', summaryX + 10);
      }

      doc.addPage();

      // Checklist de Itens
      doc.fontSize(14).font('Helvetica-Bold').text('Checklist Detalhado de Inspeção', { underline: true });
      doc.moveDown(0.8);

      // Função helper para adicionar categoria de checklist
      const addChecklistCategory = (title: string, items: string[]) => {
        doc.fontSize(11).font('Helvetica-Bold').text(title, { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(9).font('Helvetica');

        items.forEach(item => {
          const status = (vehicleChecklist && vehicleChecklist[item]?.checked !== false) ? '✓ OK' : '✗ PROBLEMA';
          const notes = vehicleChecklist && vehicleChecklist[item]?.notes ? ` — ${vehicleChecklist[item].notes}` : '';
          const symbol = (vehicleChecklist && vehicleChecklist[item]?.checked !== false) ? '  ☑' : '  ☐';
          doc.text(`${symbol}  ${item} — ${status}${notes}`);
        });
        doc.moveDown(0.7);
      };

      addChecklistCategory('CHECKLIST EXTERNO - ITENS DE LATARIA E ESTRUTURA', [
        'Antena', 'Para-Choque Dianteiro', 'Para-Choque Traseiro', 'Capô', 'Teto',
        'Porta Dianteira Direita', 'Porta Traseira Direita', 'Porta Dianteira Esquerda', 'Porta Traseira Esquerda',
        'Retrovisor Direito', 'Retrovisor Esquerdo', 'Faróis Dianteiros', 'Lanternas Traseiras',
        'Para-Brisa Dianteiro', 'Vidros Laterais', 'Vidro Traseiro', 'Pintura Geral'
      ]);

      addChecklistCategory('CHECKLIST EQUIPAMENTOS DE SINALIZAÇÃO E SEGURANÇA', [
        'Chave De Roda', 'Triângulo', 'Documento Do Veículo'
      ]);

      addChecklistCategory('CHECKLIST DE ITENS ELÉTRICOS', [
        'Faróis Baixo/Alto', 'Luz De Ré', 'Luz De Freio', 'Luzes De Seta', 'Luz De Placa',
        'Limpador De Para-Brisa', 'Lavador De Para-Brisa', 'Painel De Instrumentos', 'Ar-Condicionado / Ventilação'
      ]);

      addChecklistCategory('CHECKLIST INTERNO - ITENS DE ACABAMENTO E CONFORTO', [
        'Bancos (Dianteiros/Traseiros)', 'Tapetes', 'Painel', 'Alavanca De Câmbio',
        'Vidros Elétricos', 'Travas Elétricas', 'Espelhos Internos'
      ]);

      addChecklistCategory('CHECKLIST MECÂNICA BÁSICA', [
        'Nível De Óleo', 'Nível Da Água (Radiador)', 'Nível Do Fluido De Freio', 'Nível Do Fluido De Direção',
        'Vazamentos Visíveis', 'Funcionamento Do Motor', 'Funcionamento Dos Freios',
        'Funcionamento Da Direção', 'Funcionamento Da Embreagem'
      ]);

      doc.addPage();

      // Fotos Obrigatórias
      doc.fontSize(14).font('Helvetica-Bold').text('Registro Fotográfico do Veículo', { underline: true });
      doc.moveDown(0.8);

      const photoLabels = [
        { key: 'frente', label: 'Vista Frontal' },
        { key: 'fundo', label: 'Vista Traseira' },
        { key: 'lateral_esquerda', label: 'Lateral Esquerda' },
        { key: 'lateral_direita', label: 'Lateral Direita' }
      ];

      const photoBoxWidth = 240;
      const photoBoxHeight = 180;
      const photoMargin = 50;
      const photoSpacing = 20;

      // Salvar a posição Y inicial
      const startPhotoY = doc.y;

      // Primeira linha - Fotos 0 e 1 (Frente e Fundo)
      for (let i = 0; i < 2; i++) {
        const photo = photoLabels[i];
        const photoX = photoMargin + (i * (photoBoxWidth + photoSpacing));
        const photoY = startPhotoY;

        // Título da foto
        doc.fontSize(10).font('Helvetica-Bold').text(photo.label, photoX, photoY, { width: photoBoxWidth, align: 'center' });

        // Desenhar borda do box da foto
        doc.rect(photoX, photoY + 20, photoBoxWidth, photoBoxHeight).stroke();

        // Inserir foto
        if (checkInPhotos && checkInPhotos[photo.key]) {
          try {
            const imageData = checkInPhotos[photo.key].replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(imageData, 'base64');
            // Usar 'fit' para manter o aspect ratio
            doc.image(buffer, photoX + 5, photoY + 25, { fit: [photoBoxWidth - 10, photoBoxHeight - 10], align: 'center', valign: 'center' });
          } catch (error) {
            console.error('Erro ao adicionar foto:', error);
            doc.fontSize(9).font('Helvetica').text('Imagem não disponível', photoX + 60, photoY + 100);
          }
        } else {
          doc.fontSize(9).font('Helvetica').text('Foto não fornecida', photoX + 70, photoY + 100);
        }
      }

      // Segunda linha - Fotos 2 e 3 (Laterais)
      const secondRowY = startPhotoY + photoBoxHeight + 50;
      for (let i = 2; i < 4; i++) {
        const photo = photoLabels[i];
        const col = i - 2; // Coluna 0 ou 1
        const photoX = photoMargin + (col * (photoBoxWidth + photoSpacing));
        const photoY = secondRowY;

        // Título da foto
        doc.fontSize(10).font('Helvetica-Bold').text(photo.label, photoX, photoY, { width: photoBoxWidth, align: 'center' });

        // Desenhar borda do box da foto
        doc.rect(photoX, photoY + 20, photoBoxWidth, photoBoxHeight).stroke();

        // Inserir foto
        if (checkInPhotos && checkInPhotos[photo.key]) {
          try {
            const imageData = checkInPhotos[photo.key].replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(imageData, 'base64');
            // Usar 'fit' para manter o aspect ratio
            doc.image(buffer, photoX + 5, photoY + 25, { fit: [photoBoxWidth - 10, photoBoxHeight - 10], align: 'center', valign: 'center' });
          } catch (error) {
            console.error('Erro ao adicionar foto:', error);
            doc.fontSize(9).font('Helvetica').text('Imagem não disponível', photoX + 60, photoY + 100);
          }
        } else {
          doc.fontSize(9).font('Helvetica').text('Foto não fornecida', photoX + 70, photoY + 100);
        }
      }

      // Ajustar posição Y após todas as fotos (segunda linha + altura + espaçamento)
      doc.y = secondRowY + photoBoxHeight + 50;

      // Fotos de Danos (se houver)
      if (damagedItems.length > 0) {
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Registro de Avarias e Danos', { underline: true });
        doc.moveDown(0.8);

        damagedItems.forEach(item => {
          doc.fontSize(10).font('Helvetica-Bold').text(`• ${item}`);
          doc.fontSize(9).font('Helvetica').text(`  Observação: ${vehicleChecklist[item].notes}`, { indent: 20 });
          doc.moveDown(0.5);
        });
      }

      // Assinaturas
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Autenticação e Assinaturas', { underline: true });
      doc.moveDown(1);

      doc.fontSize(10).font('Helvetica').text('As partes abaixo assinam o presente relatório de vistoria, atestando a veracidade das informações:', { align: 'left' });
      doc.moveDown(2);

      const signX = 80;
      const signY = doc.y;
      const signBoxWidth = 200;
      const signBoxHeight = 80;

      // Assinatura do Cliente
      doc.rect(signX, signY, signBoxWidth, signBoxHeight).stroke();

      if (customerSignature) {
        try {
          const imageData = customerSignature.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(imageData, 'base64');
          doc.image(buffer, signX + 25, signY + 5, { fit: [signBoxWidth - 50, signBoxHeight - 25], align: 'center', valign: 'center' });
        } catch (error) {
          console.error('Erro ao adicionar assinatura do cliente:', error);
          doc.fontSize(8).font('Helvetica').text('(Assinatura digital)', signX + 60, signY + 35);
        }
      }

      doc.fontSize(9).font('Helvetica-Bold').text('Assinatura do Cliente', signX + 30, signY + signBoxHeight + 8);
      doc.fontSize(8).font('Helvetica').text(customerData?.name || 'Nome não informado', signX + 20, signY + signBoxHeight + 22);
      doc.fontSize(8).text(`CPF: ${customerData?.cpf || 'N/A'}`, signX + 20, signY + signBoxHeight + 35);

      // Assinatura do Vistoriador
      const inspectorX = signX + signBoxWidth + 60;
      doc.rect(inspectorX, signY, signBoxWidth, signBoxHeight).stroke();

      if (inspectorSignature) {
        try {
          const imageData = inspectorSignature.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(imageData, 'base64');
          doc.image(buffer, inspectorX + 25, signY + 5, { fit: [signBoxWidth - 50, signBoxHeight - 25], align: 'center', valign: 'center' });
        } catch (error) {
          console.error('Erro ao adicionar assinatura do vistoriador:', error);
          doc.fontSize(8).font('Helvetica').text('(Assinatura digital)', inspectorX + 60, signY + 35);
        }
      }

      doc.fontSize(9).font('Helvetica-Bold').text('Assinatura do Vistoriador', inspectorX + 20, signY + signBoxHeight + 8);
      doc.fontSize(8).font('Helvetica').text('Imobilicar - Locadora de Veículos', inspectorX + 10, signY + signBoxHeight + 22);
      doc.fontSize(8).text(`Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`, inspectorX + 10, signY + signBoxHeight + 35);

      // Rodapé com informações legais
      doc.moveDown(8);
      doc.fontSize(8).font('Helvetica').text('_'.repeat(100), { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(7).text('Este documento foi gerado digitalmente pela Imobilicar e possui validade legal.', { align: 'center' });
      // Converter para horário de Brasília (UTC-3)
      const brasiliaDateFooter = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
      doc.text(`Documento gerado em ${format(brasiliaDateFooter, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, { align: 'center' });

      doc.end();
    } catch (error) {
      console.error('Erro ao gerar PDF de vistoria:', error);
      res.status(500).json({ error: "Erro ao gerar PDF de vistoria" });
    }
  });

  // SEO: Sitemap.xml dinâmico
  app.get("/sitemap.xml", (req, res) => {
    const protocol = req.protocol;
    const host = req.get('host');
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

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // SEO: Robots.txt dinâmico
  app.get("/robots.txt", (req, res) => {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const robotsTxt = `# Robots.txt para Imobilicar
# Permite que todos os motores de busca indexem o site

User-agent: *
Allow: /vehicles
Allow: /investor
Allow: /customer

# Bloquear áreas administrativas e APIs
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*
Disallow: /crm

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Endpoint para gerar contrato de cessão de veículo para investidor
  app.post("/api/generate-investor-contract-docx", async (req, res) => {
    try {
      const { customer, vehicle, customDividend, bonusValue, debitosVeiculo, paymentDate } = req.body;
      const docxBuffer = await generateInvestorCessionContractDocx(customer, vehicle, customDividend || '0', bonusValue || '0', debitosVeiculo || '', paymentDate || '20');
      const filename = `Contrato de Cessao - ${customer.name || 'Investidor'} - ${format(new Date(), "dd-MM-yyyy")}.docx`;
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      res.send(docxBuffer);
    } catch (error) {
      console.error('Error generating investor contract DOCX:', error);
      res.status(500).json({ error: "Failed to generate contract" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateContractPdf(doc: PDFKit.PDFDocument, customer: any, rental: any, vehicle: any): void {
  const pageWidth = 595.28; // A4 width in points
  const margin = 28.35; // 1cm left/right margin
  const topMargin = 14.17; // 0.5cm top margin
  const contentWidth = pageWidth - (margin * 2);
  let currentY = topMargin + 18;

  // Cabeçalho
  doc.fontSize(16).font('Helvetica-Bold').text('CONTRATO DE LOCAÇÃO DE VEÍCULO', margin, currentY, {
    width: contentWidth,
    align: 'center',
    lineGap: 2
  });
  currentY = doc.y + 8;

  doc.fontSize(10).font('Helvetica').text('Imobilicar - Locadora de Veículos', margin, currentY, {
    width: contentWidth,
    align: 'center',
    lineGap: 1
  });
  currentY = doc.y + 12;

  doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
  currentY += 15;

  // LOCADOR
  doc.fontSize(11).font('Helvetica-Bold').text('LOCADOR: ', margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font('Helvetica').text('Imobilicar Locadora de Veículos LTDA | CNPJ: 12.345.678/0001-90 | End: Rua das Locadoras, 123 - SP', { lineGap: 1.5 });
  currentY = doc.y + 14;

  // LOCATÁRIO
  doc.fontSize(11).font('Helvetica-Bold').text('LOCATÁRIO: ', margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font('Helvetica').text(`${customer.name} | CPF: ${customer.cpf} | Tel: ${customer.phone}`, { lineGap: 1.5 });
  currentY = doc.y + 3;

  if (customer.street) {
    doc.fontSize(9).font('Helvetica').text(`End: ${customer.street}, ${customer.number} - ${customer.city}/${customer.state} - CEP: ${customer.zipCode}`, margin, currentY, {
      width: contentWidth,
      lineGap: 1.5
    });
    currentY = doc.y;
  }
  currentY += 14;

  // VEÍCULO
  doc.fontSize(11).font('Helvetica-Bold').text('VEÍCULO: ', margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font('Helvetica').text(`${vehicle.name} (${vehicle.brand} ${vehicle.model} ${vehicle.year}) | ${vehicle.category} | ${vehicle.transmission} | ${vehicle.fuel} | ${vehicle.seats} lugares`, { lineGap: 1.5 });
  currentY = doc.y + 14;

  // PERÍODO E VALORES
  doc.fontSize(11).font('Helvetica-Bold').text('PERÍODO: ', margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font('Helvetica').text(`${format(new Date(rental.startDate), "dd/MM/yyyy", { locale: ptBR })} a ${format(new Date(rental.endDate), "dd/MM/yyyy", { locale: ptBR })} | `, { continued: true, lineGap: 1.5 });
  doc.font('Helvetica-Bold').text('DIÁRIA: ', { continued: true, lineGap: 1.5 });
  doc.font('Helvetica').text(`R$ ${Number(vehicle.pricePerDay).toFixed(2)} | `, { continued: true, lineGap: 1.5 });
  doc.font('Helvetica-Bold').text('TOTAL: ', { continued: true, lineGap: 1.5 });
  doc.fontSize(10).font('Helvetica-Bold').text(`R$ ${Number(rental.totalPrice).toFixed(2)}`, { lineGap: 1.5 });
  currentY = doc.y + 16;

  // CLÁUSULAS CONTRATUAIS - em duas colunas
  doc.fontSize(12).font('Helvetica-Bold').text('CLÁUSULAS CONTRATUAIS', margin, currentY, { lineGap: 1.5 });
  currentY = doc.y + 10;

  doc.fontSize(8).font('Helvetica');

  const clauses = [
    'CLÁUSULA 1ª - DO OBJETO: O presente contrato tem por objeto a locação do veículo acima descrito, em perfeitas condições de uso, conservação e funcionamento.',
    'CLÁUSULA 2ª - DO PRAZO: O prazo de locação será conforme especificado acima, podendo ser prorrogado mediante acordo entre as partes.',
    'CLÁUSULA 3ª - DO PAGAMENTO: O LOCATÁRIO se compromete a efetuar o pagamento do valor total da locação no ato da retirada do veículo.',
    'CLÁUSULA 4ª - DAS RESPONSABILIDADES: O LOCATÁRIO assume total responsabilidade pelo veículo durante o período de locação, incluindo multas, danos e furtos.',
    'CLÁUSULA 5ª - DA DEVOLUÇÃO: O veículo deverá ser devolvido nas mesmas condições em que foi retirado, com o tanque de combustível no mesmo nível.',
    'CLÁUSULA 6ª - DA QUILOMETRAGEM: A locação inclui quilometragem livre dentro do território nacional.'
  ];

  // Dividir cláusulas em duas colunas
  const col1Width = (contentWidth - 18) / 2;
  const col2X = margin + col1Width + 18;
  const clausesPerColumn = 3;
  const clauseStartY = currentY;

  // Coluna 1 (cláusulas 1-3)
  let col1Y = clauseStartY;
  for (let i = 0; i < clausesPerColumn; i++) {
    doc.text(clauses[i], margin, col1Y, {
      width: col1Width,
      align: 'justify',
      lineGap: 1.5
    });
    col1Y = doc.y + 7;
  }

  // Coluna 2 (cláusulas 4-6)
  let col2Y = clauseStartY;
  for (let i = clausesPerColumn; i < clauses.length; i++) {
    doc.text(clauses[i], col2X, col2Y, {
      width: col1Width,
      align: 'justify',
      lineGap: 1.5
    });
    col2Y = doc.y + 7;
  }

  currentY = Math.max(col1Y, col2Y) + 15;

  // ASSINATURAS
  doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
  currentY += 45;

  const signatureWidth = (contentWidth - 55) / 2;

  // Linhas de assinatura
  doc.moveTo(margin, currentY).lineTo(margin + signatureWidth, currentY).stroke();
  doc.moveTo(pageWidth - margin - signatureWidth, currentY).lineTo(pageWidth - margin, currentY).stroke();

  currentY += 8;

  doc.fontSize(9).font('Helvetica-Bold').text('LOCADOR', margin, currentY, {
    width: signatureWidth,
    align: 'center',
    lineGap: 1.5
  });

  doc.fontSize(8).font('Helvetica').text('Imobilicar Locadora', margin, doc.y + 3, {
    width: signatureWidth,
    align: 'center',
    lineGap: 1.5
  });

  const rightSignX = pageWidth - margin - signatureWidth;
  doc.fontSize(9).font('Helvetica-Bold').text('LOCATÁRIO', rightSignX, currentY, {
    width: signatureWidth,
    align: 'center',
    lineGap: 1.5
  });

  doc.fontSize(8).font('Helvetica').text(customer.name, rightSignX, doc.y + 3, {
    width: signatureWidth,
    align: 'center',
    lineGap: 1.5
  });

  currentY = doc.y + 20;

  doc.fontSize(8).font('Helvetica').text(
    `São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
    margin,
    currentY,
    {
      width: contentWidth,
      align: 'center',
      lineGap: 1.5
    }
  );
}

async function generateContractDocx(customer: any, rental: any, vehicle: any): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 540,    // 0.375 inches - margem segura para impressão
            bottom: 540, // 0.375 inches - margem segura para impressão
            left: 900,   // 0.625 inches - margem segura para impressão
            right: 900,  // 0.625 inches - margem segura para impressão
          },
        },
      },
      children: [
        // Cabeçalho
        new Paragraph({
          text: "CONTRATO DE LOCAÇÃO DE VEÍCULO",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: "Imobilicar - Locadora de Veículos",
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
        }),

        // LOCADOR
        new Paragraph({
          children: [
            new TextRun({
              text: "LOCADOR: ",
              bold: true,
            }),
            new TextRun({
              text: "Imobilicar Locadora de Veículos LTDA",
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: "CNPJ: 12.345.678/0001-90",
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: "Endereço: Rua das Locadoras, 123 - São Paulo - SP",
          spacing: { after: 180 },
        }),

        // LOCATÁRIO
        new Paragraph({
          children: [
            new TextRun({
              text: "LOCATÁRIO: ",
              bold: true,
            }),
            new TextRun({
              text: customer.name,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: `CPF: ${customer.cpf}`,
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: `Email: ${customer.email}`,
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: `Telefone: ${customer.phone}`,
          spacing: { after: 80 },
        }),
        ...(customer.street ? [
          new Paragraph({
            text: `Endereço: ${customer.street}, ${customer.number}${customer.complement ? `, ${customer.complement}` : ''} - ${customer.neighborhood}`,
            spacing: { after: 80 },
          }),
          new Paragraph({
            text: `Cidade/UF: ${customer.city} - ${customer.state}`,
            spacing: { after: 80 },
          }),
          new Paragraph({
            text: `CEP: ${customer.zipCode}`,
            spacing: { after: 180 },
          }),
        ] : [
          new Paragraph({
            text: "",
            spacing: { after: 180 },
          }),
        ]),

        // OBJETO DO CONTRATO
        new Paragraph({
          text: "OBJETO DO CONTRATO",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Veículo: ",
              bold: true,
            }),
            new TextRun({
              text: vehicle.name,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Marca/Modelo: ",
              bold: true,
            }),
            new TextRun({
              text: `${vehicle.brand} ${vehicle.model}`,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Ano: ",
              bold: true,
            }),
            new TextRun({
              text: String(vehicle.year),
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Categoria: ",
              bold: true,
            }),
            new TextRun({
              text: vehicle.category,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Transmissão: ",
              bold: true,
            }),
            new TextRun({
              text: vehicle.transmission,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Combustível: ",
              bold: true,
            }),
            new TextRun({
              text: vehicle.fuel,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Lugares: ",
              bold: true,
            }),
            new TextRun({
              text: `${vehicle.seats} pessoas`,
            }),
          ],
          spacing: { after: 180 },
        }),

        // PERÍODO E VALORES
        new Paragraph({
          text: "PERÍODO DE LOCAÇÃO",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Data de Início: ",
              bold: true,
            }),
            new TextRun({
              text: format(new Date(rental.startDate), "dd/MM/yyyy", { locale: ptBR }),
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Data de Término: ",
              bold: true,
            }),
            new TextRun({
              text: format(new Date(rental.endDate), "dd/MM/yyyy", { locale: ptBR }),
            }),
          ],
          spacing: { after: 180 },
        }),

        new Paragraph({
          text: "VALORES",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Diária: ",
              bold: true,
            }),
            new TextRun({
              text: `R$ ${Number(vehicle.pricePerDay).toFixed(2)}`,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Valor Total: ",
              bold: true,
            }),
            new TextRun({
              text: `R$ ${Number(rental.totalPrice).toFixed(2)}`,
              bold: true,
            }),
          ],
          spacing: { after: 180 },
        }),

        // CLÁUSULAS CONTRATUAIS
        new Paragraph({
          text: "CLÁUSULAS CONTRATUAIS",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 1ª - DO OBJETO: ",
              bold: true,
            }),
            new TextRun({
              text: "O presente contrato tem por objeto a locação do veículo acima descrito, em perfeitas condições de uso, conservação e funcionamento.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 2ª - DO PRAZO: ",
              bold: true,
            }),
            new TextRun({
              text: "O prazo de locação será conforme especificado acima, podendo ser prorrogado mediante acordo entre as partes.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 3ª - DO PAGAMENTO: ",
              bold: true,
            }),
            new TextRun({
              text: "O LOCATÁRIO se compromete a efetuar o pagamento do valor total da locação no ato da retirada do veículo.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 4ª - DAS RESPONSABILIDADES: ",
              bold: true,
            }),
            new TextRun({
              text: "O LOCATÁRIO assume total responsabilidade pelo veículo durante o período de locação, incluindo multas, danos e furtos.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 5ª - DA DEVOLUÇÃO: ",
              bold: true,
            }),
            new TextRun({
              text: "O veículo deverá ser devolvido nas mesmas condições em que foi retirado, com o tanque de combustível no mesmo nível.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 6ª - DA QUILOMETRAGEM: ",
              bold: true,
            }),
            new TextRun({
              text: "A locação inclui quilometragem livre dentro do território nacional.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 180 },
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
              size: 6,
            },
          },
        }),

        // Tabela de assinaturas
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "",
                      spacing: { before: 350 },
                    }),
                    new Paragraph({
                      text: "________________________________",
                      alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                      text: "LOCADOR",
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 50 },
                    }),
                    new Paragraph({
                      text: "Imobilicar Locadora",
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "",
                      spacing: { before: 350 },
                    }),
                    new Paragraph({
                      text: "________________________________",
                      alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                      text: "LOCATÁRIO",
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 50 },
                    }),
                    new Paragraph({
                      text: customer.name,
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  },
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: `São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

function generateInvestorContractPdf(doc: PDFKit.PDFDocument, investor: any, vehicles: any[]): void {
  const pageWidth = 595.28;
  const margin = 28.35;
  const topMargin = 14.17;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = topMargin + 18;

  doc.fontSize(16).font('Helvetica-Bold').text('CONTRATO DE PARCERIA - INVESTIMENTO EM VEÍCULOS', margin, currentY, {
    width: contentWidth,
    align: 'center',
    lineGap: 2
  });
  currentY = doc.y + 8;

  doc.fontSize(10).font('Helvetica').text('Imobilicar - Locadora de Veículos', margin, currentY, {
    width: contentWidth,
    align: 'center',
    lineGap: 1
  });
  currentY = doc.y + 12;

  doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
  currentY += 15;

  doc.fontSize(11).font('Helvetica-Bold').text('CONTRATANTE: ', margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font('Helvetica').text('Imobilicar Locadora de Veículos LTDA | CNPJ: 12.345.678/0001-90 | End: Rua das Locadoras, 123 - São Paulo - SP', { lineGap: 1.5 });
  currentY = doc.y + 14;

  doc.fontSize(11).font('Helvetica-Bold').text('INVESTIDOR PARCEIRO: ', margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font('Helvetica').text(`${investor.name} | CPF: ${investor.cpf} | Email: ${investor.email} | Tel: ${investor.phone}`, { lineGap: 1.5 });
  currentY = doc.y + 14;

  doc.fontSize(11).font('Helvetica-Bold').text('VEÍCULOS DO INVESTIDOR', margin, currentY, { lineGap: 1.5 });
  currentY = doc.y + 10;

  doc.fontSize(8).font('Helvetica');
  vehicles.forEach((vehicle, index) => {
    doc.text(`${index + 1}. ${vehicle.name} - ${vehicle.brand} ${vehicle.model} ${vehicle.year} | ${vehicle.category} | ${vehicle.transmission} | ${vehicle.fuel} | Diária: R$ ${Number(vehicle.pricePerDay).toFixed(2)}`, margin, currentY, {
      width: contentWidth,
      lineGap: 1.5
    });
    currentY = doc.y + 5;
  });

  currentY += 8;

  doc.fontSize(11).font('Helvetica-Bold').text('ESTATÍSTICAS: ', margin, currentY, { continued: true, lineGap: 1.5 });
  doc.fontSize(9).font('Helvetica').text(`Total Ganho: R$ ${Number(investor.totalEarnings || 0).toFixed(2)} | Total de Veículos: ${vehicles.length} | Percentual: 70% para o investidor`, { lineGap: 1.5 });
  currentY = doc.y + 16;

  doc.fontSize(12).font('Helvetica-Bold').text('CLÁUSULAS CONTRATUAIS', margin, currentY, { lineGap: 1.5 });
  currentY = doc.y + 10;

  doc.fontSize(8).font('Helvetica');

  const clauses = [
    'CLÁUSULA 1ª - DA PARCERIA: O presente contrato estabelece parceria entre CONTRATANTE e INVESTIDOR para investimento em veículos destinados à locação.',
    'CLÁUSULA 2ª - DO PERCENTUAL: O INVESTIDOR terá direito a 70% dos valores recebidos pelas locações dos veículos de sua propriedade.',
    'CLÁUSULA 3ª - DOS PAGAMENTOS: Os pagamentos serão realizados mensalmente até o 5º dia útil do mês subsequente às locações.',
    'CLÁUSULA 4ª - DA MANUTENÇÃO: A CONTRATANTE será responsável pela manutenção preventiva e corretiva dos veículos.',
    'CLÁUSULA 5ª - DO SEGURO: Todos os veículos deverão possuir seguro contra terceiros e cobertura de danos, custeado pela CONTRATANTE.',
    'CLÁUSULA 6ª - DA GESTÃO: A CONTRATANTE será responsável pela gestão operacional, incluindo divulgação, reservas e entregas.',
    'CLÁUSULA 7ª - DA RESCISÃO: Qualquer das partes poderá rescindir o contrato mediante aviso prévio de 30 dias.',
    'CLÁUSULA 8ª - DA EXCLUSIVIDADE: Os veículos objeto deste contrato serão administrados exclusivamente pela CONTRATANTE durante a vigência.',
    'CLÁUSULA 9ª - DAS RESPONSABILIDADES: O INVESTIDOR é proprietário dos veículos e responsável por sua documentação e regularização.'
  ];

  const col1Width = (contentWidth - 18) / 2;
  const col2X = margin + col1Width + 18;
  const clausesPerColumn = 5;
  const clauseStartY = currentY;

  let col1Y = clauseStartY;
  for (let i = 0; i < clausesPerColumn; i++) {
    doc.text(clauses[i], margin, col1Y, {
      width: col1Width,
      align: 'justify',
      lineGap: 1.5
    });
    col1Y = doc.y + 7;
  }

  let col2Y = clauseStartY;
  for (let i = clausesPerColumn; i < clauses.length; i++) {
    doc.text(clauses[i], col2X, col2Y, {
      width: col1Width,
      align: 'justify',
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

  doc.fontSize(9).font('Helvetica-Bold').text('CONTRATANTE', margin, currentY, {
    width: signatureWidth,
    align: 'center',
    lineGap: 1.5
  });

  doc.fontSize(8).font('Helvetica').text('Imobilicar Locadora', margin, doc.y + 3, {
    width: signatureWidth,
    align: 'center',
    lineGap: 1.5
  });

  const rightSignX = pageWidth - margin - signatureWidth;
  doc.fontSize(9).font('Helvetica-Bold').text('INVESTIDOR PARCEIRO', rightSignX, currentY, {
    width: signatureWidth,
    align: 'center',
    lineGap: 1.5
  });

  doc.fontSize(8).font('Helvetica').text(investor.name, rightSignX, doc.y + 3, {
    width: signatureWidth,
    align: 'center',
    lineGap: 1.5
  });

  currentY = doc.y + 20;

  doc.fontSize(8).font('Helvetica').text(
    `São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
    margin,
    currentY,
    {
      width: contentWidth,
      align: 'center',
      lineGap: 1.5
    }
  );
}

async function generateInvestorContractDocx(investor: any, vehicles: any[]): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 540,
            bottom: 540,
            left: 900,
            right: 900,
          },
        },
      },
      children: [
        new Paragraph({
          text: "CONTRATO DE PARCERIA - INVESTIMENTO EM VEÍCULOS",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: "Imobilicar - Locadora de Veículos",
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "CONTRATANTE: ",
              bold: true,
            }),
            new TextRun({
              text: "Imobilicar Locadora de Veículos LTDA",
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: "CNPJ: 12.345.678/0001-90",
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: "Endereço: Rua das Locadoras, 123 - São Paulo - SP",
          spacing: { after: 180 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: "INVESTIDOR PARCEIRO: ",
              bold: true,
            }),
            new TextRun({
              text: investor.name,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: `CPF: ${investor.cpf}`,
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: `Email: ${investor.email}`,
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: `Telefone: ${investor.phone}`,
          spacing: { after: 180 },
        }),

        new Paragraph({
          text: "VEÍCULOS DO INVESTIDOR",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 },
        }),
        ...vehicles.map((vehicle, index) =>
          new Paragraph({
            text: `${index + 1}. ${vehicle.name} - ${vehicle.brand} ${vehicle.model} ${vehicle.year} | ${vehicle.category} | ${vehicle.transmission} | ${vehicle.fuel} | Diária: R$ ${Number(vehicle.pricePerDay).toFixed(2)}`,
            spacing: { after: 80 },
          })
        ),

        new Paragraph({
          text: "ESTATÍSTICAS",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Total Ganho: ",
              bold: true,
            }),
            new TextRun({
              text: `R$ ${Number(investor.totalEarnings || 0).toFixed(2)}`,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Total de Veículos: ",
              bold: true,
            }),
            new TextRun({
              text: `${vehicles.length}`,
            }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Percentual: ",
              bold: true,
            }),
            new TextRun({
              text: "70% para o investidor",
            }),
          ],
          spacing: { after: 180 },
        }),

        new Paragraph({
          text: "CLÁUSULAS CONTRATUAIS",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 1ª - DA PARCERIA: ",
              bold: true,
            }),
            new TextRun({
              text: "O presente contrato estabelece parceria entre CONTRATANTE e INVESTIDOR para investimento em veículos destinados à locação.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 2ª - DO PERCENTUAL: ",
              bold: true,
            }),
            new TextRun({
              text: "O INVESTIDOR terá direito a 70% dos valores recebidos pelas locações dos veículos de sua propriedade.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 3ª - DOS PAGAMENTOS: ",
              bold: true,
            }),
            new TextRun({
              text: "Os pagamentos serão realizados mensalmente até o 5º dia útil do mês subsequente às locações.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 4ª - DA MANUTENÇÃO: ",
              bold: true,
            }),
            new TextRun({
              text: "A CONTRATANTE será responsável pela manutenção preventiva e corretiva dos veículos.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 5ª - DO SEGURO: ",
              bold: true,
            }),
            new TextRun({
              text: "Todos os veículos deverão possuir seguro contra terceiros e cobertura de danos, custeado pela CONTRATANTE.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 6ª - DA GESTÃO: ",
              bold: true,
            }),
            new TextRun({
              text: "A CONTRATANTE será responsável pela gestão operacional, incluindo divulgação, reservas e entregas.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 7ª - DA RESCISÃO: ",
              bold: true,
            }),
            new TextRun({
              text: "Qualquer das partes poderá rescindir o contrato mediante aviso prévio de 30 dias.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 8ª - DA EXCLUSIVIDADE: ",
              bold: true,
            }),
            new TextRun({
              text: "Os veículos objeto deste contrato serão administrados exclusivamente pela CONTRATANTE durante a vigência.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "CLÁUSULA 9ª - DAS RESPONSABILIDADES: ",
              bold: true,
            }),
            new TextRun({
              text: "O INVESTIDOR é proprietário dos veículos e responsável por sua documentação e regularização.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 180 },
        }),

        new Paragraph({
          text: "",
          spacing: { before: 180 },
          border: {
            top: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        }),

        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "",
                      spacing: { before: 350 },
                    }),
                    new Paragraph({
                      text: "________________________________",
                      alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                      text: "CONTRATANTE",
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 50 },
                    }),
                    new Paragraph({
                      text: "Imobilicar Locadora",
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "",
                      spacing: { before: 350 },
                    }),
                    new Paragraph({
                      text: "________________________________",
                      alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                      text: "INVESTIDOR PARCEIRO",
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 50 },
                    }),
                    new Paragraph({
                      text: investor.name,
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  },
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: `São Paulo, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

async function generateInvestorCessionContractDocx(customer: any, vehicle: any, customDividend: string, bonusValue: string, debitosVeiculo: string, paymentDate: string): Promise<Buffer> {
  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Load the Imobilicar logo (using the square version for contracts)
  let logoBuffer: Buffer | null = null;
  try {
    const logoPath = path.join(process.cwd(), 'client', 'public', 'logo-contract.png');
    if (fs.existsSync(logoPath)) {
      logoBuffer = fs.readFileSync(logoPath);
    } else {
      // Fallback to regular logo
      const fallbackPath = path.join(process.cwd(), 'client', 'public', 'logo.png');
      if (fs.existsSync(fallbackPath)) {
        logoBuffer = fs.readFileSync(fallbackPath);
      }
    }
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  const formatCurrency = (value: string | number | null | undefined): string => {
    if (!value) return "0,00";
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,.]/g, '').replace(',', '.')) : value;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const numberToWords = (num: number): string => {
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    if (num === 0) return 'zero';
    if (num === 100) return 'cem';
    let words = '';
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      words += thousands === 1 ? 'mil' : units[thousands] + ' mil';
      num %= 1000;
      if (num > 0) words += ' e ';
    }
    if (num >= 100) {
      words += hundreds[Math.floor(num / 100)];
      num %= 100;
      if (num > 0) words += ' e ';
    }
    if (num >= 20) {
      words += tens[Math.floor(num / 10)];
      num %= 10;
      if (num > 0) words += ' e ';
    } else if (num >= 10) {
      words += teens[num - 10];
      num = 0;
    }
    if (num > 0) words += units[num];
    return words;
  };

  const dividendValue = parseFloat(customDividend?.replace(/[^\d,.]/g, '').replace(',', '.') || '0');
  const dividendWords = numberToWords(Math.floor(dividendValue)) + ' reais';
  const bonusVal = parseFloat(bonusValue?.replace(/[^\d,.]/g, '').replace(',', '.') || '0');
  const bonusWords = numberToWords(Math.floor(bonusVal)) + ' reais';

  const customerAddress = `${customer.street || ''}${customer.number ? `, nº${customer.number}` : ''}${customer.neighborhood ? ` - ${customer.neighborhood}` : ''}${customer.city ? ` - ${customer.city}/${customer.state}` : ''}${customer.zipCode ? ` - CEP ${customer.zipCode}` : ''}`;

  const vehicleBrand = vehicle.brand || '';
  const vehicleModel = vehicle.model || vehicle.name || '';
  const vehicleYear = vehicle.year || '';
  const vehiclePlate = vehicle.licensePlate || vehicle.plate || '';
  const vehicleRenavam = vehicle.renavam || '';
  const vehicleChassi = vehicle.chassi || '';

  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  const thinBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  };

  const investorContractDoc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 24 },
          paragraph: { spacing: { line: 276, after: 0 } },
        },
      },
      paragraphStyles: [{
        id: "Normal",
        name: "Normal",
        run: { font: "Times New Roman", size: 24 },
        paragraph: { spacing: { line: 276, after: 0 } },
      }],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1134 },
          size: { width: 11906, height: 16838 },
        }
      },
      children: [
        // Logo da Imobilicar no topo (proporção 1:1 - quadrada)
        ...(logoBuffer ? [
          new Paragraph({
            children: [
              new ImageRun({
                data: logoBuffer,
                transformation: { width: 120, height: 120 },
                type: 'png',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        ] : []),

        new Paragraph({
          children: [new TextRun({ text: "CONTRATO DE LOCAÇÃO DE VEÍCULO COM RESPONSABILIDADE EXCLUSIVA DA LOCADORA", bold: true, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 200 },
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CONTRATANTE: ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: `${customer.name?.toUpperCase() || ""}, brasileiro, inscrito no CPF sob o nº ${customer.cpf}${customer.rg ? ` e portador da cédula de identidade R.G. sob o nº ${customer.rg}` : ''}, residente e domiciliado à ${customerAddress}. Número para contato: ${customer.phone || ''} e e-mail: ${customer.email || ''}`, font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CONTRATADA: ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "IMOBILICAR LOCAÇÃO DE VEÍCULOS, pessoa jurídica de direito privado, inscrito no CNPJ sob o nº 61.363.556/0001-37, localizada na Rua Antônio Cardoso Franco, nº 237 Casa Branca - Santo André/SP - CEP 09015-530. Número para contato: 11 9 5190-5499 e e-mail: administracao@imobilicar.com.br", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "as partes por livre e espontânea vontade resolvem celebrar o presente instrumento, que será regido pelas seguintes cláusulas e condições, mutuamente outorgadas e aceitas, conforme descrito a seguir:", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "DO OBJETO DO CONTRATO", bold: true, font: "Times New Roman", size: 24 })],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 1º - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O presente contrato tem por objeto a cessão temporária de uso do de propriedade do CONTRATANTE, para ser agregado à frota da CONTRATADA, que o destinará à atividade de locação para terceiros, notadamente motorista de aplicativo de carona compartilhada, e/ou outras atividades lícitas. Este contrato não gera vínculo empregatício, societário, associação ou representação comercial entre as partes, tendo natureza estritamente civil.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 1.1 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: `Para a realização da prestação dos serviços, o CONTRATANTE disponibilizará à CONTRATADA o seguinte veículo de sua propriedade para intermediação da locação: Marca ${vehicleBrand} ${vehicleModel} - Ano/Mod. ${vehicleYear} - Placa ${vehiclePlate}${vehicleRenavam ? ` - RENAVAM ${vehicleRenavam}` : ''}${vehicleChassi ? ` - CHASSI ${vehicleChassi}` : ''}`, font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "DÉBITOS DO VEÍCULO: ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: debitosVeiculo || "(A preencher)", font: "Times New Roman", size: 24 }),
          ],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "Conforme fotos e vistoria feita pelo checkandoapp anexos a este instrumento, e vistoriado pela própria CONTRATADA, quando no ato da adesão entregue pelo CONTRATANTE", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 1.2 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O CONTRATANTE deverá fornecer à CONTRATADA os documentos de porte obrigatório para a condução do veículo, incluindo as chaves, comprovante de pagamento do IPVA, licenciamento, além de outros documentos pertinentes que a CONTRATADA vier a solicitar no início da contratação, caso o veículo esteja financiado, deverá enviar o comprovante de pagamento sempre que solicitado.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "DO REPASSE FINANCEIRO", bold: true, font: "Times New Roman", size: 24 })],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 2º - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: `A CONTRATADA efetuará ao CONTRATANTE um repasse mensal no valor de R$${formatCurrency(customDividend)} (${dividendWords.charAt(0).toUpperCase() + dividendWords.slice(1)}), dia ${paymentDate} (${numberToWords(parseInt(paymentDate)).charAt(0).toUpperCase() + numberToWords(parseInt(paymentDate)).slice(1)}) de cada mês vigente, conforme acordado previamente entre as partes para cessão do veículo a frota.`, font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [new TextRun({ text: "O repasse ocorrerá independentemente do veículo em questão estar ou não locado, salvo nas hipóteses de sinistro com perda parcial ou total, roubo sem recuperação, indisponibilidade por mais de 15 (Quinze) dias ou por falta de procura na locação do modelo do veículo por mais de 30 (trinta) dias.", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        }),
        new Paragraph({
          children: [new TextRun({ text: "O pagamento será realizado via PIX/Transferência Bancária, na conta de titularidade do CONTRATANTE", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 2.1 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: `A CONTRATADA irá pagar o valor de R$${formatCurrency(bonusValue)} (${bonusWords.charAt(0).toUpperCase() + bonusWords.slice(1)}) para o CONTRATANTE em forma de bônus por agregar o veículo na frota, até 7 (Sete) dias úteis após a assinatura do contrato`, font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 2.2. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O valor gasto pela CONTRATADA para preparação do veículo será abatido automaticamente do bônus por agregar e/ou do primeiro repasse ao CONTRATANTE, conforme tabela abaixo:", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ITENS VERIFICADOS", bold: true, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders, width: { size: 60, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "VALOR DE DESCONTO", bold: true, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders, width: { size: 40, type: WidthType.PERCENTAGE } }),
              ],
            }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TROCA DE ÓLEO + FILTRO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 250,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PNEU (UNIDADE)", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 120,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MANUTENÇÃO SIMPLES DO AR-CONDICIONADO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 200,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "REPARO COMPLETO DO AR-CONDICIONADO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 500,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FREIO E PASTILHAS", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 500,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FUNILARIA (POR PEÇA)", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 300,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "EMBREAGEM", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 600,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MOTOR E CÂMBIO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "A AVALIAR", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "BATERIA", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 300,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CHAVE", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$ 50,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
          ],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "DAS RESPONSABILIDADES", bold: true, font: "Times New Roman", size: 24 })],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 3º - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "A CONTRATADA compromete-se a gerenciar o veículo durante toda a sua permanência na sua frota, realizar a locação do mesmo a terceiros, zelar pela conservação do veículo. Despesas como manutenção corretiva e preventiva (exceto se decorrentes de vícios ocultos anteriores à entrega), seguro total do bem (Contra roubo e/ou furto, colisões e danos a terceiros) e multas enquanto o presente contrato estiver vigente.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 3.1. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: 'A CONTRATADA irá realizar o Check-in de entrada, com registros fotográficos e vistoria das condições mecânicas, estéticas e documentais do veículo no momento da entrega. O mesmo será feito pelo "APPCHECKANDO". Ao término do contrato será efetuado o mesmo procedimento no Check-out, devendo ser devolvido o veículo nas mesmas condições, salvo o desgaste natural do uso.', font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 3.2 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O CONTRATANTE compromete-se a entregar o veículo em perfeitas condições de uso, manutenção e documentação regularizada. Responsabiliza-se também pelos encargos de propriedade (IPVA, licenciamento, multas e seguro) até a data do presente contrato, bem como, livre de restrições administrativas e judiciais.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 3.3 - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "É dever do CONTRATANTE pagar as despesas anuais como IPVA e Licenciamento, tendo a opção da CONTRATADA efetuar o pagamento e descontar do repasse mensal.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "DAS MULTAS E INFRAÇÕES", bold: true, font: "Times New Roman", size: 24 })],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 4º - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Quaisquer multas e/ou infrações de trânsito e administrativas durante todo o período de agregação junto a locadora, será de inteira responsabilidade da CONTRATADA e/ou motorista locatário. A CONTRATADA se compromete a informar o órgão autuador sobre o condutor responsável, bem como fazer a transferência de pontuação, quando notificada.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 4.1. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Multas retroativas e/ou anteriores a vigência desse contrato, são de exclusiva responsabilidade do CONTRATANTE", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "DO SINISTRO E AVARIAS", bold: true, font: "Times New Roman", size: 24 })],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 5º - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Em caso de sinistro, a CONTRATADA tem o dever de informar imediatamente o ocorrido a associação e também ao CONTRATANTE.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 5.1. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Em caso de roubo/furto não recuperado ou perda total, a CONTRATADA compromete-se a tomar a frente junto a associação KONG para que o mesmo faça o pagamento ao CONTRATANTE no valor integral da tabela FIPE do veículo, na data do evento. Será descontado os valores de franquias, se aplicáveis, conforme contrato com a associação veicular. A indenização tem o prazo conforme contrato assinado com a associação, a ser contado a partir da comunicação formal do sinistro.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 5.2. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Em caso de avarias parciais, a CONTRATADA será responsável pelos reparos.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "DA MANUTENÇÃO", bold: true, font: "Times New Roman", size: 24 })],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 6º - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "As manutenções corretivas e preventivas decorrentes do uso normal, são de responsabilidade da CONTRATADA. Já as manutenções estruturais de longo prazo, são de responsabilidade do CONTRATANTE, salvo o uso decorrentes de mau uso ou avarias.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "VIGÊNCIA E RESCISÃO", bold: true, font: "Times New Roman", size: 24 })],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 7º - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O presente contrato vigorará por prazo indeterminado, podendo ser rescindido por qualquer das partes, mediante aviso prévio de 30 (Trinta) dias. No caso de descumprimento por parte do CONTRATANTE, será acarretado uma multa no valor de R$1.900,00 (Hum mil e novecentos reais)", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 7.1. - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "Caso o CONTRATANTE necessite retirar o veículo antes do prazo de 30 (Trinta) dias, será cobrado o valor de 2 (Duas) mensalidades, a taxa de remoção do veículo no valor de R$500,00 (Quinhentos reais), o seguro e o valor do bônus por agregar.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 7.2. ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O contrato será imediatamente cancelado se a CONTRATADA descobrir informações inverídicas por parte do CONTRATANTE, determinação judicial e/ou problemas mecânicos graves.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "DAS DISPOSIÇÕES FINAIS E DO FORO", bold: true, font: "Times New Roman", size: 24 })],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [
            new TextRun({ text: "CLÁUSULA 8º - ", bold: true, font: "Times New Roman", size: 24 }),
            new TextRun({ text: "O CONTRATANTE declara estar ciente e de acordo com todas as condições acima citadas. O presente contrato obriga as partes seus herdeiros e sucessores.", font: "Times New Roman", size: 24 }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "As partes elegem o foro da comarca de Santo André/SP para dirimir quaisquer dúvidas, litígios decorrentes e/ou controvérsias deste contrato.", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "E, por assim justos e contratados firmam o presente contrato em 2 (Duas) vias de igual teor.", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: `Santo André, ${currentDate}`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER,
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
                  new Paragraph({ children: [new TextRun({ text: `CPF nº ${customer.cpf}`, font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER }),
                ],
                borders: noBorders,
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "___________________________________", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "IMOBILICAR LOCAÇÃO DE VEÍCULOS", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "CNPJ nº 61.363.556/0001-37", font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER }),
                ],
                borders: noBorders,
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          })],
        }),

        new Paragraph({
          children: [new PageBreak()],
        }),

        new Paragraph({
          children: [new TextRun({ text: "TABELA MÉDIA DE VALORES DE PREPARAÇÃO", bold: true, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        new Paragraph({ text: "" }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ITEM DE REVISÃO/AJUSTE", bold: true, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders, width: { size: 60, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "VALOR DE REFERÊNCIA", bold: true, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders, width: { size: 40, type: WidthType.PERCENTAGE } }),
              ],
            }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TROCA DE ÓLEO + FILTRO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$250,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PNEU (UNIDADE)", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$120,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MANUTENÇÃO SIMPLES DO AR", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$200,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "REPARO COMPLETO DO AR", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$500,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PASTILHAS E REVISÃO DE FREIO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$500,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FUNILARIA (POR PEÇA)", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$300,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TROCA DE EMBREAGEM", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$600,00", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MOTOR - DIAGNÓSTICO E REPARO", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "A AVALIAR - ESTIMATIVA DE GARANTIA DE 6 MESES", font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "INSTALAÇÃO DE RASTREADOR", font: "Times New Roman", size: 22 })] })], borders: thinBorders }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "R$79,90 MENSAL", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER })], borders: thinBorders })] }),
          ],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: `Eu, ${customer.name?.toUpperCase() || "CONTRATANTE"}, brasileiro, inscrito no CPF sob o nº ${customer.cpf}${customer.rg ? ` e portador da cédula de identidade R.G. sob o nº ${customer.rg}` : ''}, residente e domiciliado à ${customerAddress}. Número para contato: ${customer.phone || ''} e e-mail: ${customer.email || ''}, declaro que estou ciente e de acordo com os termos aqui dispostos, especialmente quando:`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "À eventual necessidade de reparos mecânicos e estéticos do veículo, aos valores de referência acima citados para tal fim, à dedução automática dos valores acima mencionados, ao prazo de até 7 (Sete) dias úteis para o preparo do veículo e da obrigatoriedade de instalação do rastreador.", font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: `Santo André, ${currentDate}`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER,
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
                  new Paragraph({ children: [new TextRun({ text: `CPF nº ${customer.cpf}`, font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER }),
                ],
                borders: noBorders,
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "___________________________________", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "IMOBILICAR LOCAÇÃO DE VEÍCULOS", font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "CNPJ nº 61.363.556/0001-37", font: "Times New Roman", size: 20 })], alignment: AlignmentType.CENTER }),
                ],
                borders: noBorders,
                width: { size: 50, type: WidthType.PERCENTAGE },
              }),
            ],
          })],
        }),

        new Paragraph({
          children: [new PageBreak()],
        }),

        new Paragraph({
          children: [new TextRun({ text: "PROCURAÇÃO PARTICULAR", bold: true, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: `Pelo presente instrumento particular de procuração, ${customer.name?.toUpperCase() || "CONTRATANTE"}, brasileiro, inscrito no CPF sob o nº ${customer.cpf}${customer.rg ? ` e portador da cédula de identidade R.G. sob o nº ${customer.rg}` : ''}, residente e domiciliado à ${customerAddress}. Número para contato: ${customer.phone || ''} e e-mail: ${customer.email || ''}, nomeia e constitui seu bastante procurador WALLACE DA SILVA NASCIMENTO, brasileiro, inscrito no CPF sob o nº 373.988.978-04 e portador da cédula de identidade R.G. sob o nº 48.294.418-3, residente e domiciliado à Rua Antônio Cardoso Franco, nº237 - Casa Branca - Santo André/SP - CEP 09015-530, e, a quem concede plenos poderes a fim de que possa defender os direitos e interesses do(a) OUTORGANTE junto ao DETRAN, podendo solicitar liberação do pátio e do substabelecimento, solicitar 2ª via de CRLV, autorizar e acompanhar vistorias, efetuar pagamentos, formular requerimentos, interpor recursos, reclamar, desistir, solicitar cópias de processos, locar, além de ter acesso a documentos de qualquer natureza, nos termos da Portaria Detran nº 1680, Cap. II, Art. 8, Parágrafo VI, referente ao VEÍCULO:`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({ children: [new TextRun({ text: "MARCA/MODELO: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: `${vehicleBrand.toUpperCase()} ${vehicleModel.toUpperCase()}`, font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: "ANO/MODELO: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: String(vehicleYear), font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: "PLACA: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: vehiclePlate || "—", font: "Times New Roman", size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: "CHASSI: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: vehicleChassi || "—", font: "Times New Roman", size: 24 }), new TextRun({ text: " RENAVAM: ", bold: true, font: "Times New Roman", size: 24 }), new TextRun({ text: vehicleRenavam || "—", font: "Times New Roman", size: 24 })] }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: "Obs: Procuração válida por 1 (um) ano a partir da data do reconhecimento da declaração.", font: "Times New Roman", size: 24 })],
        }),

        new Paragraph({ text: "" }),

        new Paragraph({
          children: [new TextRun({ text: `Santo André, ${currentDate}`, font: "Times New Roman", size: 24 })],
          alignment: AlignmentType.CENTER,
        }),

        new Paragraph({ text: "" }),

        new Paragraph({ children: [new TextRun({ text: "________________________________________________________________", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `   ${customer.name?.toUpperCase() || "CONTRATANTE"} `, font: "Times New Roman", size: 22 })], alignment: AlignmentType.CENTER }),
      ],
    }],
  });

  return await Packer.toBuffer(investorContractDoc);
}
