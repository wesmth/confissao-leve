// src/pages/PostDetalhe.tsx

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Heart, User, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatarTempoAtras } from "@/lib/utilidades";
import { supabase } from "@/lib/supabase";
import { ListaComentarios } from "@/components/ListaComentarios";
import { Post } from "./Index"; 

// --- Subcomponente: Card do Post Expandido ---
interface PostExpandidoProps {
    post: Post;
    isMobile: boolean;
}

const PostExpandido = ({ post, isMobile }: PostExpandidoProps) => {
    
    const categoriaClasses: { [key in Post["tipo"]]: string } = {
        desabafo: "bg-desabafo text-desabafo-foreground",
        confissao: "bg-confissao text-confissao-foreground",
        fofoca: "bg-fofoca text-fofoca-foreground",
    };

    const isNovo = useMemo(() => {
        const dataPostagem = new Date(post.criado_em);
        const vinteQuatroHorasAtras = new Date(Date.now() - (24 * 60 * 60 * 1000));
        return dataPostagem > vinteQuatroHorasAtras;
    }, [post.criado_em]);
    
    const isEmAlta = post.em_alta && !isNovo;
    const autorNome = post.autor_apelido || "Anônimo";

    return (
        <Card className="animate-fade-in shadow-xl border-2 w-full max-w-full overflow-hidden"> {/* Adicionado overflow-hidden no Card pai por segurança */}
            <CardHeader className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    {/* Autor */}
                    <div className="flex items-center space-x-3">
                        {post.autor_apelido && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                        )}
                        <p className={`font-semibold text-sm ${post.autor_apelido ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                            @{autorNome}
                        </p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center space-x-2">
                        {isNovo && (
                            <Badge className="bg-novo text-white hover:bg-novo/80">
                                <Clock className="h-3 w-3 mr-1" /> Novo
                            </Badge>
                        )}
                        {isEmAlta && (
                            <Badge className="bg-trending text-white hover:bg-trending/80">
                                <Sparkles className="h-3 w-3 mr-1" /> Em Alta
                            </Badge>
                        )}
                        <Badge className={`${categoriaClasses[post.tipo]} capitalize`}>
                            {post.tipo}
                        </Badge>
                    </div>
                </div>

                <Separator />
                
                <CardTitle className="text-xl font-bold pt-2">
                    {post.tipo === 'desabafo' ? 'Desabafo:' : post.tipo === 'confissao' ? 'Confissão:' : 'Fofoca:'}
                </CardTitle>
            </CardHeader>

            <CardContent className="w-full">
                {/* AQUI A MÁGICA: break-words força a quebra de palavras longas */}
                <p className="text-lg whitespace-pre-wrap break-words text-foreground leading-relaxed w-full">
                    {post.conteudo}
                </p>
            </CardContent>

            <CardFooter className="flex justify-between items-center text-sm pt-4">
                <p className="text-muted-foreground">
                    Publicado {formatarTempoAtras(post.criado_em)}
                </p>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center text-muted-foreground">
                        <MessageCircle className="h-4 w-4 mr-1.5" />
                        <span>{post.total_comentarios}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <Heart className="h-4 w-4 mr-1.5" />
                        <span>{post.total_reacoes}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- O RESTO DO ARQUIVO CONTINUA IGUAL AO ANTERIOR ---
// Vou repetir aqui só pra garantir que você tenha o arquivo completo funcional

const PostDetalhe = () => {
    const { id } = useParams<{ id: string }>(); 
    const navigate = useNavigate();
    
    const [post, setPost] = useState<Post | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const isMobile = useMemo(() => window.innerWidth < 768, []); 

    useEffect(() => {
        window.scrollTo(0, 0);

        if (!id) {
            setErro("ID do post inválido.");
            setCarregando(false);
            return;
        }

        const fetchPost = async () => {
            setCarregando(true);
            setErro(null);

            const { data, error } = await supabase
                .from('posts')
                .select(`
                    id,
                    autor_id,
                    tipo,
                    conteudo,
                    created_at,
                    total_comentarios,
                    total_reacoes,
                    em_alta,
                    status,
                    profiles (apelido)
                `)
                .eq('id', id)
                .single();

            if (error || !data || data.status !== 'ativo') {
                setErro("Post não encontrado ou foi removido.");
                setCarregando(false);
                return;
            }

            const postMapeado: Post = {
                ...data,
                criado_em: data.created_at,
                autor_apelido: data.profiles?.apelido || null,
            };
            
            setPost(postMapeado);
            setCarregando(false);
        };

        fetchPost();
    }, [id]);

    const handleCommentCountUpdate = (_postId: string, newCount: number) => {
        if (post) {
            setPost({
                ...post,
                total_comentarios: newCount
            });
        }
    };

    if (carregando) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    if (erro || !post) {
        return (
            <div className="min-h-screen bg-background">
                 <Cabecalho />
                <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
                    <Card className="text-center p-6 bg-card border rounded-xl shadow-lg max-w-lg w-full">
                        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h1 className="mb-2 text-2xl font-bold text-destructive">Ops!</h1>
                        <p className="mb-6 text-lg text-foreground font-semibold">
                            {erro}
                        </p>
                        <Button onClick={() => navigate("/")} size="lg" className="w-full sm:w-auto">
                            Voltar ao Feed Principal
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-background">
            <Cabecalho />
            
            <main className="container py-8 max-w-4xl px-4 sm:px-6 lg:px-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="mb-6 text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Feed
                </Button>

                <PostExpandido post={post} isMobile={isMobile} />
                
                <Separator className="my-8" />
                
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        <MessageCircle className="h-6 w-6 text-primary" />
                        Comentários ({post.total_comentarios})
                    </h2>
                    
                    <ListaComentarios 
                        postId={post.id} 
                        onCommentCountUpdate={handleCommentCountUpdate} 
                    />
                </div>
            </main>
        </div>
    );
};

export default PostDetalhe;