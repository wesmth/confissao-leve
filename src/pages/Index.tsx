// src/pages/Index.tsx (CÓDIGO COMPLETO COM FILTRO DE 24 HORAS)

/**
 * Página Principal - DesabafaAí
 * * Página inicial do aplicativo que contém:
 * - Cabeçalho com autenticação
 * - Feed de posts com filtros
 * - Barra lateral com formulário de postagem e status do usuário
 * - Sistema de temas (claro/escuro)
 */

import { useState, useEffect, useCallback } from "react"; 
import { Cabecalho } from "@/components/Cabecalho";
import { CartaoPost } from "@/components/CartaoPost";
import { CaixaPostar } from "@/components/CaixaPostar";
import { BarraFiltros } from "@/components/BarraFiltros";
import { StatusUsuario } from "@/components/StatusUsuario";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth"; 
import { Button } from "@/components/ui/button"; 
import { supabase } from "@/lib/supabase"; 
import { LogIn } from "lucide-react"; 
import { formatarTempoAtras } from "@/lib/utilidades"; 

// --- Tipagem ---
export interface Post {
    id: string; // UUID do DB
    autor_id: string | null; 
    tipo: "desabafo" | "confissao" | "fofoca";
    conteudo: string;
    criado_em: string; // Criado em (Nome da interface)
    total_comentarios: number;
    total_reacoes: number;
    em_alta: boolean;
    autor_apelido: string | null;
}

interface PostFromDB {
    id: string; 
    autor_id: string | null; 
    tipo: "desabafo" | "confissao" | "fofoca";
    conteudo: string;
    created_at: string; // created_at (Nome real do DB)
    total_comentarios: number;
    total_reacoes: number;
    em_alta: boolean;
    status: string;
    profiles: {
        apelido: string;
    } | null;
}


// --- Componente auxiliar: Aviso de Login (Simples) ---
const AvisoLoginCard = () => (
    <div className="p-6 space-y-4 bg-card border rounded-lg shadow-lg animate-fade-in text-center">
      <LogIn className="h-8 w-8 text-primary mx-auto mb-2" />
      <h3 className="text-xl font-bold">Quase lá!</h3>
      <p className="text-sm text-muted-foreground">
        Faça login no cabeçalho para poder postar seu desabafo.
      </p>
    </div>
);


// --- 2. COMPONENTE PRINCIPAL ---

const Index = () => {
    const { toast } = useToast();
    
    // Usa HOOKS GLOBAIS
    const { 
        usuario, 
        estaLogado, 
        estaCarregando,
        atualizarPostsComentarios
    } = useAuth(); 

    // Estados
    const [filtroOrdem, setFiltroOrdem] = useState<"emAlta" | "recentes">("emAlta");
    const [filtroCategoria, setFiltroCategoria] = useState<"tudo" | "desabafo" | "confissao" | "fofoca">("tudo");
    const [posts, setPosts] = useState<Post[]>([]); 
    const [carregandoPosts, setCarregandoPosts] = useState(true);

    // --- Lógica de Busca de Posts (Feed) - CORRIGIDA COM FILTRO DE 24H ---
    const fetchPosts = useCallback(async () => {
        setCarregandoPosts(true);

        let query = supabase
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
            profiles (apelido)
          `);
          
        if (filtroCategoria !== "tudo") {
          query = query.eq('tipo', filtroCategoria);
        }
        
        // NOVO FILTRO: Se for "Recentes", filtra pelas últimas 24 horas
        if (filtroOrdem === "recentes") {
            // Calcula o timestamp de 24 horas atrás no formato ISO
            const twentyFourHoursAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString();
            
            // Adiciona o filtro: created_at >= 24 horas atrás
            query = query.gte('created_at', twentyFourHoursAgo);
            
            // Ordena apenas pelo mais recente
            query = query.order('created_at', { ascending: false });
            
        } else { 
            // Lógica original para "Em Alta"
            query = query.order('total_reacoes', { ascending: false });
            query = query.order('created_at', { ascending: false }); 
        }

        // Filtro base: posts ativos
        query = query.eq('status', 'ativo'); 

        const { data, error } = await query.limit(50); 

        if (error) {
          console.error("Erro ao buscar posts:", error);
          toast({ title: "Erro de Feed", description: "Não foi possível carregar os posts.", variant: "destructive" });
          setCarregandoPosts(false);
          return;
        }

        // Mapeamento: Converte created_at (DB) para criado_em (Interface React)
        const mappedPosts: Post[] = data.map((item: PostFromDB) => ({
          ...item,
          criado_em: item.created_at, // <<-- MAPEAMENTO AQUI
          autor_apelido: item.profiles?.apelido || null, 
        }));
        
        setPosts(mappedPosts);
        setCarregandoPosts(false);
    }, [filtroCategoria, filtroOrdem, toast]);


    // Efeito para carregar os posts
    useEffect(() => {
      fetchPosts();
    }, [fetchPosts]);


    // --- Lógica de Postagem Real ---
    const handlePostar = async (conteudo: string, categoria: "desabafo" | "confissao" | "fofoca", compartilharNome: boolean) => {
        if (!estaLogado || !usuario) {
          toast({ title: "Ops!", description: "Você precisa estar logado para postar.", variant: "destructive" });
          return;
        }

        const limiteMaximoPosts = usuario.plano === "gratuito" ? 1 : Infinity;
        if (usuario.limites.postsDiarios >= limiteMaximoPosts) {
          toast({ title: "Limite atingido", description: "Você já fez seu post de hoje. Vire Premium!", variant: "destructive" });
          return;
        }
        
        // CORREÇÃO DE ANONIMATO: Se for para compartilhar o nome, usa o ID. Senão, usa NULL.
        const autorId = compartilharNome ? usuario.id : null; 
        
        const novoPostData = {
          autor_id: autorId, 
          tipo: categoria,
          conteudo: conteudo,
        };
        
        // Seleciona todas as colunas necessárias, incluindo o nome real do DB: created_at
        const { data: newPostArray, error } = await supabase
          .from('posts')
          .insert([novoPostData])
          .select(`
            id,
            autor_id,
            tipo,
            conteudo,
            created_at,
            total_comentarios,
            total_reacoes,
            em_alta,
            profiles (apelido)
          `); 

        if (error) {
          console.error("Erro ao postar:", error);
          toast({ title: "Erro na Postagem", description: error.message, variant: "destructive" });
          return;
        }

        // Mapeamento: Converte created_at (DB) para criado_em (Interface React)
        const novoPost: Post = newPostArray.map((item: PostFromDB) => ({
            ...item,
            criado_em: item.created_at, 
            autor_apelido: item.profiles?.apelido || null, 
        }))[0];
        
        setPosts((prev) => [novoPost, ...prev]); 
        atualizarPostsComentarios("post", 1); 

        toast({ title: "Post publicado!", description: "Seu desabafo foi compartilhado." });
    };


    // --- Funções Auxiliares ---
    const handleCommentCountUpdate = (postId: string, newCount: number) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, total_comentarios: newCount } : post
        )
      );
    };
    
    const abrirPost = (postId: string) => {
      toast({ title: "Em desenvolvimento", description: `Abrindo post #${postId}...` });
    };

    const isNovo = (post: Post) => {
      const dataPostagem = new Date(post.criado_em);
      const vinteQuatroHorasAtras = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
      return dataPostagem > vinteQuatroHorasAtras;
    };

    if (estaCarregando) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Cabeçalho */}
        <Cabecalho /> 

        {/* Conteúdo Principal */}
        <main className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal - Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Barra de Filtros */}
              <BarraFiltros
                filtroOrdem={filtroOrdem}
                filtroCategoria={filtroCategoria}
                aoMudarOrdem={setFiltroOrdem}
                aoMudarCategoria={setFiltroCategoria}
              />

              {/* Lista de Posts */}
              <div className="space-y-4">
                {carregandoPosts ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                    <p className="ml-3 text-muted-foreground">Carregando posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    Nenhum post encontrado com esses filtros. Seja o primeiro a postar!
                  </p>
                ) : (
                  posts.map((post) => (
                    <CartaoPost
                      key={post.id}
                      post={{
                          id: post.id,
                          tipo: post.tipo,
                          conteudo: post.conteudo,
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

            {/* Coluna Lateral - Sticky */}
            <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
              
              {/* Caixa de Postar ou Aviso de Login */}
              {estaLogado && !estaCarregando ? (
                  <CaixaPostar aoPostar={handlePostar} estaCarregando={false} />
              ) : (
                  <AvisoLoginCard />
              )}

              {/* Status do Usuário (apenas se logado) */}
              {estaLogado && usuario && (
                <StatusUsuario
                  postsHoje={usuario.limites.postsDiarios}
                  comentariosHoje={usuario.limites.comentariosDiarios}
                  limitePostsDiarios={usuario.plano === "gratuito" ? 1 : Infinity}
                  limiteComentariosDiarios={usuario.plano === "gratuito" ? 3 : Infinity}
                  aoClicarPremium={() => toast({ title: "Premium", description: "Página de upgrade em desenvolvimento!", })}
                />
              )}

              {/* Placeholder de Anúncio */}
              <div className="hidden lg:block">
                <div className="bg-muted rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-border">
                  <p className="text-sm text-muted-foreground">
                    Espaço Publicitário
                    <br />
                    300x250
                  </p>
                </div>
              </div>

              {/* Rodapé */}
              <div className="text-center space-y-2 text-xs text-muted-foreground pt-4">
                <p>
                  <a href="/regras" className="hover:underline">
                    Regras da Casa
                  </a>
                  {" • "}
                  <a href="/premium" className="hover:underline">
                    Premium
                  </a>
                </p>
                <p className="font-medium">
                  Um projeto de <span className="text-primary">Weslen Matheus</span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
};

export default Index;