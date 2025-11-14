/**
 * Página de Regras da Casa
 * 
 * Explica as regras e diretrizes da comunidade
 * para manter um ambiente seguro e respeitoso
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Heart, Ban, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const RegrasConvivencia = () => {
  const navigate = useNavigate();
  const [temaEscuro, setTemaEscuro] = useState(
    document.documentElement.classList.contains("dark")
  );

  const alternarTema = () => {
    setTemaEscuro((prev) => {
      const novoTema = !prev;
      if (novoTema) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("tema", "escuro");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("tema", "claro");
      }
      return novoTema;
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

      <main className="container py-8 max-w-4xl">
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Regras da Casa</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Para manter o DesabafaAí um lugar seguro, respeitoso e acolhedor para todos
          </p>
        </div>

        {/* Princípios */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-secondary" />
              Nossos Princípios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Empatia Sempre</h4>
                <p className="text-sm text-muted-foreground">
                  Trate os outros com compaixão. Todos aqui estão passando por algo.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Respeito Mútuo</h4>
                <p className="text-sm text-muted-foreground">
                  Discordar é OK, mas faça isso com respeito. Ataques pessoais não são tolerados.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Anonimato Protegido</h4>
                <p className="text-sm text-muted-foreground">
                  Não tente descobrir a identidade de outros usuários. O anonimato é sagrado aqui.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regras Específicas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              O Que NÃO É Permitido
            </CardTitle>
            <CardDescription>
              Violações resultam em advertência, suspensão ou banimento permanente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Proibido 1 */}
            <div>
              <h4 className="font-medium mb-2 text-destructive">
                ❌ Discurso de Ódio e Discriminação
              </h4>
              <p className="text-sm text-muted-foreground">
                Qualquer conteúdo racista, sexista, homofóbico, transfóbico ou que
                discrimine qualquer grupo será removido e resultará em banimento imediato.
              </p>
            </div>

            <Separator />

            {/* Proibido 2 */}
            <div>
              <h4 className="font-medium mb-2 text-destructive">
                ❌ Assédio e Bullying
              </h4>
              <p className="text-sm text-muted-foreground">
                Não persiga, ameace ou intimide outros usuários. Isso inclui comentários
                repetidos não desejados e ataques pessoais.
              </p>
            </div>

            <Separator />

            {/* Proibido 3 */}
            <div>
              <h4 className="font-medium mb-2 text-destructive">
                ❌ Conteúdo Ilegal
              </h4>
              <p className="text-sm text-muted-foreground">
                Nada de compartilhar ou promover atividades ilegais. Isso inclui drogas,
                pirataria, violência, etc. Crimes serão reportados às autoridades.
              </p>
            </div>

            <Separator />

            {/* Proibido 4 */}
            <div>
              <h4 className="font-medium mb-2 text-destructive">
                ❌ Spam e Autopromoção
              </h4>
              <p className="text-sm text-muted-foreground">
                Não use o DesabafaAí para promover produtos, serviços ou redes sociais.
                Spam excessivo resulta em banimento.
              </p>
            </div>

            <Separator />

            {/* Proibido 5 */}
            <div>
              <h4 className="font-medium mb-2 text-destructive">
                ❌ Conteúdo Sexual Explícito
              </h4>
              <p className="text-sm text-muted-foreground">
                Confissões íntimas são OK, mas pornografia, nudez ou conteúdo sexualmente
                explícito não são permitidos.
              </p>
            </div>

            <Separator />

            {/* Proibido 6 */}
            <div>
              <h4 className="font-medium mb-2 text-destructive">
                ❌ Doxxing (Exposição de Dados)
              </h4>
              <p className="text-sm text-muted-foreground">
                Nunca compartilhe informações pessoais de terceiros (nomes completos,
                endereços, telefones, redes sociais). Banimento imediato.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Moderação */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-secondary" />
              Como Funciona a Moderação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Usamos <strong>moderação automatizada por IA</strong> + <strong>denúncias
              da comunidade</strong> para manter o ambiente seguro.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">🤖 IA Moderadora</p>
              <p className="text-sm text-muted-foreground">
                Todos os posts passam por análise de IA antes de serem publicados. Conteúdos
                que violam as regras são bloqueados automaticamente.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">👥 Denúncias</p>
              <p className="text-sm text-muted-foreground">
                Viu algo errado? Use o botão de denúncia. Nossa equipe revisa todas as
                denúncias em até 24h.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">⚠️ Sistema de Advertências</p>
              <p className="text-sm text-muted-foreground">
                • 1ª violação: Advertência + conteúdo removido<br />
                • 2ª violação: Suspensão temporária (7 dias)<br />
                • 3ª violação: Banimento permanente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-sm">
                Ao usar o DesabafaAí, você concorda em seguir estas regras.
              </p>
              <p className="text-sm font-medium">
                Juntos, criamos um espaço melhor para desabafar! 💙
              </p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Entendi, Voltar ao Feed
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RegrasConvivencia;
