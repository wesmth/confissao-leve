/**
 * Página Premium
 * * Mostra os benefícios do plano premium
 * e permite upgrade por R$ 9,90/mês
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, Zap, Crown, Star } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme"; // Importação Corrigida

const Premium = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // USA O HOOK DE TEMA AGORA
  const { temaEscuro, alternarTema } = useTheme(); //

  const handleAssinar = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A integração com pagamentos será implementada em breve!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Cabecalho
        temaEscuro={temaEscuro}
        alternarTema={alternarTema}
        estaLogado={false}
        aoClicarLogin={() => {}}
        aoClicarLogout={() => {}}
      />

      <main className="container py-8 max-w-6xl">
        {/* Botão voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Feed
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-trending mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Vire Premium e Desabafe Sem Limites!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Desbloqueie recursos exclusivos por apenas <strong>R$ 9,90/mês</strong>
          </p>
        </div>

        {/* Comparação de Planos */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Plano Gratuito */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>Plano Gratuito</CardTitle>
                <Badge variant="outline">Atual</Badge>
              </div>
              <CardDescription className="text-2xl font-bold">
                R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm">1 post por dia</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm">3 comentários por dia</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm">Postar anonimamente</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm">Reagir com ❤️ em posts</span>
                </div>
                <div className="flex items-center gap-3 opacity-40">
                  <span className="text-sm line-through">Badge Premium</span>
                </div>
                <div className="flex items-center gap-3 opacity-40">
                  <span className="text-sm line-through">Sem anúncios</span>
                </div>
                <div className="flex items-center gap-3 opacity-40">
                  <span className="text-sm line-through">Temas personalizados</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plano Premium */}
          <Card className="relative border-primary shadow-lg shadow-primary/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-secondary to-trending text-white px-4 py-1">
                <Crown className="mr-1 h-3 w-3" />
                Mais Popular
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Plano Premium
                <Sparkles className="h-5 w-5 text-secondary" />
              </CardTitle>
              <CardDescription className="text-3xl font-bold text-primary">
                R$ 9,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">Posts ILIMITADOS ♾️</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">Comentários ILIMITADOS ♾️</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">Badge Premium exclusivo ✨</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">Experiência sem anúncios 🚫</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">Reações extras 💫 💪 🤝 🎯</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">Temas de cores personalizados 🎨</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">Prioridade no suporte 🚀</span>
                </div>
              </div>

              <Button 
                onClick={handleAssinar}
                className="w-full bg-gradient-to-r from-secondary to-trending hover:opacity-90 text-white mt-6"
                size="lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Assinar Agora
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-2">
                Cancele quando quiser • Sem compromisso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefícios Destacados */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            Por Que Virar Premium?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Liberdade Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Desabafe quantas vezes quiser, sem se preocupar com limites diários.
                  Tire tudo do peito!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                  <Star className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">Destaque-se</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Badge Premium exclusivo que mostra seu apoio à comunidade e te
                  diferencia dos demais.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                  <Crown className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg">Experiência VIP</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Navegue sem anúncios, personalize temas e tenha prioridade no
                  suporte quando precisar.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">💳 Como funciona o pagamento?</h4>
              <p className="text-sm text-muted-foreground">
                Cobrança mensal de R$ 9,90 no cartão de crédito. Você pode cancelar
                quando quiser sem multas.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">🔄 Posso cancelar a qualquer momento?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Sem compromisso. Cancele direto nas configurações da sua conta.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">📱 Funciona no celular e desktop?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! O Premium funciona em todos os dispositivos onde você acessar o
                DesabafaAí.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">🎁 Tem período de teste grátis?</h4>
              <p className="text-sm text-muted-foreground">
                Não oferecemos teste gratuito, mas você pode cancelar no primeiro mês
                se não gostar!
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Premium;