import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme"; // Importação Corrigida

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // USA O HOOK DE TEMA AGORA
  const { temaEscuro, alternarTema } = useTheme();

  useEffect(() => {
    // Manter o console.error para debug, como você já tinha
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Adiciona o Cabeçalho para manter a identidade visual */}
      <Cabecalho
        temaEscuro={temaEscuro}
        alternarTema={alternarTema}
        estaLogado={false} // Assume não logado, já que é uma página de erro
        aoClicarLogin={() => navigate("/")}
        aoClicarLogout={() => navigate("/")}
      />
      
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center p-6 bg-card border rounded-xl shadow-lg animate-fade-in">
          <h1 className="mb-2 text-8xl font-extrabold text-primary">404</h1>
          <p className="mb-6 text-xl text-foreground font-semibold">
            Página Não Encontrada
          </p>
          <p className="mb-8 text-muted-foreground max-w-sm mx-auto">
            Vish! Não conseguimos encontrar o endereço <span className="text-destructive font-mono break-all">{location.pathname}</span>.
          </p>
          <Button onClick={() => navigate("/")} size="lg">
            Voltar ao Feed Principal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;