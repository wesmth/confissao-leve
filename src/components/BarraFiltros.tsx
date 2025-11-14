/**
 * Componente BarraFiltros
 * 
 * Barra de filtros para o feed de posts
 * Permite filtrar por:
 * - Ordem (Em alta / Recentes)
 * - Categoria (Tudo / Desabafos / Confissões)
 */

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface BarraFiltrosProps {
  filtroOrdem: "emAlta" | "recentes";
  filtroCategoria: "tudo" | "desabafo" | "confissao";
  aoMudarOrdem: (ordem: "emAlta" | "recentes") => void;
  aoMudarCategoria: (categoria: "tudo" | "desabafo" | "confissao") => void;
}

export function BarraFiltros({
  filtroOrdem,
  filtroCategoria,
  aoMudarOrdem,
  aoMudarCategoria,
}: BarraFiltrosProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b">
      {/* Filtro de Ordem */}
      <Tabs value={filtroOrdem} onValueChange={(v) => aoMudarOrdem(v as any)}>
        <TabsList>
          <TabsTrigger value="emAlta">🔥 Em Alta</TabsTrigger>
          <TabsTrigger value="recentes">🕐 Recentes</TabsTrigger>
        </TabsList>
      </Tabs>

      <Separator orientation="vertical" className="hidden sm:block h-6" />

      {/* Filtro de Categoria */}
      <Tabs value={filtroCategoria} onValueChange={(v) => aoMudarCategoria(v as any)}>
        <TabsList>
          <TabsTrigger value="tudo">Tudo</TabsTrigger>
          <TabsTrigger value="desabafo">Desabafos</TabsTrigger>
          <TabsTrigger value="confissao">Confissões</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
