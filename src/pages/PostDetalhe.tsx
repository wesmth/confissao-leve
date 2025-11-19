// src/pages/PostDetalhe.tsx (CÓDIGO COMPLETO)

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Heart, User, Sparkles, Clock, Ban, AlertTriangle } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatarTempoAtras, gerarAvatarPlaceholder } from "@/lib/utilidades"; // Importa utilidades
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";

// Importa a interface Post do Index.tsx
import { Post } from "./Index"; 
import { ListaComentarios } from "@/components/ListaComentarios"; // Componente para listar comentários

// Componente para exibir um único Post em formato de card expandido
interface PostExpandidoProps {
    post: Post;
    isMobile: boolean; // Para adaptar o layout
}

const PostExpandido = ({ post, isMobile }: PostExpandidoProps) => {
    
    // Lógica para cor da categoria
    const categoriaClasses: { [key in Post["tipo"]]: string } = {
        desabafo: "bg-desabafo text-desabafo-foreground",
        confissao: "bg-confissao text-confissao-foreground",
        fofoca: "bg-fofoca text-fofoca-foreground",
    };

    // Lógica para Tags
    const isNovo = (post: Post) => {
        const dataPostagem = new Date(post.criado_em);
        const vinteQuatroHorasAtras = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
        return dataPostagem > vinteQuatroHorasAtras;
    };
    
    const isEmAlta = post.em_alta && !isNovo(post);
    
    const autorNome = post.autor_apelido || "Anônimo";
    const autorAvatar = gerarAvatarPlaceholder(autorNome);

    return (
        <Card className="animate-fade-in shadow-xl border-2">
            <CardHeader className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    {/* Informações do Autor */}
                    <div className="flex items-center space-x-3">
                        {/* Avatar (só aparece se não for anônimo) */}
                        {post.autor_apelido && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                        )}
                        <p className={`font-semibold text-sm ${post.autor_apelido ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                            @{autorNome}
                            {/* Badge Premium, se tivesse no objeto Post */}
                        </p>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center space-x-2">
                        {isNovo(post) && (
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
            <CardContent>
                {/* CONTEÚDO COMPLETO SEM TRUNCAR */}
                <p className="text-lg whitespace-pre-wrap text-foreground">
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


// ----------------------------------------------------
// PÁGINA PRINCIPAL: PostDetalhe
// ----------------------------------------------------

const PostDetalhe = () => {
    const { id } = useParams<{ id: string }>(); // Pega o ID da URL
    const navigate = useNavigate();
    const { toast } = useToast();
    const { temaEscuro, alternarTema } = useTheme(); // Para o cabeçalho
    const { estaLogado, usuario, logout } = useAuth(); // Para o cabeçalho
    
    const [post, setPost] = useState<Post | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    // Usa useMobile para passar ao subcomponente (adaptação)
    const isMobile = useMemo(() => window.innerWidth < 768, []); 

    // 1. Lógica de Busca do Post
    useEffect(() => {
        if (!id) {
            setErro("ID do post inválido.");
            setCarregando(false);
            return;
        }

        const fetchPost = async () => {
            setCarregando(true);
            setErro(null);

            // Busca o post por ID
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
                .single(); // Espera apenas um resultado

            if (error || !data || data.status !== 'ativo') {
                setErro("Post não encontrado ou foi removido.");
                setCarregando(false);
                return;
            }

            // Mapeia o resultado do DB para a interface Post
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

    // Lógica do loader/erro
    if (carregando) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    // Se der erro ou 404
    if (erro || !post) {
        return (
            <div className="min-h-screen bg-background">
                 <Cabecalho />
                <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
                    <Card className="text-center p-6 bg-card border rounded-xl shadow-lg animate-fade-in max-w-lg">
                        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
                        <h1 className="mb-2 text-2xl font-bold text-destructive">Ops!</h1>
                        <p className="mb-6 text-lg text-foreground font-semibold">
                            {erro}
                        </p>
                        <Button onClick={() => navigate("/")} size="lg">
                            Voltar ao Feed Principal
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }
    
    // Sucesso
    return (
        <div className="min-h-screen bg-background">
            <Cabecalho />
            
            <main className="container py-8 max-w-4xl">
                {/* Botão voltar */}
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="mb-6 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Feed
                </Button>

                {/* 1. O POST EXPANDIDO */}
                <PostExpandido post={post} isMobile={isMobile} />
                
                <Separator className="my-8" />
                
                {/* 2. FEED DE COMENTÁRIOS */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        <MessageCircle className="h-6 w-6 text-primary" />
                        Comentários ({post.total_comentarios})
                    </h2>
                    
                    {/* NOVO COMPONENTE: ListaComentarios (Mockado por enquanto, mas usa lógica real) */}
                    <ListaComentarios 
                        postId={post.id} 
                        // Simula o count update no Card (aqui não precisa, mas é bom manter a prop)
                        onCommentCountUpdate={() => { /* no-op */ }} 
                    />
                </div>

            </main>
        </div>
    );
};

export default PostDetalhe;