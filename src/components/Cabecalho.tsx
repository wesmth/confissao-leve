// src/components/Cabecalho.tsx (CÓDIGO COMPLETO E FINAL COM INVERSÃO DE TEMA)

/**
 * Componente Cabeçalho
 * * Barra de navegação principal com:
 * - Logo do site
 * - Alternador de tema (claro/escuro)
 * - Botões de autenticação (login/logout)
 * - Menu do usuário quando logado
 * - NOVO: Modal de Login com Google
 */

import React from 'react';
import { Moon, Sun, User as UserIcon, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth"; 
import { useTheme } from "@/hooks/use-theme"; 
// Importação do NOVO Modal
import { LoginModal } from "./LoginModal"; 
import { useState } from "react";


export function Cabecalho() { 
  const navigate = useNavigate();
  
  const { usuario, estaLogado, logout } = useAuth();
  const { temaEscuro, alternarTema } = useTheme();
  
  // Estado local para controlar a abertura do Modal de Login
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo/Título */}
        <a href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">DesabafaAí</span>
        </a>

        {/* Ações da Direita */}
        <div className="flex items-center space-x-2">
          {/* Alternador de Tema */}
          <Button
            variant="ghost"
            size="sm"
            onClick={alternarTema}
            className="h-9 w-9"
            aria-label="Alternar Tema"
          >
            {/* FIX: Lógica de Inversão VISUAL correta e classes simplificadas */}
            {temaEscuro ? (
              // Se está ESCURO, mostra o SOL (para ir para o CLARO)
              <Sun className="h-5 w-5 transition-all rotate-0 scale-100" />
            ) : (
              // Se está CLARO, mostra a LUA (para ir para o ESCURO)
              <Moon className="h-5 w-5 transition-all rotate-0 scale-100" /> 
            )}
          </Button>
          
          {/* Notificações (Placeholder) */}
          {/* Você pode religar isso com a NotificacoesDropdown.tsx se quiser, mas por enquanto: */}
          {/* <NotificacoesDropdown /> */}


          {/* Botão de Autenticação */}
          {estaLogado && usuario ? (
            // Usuário Logado - Menu Dropdown
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-9 px-3">
                  <span className="text-sm font-medium hidden sm:inline">
                    {usuario.apelido}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={usuario.avatar} alt={usuario.apelido} />
                    <AvatarFallback>{usuario.apelido[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/perfil")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/premium")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Mudar Plano
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive hover:text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Usuário Deslogado - Botão Entrar
            <Button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary-hover">
              Entrar
            </Button>
          )}
        </div>
      </div>
      
      {/* NOVO: Modal de Login (sempre renderizado, abre/fecha com estado) */}
      <LoginModal open={modalOpen} onOpenChange={setModalOpen} />
    </header>
  );
}