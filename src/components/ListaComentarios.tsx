// src/components/ListaComentarios.tsx

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { formatarTempoAtras, gerarAvatarPlaceholder } from "@/lib/utilidades";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Send, User, Loader2, Ghost, Trash2, Heart, CornerDownLeft, X } from "lucide-react";

// --- NOVO: Limite de exibição de respostas ---
const REPLY_DISPLAY_LIMIT = 2;

// Interface Completa e Correta
interface Comentario {
    id: string;
    post_id: string;
    autor_id: string | null;
    conteudo: string;
    created_at: string;
    deleted: boolean;
    total_reacoes: number;
    ja_curtiu: boolean;
    profiles: {
        apelido: string;
    } | null;
    parent_id: string | null; 
}

interface ListaComentariosProps {
    postId: string;
    onCommentCountUpdate: (postId: string, newCount: number) => void;
}

export function ListaComentarios({ postId, onCommentCountUpdate }: ListaComentariosProps) {
    const { usuario, estaLogado } = useAuth();
    const { toast } = useToast();
    
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [novoComentario, setNovoComentario] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [isAnonimo, setIsAnonimo] = useState(false);
    const [excluindoId, setExcluindoId] = useState<string | null>(null);
    const [reagindoComentarioId, setReagindoComentarioId] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<{ id: string, apelido: string, isAnonimo: boolean } | null>(null);
    
    // --- ESTADO PARA CONTROLAR A EXPANSÃO DAS RESPOSTAS ---
    const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({}); // Usa o ID do comentário pai como chave

    // 1. Buscar comentários (Mantido)
    const buscarComentarios = async () => {
        setCarregando(true);
        try {
            const { data: comentariosData, error } = await supabase
                .from('comentarios')
                .select(`
                    id, post_id, autor_id, conteudo, created_at, deleted, total_reacoes, parent_id,
                    profiles:profiles!comentarios_autor_id_fkey (apelido)  
                `)
                .eq('post_id', postId)
                .eq('deleted', false)
                .order('parent_id', { ascending: true, nullsFirst: true }) 
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            let comentariosMapeados: Comentario[] = (comentariosData || []).map((c: any) => ({
                ...c,
                total_reacoes: c.total_reacoes || 0,
                ja_curtiu: false,
            }));

            // Verifica se o usuário logado curtiu algum
            if (usuario?.id && comentariosMapeados.length > 0) {
                const comentarioIds = comentariosMapeados.map(c => c.id);
                
                const { data: likesData } = await supabase
                    .from('comentario_reacoes')
                    .select('comentario_id')
                    .in('comentario_id', comentarioIds)
                    .eq('user_id', usuario.id);

                const meusLikes = new Set(likesData?.map(l => l.comentario_id) || []);

                comentariosMapeados = comentariosMapeados.map(c => ({
                    ...c,
                    ja_curtiu: meusLikes.has(c.id),
                }));
            }
            
            setComentarios(comentariosMapeados);

        } catch (error) {
            console.error("Erro ao buscar comentários:", error);
            toast({ title: "Erro de Carregamento", description: "Não foi possível buscar os comentários.", variant: "destructive" });
        } finally {
            setCarregando(false);
        }
    };
    
    useEffect(() => {
        buscarComentarios();
    }, [postId, usuario?.id]);

    // Função para definir quem está sendo respondido
    const handleSetReplyingTo = (comentario: Comentario) => {
        const apelido = comentario.profiles?.apelido || "Anônimo";
        setReplyingTo({ 
            id: comentario.id, 
            apelido: apelido,
            isAnonimo: !comentario.autor_id
        });
        document.getElementById('comment-form-textarea')?.focus();
    };

    // Função de Enviar Comentário
    const handleEnviarComentario = async () => {
        if (!novoComentario.trim()) return;
        if (!estaLogado) {
            toast({ title: "Login necessário", description: "Faça login para comentar.", variant: "destructive" });
            return;
        }

        setEnviando(true);

        try {
            const autorIdParaComentario = isAnonimo ? null : usuario?.id;

            const { error: erroInsert } = await supabase
                .from('comentarios')
                .insert({
                    post_id: postId, 
                    autor_id: autorIdParaComentario,
                    conteudo: novoComentario.trim(),
                    parent_id: replyingTo?.id || null, 
                });

            if (erroInsert) throw erroInsert;

            setNovoComentario("");
            setIsAnonimo(false); 
            setReplyingTo(null);
            await buscarComentarios(); 
            
            const newCount = comentarios.length + 1;
            onCommentCountUpdate(postId, newCount);
            
            // SE FOR UMA RESPOSTA, expande a thread automaticamente
            if (replyingTo?.id) {
                 setExpandedReplies(prev => ({ ...prev, [replyingTo.id]: true }));
            }

            toast({ 
                title: replyingTo ? "Resposta enviada!" : (isAnonimo ? "Comentário anônimo enviado!" : "Comentário enviado!"), 
            });

        } catch (error: any) {
            console.error("Erro ao enviar:", error);
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        } finally {
            setEnviando(false);
        }
    };

    // Função de Excluir (Soft Delete)
    const handleExcluirComentario = async (comentarioId: string) => {
        setExcluindoId(comentarioId);
        try {
            const { error } = await supabase
                .from('comentarios')
                .update({ deleted: true })
                .eq('id', comentarioId)
                .eq('autor_id', usuario?.id); 

            if (error) throw error;

            const novaLista = comentarios.filter(c => c.id !== comentarioId);
            setComentarios(novaLista);
            onCommentCountUpdate(postId, novaLista.length);

            toast({ title: "Comentário removido." });

        } catch (error: any) {
            console.error("Erro ao excluir:", error);
            toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
        } finally {
            setExcluindoId(null);
        }
    };

    // Função de Reagir no Comentário
    const handleReagirComentario = async (comentario: Comentario) => {
        const { id: comentarioId, autor_id } = comentario;

        const isProprioComentario = usuario?.id && autor_id && usuario.id === autor_id;
        if (isProprioComentario) {
             toast({ title: "Espera aí!", description: "Você não pode curtir seu próprio comentário.", variant: "default" });
             return;
        }

        if (!estaLogado) {
            toast({ title: "Login Necessário", description: "Faça login para reagir!", variant: "default" });
            return;
        }
        
        setReagindoComentarioId(comentarioId);
        
        const novoEstado = !comentario.ja_curtiu;
        const novaLista = comentarios.map(c => {
            if (c.id === comentarioId) {
                return {
                    ...c,
                    ja_curtiu: novoEstado,
                    total_reacoes: novoEstado ? c.total_reacoes + 1 : c.total_reacoes - 1
                };
            }
            return c;
        });
        setComentarios(novaLista);

        try {
            const { data: curtiuAgora, error } = await supabase.rpc('toggle_reacao_comentario', { comentario_row_id: comentarioId });
            
            if (error) throw error;
            
            if (curtiuAgora !== novoEstado) {
                 await buscarComentarios();
            }

        } catch (error: any) {
             console.error("Erro ao reagir no comentário:", error);
             toast({ title: "Erro", description: "Não foi possível registrar sua reação.", variant: "destructive" });
             await buscarComentarios();
        } finally {
            setReagindoComentarioId(null);
        }
    };


    // --- FUNÇÃO DE RENDERIZAÇÃO ANINHADA ---
    const renderComentario = (comentario: Comentario, isReply: boolean = false) => {
        const autorNome = comentario.profiles?.apelido || "Anônimo";
        const isComentarioAnonimo = !comentario.autor_id; 
        const isDono = usuario && comentario.autor_id === usuario.id;
        const avatarUrl = gerarAvatarPlaceholder(autorNome);
        
        const isReagindo = reagindoComentarioId === comentario.id;
        const isProprioComentario = usuario?.id && comentario.autor_id && usuario.id === comentario.autor_id;
        
        // Lógica para respostas
        const parentComentario = isReply ? comentarios.find(c => c.id === comentario.parent_id) : null;
        const parentApelido = parentComentario?.profiles?.apelido || "Anônimo";
        
        // Determina as respostas para este comentário (só se for nível 0)
        const replies = isReply ? [] : commentsByParent[comentario.id] || [];
        const isThreadExpanded = expandedReplies[comentario.id] || false;
        
        // AQUI ESTÁ O SLICE QUE LIMITA AS RESPOSTAS VISÍVEIS
        const repliesToDisplay = isThreadExpanded ? replies : replies.slice(0, REPLY_DISPLAY_LIMIT);
        const hiddenRepliesCount = replies.length - repliesToDisplay.length;


        return (
            <div key={comentario.id} className={`space-y-4`}>
                <div className={`group flex space-x-4 p-4 bg-card border rounded-lg animate-fade-in hover:shadow-md transition-shadow relative ${isReply ? 'ml-0' : ''}`}>
                    
                    {/* AVATAR E INFO */}
                    <div className={`${isReply ? 'ml-[-4px]' : ''}`}> {/* Alinhamento visual da linha de resposta */}
                        <Avatar className={`h-10 w-10 border-2 shadow-sm ${isComentarioAnonimo ? 'border-muted' : 'border-primary/20'}`}>
                            {isComentarioAnonimo ? (
                                    <div className="h-full w-full bg-muted flex items-center justify-center rounded-full">
                                    <Ghost className="h-5 w-5 text-muted-foreground" />
                                    </div>
                            ) : (
                                <>
                                    <AvatarImage src={avatarUrl} alt={autorNome} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </>
                            )}
                        </Avatar>
                    </div>

                    <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className={`text-sm font-bold ${isComentarioAnonimo ? 'text-muted-foreground italic' : 'text-primary'}`}>
                                    @{autorNome}
                                </span>
                                {isReply && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                        em resposta a <span className="font-semibold text-primary/70">@{parentApelido}</span>
                                    </span>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatarTempoAtras(comentario.created_at)}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                
                                {/* BOTÃO DE LIKE NO COMENTÁRIO (Mantido) */}
                                <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost" size="sm"
                                            className={`transition-colors h-8 px-2 
                                                ${comentario.ja_curtiu ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}
                                                ${isProprioComentario ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                            onClick={() => handleReagirComentario(comentario)}
                                            disabled={isReagindo || isProprioComentario}
                                        >
                                            {isReagindo ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                            ) : (
                                                <Heart className={`h-4 w-4 mr-1 ${comentario.ja_curtiu ? 'fill-current' : ''}`} />
                                            )}
                                            <span className="text-xs">{comentario.total_reacoes}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    {isProprioComentario && (
                                        <TooltipContent>
                                            Você não pode curtir seu próprio comentário.
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                                
                                {/* BOTÃO RESPONDER */}
                                {!isReply && ( // Não permite responder respostas aninhadas (para manter 2 níveis)
                                    <Button
                                        variant="ghost" size="sm"
                                        className="h-8 px-2 text-primary/70 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold"
                                        onClick={() => handleSetReplyingTo(comentario)}
                                        disabled={!estaLogado}
                                    >
                                        <CornerDownLeft className="h-3 w-3 mr-1" /> Responder
                                    </Button>
                                )}

                                {/* BOTÃO DE EXCLUIR (Mantido) */}
                                {isDono && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="ghost" size="icon" 
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                disabled={excluindoId === comentario.id}
                                            >
                                                {excluindoId === comentario.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
                                                <AlertDialogDescription>Essa ação ocultará seu comentário.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleExcluirComentario(comentario.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Sim, excluir
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                            {comentario.conteudo}
                        </p>
                    </div>
                </div>
                
                {/* 2. Respostas Aninhadas (usando recursão e indentação) */}
                {replies.length > 0 && (
                    <div className="space-y-4 ml-6 border-l border-border pl-4">
                        {repliesToDisplay.map(r => renderComentario(r, true))} {/* Renderiza resposta como isReply=true */}
                    </div>
                )}
                
                {/* 3. Botão Ver Mais Respostas */}
                {hiddenRepliesCount > 0 && (
                    <div className="flex justify-start pt-2">
                        <Button 
                            variant="link" 
                            onClick={() => setExpandedReplies(prev => ({ ...prev, [comentario.id]: true }))}
                            className="text-sm font-semibold text-primary ml-6" // Alinhamento para a thread
                        >
                            Ver mais {hiddenRepliesCount} {hiddenRepliesCount === 1 ? 'resposta' : 'respostas'}
                        </Button>
                    </div>
                )}
            </div>
        );
    };
    
    // Agrupa os comentários por parent_id
    const commentsByParent = comentarios.reduce((acc, c) => {
        const parentId = c.parent_id || 'root';
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(c);
        return acc;
    }, {} as Record<string, Comentario[]>);

    const rootComments = commentsByParent['root'] || [];

    return (
        <div className="space-y-6">
            <div className="space-y-4 mb-8">
                {carregando ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : rootComments.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                        <p className="text-muted-foreground italic mb-2">Ninguém comentou ainda...</p>
                        <p className="text-sm font-medium text-primary">Seja o primeiro!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rootComments.map(c => renderComentario(c))} 
                    </div>
                )}
            </div>

            {/* FORMULÁRIO (Mantido) */}
            <div className="flex flex-col gap-4 pt-4 border-t bg-background/50 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
                
                {/* Contexto de Resposta */}
                {replyingTo && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg border border-primary/20 animate-fade-in">
                        <p className="text-sm font-medium text-muted-foreground flex items-center">
                            <CornerDownLeft className="h-4 w-4 mr-2" />
                            Respondendo a 
                            <span className={`ml-1 font-bold ${replyingTo.isAnonimo ? 'italic text-muted-foreground' : 'text-primary'}`}>
                                @{replyingTo.apelido}
                            </span>
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                
                {estaLogado && (
                    <div className="flex items-center space-x-2 pb-2">
                        <Switch id="anonimo-mode" checked={isAnonimo} onCheckedChange={setIsAnonimo} />
                        <Label htmlFor="anonimo-mode" className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground">
                            {isAnonimo ? <Ghost className="h-4 w-4" /> : <User />}
                            {isAnonimo ? "Modo Anônimo" : "Comentar publicamente"}
                        </Label>
                    </div>
                )}

                <Textarea 
                    id="comment-form-textarea"
                    placeholder={estaLogado ? (replyingTo ? `Escreva sua resposta para @${replyingTo.apelido}...` : (isAnonimo ? "Comentário anônimo..." : `Comente como @${usuario?.apelido}...`)) : "Faça login para comentar"} 
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    disabled={!estaLogado || enviando}
                    className="min-h-[100px] resize-none bg-background focus-visible:ring-primary"
                />
                
                <div className="flex justify-end">
                    <Button onClick={handleEnviarComentario} disabled={!estaLogado || enviando || !novoComentario.trim()} className={`w-full sm:w-auto ${isAnonimo && estaLogado ? 'bg-slate-600 hover:bg-slate-700' : ''}`}>
                        {enviando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : <>{replyingTo ? "Responder" : "Publicar"}</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}