// src/components/NotificacoesDropdown.tsx

import { useState } from "react";
import { Bell, MessageCircle, Heart, CheckCircle2, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatarTempoAtras } from "@/lib/utilidades";
import { useAuth } from "@/hooks/use-auth";

// --- Tipos ---
interface Notificacao {
  id: number;
  tipo: "resposta" | "reacao" | "alerta"; // Tipo de notificação
  mensagem: string;
  data: string;
  lida: boolean;
  link: string; // Link para o post ou comentário
}

// --- Mock de Notificações ---
const NOTIFICACOES_MOCK: Notificacao[] = [
  {
    id: 1,
    tipo: "resposta",
    mensagem: "Um usuário respondeu ao seu comentário no post 'Chefe Robô'.",
    data: "2025-11-14T11:40:00Z",
    lida: false,
    link: "/post/1",
  },
  {
    id: 2,
    tipo: "reacao",
    mensagem: "Você recebeu 5 novas reações no seu desabafo.",
    data: "2025-11-13T10:00:00Z",
    lida: false,
    link: "/post/3",
  },
  {
    id: 3,
    tipo: "alerta",
    mensagem: "Seu comentário foi aprovado pela moderação (IA).",
    data: "2025-11-12T08:00:00Z",
    lida: true,
    link: "/perfil?tab=historico",
  },
  {
    id: 4,
    tipo: "alerta",
    mensagem: "Lembrete: Você pode trocar seu apelido a partir de amanhã!",
    data: "2025-11-11T09:00:00Z",
    lida: true,
    link: "/perfil",
  },
];

export function NotificacoesDropdown() {
  const { estaLogado } = useAuth();
  
  // Estado para gerenciar as notificações
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(NOTIFICACOES_MOCK);

  // Calcula o número de notificações não lidas
  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const handleMarcarComoLida = (id: number) => {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    // Aqui no futuro faria a chamada à API para persistir a leitura no Supabase
  };

  const getIcone = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case "resposta":
        return <MessageCircle className="h-4 w-4 text-primary" />;
      case "reacao":
        return <Heart className="h-4 w-4 text-secondary" />;
      case "alerta":
        return <CheckCircle2 className="h-4 w-4 text-accent" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Se não estiver logado, não renderiza o sino.
  if (!estaLogado) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
        >
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">
              {naoLidas}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-3 border-b">
            <h4 className="text-lg font-semibold">Notificações</h4>
            <p className="text-sm text-muted-foreground">{naoLidas} não lidas</p>
        </div>

        <ScrollArea className="h-80">
          {notificacoes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              Nenhuma notificação por enquanto.
            </p>
          ) : (
            notificacoes.map((n) => (
              <DropdownMenuItem
                key={n.id}
                asChild
                // Marca como lida ao clicar e navega
                onSelect={() => handleMarcarComoLida(n.id)}
              >
                <a 
                  href={n.link} 
                  className={`flex items-start p-3 w-full space-x-3 cursor-pointer ${
                    n.lida ? "bg-background/50" : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="pt-1">{getIcone(n.tipo)}</div>
                  <div className="flex-1">
                    <p className={`text-sm ${n.lida ? 'text-muted-foreground' : 'font-medium'}`}>
                      {n.mensagem}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {formatarTempoAtras(n.data)}
                    </span>
                  </div>
                </a>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem 
            className="flex justify-center text-xs text-muted-foreground py-2 cursor-pointer"
            onClick={() => setNotificacoes(prev => prev.map(n => ({...n, lida: true})))}
        >
            Marcar todas como lidas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}