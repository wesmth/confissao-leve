// src/pages/PostDetalhe.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Cabecalho } from "@/components/Cabecalho";
import { CartaoPost } from "@/components/CartaoPost";
import { ListaComentarios } from "@/components/ListaComentarios";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Interface compatível com o CartaoPost
interface PostDetalheType {
    id: string;
    autor_id: string | null;
    tipo: "desabafo" | "confissao" | "fofoca";
    conteudo: string;
    created_at: string;
    total_comentarios: number;
    total_reacoes: number;
    em_alta: boolean;
    anonimo: boolean;
    ja_curtiu: boolean;
    profiles: {
        apelido: string;
    } | null;
}

const PostDetalhe = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { usuario, estaCarregando: authCarregando } = useAuth();
    const { toast } = useToast();

    const [post, setPost] = useState<PostDetalheType | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    // Função de buscar o post individual
    const carregarPost = useCallback(async () => {
        if (!id) return;
        setCarregando(true);
        setErro(false);

        try {
            // 1. Busca o Post com a relação explícita do autor
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .select(`
                    id, autor_id, tipo, conteudo, created_at,
                    total_comentarios, total_reacoes, em_alta, anonimo,
                    profiles:profiles!posts_autor_id_fkey (apelido) 
                `)
                .eq('id', id)
                .single(); // .single() retorna um objeto direto, ou erro se não achar

            if (postError) throw postError;

            // 2. Verifica se o usuário logado curtiu este post específico
            let curtiu = false;
            if (usuario?.id) {
                const { data: likeData } = await supabase
                    .from('post_reacoes')
                    .select('post_id')
                    .eq('post_id', id)
                    .eq('user_id', usuario.id)
                    .maybeSingle(); // maybeSingle não dá erro se não achar
                
                if (likeData) curtiu = true;
            }

            // 3. Monta o objeto final
            const postFormatado: PostDetalheType = {
                ...postData,
                // Garante que anonimo seja booleano (para posts antigos)
                anonimo: postData.anonimo ?? false,
                ja_curtiu: curtiu
            };

            setPost(postFormatado);

        } catch (error: any) {
            console.error("Erro ao carregar post:", error);
            setErro(true);
        } finally {
            setCarregando(false);
        }
    }, [id, usuario?.id]);

    useEffect(() => {
        carregarPost();
    }, [carregarPost]);

    // Função para atualizar contador quando comentar
    const handleCommentCountUpdate = (postId: string, newCount: number) => {
        if (post && post.id === postId) {
            setPost({ ...post, total_comentarios: newCount });
        }
    };

    if (authCarregando || carregando) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (erro || !post) {
        return (
            <div className="min-h-screen bg-background">
                <Cabecalho />
                <main className="container py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="bg-destructive/10 p-4 rounded-full">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold">Post não encontrado</h2>
                    <p className="text-muted-foreground max-w-md">
                        Esse desabafo pode ter sido removido ou não existe mais.
                    </p>
                    <Button onClick={() => navigate("/")} variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para o Feed
                    </Button>
                </main>
            </div>
        );
    }

    // Adaptador para o componente CartaoPost (que espera nomes de props específicos)
    const postParaCartao = {
        id: post.id,
        tipo: post.tipo,
        conteudo: post.conteudo,
        dataPublicacao: post.created_at,
        totalComentarios: post.total_comentarios,
        totalReacoes: post.total_reacoes,
        emAlta: post.em_alta,
        novo: false, // Detalhe não precisa da badge "Novo"
        autor: post.profiles?.apelido || null,
        anonimo: post.anonimo,
        ja_curtiu: post.ja_curtiu
    };

    return (
        <div className="min-h-screen bg-background">
            <Cabecalho />

            <main className="container py-8 max-w-3xl">
                <Button 
                    variant="ghost" 
                    className="mb-6 pl-0 hover:bg-transparent hover:text-primary"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>

                <div className="space-y-8 animate-fade-in">
                    {/* O Cartão do Post Expandido */}
                    <CartaoPost 
                        post={postParaCartao}
                        aoClicar={() => {}} // Já estamos no detalhe, clique não faz nada
                        onCommentCountUpdate={handleCommentCountUpdate}
                        expandido={true}
                    />

                    {/* Seção de Comentários */}
                    <div className="pt-4">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            Comentários 
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                                ({post.total_comentarios})
                            </span>
                        </h3>
                        
                        <ListaComentarios 
                            postId={post.id} 
                            onCommentCountUpdate={handleCommentCountUpdate}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PostDetalhe;