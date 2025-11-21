// src/components/CartaoPost.tsx

import { MessageCircle, Heart, Sparkles, Clock, User } from "lucide-react";
import { useState, useEffect } from "react"; 
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatarTempoAtras } from "@/lib/utilidades";
import { supabase } from "@/lib/supabase"; 
import { useAuth } from "@/hooks/use-auth"; 
import { useToast } from "@/hooks/use-toast"; 
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Importado para melhor UX

interface Post {
  id: string;
  autor_id: string | null; // <--- ADICIONADO: Essencial para checar a propriedade
  tipo: "desabafo" | "confissao" | "fofoca";
  conteudo: string;
  dataPublicacao: string;
  totalComentarios: number; 
  totalReacoes: number;
  emAlta?: boolean;
  novo?: boolean;
  autor?: string | null; 
  anonimo?: boolean;
  ja_curtiu?: boolean;
}

interface CartaoPostProps {
  post: Post;
  aoClicar: () => void; 
  onCommentCountUpdate: (postId: string, newCount: number) => void;
  expandido?: boolean; 
}

export function CartaoPost({ post, aoClicar, onCommentCountUpdate, expandido = false }: CartaoPostProps) {
  // Puxa o usuário logado para a checagem
  const { estaLogado, usuario } = useAuth(); 
  const { toast } = useToast();
  
  const [reacoes, setReacoes] = useState(post.totalReacoes);
  const [curtiu, setCurtiu] = useState(false);
  const [reagindo, setReagindo] = useState(false); 

  // Checa se o post pertence ao usuário logado
  const isProprioPost = !!(usuario?.id && post.autor_id && usuario.id === post.autor_id);

  useEffect(() => {
    setCurtiu(!!post.ja_curtiu);
    setReacoes(post.totalReacoes);
  }, [post.ja_curtiu, post.totalReacoes]);

  const handleReagir = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    // Desabilita a reação se for o próprio post
    if (isProprioPost) {
      toast({ title: "Ei, não vale!", description: "Você não pode curtir seu próprio post. 😉", variant: "default" });
      return;
    }
    
    if (!estaLogado) {
        toast({ title: "Login Necessário", description: "Faça login para reagir!", variant: "default" });
        return;
    }
    if (reagindo) return;
    setReagindo(true);
    
    // Otimista: Já troca na tela
    const novoEstado = !curtiu;
    setCurtiu(novoEstado);
    setReacoes(prev => novoEstado ? prev + 1 : prev - 1);
    
    // Chama a função de Toggle no banco
    const { data: curtiuAgora, error } = await supabase.rpc('toggle_reacao_post', { post_row_id: post.id });
    setReagindo(false);

    if (error) {
        // Desfaz a mudança visual se o banco falhar (Ex: RLS, erro de chave duplicada)
        setCurtiu(!novoEstado);
        setReacoes(prev => novoEstado ? prev - 1 : prev + 1);
        console.error("Erro ao reagir:", error);
    } else {
        setCurtiu(curtiuAgora);
    }
  };

  let corCategoria = "";
  if (post.tipo === "confissao") corCategoria = "bg-categoria-confissao";
  else if (post.tipo === "fofoca") corCategoria = "bg-categoria-fofoca";
  else corCategoria = "bg-categoria-desabafo";

  const isAnonimoVisual = post.anonimo || !post.autor;
  const autorNomeVisual = isAnonimoVisual ? "Anônimo" : post.autor;

  return (
    <Card className={`animate-slide-up transition-all duration-300 ${!expandido ? 'hover-lift' : ''}`}>
      <CardHeader className={`pb-3 ${!expandido ? 'cursor-pointer' : ''}`} onClick={!expandido ? aoClicar : undefined}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="default" className={`${corCategoria} text-primary-foreground`}>
              {post.tipo.charAt(0).toUpperCase() + post.tipo.slice(1)}
            </Badge>
            {post.emAlta && (
              <Badge variant="secondary" className="bg-trending text-white"><Sparkles className="h-3 w-3 mr-1" /> Em Alta</Badge>
            )}
            {post.novo && (
              <Badge variant="secondary" className="bg-novo text-white"><Clock className="h-3 w-3 mr-1" /> Novo</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatarTempoAtras(post.dataPublicacao)}
          </span>
        </div>
      </CardHeader>

      <CardContent className={`pb-3 ${!expandido ? 'cursor-pointer' : ''}`} onClick={!expandido ? aoClicar : undefined}>
        <p className={`text-sm text-foreground leading-relaxed break-words ${expandido ? 'whitespace-pre-wrap' : 'line-clamp-3'}`}>
          {post.conteudo}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center text-xs text-muted-foreground">
            {isAnonimoVisual ? (
                <User className="mr-1 h-3 w-3" />
            ) : (
                <span className="mr-1 font-semibold text-primary">@{autorNomeVisual}</span>
            )}
            <span>{isAnonimoVisual ? "Post Anônimo" : autorNomeVisual}</span>
        </div>
        
        <div className="flex space-x-2">
            {/* Ícone de comentário estático */}
            <div 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 text-muted-foreground select-none pointer-events-none"
                title="Comentários"
            >
                <MessageCircle className="mr-2 h-4 w-4" />
                <span className="text-sm">{post.totalComentarios}</span>
            </div>

            {/* BOTÃO DE LIKE */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="sm"
                  className={`transition-colors 
                      ${curtiu ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}
                      ${isProprioPost ? 'opacity-50 cursor-not-allowed' : ''} 
                  `}
                  onClick={handleReagir}
                  disabled={reagindo || isProprioPost}
                >
                  <Heart className={`mr-2 h-4 w-4 ${curtiu ? 'fill-current' : ''}`} />
                  <span className="text-sm">{reacoes}</span>
                </Button>
              </TooltipTrigger>
              {isProprioPost && (
                <TooltipContent>
                  Você não pode curtir sua própria postagem.
                </TooltipContent>
              )}
            </Tooltip>

            {!expandido && (
                <Button variant="link" size="sm" onClick={aoClicar} className="text-primary">Ler Mais</Button>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}