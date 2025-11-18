// src/lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

// Carrega as chaves do .env através do ambiente do Vite
// O .env precisa do prefixo VITE_ para o Vite ler no front-end
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Isso garante que o projeto não inicie sem as chaves
  throw new Error("Credenciais do Supabase não encontradas. Verifique seu arquivo .env");
}

// Cria e exporta a instância do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);