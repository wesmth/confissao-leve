/**
 * Componente StatusUsuario
 * 
 * Exibe o status do usuário logado (plano gratuito)
 * Mostra:
 * - Posts disponíveis hoje
 * - Comentários disponíveis hoje
 * - Botão para upgrade premium
 */

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatusUsuarioProps {
  postsHoje: number;
  comentariosHoje: number;
  limitePostsDiarios: number;
  limiteComentariosDiarios: number;
  aoClicarPremium: () => void;
}

export function StatusUsuario({
  postsHoje,
  comentariosHoje,
  limitePostsDiarios,
  limiteComentariosDiarios,
  aoClicarPremium,
}: StatusUsuarioProps) {
  const porcentagemPosts = (postsHoje / limitePostsDiarios) * 100;
  const porcentagemComentarios = (comentariosHoje / limiteComentariosDiarios) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Seu Status (Gratuito)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Posts */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Posts hoje</span>
            <span className="font-medium">
              {postsHoje}/{limitePostsDiarios}
            </span>
          </div>
          <Progress value={porcentagemPosts} className="h-2" />
        </div>

        {/* Comentários */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Comentários hoje</span>
            <span className="font-medium">
              {comentariosHoje}/{limiteComentariosDiarios}
            </span>
          </div>
          <Progress value={porcentagemComentarios} className="h-2" />
        </div>

        {/* Botão Premium */}
        <Button
          onClick={aoClicarPremium}
          asChild
          className="w-full bg-gradient-to-r from-secondary to-trending hover:opacity-90"
        >
          <a href="/premium">
            <Sparkles className="mr-2 h-4 w-4" />
            Vire Premium (Ilimitado!)
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
