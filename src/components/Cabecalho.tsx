/**
 * Componente Cabeçalho
 * 
 * Barra de navegação principal com:
 * - Logo do site
 * - Alternador de tema (claro/escuro)
 * - Botões de autenticação (login/logout)
 * - Menu do usuário quando logado
 */

import { Moon, Sun, User, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CabecalhoProps {
  temaEscuro: boolean;
  alternarTema: () => void;
  estaLogado: boolean;
  usuario?: {
    apelido: string;
    avatar: string;
  };
  aoClicarLogin: () => void;
  aoClicarLogout: () => void;
}

export function Cabecalho({
  temaEscuro,
  alternarTema,
  estaLogado,
  usuario,
  aoClicarLogin,
  aoClicarLogout,
}: CabecalhoProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">
            Desabafa<span className="text-primary">Aí</span>
          </h1>
        </div>

        {/* Ações da direita */}
        <div className="flex items-center space-x-3">
          {/* Botão de alternar tema */}
          <Button
            variant="ghost"
            size="icon"
            onClick={alternarTema}
            className="h-9 w-9"
          >
            {temaEscuro ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>

          {/* Autenticação */}
          {estaLogado && usuario ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 px-3"
                >
                  <span className="hidden sm:inline text-sm font-medium">
                    {usuario.apelido}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={usuario.avatar} alt={usuario.apelido} />
                    <AvatarFallback>{usuario.apelido[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <a href="/perfil" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/premium" className="flex items-center cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Mudar Plano
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={aoClicarLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={aoClicarLogin} className="bg-primary hover:bg-primary-hover">
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
