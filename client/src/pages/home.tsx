import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import {
  Car,
  Shield,
  Clock,
  CheckCircle,
  Star,
  MapPin,
  ChevronDown,
  Users,
  TrendingUp,
  ArrowRight,
  Quote,
} from "lucide-react";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import logoImobilicar from "@assets/logo imobile_1759944435911.png";
import heroImage from "@assets/Novo-imagem-inicio.jpg";
import negativadosImage from "@assets/Imobilicar_1760031488481.png";
import rentToOwnImage from "@assets/rent_to_own_car.jpg";

// --- Custom Hooks ---

function useScrollReveal() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observers = useRef<Map<string, IntersectionObserver>>(new Map());

  const registerSection = (id: string, element: HTMLElement | null) => {
    if (!element || observers.current.has(id)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set(prev).add(id));
          observer.disconnect();
          observers.current.delete(id);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    observer.observe(element);
    observers.current.set(id, observer);
  };

  useEffect(() => {
    return () => observers.current.forEach((obs) => obs.disconnect());
  }, []);

  return { visibleSections, registerSection };
}

// --- Helper Components ---

function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

// --- Constants & Data ---

const HOME_DATA = {
  features: [
    { icon: Car, title: "Frota Diversificada", description: "Carros de todas as categorias para suas necessidades" },
    { icon: Shield, title: "Seguro Completo", description: "Proteção total incluída em todos os aluguéis" },
    { icon: Clock, title: "Processo Rápido", description: "Alugue em minutos, sem complicação" },
  ],
  testimonials: [
    { name: "Maria Silva", content: "Aluguei um carro por uma semana e o atendimento foi excelente. O veículo estava impecável e o processo foi super simples!", rating: 5 },
    { name: "João Santos", content: "Processo super fácil, consegui alugar mesmo sendo negativado. Recomendo!", rating: 5 },
    { name: "Carlos Oliveira", content: "Consegui meu carro próprio através da locação com opção de compra. Parcelas que cabem no bolso e sem burocracia!", rating: 5 },
  ],
  steps: [
    { number: "1", title: "Escolha o Veículo", description: "Navegue por nossa frota e selecione o carro ideal" },
    { number: "2", title: "Preencha os Dados", description: "Processo simples e rápido, sem burocracia" },
    { number: "3", title: "Agende uma visita", description: "Entre em contato e tire todas as suas dúvidas" },
  ],
  stats: [
    { value: 100, suffix: "+", label: "Veículos na Frota", icon: Car },
    { value: 500, suffix: "+", label: "Clientes Satisfeitos", icon: Users },
    { value: 40, suffix: "+", label: "Investidores Parceiros", icon: TrendingUp },
  ],
  rentToOwnFeatures: [
    "Entradas a partir de R$ 6.000,00",
    "Parcelas de até 48x",
    "Aprovação direto com a loja",
    "Sem burocracia",
    "Sem comprovar renda",
    "Carros com procedência",
  ],
  negativadosFeatures: [
    "Sem consulta ao SPC/Serasa",
    "Sem consulta ao score",
    "Aprovação imediata",
    "Documentação mínima necessária",
    "Processo 100% descomplicado",
  ],
};

// --- Main Page Component ---

export default function Home() {
  const { visibleSections, registerSection } = useScrollReveal();

  return (
    <div className="flex flex-col">
      <HeroSection />

      <StatsSection
        isVisible={visibleSections.has("stats")}
        registerRef={(el) => registerSection("stats", el)}
      />

      <FeaturesSection
        isVisible={visibleSections.has("features")}
        registerRef={(el) => registerSection("features", el)}
      />

      <HowItWorksSection
        isVisible={visibleSections.has("howItWorks")}
        registerRef={(el) => registerSection("howItWorks", el)}
      />

      <RentToOwnSection
        isVisible={visibleSections.has("rentToOwn")}
        registerRef={(el) => registerSection("rentToOwn", el)}
      />

      <NegativadosSection
        isVisible={visibleSections.has("negativados")}
        registerRef={(el) => registerSection("negativados", el)}
      />

      <TestimonialsSection
        isVisible={visibleSections.has("testimonials")}
        registerRef={(el) => registerSection("testimonials", el)}
      />

      <CTASection
        isVisible={visibleSections.has("cta")}
        registerRef={(el) => registerSection("cta", el)}
      />

      <FooterSection
        isVisible={visibleSections.has("footer")}
        registerRef={(el) => registerSection("footer", el)}
      />

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5511947348989"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 animate-pulse-glow"
        aria-label="Contato via WhatsApp"
      >
        <FaWhatsapp className="h-7 w-7 sm:h-8 sm:w-8" />
      </a>
    </div>
  );
}

// --- Sub-sections Components ---

function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      <div className="absolute inset-0 hero-gradient-overlay z-10" />
      <img
        src={heroImage}
        alt="Hero"
        className="absolute inset-0 w-full h-full object-cover object-[center_65%] animate-fade-in opacity-50"
        style={{ animationDuration: '1.5s' }}
      />
      <div className="relative z-20 min-h-screen flex items-start justify-center w-full pt-8 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl flex flex-col items-center text-center mx-auto">
            <img
              src={logoImobilicar}
              alt="Logo"
              className="h-24 sm:h-32 md:h-40 lg:h-48 w-auto mb-6 drop-shadow-2xl animate-fade-in-down"
            />
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-primary/40 px-5 py-1.5 text-xs sm:text-sm font-black backdrop-blur-md bg-primary/5 text-primary animate-fade-in-down animation-delay-200 shadow-[0_0_20px_rgba(255,204,0,0.1)] group/badge">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#ffcc00]" />
              <span className="tracking-[0.2em] uppercase text-[10px] sm:text-[12px] font-display">Sem Consulta ao SPC/Serasa</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 font-display leading-[1.1] tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-fade-in-up animation-delay-300">
              Aluguel de Carros <br className="hidden sm:block" />
              <span className="text-gradient-gold italic inline-block pr-2 drop-shadow-[0_0_15px_rgba(255,204,0,0.4)]">Sem Burocracia</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 px-4 animate-fade-in-up animation-delay-400">
              Oportunidade para negativados. Processo rápido e descomplicado. Valorizamos pessoas, não histórico de Crédito.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center w-full px-4 animate-fade-in-up animation-delay-500">
              <Button asChild size="lg" className="w-full sm:w-auto text-lg h-14 px-8 shadow-[0_10px_20px_-10px_rgba(255,204,0,0.5)] bg-gradient-to-r from-primary via-[#f8e08e] to-primary bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 group">
                <Link href="/veiculos?mode=financing">
                  <span className="flex items-center gap-2.5">
                    Alugar Agora
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-white/5 border-white/20 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/40 shadow-xl transition-all duration-300 group">
                <Link href="/investidor">
                  <span className="flex items-center gap-2.5">
                    Seja Investidor
                    <TrendingUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-bounce-subtle">
        <ChevronDown className="h-8 w-8 text-white/60" />
      </div>
    </section>
  );
}

function StatsSection({ isVisible, registerRef }: { isVisible: boolean; registerRef: (el: HTMLElement | null) => void }) {
  return (
    <section ref={registerRef} className="py-10 sm:py-16 relative overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
          {HOME_DATA.stats.map((stat, idx) => (
            <div
              key={idx}
              className={`relative group ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="p-6 sm:p-8 rounded-2xl border-2 border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 group-hover:-translate-y-1 relative overflow-hidden">
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 p-3.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500 shadow-inner">
                    <stat.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-foreground">
                      {isVisible ? <AnimatedCounter target={stat.value} suffix={stat.suffix} /> : "0"}
                    </h3>
                    <div className="h-1 w-10 bg-primary/30 mx-auto rounded-full group-hover:w-16 group-hover:bg-primary transition-all duration-500" />
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-3 group-hover:text-foreground transition-colors">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ isVisible, registerRef }: { isVisible: boolean; registerRef: (el: HTMLElement | null) => void }) {
  return (
    <section ref={registerRef} className="py-16 lg:py-24 bg-background relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffcc00_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.03] -z-10" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <SectionHeader
          isVisible={isVisible}
          badge="Vantagens"
          title="Por Que Escolher a Imobilicar?"
          description="Oferecemos a melhor experiência em aluguel de veículos com tecnologia e confiança."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {HOME_DATA.features.map((feature, idx) => (
            <Card key={idx} className={`relative border-2 border-border/40 group card-shine hover:border-primary/50 transition-all duration-500 overflow-hidden bg-card/30 backdrop-blur-sm shadow-xl shadow-black/5 ${isVisible ? "animate-slide-in-scale" : "opacity-0"}`} style={{ animationDelay: `${200 + idx * 150}ms` }}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full group-hover:bg-primary/20 transition-colors" />
              <CardContent className="p-8 text-center relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-primary/10">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-black mb-3 group-hover:text-primary transition-colors tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection({ isVisible, registerRef }: { isVisible: boolean; registerRef: (el: HTMLElement | null) => void }) {
  return (
    <section ref={registerRef} className="py-24 lg:py-32 relative overflow-hidden bg-[#0a0a0a]">
      {/* Dark Premium Background with Gold Accents */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle Gold Glows */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-50" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2 opacity-30" />

        {/* Animated Grid Texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className={`relative p-12 sm:p-20 rounded-[3rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
          {/* Internal Decorative Grain */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

          <div className="relative z-10">
            <SectionHeader
              isVisible={isVisible}
              title={<span className="text-white">Como Funciona</span>}
              description={<span className="text-white/60">Alugue seu carro em 3 passos simples com nossa plataforma otimizada</span>}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 lg:gap-16 relative mt-16">
              {HOME_DATA.steps.map((step, idx) => (
                <div key={idx} className={`relative group flex flex-col items-center ${isVisible ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${300 + idx * 200}ms` }}>
                  <div className="relative mb-8">
                    {/* Step number - Large, bold and glowing */}
                    <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-4xl font-black relative z-10 shadow-[0_0_30px_-5px_rgba(255,204,0,0.4)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      {step.number}
                    </div>
                    {/* Background glow for the number */}
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 -z-10 group-hover:scale-110 transition-transform duration-500" />
                  </div>

                  <h3 className="text-xl lg:text-2xl font-black mb-4 text-white tracking-tight text-center group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-white/60 text-center text-base leading-relaxed font-medium max-w-[240px]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RentToOwnSection({ isVisible, registerRef }: { isVisible: boolean; registerRef: (el: HTMLElement | null) => void }) {
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "center center"]
  });

  const y = useTransform(scrollYProgress, [0, 0.5], [60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);

  return (
    <section ref={(el) => {
      registerRef(el);
      (scrollRef as any).current = el;
    }} className="py-24 lg:py-32 relative overflow-hidden bg-background">
      {/* Decorative background */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ImageContainer isVisible={isVisible} src={rentToOwnImage} alt="Opção de compra" animationDir="left" />
          <div className={`flex flex-col space-y-8 ${isVisible ? "" : "opacity-0"}`}>
            <motion.div style={{ y, opacity, scale }} className="origin-left">
              <FeatureContent
                title={<>Locação com Opção de <span className="text-gradient-gold">Compra</span></>}
                description="Nossa modalidade exclusiva permite que você saia com o carro hoje e se torne o proprietário no final do contrato. Sem bancos, sem complicação."
                features={HOME_DATA.rentToOwnFeatures}
                btnText="Conhecer Condições"
                href="/veiculos?mode=financing"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NegativadosSection({ isVisible, registerRef }: { isVisible: boolean; registerRef: (el: HTMLElement | null) => void }) {
  return (
    <section ref={registerRef} className="py-24 lg:py-32 bg-muted/40 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute bottom-1/2 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ImageContainer isVisible={isVisible} src={negativadosImage} alt="Negativados" animationDir="left" className="lg:order-1 shadow-[#ffcc00]/10" delay={200} />
          <div className={`lg:order-2 space-y-8 ${isVisible ? "animate-fade-in-right" : "opacity-0"}`}>
            <FeatureContent
              title={<>Aluguel Para Negativados <br /><span className="text-gradient-gold">Sem Burocracia</span></>}
              description="Sabemos que imprevistos acontecem. Por isso, não fazemos consulta de crédito. Você só precisa de documentos básicos e está pronto para alugar."
              features={HOME_DATA.negativadosFeatures}
              btnText="Ver Veículos Disponíveis"
              href="/veiculos"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ isVisible, registerRef }: { isVisible: boolean; registerRef: (el: HTMLElement | null) => void }) {
  return (
    <section ref={registerRef} className="py-24 lg:py-32 relative overflow-hidden bg-muted/30">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
        <SectionHeader
          isVisible={isVisible}
          badge="Depoimentos"
          title={<>O Que Dizem Nossos <span className="text-gradient-gold">Clientes</span></>}
          description="A confiança de quem já transformou sua mobilidade conosco."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {HOME_DATA.testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 group relative overflow-hidden flex flex-col shadow-lg hover:shadow-primary/5">
                {/* Decorative Quote Icon */}
                <div className="absolute top-6 right-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                  <Quote className="h-12 w-12 rotate-12" />
                </div>

                <CardContent className="p-8 flex flex-col h-full relative z-10">
                  <div className="flex gap-0.5 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>

                  <p className="text-foreground/80 text-lg leading-relaxed mb-8 italic flex-grow">
                    "{testimonial.content}"
                  </p>

                  <div className="flex items-center gap-4 mt-auto pt-6 border-t border-border/50">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <span className="text-primary font-black text-sm">
                        {testimonial.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Cliente Satisfeito
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


function CTASection({ isVisible, registerRef }: { isVisible: boolean; registerRef: (el: HTMLElement | null) => void }) {
  return (
    <section ref={registerRef} className="py-24 lg:py-32 relative overflow-hidden bg-[#0a0a0a]">
      {/* Dark Premium Background with Gold Accents */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle Gold Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-30" />

        {/* Animated Grid Texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className={`relative p-12 sm:p-20 rounded-[3rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
          {/* Internal Decorative Grain */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-black uppercase tracking-[0.2em] mb-8">
              Oportunidade Única
            </div>

            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-8 font-display tracking-tight text-white leading-[1.1]">
              Pronto Para <span className="text-primary italic">Começar?</span>
            </h2>

            <p className="text-lg sm:text-xl lg:text-2xl mb-12 text-white/60 max-w-2xl mx-auto font-medium leading-relaxed">
              Alugue seu carro hoje ou transforme seu veículo em uma fonte de renda com a plataforma que redefine a mobilidade.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_30px_-10px_rgba(255,204,0,0.5)] font-bold h-14 sm:h-16 px-10 text-lg hover:scale-105 transition-all duration-300 group rounded-2xl">
                <Link href="/veiculos?mode=financing">
                  <span className="flex items-center gap-3">
                    Alugar Veículo
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/5 shadow-xl font-bold h-14 sm:h-16 px-10 text-lg hover:scale-105 transition-all duration-300 group rounded-2xl">
                <Link href="/investidor">
                  <span className="flex items-center gap-3">
                    Ser Investidor
                    <TrendingUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterSection({ isVisible, registerRef }: { isVisible: boolean; registerRef: (el: HTMLElement | null) => void }) {
  return (
    <footer ref={registerRef} className="py-20 bg-muted/30 border-t-2 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <FooterCard isVisible={isVisible} icon={Shield} title="Jurídico" content="CNPJ: 61.363.556/0001-37" delay={0} />
          <FooterCard isVisible={isVisible} icon={MapPin} title="Localização" delay={200}
            content={<a href="https://google.com/search?q=..." target="_blank" className="hover:text-primary transition-colors">R. Antônio Cardoso Franco, 237<br />Santo André - SP</a>}
          />
          <FooterCard isVisible={isVisible} icon={Star} title="Redes Sociais" delay={400}
            content={
              <div className="flex gap-4 justify-center">
                <SocialLink icon={FaInstagram} href="https://instagram.com/imobilicar" color="bg-gradient-to-br from-[#E4405F] to-[#833AB4]" />
                <SocialLink icon={FaWhatsapp} href="https://wa.me/5511947348989" color="bg-[#25D366]" />
              </div>
            }
          />
        </div>
        <div className="pt-8 border-t-2 text-center text-muted-foreground">&copy; {new Date().getFullYear()} Imobilicar. Todos os direitos reservados.</div>
      </div>
    </footer>
  );
}

// --- Shared Internal UI Components ---

function SectionHeader({ isVisible, badge, title, description }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-12 sm:mb-16"
    >
      {badge && (
        <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-4 border border-primary/20">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-5xl font-black mb-4 font-display tracking-tight leading-tight">{title}</h2>
      <div className="h-1 w-12 bg-primary/40 mx-auto mb-6 rounded-full" />
      <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">{description}</p>
    </motion.div>
  );
}


function ImageContainer({ isVisible, src, alt, className = "", delay = 0 }: any) {
  return (
    <div className={`relative h-[350px] sm:h-[550px] rounded-2xl overflow-hidden shadow-2xl group ${isVisible ? "animate-fade-in-left" : "opacity-0"} ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <img src={src} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}

function FeatureContent({ badge, title, description, features, btnText, href, badgeColor = "bg-chart-3 text-white border-chart-3/30", scrollProgress }: any) {
  return (
    <>
      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={`mb-6 inline-flex items-center rounded-full border-2 px-4 py-2 text-sm font-bold shadow-lg ${badgeColor}`}
        >
          {badge}
        </motion.div>
      )}

      <h2 className="text-3xl sm:text-5xl font-bold mb-6 font-display leading-tight">{title}</h2>

      <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{description}</p>

      <div className="space-y-4 mb-10">
        {features.map((item: string, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-4 group/item"
          >
            <CheckCircle className="h-5 w-5 text-chart-3" />
            <span className="text-base sm:text-lg font-medium">{item}</span>
          </motion.div>
        ))}
      </div>

      <Button asChild size="lg" className="w-full sm:w-auto text-lg h-14 px-10 shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300 group">
        <Link href={href}>
          <span className="flex items-center gap-2.5">
            {btnText}
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>
      </Button>
    </>
  );
}


function FooterCard({ isVisible, icon: Icon, title, content, delay }: any) {
  return (
    <Card className={`hover-elevate border-2 card-shine ${isVisible ? "animate-slide-in-scale" : "opacity-0"}`} style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-8 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><Icon className="h-8 w-8 text-primary" /></div>
        <h3 className="font-bold text-lg mb-3">{title}</h3>
        <div className="text-muted-foreground font-medium">{content}</div>
      </CardContent>
    </Card>
  );
}

function SocialLink({ icon: Icon, href, color }: any) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`h-12 w-12 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-xl ${color}`}>
      <Icon className="h-6 w-6" />
    </a>
  );
}

