// src/pages/Index.tsx

import { useState, useEffect, useCallback } from "react"; 
import { Cabecalho } from "@/components/Cabecalho";
import { CartaoPost } from "@/components/CartaoPost";
import { CaixaPostar } from "@/components/CaixaPostar";
import { BarraFiltros } from "@/components/BarraFiltros";
import { StatusUsuario } from "@/components/StatusUsuario";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth"; 
import { supabase } from "@/lib/supabase"; 
import { LogIn } from "lucide-react"; 
import { useNavigate } from "react-router-dom"; 

// Interfaces
export interface Post {
    id: string; 
    autor_id: string | null; 
    tipo: "desabafo" | "confissao" | "fofoca";
    conteudo: string;
    criado_em: string; 
    total_comentarios: number;
    total_reacoes: number;
    em_alta: boolean;
    autor_apelido: string | null;
    anonimo: boolean;
    ja_curtiu: boolean; 
}

interface PostFromDB {
    id: string; 
    autor_id: string | null; 
    tipo: "desabafo" | "confissao" | "fofoca";
    conteudo: string;
    created_at: string;
    total_comentarios: number;
    total_reacoes: number;
    em_alta: boolean;
    status: string;
    anonimo: boolean;
    profiles: {
        apelido: string;
    } | null;
}

const AvisoLoginCard = () => (
    <div className="p-6 space-y-4 bg-card border rounded-lg shadow-lg animate-fade-in text-center">
      <LogIn className="h-8 w-8 text-primary mx-auto mb-2" />
      <h3 className="text-xl font-bold">Quase lá!</h3>
      <p className="text-sm text-muted-foreground">
        Faça login no cabeçalho para poder postar seu desabafo.
      </p>
    </div>
);

const Index = () => {
    const { toast } = useToast();
    const navigate = useNavigate(); 
    const { usuario, estaLogado, estaCarregando, atualizarPostsComentarios } = useAuth(); 

    const [filtroOrdem, setFiltroOrdem] = useState<"emAlta" | "recentes">("emAlta");
    const [filtroCategoria, setFiltroCategoria] = useState<"tudo" | "desabafo" | "confissao" | "fofoca">("tudo");
    const [posts, setPosts] = useState<Post[]>([]); 
    const [carregandoPosts, setCarregandoPosts] = useState(true);

    const fetchPosts = useCallback(async () => {
        setCarregandoPosts(true); 

        try {
            // CORREÇÃO AQUI: Usamos 'profiles:profiles!posts_autor_id_fkey' para desambiguar
            let query = supabase
              .from('posts')
              .select(`
                id, autor_id, tipo, conteudo, created_at,
                total_comentarios, total_reacoes, em_alta, anonimo, 
                profiles:profiles!posts_autor_id_fkey (apelido)
              `);
              
            if (filtroCategoria !== "tudo") query = query.eq('tipo', filtroCategoria);
            
            if (filtroOrdem === "recentes") {
                const twentyFourHoursAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();
                query = query.gte('created_at', twentyFourHoursAgo).order('created_at', { ascending: false });
            } else { 
                query = query.order('total_reacoes', { ascending: false }).order('created_at', { ascending: false }); 
            }

            query = query.eq('status', 'ativo'); 
            const { data: postsData, error } = await query.limit(50); 
            
            if (error) {
                console.error("Erro SQL Posts:", error);
                throw error; 
            }

            // 2. Busca os Likes (BLINDADO)
            let meusLikes = new Set();
            if (usuario?.id) {
                try {
                    const { data: likesData, error: likesError } = await supabase
                        .from('post_reacoes')
                        .select('post_id')
                        .eq('user_id', usuario.id);
                    
                    if (!likesError && likesData) {
                        likesData.forEach(l => meusLikes.add(l.post_id));
                    }
                } catch (err) {
                    console.warn("Erro ao buscar likes:", err);
                }
            }

            // 3. Combina tudo
            const mappedPosts: Post[] = (postsData || []).map((item: PostFromDB) => ({
              ...item,
              criado_em: item.created_at, 
              autor_apelido: item.profiles?.apelido || null,
              anonimo: item.anonimo ?? false, 
              ja_curtiu: meusLikes.has(item.id) 
            }));
            
            setPosts(mappedPosts);

        } catch (error: any) {
            console.error("Erro crítico no Feed:", error);
            if (error.code === 'PGRST201') {
                 toast({ title: "Erro de Conflito", description: "Muitas conexões entre tabelas. O código foi corrigido?", variant: "destructive" });
            } else {
                 toast({ title: "Erro de Feed", description: "Não foi possível carregar os posts.", variant: "destructive" });
            }
        } finally {
            setCarregandoPosts(false);
        }
    }, [filtroCategoria, filtroOrdem, toast, usuario?.id]); 

    useEffect(() => {
      fetchPosts();
    }, [fetchPosts]);

    const handlePostar = async (conteudo: string, categoria: "desabafo" | "confissao" | "fofoca", compartilharNome: boolean) => {
        if (!estaLogado || !usuario) {
          toast({ title: "Login necessário", variant: "destructive" }); return;
        }
        const limiteMaximoPosts = usuario.plano === "gratuito" ? 1 : Infinity;
        if (usuario.limites.postsDiarios >= limiteMaximoPosts) {
          toast({ title: "Limite atingido", description: "Vire Premium!", variant: "destructive" }); return;
        }
        
        const novoPostData = {
          autor_id: usuario.id,
          tipo: categoria,
          conteudo: conteudo,
          anonimo: !compartilharNome
        };
        
        // CORREÇÃO AQUI TAMBÉM: profiles:profiles!posts_autor_id_fkey
        const { data: newPostArray, error } = await supabase
          .from('posts')
          .insert([novoPostData])
          .select(`*, profiles:profiles!posts_autor_id_fkey (apelido)`); 

        if (error) {
          console.error("Erro ao postar:", error);
          toast({ title: "Erro", description: error.message, variant: "destructive" }); return;
        }

        const novoPost: Post = newPostArray.map((item: any) => ({
            ...item,
            criado_em: item.created_at, 
            autor_apelido: item.profiles?.apelido || null,
            ja_curtiu: false 
        }))[0];
        
        setPosts((prev) => [novoPost, ...prev]); 
        atualizarPostsComentarios("post", 1); 
        toast({ title: "Post publicado!" });
    };

    const handleCommentCountUpdate = (postId: string, newCount: number) => {
      setPosts(prevPosts =>
        prevPosts.map(post => post.id === postId ? { ...post, total_comentarios: newCount } : post)
      );
    };
    
    const abrirPost = (postId: string) => navigate(`/post/${postId}`); 
    const isNovo = (post: Post) => new Date(post.criado_em) > new Date(Date.now() - (24 * 60 * 60 * 1000));

    if (estaCarregando) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Cabecalho /> 
        <main className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <BarraFiltros
                filtroOrdem={filtroOrdem}
                filtroCategoria={filtroCategoria}
                aoMudarOrdem={setFiltroOrdem}
                aoMudarCategoria={setFiltroCategoria}
              />
              <div className="space-y-4">
                {carregandoPosts ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>
                ) : posts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">Nenhum post encontrado.</p>
                ) : (
                  posts.map((post) => (
                    <CartaoPost
                      key={post.id}
                      post={{
                          ...post,
                          dataPublicacao: post.criado_em, 
                          totalComentarios: post.total_comentarios,
                          totalReacoes: post.total_reacoes,
                          emAlta: post.em_alta,
                          novo: isNovo(post),
                          autor: post.autor_apelido, 
                      }}
                      aoClicar={() => abrirPost(post.id)}
                      onCommentCountUpdate={handleCommentCountUpdate} 
                    />
                  ))
                )}
              </div>
            </div>
            <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
              {estaLogado && !estaCarregando ? (
                  <CaixaPostar aoPostar={handlePostar} estaCarregando={false} />
              ) : (
                  <AvisoLoginCard />
              )}
              {estaLogado && usuario && (
                <StatusUsuario
                  postsHoje={usuario.limites.postsDiarios}
                  comentariosHoje={usuario.limites.comentariosDiarios}
                  limitePostsDiarios={usuario.plano === "gratuito" ? 1 : Infinity}
                  limiteComentariosDiarios={usuario.plano === "gratuito" ? 3 : Infinity}
                  aoClicarPremium={() => navigate("/premium")} 
                />
              )}
              <div className="hidden lg:block">
                <div className="bg-muted rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-border"><p className="text-sm text-muted-foreground">Publicidade</p></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
};

export default Index;