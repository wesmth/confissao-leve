// src/hooks/use-theme.ts

import { useState, useEffect, useCallback } from "react";

// Define o tipo para o tema
type Theme = "claro" | "escuro";

// Função para aplicar o tema no DOM e no localStorage
const aplicarTema = (tema: Theme) => {
  const root = document.documentElement;
  if (tema === "escuro") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("tema", tema);
};

// Hook customizado para gerenciar o tema
export function useTheme() {
  const [tema, setTema] = useState<Theme>("claro"); // Estado inicial temporário

  // 1. Inicializa o tema na montagem do componente
  useEffect(() => {
    // Tenta carregar do localStorage
    const temaSalvo = localStorage.getItem("tema") as Theme | null;
    
    // Checa a preferência do sistema
    const prefereSistemaEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;

    let temaInicial: Theme;

    if (temaSalvo) {
      temaInicial = temaSalvo;
    } else {
      temaInicial = prefereSistemaEscuro ? "escuro" : "claro";
    }

    aplicarTema(temaInicial);
    setTema(temaInicial);
  }, []);

  // 2. Função para alternar o tema
  const alternarTema = useCallback(() => {
    setTema((prev) => {
      const novoTema = prev === "claro" ? "escuro" : "claro";
      aplicarTema(novoTema);
      return novoTema;
    });
  }, []);

  // 3. Verifica o tema atual (útil para o Cabecalho)
  const temaEscuro = tema === "escuro";

  return { tema, temaEscuro, alternarTema };
}