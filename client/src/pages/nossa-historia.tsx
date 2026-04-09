import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, TrendingUp, Shield } from "lucide-react";

export default function NossaHistoria() {
  return (
    <div className="flex-1">
      <main>
        <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 font-display" data-testid="text-title">
                Nossa História
              </h1>
              <div className="max-w-3xl mx-auto space-y-6">
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Em um mundo onde a mobilidade se transforma a cada dia, nasceu a Imobilicar, com um propósito simples, 
                  mas poderoso: <strong>transformar carros parados em oportunidades de renda e liberdade</strong>.
                </p>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Tudo começou com uma pergunta:
                </p>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed italic border-l-4 border-primary pl-4">
                  "E se existisse uma forma de conectar donos de veículos com pessoas que precisam rodar todos os dias, 
                  sem burocracia, sem complicação?"
                </p>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Foi assim que surgiu a ideia da primeira #imobiliária de carros do Brasil.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-none">
              <div className="mb-12">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-6 font-display break-words" data-testid="text-mission-title">
                  Nossa Missão
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4" data-testid="text-mission-content">
                  Na Imobilicar, não vendemos promessas: <strong>entregamos soluções</strong>. Enquanto muitos viam o carro 
                  como um bem que só gera despesas, nós enxergamos ativos que podem gerar renda. Unimos proprietários de veículos 
                  que não estão usando seus carros com motoristas de aplicativo que precisam de um carro para trabalhar e mudar suas vidas.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Criamos um modelo inovador de agregação de veículos: o dono recebe uma <strong>renda fixa mensal</strong>, 
                  com contrato, garantia, manutenção e segurança. Já o motorista pega o carro pronto pra rodar, sem complicações, 
                  com suporte e confiança.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Hoje, já são mais de <strong>120 carros</strong> entre frota própria e de parceiros, e esse número cresce todos os meses. 
                  A cada carro agregado, a cada motorista que começa a rodar, uma nova história começa a ser escrita.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Porque na Imobilicar, a gente acredita que <strong>mobilidade é liberdade</strong> — e liberdade se conquista com oportunidade.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-12">
                <Card className="hover-elevate" data-testid="card-value-1">
                  <CardContent className="p-6">
                    <Heart className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-3">Respeito e Dignidade</h3>
                    <p className="text-muted-foreground">
                      Tratamos cada cliente com respeito, oferecendo soluções sem julgamentos ou burocracias desnecessárias.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate" data-testid="card-value-2">
                  <CardContent className="p-6">
                    <Users className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-3">Inclusão Financeira</h3>
                    <p className="text-muted-foreground">
                      Criamos alternativas para que pessoas com restrições de crédito também tenham acesso a veículos de qualidade.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate" data-testid="card-value-3">
                  <CardContent className="p-6">
                    <TrendingUp className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-3">Novas Oportunidades</h3>
                    <p className="text-muted-foreground">
                      Oferecemos programas de aluguel para renda e financiamento próprio (rent-to-own) para ajudar na reconstrução financeira.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover-elevate" data-testid="card-value-4">
                  <CardContent className="p-6">
                    <Shield className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-3">Transparência</h3>
                    <p className="text-muted-foreground">
                      Processos claros, sem pegadinhas ou taxas ocultas. Você sabe exatamente o que está contratando.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 sm:mb-6 font-display" data-testid="text-cta-title">
              Faça Parte da Nossa História
            </h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90">
              Junte-se a centenas de pessoas que já conquistaram sua mobilidade conosco
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="h-11 sm:h-12 px-6 sm:px-8 w-full sm:w-auto" data-testid="button-cta-veiculos">
                <Link href="/veiculos">Ver Veículos</Link>
              </Button>
              <Button asChild size="lg" className="h-11 sm:h-12 px-6 sm:px-8 bg-black text-white border-2 border-black w-full sm:w-auto" data-testid="button-cta-investidor">
                <Link href="/investidor">Ser Investidor</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
