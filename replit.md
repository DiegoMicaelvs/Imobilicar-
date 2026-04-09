# Imobilicar - Plataforma de Locadora de Veículos

## Overview
Imobilicar is a web application for a vehicle rental company designed to streamline car rentals, expand the fleet through an investor program, and offer rental solutions for credit-negative customers. The platform aims to provide a user-friendly experience, serve a broad customer base, and grow its vehicle fleet.

**Key Capabilities:**
- **Vehicle Rental System**: Comprehensive browsing, filtering, searching, and reservation of vehicles.
- **Investor Program**: Allows vehicle owners to register cars for rental, with administrative approval and profit sharing.
- **Credit-Negative Customer Support**: Simplifies the rental process for customers without traditional credit checks.
- **CRM System**: Manages leads, customers, investors, and vehicles, including event tracking and rental history.
- **Admin Panel**: Centralized management for all platform entities, approvals, and statistics. CRM uses vertical sidebar navigation with two groups: Operações (Leads, Clientes, Frota, Veículos de Troca, Financiamentos, Aluguéis, Investidores, Eventos) and Configurações (Contratos, Usuários, Logs, Solicitações). Sidebar is collapsible and hidden on mobile (horizontal tabs shown instead).
- **Financing System (Rent-to-Own)**: Manages company-owned vehicle financing with interactive calculators and amortization.
- **Vehicle Inspection System**: Tracks inspection photos with timestamps and organization, supporting various inspection types.
- **Business Intelligence**: Provides metrics for average rental duration, unavailable vehicles, and sales performance.

## User Preferences
- I prefer simple language.
- I like functional programming.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder Z.
- Do not make changes to the file Y.

## System Architecture

### UI/UX Decisions
- **Design Guidelines**: Clean, modern aesthetic inspired by Turo and Airbnb, with a dark mode first approach.
- **Color Palette**: Dark Navy, Cyan, White, Light Gray.
- **Typography**: Inter (body) and Plus Jakarta Sans (headings).
- **Language**: Primary language is Portuguese (BR).
- **Responsive Design**: Mobile-first approach using Tailwind CSS.
- **PWA/Offline**: Disabled due to cache conflicts. Service Worker cleaned to prevent update issues.

### Technical Implementation
- **Frontend**: React with Vite, Wouter for routing, TanStack Query v5 for state management, React Hook Form + Zod for forms, Shadcn + Tailwind CSS for UI.
- **Backend**: Express.js framework.
- **Database**: PostgreSQL (Neon) with Drizzle ORM.
- **Storage**: Custom DatabaseStorage.
- **Validation**: Shared Zod schemas for both frontend and backend.
- **CRM Architecture**: Modular structure under `client/src/pages/crm/` with:
  - `context/CrmDataProvider.tsx`: Centralized data management with shared queries
  - `utils/`: Shared utilities (formatters, FIPE lookup, file upload)
  - `components/shared/`: Reusable components (SignatureCanvas, ContractStep, PhotoGallery, Checklist)
  - `domains/`: 11 domain modules (leads, customers, investors, vehicles, rentals, financing, contracts, plans, dashboard)
  - **Performance**: Successfully reduced main CRM file from 18,000+ lines to 8,299 lines (54% reduction), eliminating Babel deoptimization warnings

### Feature Specifications
- **Authentication**: Separate systems for Admin (Email + Password) and Investor (CPF + Password). **IMPORTANT**: User login access is exclusively for active investors with vehicles registered in the system - general user registration is not permitted. Only investors with at least one active vehicle (isInvestorVehicle = true, available = true) can create passwords and access the investor portal. Both systems use protected routes and persistent login.
- **Bonificação System**: Bonus balance system for customer discounts, managed by administrators.
- **Vehicle Management**: CRUD operations, availability toggling, image uploads with compression, bulk creation, FIPE value integration, and conversion of trade-in vehicles to fleet. **Vehicle Categories** (standardized across entire system): Econômico, Hatch, Sedan, SUV, Pickup, Van, Minivan, Utilitário, Esportivo, Luxo. **Auto-Financing Availability**: All vehicles added to the fleet (manually or investor) are automatically available for financing by default. Admins can manually toggle this setting using the "Disponível p/ Financiamento" button. Vehicles in active financings are automatically excluded from new financing options.
- **Rental Management**: Create, view, update statuses, auto-calculate totals, process investor payouts, generate PDF contracts, approval system with image checklists. Support for guarantor (avalista) in both normal rentals and financing, with complete guarantor information including personal data, CNH, and full address.
- **Investor Program**: Unified investor and vehicle registration with 6-step wizard (Cadastro, Veículo, Dividendos, Fotos, Contrato, Criar Conta), admin approval, automated dividend calculation based on investment quotas, mandatory inspection photos. **Automatic Account Creation**: When completing the investment wizard, an investor account is automatically created with CPF as login and default password "Investicar@2025" - visible in "Usuários" section.
- **Bonus Payment System**: One-time bonus payments for investors with specific date (DD/MM/AAAA format) and value. Fields: `bonusDate` (text) and `bonusValue` (decimal). Replaced the old recurring monthly `bonusPaymentDay` system.
- **CRM System**: Manages customers, investors, and vehicles with personal info, statistics, event tracking, rating systems, and automated contract generation. Includes RG field in forms and views. Administrators can edit customer CPF with automatic validation to prevent duplicates.
- **Admin Panel**: Password-protected access with dashboards, CRUD capabilities, request/rental management, automated contract generation, visual notifications, and smart CRM redirection.
- **Vendor Workspace**: Dedicated interface for sales staff with:
  - **Dashboard Tab**: Sales goal tracking (daily/weekly/monthly/yearly), progress visualization, revenue metrics, and monthly achievements counter
  - **Leads Tab**: Complete lead management with filters, search, and status tracking (reuses CrmDataProvider and LeadManagement component)
  - **Fleet Tab**: Full vehicle catalog with availability status, filters, and detailed information (reuses VehicleManagement component)
  - **New Sale Wizards**: Integrated rental and financing wizards via dropdown menu with full accessibility (DialogTitle/DialogDescription)
  - Seamless integration with existing CRM infrastructure for data consistency
- **Investment Quotas**: Administrative system to define fixed monthly dividend amounts based on vehicle FIPE value ranges and categories.
- **Public Pages**: Home, vehicle catalog with filtering, detailed vehicle view, reservation form, investor page, and customer portal.
- **Security**: All customer API endpoints sanitize responses by removing password hashes. Protected routes verify authentication.
- **Sales Management**: Flexible sales goals with customizable periods (daily, weekly, monthly, yearly) per salesperson, tracking of total sales revenue, and permanent history of total sales and goals achieved.
- **Counter-Proposal System**: Comprehensive financing proposal workflow where vendors can submit counter-proposals from FinancingWizard (step 2), admin reviews proposals in Solicitações section with side-by-side value comparison and pending badge notifications, and approved proposals trigger wizard resume flow with auto-detection and field hydration. Server-side seller scoping (`/api/financing-proposals/seller/:sellerId`) prevents data leakage between vendors. Calculations preserve exact approved values including trade-in offsets for validation consistency.
- **Trade-In Vehicle System**: In financing workflow (step 2), administrators can specify if customer has a vehicle for trade-in. System allows selecting vehicle from existing fleet, manually defining accepted value, and automatically deducts trade-in value from down payment calculation. Trade-in vehicles are saved to `tradeInVehicles` table with full details (brand, model, year, category, FIPE value, accepted value) and can be viewed in dedicated "Veículos de Troca" section in Admin CRM.
- **Bulk Import System**: Script-based bulk data import from Excel spreadsheets for investors and vehicles. Located at `scripts/import-investors-vehicles.ts`. Successfully imported 42 investors and 108 vehicles from production spreadsheet (December 2024). Script handles CPF normalization, phone formatting, email generation for missing emails, duplicate detection, and automatic investor-vehicle association. FIPE values set to 0 for manual admin update. Default values used for vehicle category, transmission, and fuel type requiring admin review. **Dividend Aggregation**: Each vehicle's "VALOR ACORDADO" from the spreadsheet is stored in `vehicles.customDividend`. The investor portal automatically aggregates all vehicle dividends to display the total monthly dividend for multi-vehicle investors (e.g., Cesar Peres with 6 vehicles receives R$ 10.200,00 total). A migration script (`scripts/update-dividends.ts`) is available to backfill dividend values from the spreadsheet into existing vehicle records.

## External Dependencies
- **PostgreSQL (Neon)**: Relational database service.
- **API FIPE v2**: Used for automatic consultation of vehicle values during investor vehicle registration, admin vehicle additions, and bulk vehicle creation.