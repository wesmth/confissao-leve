/**
 * Componente CartaoPost
 * 
 * Card individual que exibe um post no feed
 * Inclui:
 * - Badge de categoria (Desabafo/Confissão)
 * - Badge de "Novo" ou "Em alta" 
 * - Conteúdo do post (truncado)
 * - Botões de reação
 * - Contador de comentários
 * - Animação de entrada
 */

import { MessageCircle, Heart, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatarTempoAtras } from "@/lib/utilidades";

interface CartaoPostProps {
  post: {
    id: number;
    tipo: "desabafo" | "confissao" | "fofoca";
    conteudo: string;
    dataPublicacao: string;
    totalComentarios: number;
    totalReacoes: number;
    emAlta?: boolean;
    novo?: boolean;
  };
  aoClicar: () => void;
}

export function CartaoPost({ post, aoClicar }: CartaoPostProps) {
  // Define a cor da badge baseado no tipo
  const corCategoria = post.tipo === "confissao" ? "confissao" : post.tipo === "fofoca" ? "trending" : "desabafo";
  const textoCategoria = post.tipo === "confissao" ? "Confissão" : post.tipo === "fofoca" ? "Fofoca" : "Desabafo";

  return (
    <Card
      onClick={aoClicar}
      className="cursor-pointer hover-lift animate-slide-up transition-all duration-200"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Badges */}
          <div className="flex items-center gap-2">
            <Badge
              className={`${
                post.tipo === "confissao"
                  ? "bg-confissao text-white"
                  : post.tipo === "fofoca"
                  ? "bg-trending text-white"
                  : "bg-desabafo text-white"
              }`}
            >
              {textoCategoria}
            </Badge>
            
            {/* Badge de "Em Alta" */}
            {post.emAlta && (
              <Badge variant="secondary" className="bg-trending text-white">
                <Sparkles className="mr-1 h-3 w-3" />
                Em Alta
              </Badge>
            )}
            
            {/* Badge de "Novo" */}
            {post.novo && (
              <Badge variant="secondary" className="bg-novo text-white">
                <Clock className="mr-1 h-3 w-3" />
                Novo
              </Badge>
            )}
          </div>

          {/* Tempo atrás */}
          <span className="text-xs text-muted-foreground">
            {formatarTempoAtras(post.dataPublicacao)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Conteúdo truncado do post */}
        <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
          {post.conteudo}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t">
        {/* Contador de comentários */}
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          <span className="text-sm">{post.totalComentarios}</span>
        </Button>

        {/* Contador de reações */}
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-secondary"
          onClick={(e) => {
            e.stopPropagation(); // Impede de abrir o post ao clicar
            // Aqui viria a lógica de reagir
          }}
        >
          <Heart className="mr-2 h-4 w-4" />
          <span className="text-sm">{post.totalReacoes}</span>
        </Button>

        {/* Botão "Ler mais" */}
        <Button
          variant="link"
          size="sm"
          className="text-primary hover:text-primary-hover"
        >
          Ler mais →
        </Button>
      </CardFooter>
    </Card>
  );
}
