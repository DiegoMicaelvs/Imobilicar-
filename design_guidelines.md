# Imobilicar - Design Guidelines

## Identidade Visual

### Nome da Empresa
**Imobilicar** - Plataforma de Locadora de Veículos

### Design Approach: Reference-Based (Turo + Airbnb Hybrid)

**Primary Inspiration**: Turo (peer-to-peer car rental platform) combined with Airbnb's trust-building elements
**Rationale**: Car rental marketplace requiring visual appeal, trust signals, and investor dashboard functionality

### Key Design Principles:
- **Visual Trust**: Large, high-quality vehicle imagery to build confidence
- **Simplified Complexity**: Clean interfaces for the "sem burocracia" promise
- **Dual Experience**: Distinct but cohesive flows for renters vs. investors
- **Brazilian Context**: Warm, approachable design suited to Brazilian market expectations
- **Dark First**: Fundo escuro (#12112C) com destaques em cyan (#00FFFF)

## Paleta de Cores da Imobilicar

### Cores Principais
- **Fundo Principal**: `#12112C` (Azul Marinho Escuro/Quase Preto)
  - HSL: `242 47% 13%`
  - Uso: Fundo do site, elementos de destaque em dark mode
  
- **Cyan/Primary**: `#00FFFF` (Azul Claro/Ciano)
  - HSL: `180 100% 50%`
  - Uso: Botões primários, ícones, links, destaques interativos, CTAs
  
- **Branco**: `#FFFFFF`
  - HSL: `0 0% 100%`
  - Uso: Textos principais, elementos de contraste
  
- **Cinza Claro**: `#CCCCCC`
  - HSL: `0 0% 80%`
  - Uso: Textos secundários, bordas, elementos de suporte

### Tema Dark (Padrão)
- Background: `#12112C` (242 47% 13%)
- Primary (botões/links): `#00FFFF` (180 100% 50%)
- Foreground (texto): `#FFFFFF` (0 0% 100%)
- Muted Foreground: `#CCCCCC` (0 0% 80%)
- Cards: Levemente mais claro que background (242 45% 16%)
- Borders: `242 40% 25%`

### Tema Light
- Background: Branco `#FFFFFF`
- Primary: Cyan `#00FFFF` (180 100% 50%)
- Foreground: `#12112C` (242 47% 13%)
- Muted Foreground: `#666666` (0 0% 60%)
- Cards: Off-white (0 0% 98%)

### Accent Colors (Complementares)
- Success Green: 142 76% 36% (Investor earnings, confirmations)
- Warning Orange: 25 95% 53% (Important notices, pending actions)
- Destructive Red: 0 72% 50% (Errors, delete actions)

## Tipografia

### Fontes
- **Corpo**: Inter (sans-serif)
  - Pesos: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
  - Uso: Textos gerais, parágrafos, labels
  
- **Display/Headings**: Plus Jakarta Sans
  - Pesos: 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
  - Uso: Títulos, headings, hero text

### Escala de Tamanhos
- **Hero H1**: text-5xl md:text-6xl lg:text-7xl font-bold (56px - 72px)
- **H2 Section**: text-3xl md:text-4xl font-semibold (32px - 40px)
- **H3 Card Title**: text-xl md:text-2xl font-semibold (20px - 32px)
- **Body Text**: text-base leading-relaxed (16px)
- **Small/Caption**: text-sm (14px)

## Layout System

### Spacing Primitives
Consistent use of Tailwind units: **2, 4, 6, 8, 12, 16, 20, 24**

### Container Strategy
- Full-width sections: w-full with inner max-w-7xl mx-auto px-4 lg:px-8
- Content sections: max-w-6xl mx-auto
- Dashboard content: max-w-screen-2xl mx-auto

### Grid Patterns
- Vehicle catalog: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Dashboard stats: grid-cols-1 md:grid-cols-3 gap-4
- Feature sections: grid-cols-1 lg:grid-cols-2 gap-12

## Componentes

### Navigation
- Sticky header com logo Imobilicar à esquerda
- Nav principal centro, theme toggle e CTA direita
- Mobile: Hamburger menu com slide-in drawer
- Dual CTAs: "Alugar Carro" (primary cyan) + "Seja Investidor" (outline)

### Buttons
- **Primary**: Background cyan (#00FFFF), text dark (#12112C)
- **Outline**: Border cyan, text cyan, background transparent/backdrop-blur
- **Ghost**: No background, text foreground
- Border radius: 0.5rem (8px)
- Heights: Large (h-12), Default (h-10), Small (h-8), Icon (h-9 w-9)

### Cards
- Background: Card color (levemente mais claro que fundo)
- Border radius: 0.5rem (8px)
- Padding: 1.5rem (24px)
- Hover: Elevação sutil com `hover-elevate`

### Vehicle Cards
- Large vehicle image (aspect-ratio-4/3)
- Car name and category overlay on image
- Price per day prominent (text-2xl font-bold) em cyan
- Quick specs: transmission, fuel, seats (icons + text)
- Availability indicator badge
- Hover: subtle lift shadow (hover:shadow-xl transition)

### Badges
- Background: Primary/20 (20% opacity) com backdrop-blur
- Border: Primary/30 (30% opacity)
- Text: Primary cyan color
- Border radius: 0.375rem (6px)

### Forms (Aluguel/Cadastro)
- Large, friendly input fields (h-12)
- Clear labels above inputs
- Date range picker for rental periods
- Step indicator for multi-step flows
- Reduced friction for "negativados" flow (fewer required fields)

### Trust Signals
- Customer testimonial cards with photos
- Vehicle verification badges
- Insurance coverage highlights
- **"Sem Consulta ao SPC/Serasa"** prominent badge em cyan

## Images Strategy

### Hero Section
- Full-width hero (h-[600px] lg:h-[700px]) with stunning car image
- **Dark gradient overlay** (from-black/70 via-black/50 to-transparent)
- Text em branco sobre gradient dark
- CTAs com backdrop-blur-md, primary cyan e outline branco

### Vehicle Catalog
- Professional car photography (side profile, 3/4 angle preferred)
- Consistent lighting and background treatment
- Minimum 1200x900px resolution
- Aspect ratio: 4/3

### Investor Section
- Happy investor with their vehicle
- Dashboard screenshots showing earnings em cyan
- Car handoff/partnership imagery

## Interações

### Hover States
- Buttons: Elevação com `hover-elevate`
- Cards: Transformação sutil (scale-[1.02]) + shadow
- Links: Color shift para cyan mais claro

### Active States
- Buttons: Elevação maior com `active-elevate-2`
- Interactive elements: Feedback visual imediato

### Transitions
- Duration: 200ms - 300ms
- Easing: ease-in-out
- Avoid: Complex scroll animations, excessive parallax

## Ícones
- **Biblioteca**: Lucide React
- **Tamanho padrão**: h-6 w-6 (24px)
- **Cor**: Primary cyan (#00FFFF) para ícones de destaque
- **Stroke width**: 2

## Espaçamento e Seções

### Sections Padding
- Vertical: py-20 (80px)
- Horizontal: px-4 lg:px-8
- Hero height: 600px - 700px

### Landing Page Sections (5-7 comprehensive sections)
1. **Hero** com CTAs duplos e badge "Sem Consulta ao SPC/Serasa"
2. **Features** grid 3 colunas com ícones
3. **Como Funciona** (3-step visual guide)
4. **Programa de Investidores** com benefícios e imagem
5. **Aluguel para Negativados** seção explicativa
6. **Testimonials** social proof
7. **Footer** com links e informações

## Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
- Large Desktop: > 1280px

## Acessibilidade

### Contraste
- Text principal sobre dark: Branco (#FFFFFF) - ótimo contraste
- Cyan sobre dark: Excelente contraste
- Text principal sobre light: Dark (#12112C) - ótimo contraste

### Focus States
- Ring color: Cyan (#00FFFF)
- Ring width: 2px
- Offset: 2px

## Dark Mode First
A aplicação **prioriza dark mode** como experiência padrão, refletindo a identidade visual da marca com o fundo escuro (#12112C) e destaques em cyan (#00FFFF). Light mode está disponível mas dark é a experiência primária.

## Princípios de Design

1. **Simplicidade**: Interface limpa, focada no essencial
2. **Contraste Forte**: Cyan (#00FFFF) sobre dark (#12112C) cria identidade única
3. **Hierarquia Visual**: Tipografia e cor definem importância
4. **Consistência**: Mesmo padrão em toda aplicação
5. **Performance**: Transições suaves, carregamento rápido
6. **Acessibilidade**: Alto contraste, navegação por teclado
7. **Confiança**: Elementos visuais que transmitem profissionalismo

## Design Delivery Notes
- Maintain dark mode consistency across all form inputs and interactive elements
- Use Portuguese (BR) for all labels, CTAs, and content
- Prioritize mobile experience for vehicle browsing
- Desktop-optimized for investor dashboards with data visualization
- Primary color cyan (#00FFFF) must be used for all CTAs and interactive elements
- Background dark (#12112C) creates premium, tech-forward aesthetic
