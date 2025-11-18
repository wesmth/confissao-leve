// src/components/ComentariosDrawer.tsx

import React, { useState, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Heart, Ban, Trash2, ShieldCheck, User as UserIcon, AlertTriangle } from "lucide-react"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"; 
// ADICIONADO: DialogDescription
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatarTempoAtras } from "@/lib/utilidades";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase"; // NOVO: Cliente Supabase


// --- Tipos Atualizados (Mapeando o DB) ---
interface Comentario {
  id: string; // UUID
  autor_id: string | null; // UUID do autor, null se anônimo
  apelido: string; // Do JOIN com profiles
  avatar: string; // Placeholder ou real
  conteudo: string;
  criado_em: string; // DB timestamp
  status: "ativo" | "moderado" | "excluido";
  total_reacoes: number;
}

interface PostProps {
  id: string; // Agora é string (UUID)
  tipo: "desabafo" | "confissao" | "fofoca";
  conteudo: string;
  autorApelido: string | null;
  totalComentarios: number;
}

interface ComentariosDrawerProps {
  post: PostProps;
  children: React.ReactNode;
  onCommentCountUpdate: (postId: string, newCount: number) => void;
}

// Helper para o JOIN do DB
interface CommentFromDB {
    id: string;
    post_id: string;
    autor_id: string | null;
    conteudo: string;
    criado_em: string;
    status: string;
    total_reacoes: number;
    profiles: {
        apelido: string;
    } | null;
}


export function ComentariosDrawer({ post, children, onCommentCountUpdate }: ComentariosDrawerProps) {
  const { usuario, estaLogado, atualizarPostsComentarios } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [moderando, setModerando] = useState(false);
  const [carregandoComentarios, setCarregandoComentarios] = useState(false); // NOVO
  
  const LIMITE_CARACTERES = 1000;
  const podeComentar = novoComentario.length >= 5 && novoComentario.length <= LIMITE_CARACTERES;

  // Limites (obtido do useAuth)
  const comentariosFeitosHoje = usuario?.limites.comentariosDiarios || 0;
  const limiteMaximoComentarios = usuario?.plano === "gratuito" ? 3 : Infinity;
  const limiteAtingido = estaLogado && usuario?.plano === "gratuito" && comentariosFeitosHoje >= limiteMaximoComentarios;


  // 1. Lógica de Busca de Comentários (FETCH REAL)
  const fetchComments = useCallback(async () => {
    setCarregandoComentarios(true);
    
    // Seleciona comentários ativos para o post_id, puxando o apelido do perfil
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (apelido)
      `)
      .eq('post_id', post.id)
      .eq('status', 'ativo') // Só mostra comentários ativos
      .order('criado_em', { ascending: true }); // Ordem cronológica

    if (error) {
      console.error("Erro ao buscar comentários:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os comentários.", variant: "destructive" });
      setCarregandoComentarios(false);
      return;
    }

    // Mapeia os dados do DB para o estado do componente
    const mappedComments: Comentario[] = data.map((item: CommentFromDB) => ({
      id: item.id,
      autor_id: item.autor_id,
      apelido: item.profiles?.apelido || 'Anônimo',
      // MOCK: Placeholder se anônimo. Se for logado, usa o avatar real do usuário.
      avatar: item.autor_id ? (usuario?.avatar || "") : formatarTempoAtras('Anônimo'), 
      conteudo: item.conteudo,
      criado_em: item.criado_em,
      status: item.status as "ativo" | "moderado" | "excluido",
      total_reacoes: item.total_reacoes,
    }));
    
    setComentarios(mappedComments);
    setCarregandoComentarios(false);
  }, [post.id, toast, usuario?.avatar]);
  
  // Efeito para carregar os comentários quando o drawer abre
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);


  // 2. Lógica de Inserção de Comentário (INSERT REAL)
  const handleAdicionarComentario = async () => {
    if (!estaLogado || limiteAtingido || !podeComentar || !usuario) return;

    setModerando(true);
    
    // Simulação da Moderação IA (2 segundos de delay)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const isModerado = novoComentario.toLowerCase().includes("bizarro"); // MOCK de moderação
    
    if (isModerado) {
        setModerando(false);
        setNovoComentario("");
        toast({ title: "Moderação", description: "Seu comentário foi sinalizado e será revisado. Conteúdo impróprio não é permitido.", variant: "destructive" });
        return;
    }

    // INSERÇÃO NO SUPABASE
    const novoComentarioData = {
      post_id: post.id,
      autor_id: usuario.id, // Comentários NÃO são anônimos por padrão no seu app
      conteudo: novoComentario,
      // Status e criado_em usam DEFAULT do DB
    };

    const { data: insertedCommentArray, error } = await supabase
      .from('comments')
      .insert([novoComentarioData])
      .select(`
        *,
        profiles (apelido)
      `); // Seleciona o comentário inserido e o perfil

    setModerando(false);

    if (error) {
      console.error("Erro ao postar comentário:", error);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    const insertedComment = insertedCommentArray[0] as CommentFromDB;
    
    // Mapeia o novo comentário para o estado local
    const newComment: Comentario = {
        id: insertedComment.id,
        autor_id: insertedComment.autor_id,
        apelido: insertedComment.profiles?.apelido || usuario.apelido, // Apelido do usuário logado
        avatar: usuario.avatar, 
        conteudo: insertedComment.conteudo,
        criado_em: insertedComment.criado_em,
        status: insertedComment.status as "ativo" | "moderado" | "excluido",
        total_reacoes: insertedComment.total_reacoes,
    };
    
    setComentarios((prev) => [...prev, newComment]); // Adiciona ao fim da lista
    setNovoComentario("");
    
    // ATUALIZA O CONTADOR DO POST NO DB
    const novoTotalComentarios = post.totalComentarios + 1;
    await supabase
        .from('posts')
        .update({ total_comentarios: novoTotalComentarios })
        .eq('id', post.id);

    // Atualiza o limite do usuário localmente
    atualizarPostsComentarios("comentario", 1); 
    
    // ATUALIZA O ESTADO DO POST NO COMPONENTE PAI (Index.tsx)
    onCommentCountUpdate(post.id, novoTotalComentarios);

    toast({ title: "Comentário Adicionado!", description: "Seu comentário foi publicado." });
  };
  

  // --- Funções de Renderização e UI ---

  const renderComentario = (comentario: Comentario) => (
    <div key={comentario.id} className="flex space-x-3 p-3 border-b border-border last:border-b-0">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs font-bold bg-muted/50">
          {comentario.apelido[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
            <p className={`text-sm font-semibold truncate ${comentario.autor_id === post.autorApelido ? 'text-primary' : 'text-foreground'}`}>
                {comentario.apelido}
            </p>
            {/* Badge de MODERADO ou Excluido */}
            {comentario.status === 'moderado' && (
                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive px-2 py-0.5 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Moderado
                </Badge>
            )}
        </div>

        <p className="text-sm text-foreground break-words mt-1">{comentario.conteudo}</p>
        
        <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center">
                {formatarTempoAtras(comentario.criado_em)}
            </span>
            {/* Botão de Reação (Placeholder) */}
            <Button variant="ghost" size="sm" className="h-6 px-1 text-xs hover:text-secondary">
                <Heart className="mr-1 h-3 w-3" /> {comentario.total_reacoes}
            </Button>
            {/* Botão Denunciar (Placeholder) */}
            <Button variant="ghost" size="sm" className="h-6 px-1 text-xs hover:text-destructive">
                <Ban className="mr-1 h-3 w-3" /> Denunciar
            </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] flex flex-col h-full sm:h-auto max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Comentários ({post.totalComentarios})
          </DialogTitle>
          <DialogDescription className="text-sm line-clamp-2">
            Post: "{post.conteudo}"
          </DialogDescription>
        </DialogHeader>

        {/* Área de Comentários e Scroll */}
        <ScrollArea className="flex-1 px-6 py-2 border-y">
            {carregandoComentarios ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                    <p className="ml-3 text-muted-foreground text-sm">Carregando...</p>
                </div>
            ) : comentarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Nenhum comentário ainda. Seja o primeiro!</p>
                </div>
            ) : (
                comentarios.map(renderComentario)
            )}
        </ScrollArea>

        {/* Input de Novo Comentário */}
        <div className="p-6 pt-2">
          <div className="flex items-end space-x-2">
            <Textarea
              placeholder={estaLogado ? "Adicione um comentário..." : "Faça login para comentar."}
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              className="flex-1 min-h-[40px] max-h-[120px]"
              rows={1}
              disabled={!estaLogado || limiteAtingido || moderando}
            />
            <Button 
                onClick={handleAdicionarComentario} 
                disabled={!podeComentar || !estaLogado || limiteAtingido || moderando}
                className="flex-shrink-0"
            >
              {moderando ? (
                <ShieldCheck className="mr-2 h-4 w-4 animate-pulse" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {moderando ? "Checando IA..." : "Comentar"}
            </Button>
          </div>
          
          {estaLogado && !limiteAtingido && (
              <p className="text-xs text-muted-foreground mt-2">
                {usuario?.plano === "gratuito" ? `Você tem ${limiteMaximoComentarios - comentariosFeitosHoje} comentários restantes hoje.` : "Comentários ILIMITADOS (Premium)!"}
              </p>
          )}

          {!estaLogado && (
              <Button variant="link" size="sm" onClick={() => setIsOpen(false)} className="px-0 pt-2 h-auto text-xs">
                  Acesse sua conta para interagir!
              </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}