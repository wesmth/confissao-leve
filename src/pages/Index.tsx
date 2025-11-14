/**
 * Página Principal - DesabafaAí
 * * Página inicial do aplicativo que contém:
 * - Cabeçalho com autenticação
 * - Feed de posts com filtros
 * - Barra lateral com formulário de postagem e status do usuário
 * - Sistema de temas (claro/escuro)
 */

import { useState, useEffect } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { CartaoPost } from "@/components/CartaoPost";
import { CaixaPostar } from "@/components/CaixaPostar";
import { BarraFiltros } from "@/components/BarraFiltros";
import { StatusUsuario } from "@/components/StatusUsuario";
import { useToast } from "@/hooks/use-toast";
import { gerarAvatarPlaceholder } from "@/lib/utilidades";
import { useTheme } from "@/hooks/use-theme"; // Importação Corrigida

// Tipo para os posts
interface Post {
  id: number;
  tipo: "desabafo" | "confissao" | "fofoca";
  conteudo: string;
  dataPublicacao: string;
  totalComentarios: number;
  totalReacoes: number;
  emAlta?: boolean;
  novo?: boolean;
}

// Dados mock para demonstração
const POSTS_MOCK: Post[] = [
  {
    id: 1,
    tipo: "desabafo" as const,
    conteudo:
      "Não aguento mais meu chefe. Ele fica pedindo coisas de última hora e acha que eu sou um robô. Hoje ele pediu pra eu refazer um relatório inteiro 10 minutos antes da reunião. Sério, estou no meu limite e quase mandei tudo praquele lugar.",
    dataPublicacao: "2025-11-14T10:30:00Z",
    totalComentarios: 18,
    totalReacoes: 42,
    emAlta: true,
    novo: false,
  },
  {
    id: 2,
    tipo: "confissao" as const,
    conteudo:
      "Tenho um fetiche muito forte por pés. O problema é que isso tá tomando conta da minha vida. No outro dia, numa reunião de trabalho, a câmera de uma colega caiu e filmou ela descalça. Quase não consegui me concentrar. É bizarro.",
    dataPublicacao: "2025-11-14T09:15:00Z",
    totalComentarios: 5,
    totalReacoes: 12,
    emAlta: false,
    novo: true,
  },
  {
    id: 3,
    tipo: "desabafo" as const,
    conteudo:
      'Cansei, sabe? Tenho um carro e moro sozinho. Parece que meus "amigos" só lembram que eu existo quando precisam de carona pra festa ou um lugar pra fazer "esquenta". Ninguém me chama pra um café ou pra saber como eu tô de verdade.',
    dataPublicacao: "2025-11-13T15:00:00Z",
    totalComentarios: 32,
    totalReacoes: 87,
    emAlta: true,
    novo: false,
  },
  {
    id: 4,
    tipo: "confissao" as const,
    conteudo:
      "Eu roubei dinheiro do cofrinho da minha sobrinha de 5 anos pra comprar cerveja. Sei que é horrível, mas eu estava desesperado. Depois repus em dobro, mas a culpa não passa.",
    dataPublicacao: "2025-11-13T12:20:00Z",
    totalComentarios: 15,
    totalReacoes: 8,
    emAlta: false,
    novo: false,
  },
  {
    id: 5,
    tipo: "desabafo" as const,
    conteudo:
      "Descobri que meu melhor amigo está saindo com minha ex às minhas costas. Eles acham que eu não sei, mas vi as mensagens. Me sinto traído duas vezes. Não sei se confronto ou simplesmente sumo da vida deles.",
    dataPublicacao: "2025-11-13T08:45:00Z",
    totalComentarios: 45,
    totalReacoes: 103,
    emAlta: true,
    novo: false,
  },
  // Mais posts mockados para simular a rolagem
  {
    id: 6,
    tipo: "desabafo" as const,
    conteudo: "Meu TCC está me matando, sério. Não durmo faz três dias e meu orientador só critica. A pressão é insuportável.",
    dataPublicacao: "2025-11-12T10:00:00Z",
    totalComentarios: 10,
    totalReacoes: 30,
    emAlta: false,
    novo: false,
  },
  {
    id: 7,
    tipo: "fofoca" as const,
    conteudo: "A vizinha do 501 tá saindo escondido com o porteiro novo. Vi os dois de mãos dadas no elevador de serviço! Choque total na vizinhança. Mas shhh, segredo!",
    dataPublicacao: "2025-11-11T14:30:00Z",
    totalComentarios: 50,
    totalReacoes: 150,
    emAlta: true,
    novo: false,
  },
  {
    id: 8,
    tipo: "confissao" as const,
    conteudo: "Eu nunca assisti Star Wars. Fingi que assisti a vida toda pra não ser excluído dos papos nerds. Desculpa, mundo.",
    dataPublicacao: "2025-11-11T09:00:00Z",
    totalComentarios: 5,
    totalReacoes: 10,
    emAlta: false,
    novo: false,
  },
  {
    id: 9,
    tipo: "desabafo" as const,
    conteudo: "Minha gata me odeia. Ela só me dá patada e morde quando eu tento fazer carinho. Eu só queria um pouco de amor felino, é pedir muito?",
    dataPublicacao: "2025-11-10T18:00:00Z",
    totalComentarios: 20,
    totalReacoes: 60,
    emAlta: false,
    novo: false,
  },
  {
    id: 10,
    tipo: "desabafo" as const,
    conteudo: "Acho que sou a única pessoa do meu ciclo social que não tem dinheiro para viajar. Fico vendo as fotos e dá uma inveja triste, saca? Queria ter mais sorte na vida profissional.",
    dataPublicacao: "2025-11-09T11:00:00Z",
    totalComentarios: 25,
    totalReacoes: 75,
    emAlta: true,
    novo: false,
  },
];

const Index = () => {
  const { toast } = useToast();
  
  // USA O HOOK DE TEMA AGORA
  const { temaEscuro, alternarTema } = useTheme();

  // Estados da aplicação
  const [estaLogado, setEstaLogado] = useState(false);
  const [usuario, setUsuario] = useState({
    apelido: "Anônimo",
    avatar: "",
    postsHoje: 0,
    comentariosHoje: 0,
  });
  
  // Estados dos filtros
  const [filtroOrdem, setFiltroOrdem] = useState<"emAlta" | "recentes">("emAlta");
  const [filtroCategoria, setFiltroCategoria] = useState<"tudo" | "desabafo" | "confissao" | "fofoca">("tudo");
  
  // Estados dos posts
  const [posts, setPosts] = useState<Post[]>(POSTS_MOCK);

  // Simula o login do usuário
  const handleLogin = () => {
    // Aqui viria a integração com autenticação real (Google OAuth, etc.)
    toast({
      title: "Bem-vindo!",
      description: "Login simulado com sucesso. Crie seu apelido.",
    });
    
    // Simula usuário logado
    const apelidoSimulado = "JamantaBombada";
    setUsuario({
      apelido: apelidoSimulado,
      avatar: gerarAvatarPlaceholder(apelidoSimulado),
      postsHoje: 0,
      comentariosHoje: 1,
    });
    setEstaLogado(true);
  };

  // Faz logout do usuário
  const handleLogout = () => {
    setEstaLogado(false);
    setUsuario({
      apelido: "Anônimo",
      avatar: "",
      postsHoje: 0,
      comentariosHoje: 0,
    });
    
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta.",
    });
  };

  // Cria um novo post
  const handlePostar = (conteudo: string, categoria: "desabafo" | "confissao" | "fofoca") => {
    if (!estaLogado) {
      toast({
        title: "Ops!",
        description: "Você precisa estar logado para postar.",
        variant: "destructive",
      });
      return;
    }

    // Verifica limite de posts (usuário gratuito)
    if (usuario.postsHoje >= 1) {
      toast({
        title: "Limite atingido",
        description: "Você já fez seu post de hoje. Vire Premium para postar sem limites!",
        variant: "destructive",
      });
      return;
    }

    // Cria o novo post
    const novoPost: Post = {
      id: Date.now(),
      tipo: categoria,
      conteudo,
      dataPublicacao: new Date().toISOString(),
      totalComentarios: 0,
      totalReacoes: 0,
      novo: true,
      emAlta: false,
    };

    setPosts((prev) => [novoPost, ...prev]);
    setUsuario((prev) => ({ ...prev, postsHoje: prev.postsHoje + 1 }));

    toast({
      title: "Post publicado!",
      description: "Seu desabafo foi compartilhado com a comunidade.",
    });
  };

  // Filtra os posts baseado nos filtros selecionados
  const postsFiltrados = posts
    .filter((post) => {
      if (filtroCategoria === "tudo") return true;
      return post.tipo === filtroCategoria;
    })
    .sort((a, b) => {
      if (filtroOrdem === "emAlta") {
        return b.totalReacoes - a.totalReacoes;
      }
      return new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime();
    });

  // Abre detalhes do post (implementar depois)
  const abrirPost = (postId: number) => {
    toast({
      title: "Em desenvolvimento",
      description: `Abrindo post #${postId}...`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho */}
      <Cabecalho
        temaEscuro={temaEscuro}
        alternarTema={alternarTema}
        estaLogado={estaLogado}
        usuario={estaLogado ? usuario : undefined}
        aoClicarLogin={handleLogin}
        aoClicarLogout={handleLogout}
      />

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
              {postsFiltrados.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  Nenhum post encontrado com esses filtros.
                </p>
              ) : (
                postsFiltrados.map((post) => (
                  <CartaoPost
                    key={post.id}
                    post={post}
                    aoClicar={() => abrirPost(post.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna Lateral - Sticky */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            {/* Caixa de Postar */}
            <CaixaPostar aoPostar={handlePostar} />

            {/* Status do Usuário (apenas se logado) */}
            {estaLogado && (
              <StatusUsuario
                postsHoje={usuario.postsHoje}
                comentariosHoje={usuario.comentariosHoje}
                limitePostsDiarios={1}
                limiteComentariosDiarios={3}
                aoClicarPremium={() =>
                  toast({
                    title: "Premium",
                    description: "Página de upgrade em desenvolvimento!",
                  })
                }
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