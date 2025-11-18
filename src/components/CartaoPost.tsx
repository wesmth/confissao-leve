// src/components/CartaoPost.tsx

/**
 * Componente CartaoPost
 * * Card individual que exibe um post no feed
 * * REFATORADO: Agora usa UUIDs (string), lógica de cor dinâmica e Reações Supabase
 */

import { MessageCircle, Heart, Sparkles, Clock, Ban, User } from "lucide-react";
import { useState } from "react"; // NOVO: para estado de reação
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatarTempoAtras } from "@/lib/utilidades";
import { ComentariosDrawer } from "./ComentariosDrawer"; 
import { supabase } from "@/lib/supabase"; // NOVO: Cliente Supabase
import { useAuth } from "@/hooks/use-auth"; // NOVO: Para checar se está logado
import { useToast } from "@/hooks/use-toast"; // NOVO: Para notificação de login

// --- Tipagem Atualizada (Usando string/UUID para ID e autor) ---
interface Post {
  id: string; // UUID
  tipo: "desabafo" | "confissao" | "fofoca";
  conteudo: string;
  dataPublicacao: string;
  totalComentarios: number; 
  totalReacoes: number;
  emAlta?: boolean;
  novo?: boolean;
  autor?: string | null; // NICKNAME OU NULL (Anônimo)
}

interface CartaoPostProps {
  post: Post;
  aoClicar: () => void; 
  onCommentCountUpdate: (postId: string, newCount: number) => void; 
}

export function CartaoPost({ post, aoClicar, onCommentCountUpdate }: CartaoPostProps) {
  const { estaLogado } = useAuth(); // Para checar login
  const { toast } = useToast();
  
  // Estado local para o contador de reações e para evitar clique duplo
  const [reacoes, setReacoes] = useState(post.totalReacoes);
  const [reagindo, setReagindo] = useState(false); 


  // --- 1. Lógica de Reação (NOVA) ---
  const handleReagir = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede de abrir o post
    
    if (!estaLogado) {
        toast({ title: "Login Necessário", description: "Faça login para reagir aos posts!", variant: "default" });
        return;
    }
    
    if (reagindo) return;
    
    setReagindo(true);
    
    // Incremento otimista no front-end
    setReacoes(prev => prev + 1);
    
    // Chama a Stored Procedure do Supabase
    const { error } = await supabase.rpc('increment_reacoes_post', { post_row_id: post.id });
    
    setReagindo(false);

    if (error) {
        // Se der erro no DB, reverte a contagem local (Incremento Pessimista em caso de falha)
        setReacoes(prev => prev - 1);
        console.error("Erro ao reagir:", error);
        toast({ title: "Erro de Reação", description: "Não foi possível registrar a reação. Tente novamente.", variant: "destructive" });
    }
  };


  // 2. Lógica para definir a cor da badge (INTACTA)
  let corCategoria = "";
  if (post.tipo === "confissao") {
    corCategoria = "bg-categoria-confissao";
  } else if (post.tipo === "fofoca") {
    corCategoria = "bg-categoria-fofoca";
  } else {
    corCategoria = "bg-categoria-desabafo";
  }

  // 3. Lógica para definir o autor (INTACTA)
  const autorNome = post.autor || "Anônimo";
  const isAnonimo = !post.autor;


  const handleCommentCountUpdate = (postId: string, newCount: number) => {
    onCommentCountUpdate(postId, newCount);
  }

  return (
    <Card
      key={post.id}
      className="animate-slide-up hover-lift transition-all duration-300"
    >
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={aoClicar} 
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            
            {/* BADGE DE CATEGORIA COM COR DINÂMICA */}
            <Badge 
                variant="default" 
                className={`${corCategoria} text-primary-foreground`}
            >
              {post.tipo.charAt(0).toUpperCase() + post.tipo.slice(1)}
            </Badge>

            {post.emAlta && (
              <Badge variant="secondary" className="bg-trending text-white">
                <Sparkles className="h-3 w-3 mr-1" /> Em Alta
              </Badge>
            )}

            {post.novo && (
              <Badge variant="secondary" className="bg-novo text-white">
                <Clock className="h-3 w-3 mr-1" /> Novo
              </Badge>
            )}
            
            {/* Simulação de Status Moderado */}
            {post.id === "4" && (
                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive">
                    <Ban className="h-3 w-3 mr-1" /> Moderado
                </Badge>
            )}

          </div>

          {/* TEMPO ATRÁS */}
          <span className="text-xs text-muted-foreground">
            {formatarTempoAtras(post.dataPublicacao)}
          </span>
        </div>
      </CardHeader>

      <CardContent 
        className="pb-3 cursor-pointer"
        onClick={aoClicar} 
      >
        {/* Conteúdo truncado do post */}
        <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
          {post.conteudo}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t">
        
        {/* AUTOR DO POST */}
        <div className="flex items-center text-xs text-muted-foreground">
            {isAnonimo ? (
                <User className="mr-1 h-3 w-3" />
            ) : (
                <span className="mr-1 font-semibold text-primary">@{autorNome}</span>
            )}
            <span>{isAnonimo ? "Post Anônimo" : autorNome}</span>
        </div>
        
        <div className="flex space-x-2">

            {/* Contador de comentários - DialogTrigger */}
            <ComentariosDrawer
                post={{
                    id: post.id,
                    tipo: post.tipo,
                    conteudo: post.conteudo,
                    autorApelido: autorNome,
                    totalComentarios: post.totalComentarios
                }}
                onCommentCountUpdate={handleCommentCountUpdate}
            >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span className="text-sm">{post.totalComentarios}</span>
                </Button>
            </ComentariosDrawer>


            {/* Contador de reações (AGORA FUNCIONAL) */}
            <Button
              variant="ghost"
              size="sm"
              className={`text-muted-foreground ${reagindo ? 'opacity-50' : 'hover:text-secondary'}`}
              onClick={handleReagir}
              disabled={reagindo}
            >
              <Heart className="mr-2 h-4 w-4" />
              <span className="text-sm">{reacoes}</span>
            </Button>

            {/* Botão "Ler mais" (Mantido) */}
            <Button 
                variant="link" 
                size="sm" 
                onClick={aoClicar}
                className="text-primary"
            >
              Ler Mais
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}