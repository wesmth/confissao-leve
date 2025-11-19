// src/components/ListaComentarios.tsx (CÓDIGO COMPLETO E CORRIGIDO)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, X, Send, Heart, User as UserIcon, AlertTriangle, ShieldCheck, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatarTempoAtras, gerarAvatarPlaceholder } from "@/lib/utilidades";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


// --- Tipos e Interfaces (Mantidas) ---
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

interface ComentarioFromDB {
    id: string;
    autor_id: string | null;
    conteudo: string;
    created_at: string; // Nota: Usamos created_at aqui, mas no DB é criado_em. Isso pode dar erro se não for mapeado!
    status: "ativo" | "moderado" | "excluido";
    total_reacoes: number;
    profiles: {
        apelido: string;
    } | null;
}

interface ListaComentariosProps {
    postId: string;
    onCommentCountUpdate: (newCount: number) => void; 
}

const PAGE_SIZE = 10; 

// Componente: Cartão Individual do Comentário (Mantido)
interface ComentarioCardProps {
    comentario: Comentario;
}

const ComentarioCard = ({ comentario }: ComentarioCardProps) => {
    // ... Lógica do ComentarioCard (Mantida) ...
    const { usuario } = useAuth();
    const { toast } = useToast();
    
    const [reacoes, setReacoes] = useState(comentario.total_reacoes);
    const [reagindo, setReagindo] = useState(false);
    
    const autorNome = comentario.apelido || "Anônimo";
    const autorAvatar = gerarAvatarPlaceholder(autorNome);

    const handleReagir = async () => {
        if (!usuario) {
            toast({ title: "Ei, calma lá!", description: "Você precisa logar para reagir a um comentário.", variant: "destructive" });
            return;
        }

        setReagindo(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 300)); 
            setReacoes(prev => prev + 1);
            toast({ title: "Reação adicionada!", description: `Você reagiu ao comentário de @${autorNome}.`, duration: 1500 });
        } catch (error) {
            toast({ title: "Erro na Reação", description: "Não foi possível reagir.", variant: "destructive" });
        } finally {
            setReagindo(false);
        }
    };

    return (
        <div className="flex space-x-3 p-4 bg-card hover:bg-muted/30 transition-colors rounded-lg">
            <div className="flex-shrink-0 pt-1">
                <Avatar className="h-8 w-8">
                    {comentario.apelido ? (
                        <img src={autorAvatar} alt={autorNome} />
                    ) : (
                        <AvatarFallback className="bg-muted">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                    )}
                </Avatar>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 text-sm">
                    <p className={`font-semibold ${comentario.apelido ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                        @{autorNome}
                    </p>
                    <span className="text-xs text-muted-foreground">• {formatarTempoAtras(comentario.criado_em)}</span>
                </div>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{comentario.conteudo}</p>
                
                {/* Ações e Reações */}
                <div className="flex items-center space-x-4 mt-2">
                    {/* Botão de Reação */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs h-6 px-2 ${reagindo ? 'opacity-50' : 'hover:text-secondary'}`}
                        onClick={handleReagir}
                        disabled={reagindo}
                    >
                        <Heart className="mr-1 h-3 w-3" />
                        {reacoes}
                    </Button>
                    
                    {/* Placeholder: Responder (Se for uma thread) */}
                    <Button
                        variant="link"
                        size="sm"
                        className="text-xs h-6 px-0 text-primary/70 hover:text-primary"
                    >
                        Responder
                    </Button>
                </div>
            </div>
        </div>
    );
};


// --- Componente Principal: Lista de Comentários ---

export function ListaComentarios({ postId, onCommentCountUpdate }: ListaComentariosProps) {
    const { estaLogado, usuario, atualizarPostsComentarios } = useAuth();
    const { toast } = useToast();
    
    // Lógica do Formulário
    const [novoComentario, setNovoComentario] = useState("");
    const [compartilharNome, setCompartilharNome] = useState(false); 
    const [moderando, setModerando] = useState(false);

    // Lógica do Feed de Comentários
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [carregandoComentarios, setCarregandoComentarios] = useState(true);
    const [pagina, setPagina] = useState(0); 
    const [temMais, setTemMais] = useState(true); 
    const totalComentariosRef = useRef(0);
    
    // Limites (pega do use-auth)
    const comentariosFeitosHoje = usuario?.limites.comentariosDiarios ?? 0;
    const limiteMaximoComentarios = usuario?.plano === "gratuito" ? 3 : Infinity;
    
    const podeComentar = novoComentario.trim().length > 0;
    const limiteAtingido = comentariosFeitosHoje >= limiteMaximoComentarios;

    // --- Lógica de Busca de Comentários (Paginação) ---
    const fetchComentarios = useCallback(async (page: number) => {
        // Se a página atual for 0 e já tivermos dados, não carrega de novo. (Melhorado pelo useEffect)
        if (page > 0 && !temMais) return; 

        setCarregandoComentarios(true);
        const offset = page * PAGE_SIZE;

        let query = supabase
            .from('comments')
            .select(`
                id,
                autor_id,
                conteudo,
                criado_em, status,
                total_reacoes,
                profiles (apelido)
            `, { count: 'exact' }) 
            .eq('post_id', postId)
            .eq('status', 'ativo')
            .order('criado_em', { ascending: false }) // Mais recente primeiro
            .range(offset, offset + PAGE_SIZE - 1); 

        const { data, error, count } = await query;
        
        if (error) {
            console.error("Erro ao buscar comentários:", error);
            // setTemMais(false);
            setCarregandoComentarios(false);
            // Não retorna para não dar o loop, apenas mostra o erro
            return;
        }

        // Mapeamento: Converte created_at (DB) para a interface Comentario
        const mappedComments: Comentario[] = data.map((item: any) => { // Type 'any' temporário para o DB criado_em
            const autorNome = item.profiles?.apelido || "Anônimo";
            return {
                ...item,
                apelido: autorNome,
                avatar: gerarAvatarPlaceholder(autorNome),
                criado_em: item.criado_em, // Puxa do DB
            };
        });

        // Adiciona novos comentários ao estado
        setComentarios(prev => page === 0 ? mappedComments : [...prev, ...mappedComments]);
        
        // CORREÇÃO DA LÓGICA DE TEM MAIS: Usa a contagem total (count) para ser mais preciso
        totalComentariosRef.current = count ?? 0;
        const totalCarregado = (page * PAGE_SIZE) + mappedComments.length;

        setTemMais(totalCarregado < totalComentariosRef.current); // Se carregamos menos que o total, tem mais
        onCommentCountUpdate(count ?? 0); 
        
        setCarregandoComentarios(false);
    }, [postId, onCommentCountUpdate, toast, temMais]); // Adicionado temMais ao dependency array


    // Efeito de inicialização
    useEffect(() => {
        // Se o postID mudar, reseta e carrega a primeira página
        setComentarios([]);
        setPagina(0);
        setTemMais(true); // Tenta carregar a primeira página sempre
        fetchComentarios(0);
        
    }, [postId]); // Só roda quando o postId muda

    // Lógica para Carregar Mais
    const handleCarregarMais = () => {
        if (!carregandoComentarios && temMais) {
            const proximaPagina = pagina + 1;
            setPagina(proximaPagina);
            fetchComentarios(proximaPagina);
        }
    };
    
    // --- Lógica de Adicionar Comentário (Mantida) ---
    const handleAdicionarComentario = async () => {
        if (!estaLogado || !usuario || limiteAtingido || moderando || !podeComentar) return;

        setModerando(true);
        
        // CORREÇÃO DE ANONIMATO: Se for para compartilhar o nome, usa o ID. Senão, usa NULL.
        const autorId = compartilharNome ? usuario.id : null; 

        const novoComentarioData = {
          post_id: postId, // Chave do post
          autor_id: autorId, 
          conteudo: novoComentario,
        };
        
        const { data: newCommentArray, error } = await supabase
          .from('comments')
          .insert([novoComentarioData])
          .select(`
            id,
            autor_id,
            conteudo,
            criado_em,
            status,
            total_reacoes,
            profiles (apelido)
          `); 

        setModerando(false);

        if (error) {
          console.error("Erro ao comentar:", error);
          toast({ title: "Erro no Comentário", description: "Não foi possível publicar seu comentário.", variant: "destructive" });
          return;
        }
        
        // Mapeamento do comentário recém-criado
        const novoComentarioMapeado = newCommentArray.map((item: any) => {
            const autorNome = item.profiles?.apelido || "Anônimo";
            return {
                ...item,
                apelido: autorNome,
                avatar: gerarAvatarPlaceholder(autorNome),
                criado_em: item.criado_em,
            };
        })[0];

        setComentarios(prev => [novoComentarioMapeado, ...prev]); 
        setNovoComentario(""); // Limpa o formulário
        atualizarPostsComentarios("comentario", 1); 
        
        // Atualiza a contagem total no estado local e no post 
        totalComentariosRef.current += 1;
        onCommentCountUpdate(totalComentariosRef.current);
        
        toast({ title: "Comentário publicado!", description: "Seu comentário foi adicionado ao post." });
    };


    return (
        <div className="space-y-6">
            
            {/* 1. Formulário de Comentário (Mantido) */}
            <div className="bg-muted/30 p-4 rounded-xl border animate-slide-up">
                {/* ... (cabeçalho, textarea e botões mantidos) ... */}
                <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-8 w-8">
                        {estaLogado && usuario?.avatar ? (
                            <img src={usuario.avatar} alt={usuario.apelido} />
                        ) : (
                            <AvatarFallback>
                                <UserIcon className="h-4 w-4 text-primary" />
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <p className="font-semibold text-sm text-foreground">
                        {estaLogado ? `@${usuario?.apelido}` : "Anônimo"}
                    </p>
                    {limiteAtingido && (
                        <Badge variant="destructive" className="animate-pulse">
                            Limite Diário!
                        </Badge>
                    )}
                </div>

                <Textarea
                    placeholder={estaLogado ? "Comente aqui..." : "Faça login para comentar."}
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    className="flex-1 min-h-[80px] max-h-[160px] resize-y"
                    disabled={!estaLogado || limiteAtingido || moderando}
                />
                
                {/* Linha de Ações */}
                <div className="flex justify-between items-center mt-3">
                    {/* Switch de Anonimato */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="anonimo-comment-switch"
                            checked={!compartilharNome}
                            onCheckedChange={(checked) => setCompartilharNome(!checked)}
                            disabled={!estaLogado}
                        />
                        <Label htmlFor="anonimo-comment-switch" className="text-sm font-medium text-muted-foreground cursor-pointer">
                            Comentar Anonimamente
                        </Label>
                    </div>

                    {/* Botão de Comentar */}
                    <Button 
                        onClick={handleAdicionarComentario} 
                        disabled={!podeComentar || !estaLogado || limiteAtingido || moderando}
                        className="bg-primary hover:bg-primary-hover"
                    >
                        {moderando ? (
                            <ShieldCheck className="mr-2 h-4 w-4 animate-pulse" />
                        ) : (
                            <CornerDownRight className="mr-2 h-4 w-4" />
                        )}
                        {moderando ? "Moderando..." : "Comentar"}
                    </Button>
                </div>

                {/* Status do Limite */}
                {estaLogado && !limiteAtingido && (
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                        {usuario?.plano === "gratuito" ? 
                            `Você tem ${limiteMaximoComentarios - comentariosFeitosHoje} comentários restantes hoje.` 
                            : "Comentários ILIMITADOS (Premium)!"
                        }
                    </p>
                )}

                {!estaLogado && (
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                        Faça login no cabeçalho para comentar.
                    </p>
                )}
            </div>

            <Separator />

            {/* 2. Lista de Comentários */}
            <div className="space-y-4 pt-4">
                {/* Loader ou Mensagem de Vazio */}
                {carregandoComentarios && comentarios.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                        <span className="ml-3 text-sm text-primary">Buscando comentários...</span>
                    </div>
                ) : comentarios.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        Seja o primeiro a comentar!
                    </p>
                ) : (
                    comentarios.map((comentario, index) => (
                        <React.Fragment key={comentario.id}>
                            <ComentarioCard comentario={comentario} />
                            {/* Adiciona separador entre comentários */}
                            {index < comentarios.length - 1 && <Separator className="bg-border/50" />}
                        </React.Fragment>
                    ))
                )}
                
                {/* Botão Carregar Mais (Só aparece se tiver mais e se não estiver carregando) */}
                {temMais && (
                    <div className="flex justify-center pt-4 pb-8">
                        {carregandoComentarios ? (
                             <div className="flex items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                                <span className="ml-3 text-sm text-primary">Carregando...</span>
                            </div>
                        ) : (
                            <Button 
                                onClick={handleCarregarMais} 
                                variant="outline" 
                                className="w-full max-w-sm"
                            >
                                Carregar mais comentários
                            </Button>
                        )}
                    </div>
                )}
            </div>
            
        </div>
    );
}