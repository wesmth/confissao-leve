// src/App.tsx (CÓDIGO COMPLETO)

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth"; // Importação Nova

// Páginas
import Index from "./pages/Index";
import Perfil from "./pages/Perfil";
import RegrasConvivencia from "./pages/RegrasConvivencia";
import Premium from "./pages/Premium";
import NotFound from "./pages/NotFound";
import PostDetalhe from "./pages/PostDetalhe"; // <-- NOVO IMPORT

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* O AuthProvider deve envolver o BrowserRouter para que as rotas 
        (e todas as páginas) tenham acesso ao estado de autenticação.
      */}
      <AuthProvider> 
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/regras" element={<RegrasConvivencia />} />
            <Route path="/premium" element={<Premium />} />
            
            {/* ROTA DO DETALHE DO POST: RECEBE O ID PELA URL */}
            <Route path="/post/:id" element={<PostDetalhe />} /> 
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;