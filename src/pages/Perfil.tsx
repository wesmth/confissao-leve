// src/pages/Perfil.tsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Settings, BarChart3, FileText, Loader2, Filter, Ban, Heart, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase"; 

import { Cabecalho } from "@/components/Cabecalho";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { CartaoPost } from "@/components/CartaoPost";

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

import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme"; 

// Interface para o Histórico
interface PostHistorico {
    id: string;
    autor_id: string | null; // ID DO AUTOR AQUI É OBRIGATÓRIO
    tipo: "desabafo" | "confissao" | "fofoca";
    conteudo: string;
    created_at: string;
    total_comentarios: number;
    total_reacoes: number;
    em_alta: boolean;
    status: string;
    anonimo: boolean;
    ja_curtiu: boolean;
    profiles: {
        apelido: string;
    } | null;
}

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { usuario, estaCarregando, estaLogado, updateUsuario, logout } = useAuth();
  const { temaEscuro, alternarTema } = useTheme();

  // Estados Perfil
  const [novoApelido, setNovoApelido] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mudancaAnonimato, setMudancaAnonimato] = useState(false);

  // Estados Histórico
  const [meusPosts, setMeusPosts] = useState<PostHistorico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [filtroHistorico, setFiltroHistorico] = useState<"recentes" | "antigas" | "populares">("recentes");
  
  // Estado Estatísticas Gerais
  const [estatisticas, setEstatisticas] = useState({ publicacoes: 0, interacoes: 0 });

  // Sincronização inicial dos dados do usuário
  useEffect(() => {
    if (usuario) {
      setNovoApelido(usuario.apelido);
      setMudancaAnonimato(usuario.mostrarApelidoPublicamente);
    } else if (!estaCarregando && !estaLogado) {
        navigate('/');
    }
  }, [usuario, estaCarregando, estaLogado, navigate]);

  // --- 1. Busca Estatísticas Reais (Blindado) ---
  useEffect(() => {
    const fetchStats = async () => {
        if (!usuario?.id) return;

        // Busca apenas as colunas de números para somar
        const { data, error } = await supabase
            .from('posts')
            .select('total_comentarios, total_reacoes')
            .eq('autor_id', usuario.id);

        if (!error && data) {
            const totalPubs = data.length;
            
            // SOMA ROBUSTA: Garante que null vira 0 para não quebrar a conta
            const totalInteracoes = data.reduce((acc, curr) => {
                const comentarios = curr.total_comentarios || 0;
                const reacoes = curr.total_reacoes || 0;
                return acc + comentarios + reacoes;
            }, 0);
            
            setEstatisticas({ 
                publicacoes: totalPubs, 
                interacoes: totalInteracoes 
            });
        } else if (error) {
            console.error("Erro ao buscar estatísticas:", error);
        }
    };

    fetchStats();
  }, [usuario?.id]); 


  // --- 2. Lógica do Histórico ---
  const buscarMeusPosts = useCallback(async () => {
      if (!usuario?.id) return;
      
      setCarregandoHistorico(true);
      try {
          // AQUI ESTÁ A CORREÇÃO DO PROFILES (profiles!posts_autor_id_fkey)
          let query = supabase
              .from('posts')
              .select(`
                  *,
                  profiles:profiles!posts_autor_id_fkey (apelido)
              `)
              .eq('autor_id', usuario.id); 

          // Aplica Ordenação
          if (filtroHistorico === 'recentes') {
              query = query.order('created_at', { ascending: false });
          } else if (filtroHistorico === 'antigas') {
              query = query.order('created_at', { ascending: true });
          } else if (filtroHistorico === 'populares') {
              query = query.order('total_reacoes', { ascending: false }).order('total_comentarios', { ascending: false });
          }

          const { data, error } = await query;
          if (error) throw error;

          // Mapeamento para garantir tipos
          const postsMapeados = (data || []).map((p: any) => ({
              ...p,
              anonimo: p.anonimo ?? false,
              ja_curtiu: false 
          }));

          setMeusPosts(postsMapeados);

      } catch (error) {
          console.error("Erro ao buscar histórico:", error);
          toast({ title: "Erro", description: "Não foi possível carregar seu histórico.", variant: "destructive" });
      } finally {
          setCarregandoHistorico(false);
      }
  }, [usuario?.id, filtroHistorico, toast]);

  // Carrega histórico quando muda o usuário ou o filtro
  useEffect(() => {
      if (usuario?.id) {
          buscarMeusPosts();
      }
  }, [buscarMeusPosts]);


  // --- Funções Auxiliares de Perfil ---
  const apelidoPodeSerTrocado = () => {
    if (usuario?.plano === "premium") return true;
    if (!usuario?.proximaTrocaApelido) return true;
    const dataLimite = new Date(usuario.proximaTrocaApelido);
    return new Date() > dataLimite;
  };

  const handleSalvarApelido = async () => {
    if (!usuario || salvando) return;
    if (novoApelido.length < 3) {
      toast({ title: "Erro", description: "O apelido deve ter no mínimo 3 caracteres.", variant: "destructive" });
      return;
    }
    if (novoApelido === usuario.apelido) return;

    if (!apelidoPodeSerTrocado()) {
        toast({ title: "Aguarde", description: `Troca disponível em ${format(new Date(usuario.proximaTrocaApelido), 'dd/MM/yyyy', { locale: ptBR })}.`, variant: "destructive" });
        return;
    }
    
    setSalvando(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const proximaTroca = new Date();
    proximaTroca.setDate(proximaTroca.getDate() + 30); 

    updateUsuario({ 
        apelido: novoApelido,
        proximaTrocaApelido: proximaTroca.toISOString()
    });

    setSalvando(false);
    toast({ title: "Sucesso!", description: "Apelido atualizado com sucesso." });
  };
  
  const handleToggleAnonimato = (checked: boolean) => {
    setMudancaAnonimato(checked);
    updateUsuario({ mostrarApelidoPublicamente: checked });
  };

  const handleExcluirConta = async () => {
    toast({ title: "Atenção", description: "Entre em contato com o suporte para excluir.", variant: "destructive" });
  };
  
  const isNovo = (dataString: string) => {
      const dataPostagem = new Date(dataString);
      const vinteQuatroHorasAtras = new Date(Date.now() - (24 * 60 * 60 * 1000));
      return dataPostagem > vinteQuatroHorasAtras;
  };

  if (estaCarregando || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const dataCadastroFormatada = format(new Date(usuario.dataCadastro), 'dd/MM/yyyy', { locale: ptBR });
  const dataProximaTroca = apelidoPodeSerTrocado() ? 'Disponível Agora' : format(new Date(usuario.proximaTrocaApelido), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <div className="min-h-screen bg-background">
      <Cabecalho
        temaEscuro={temaEscuro}
        alternarTema={alternarTema}
        estaLogado={estaLogado}
        usuario={{ apelido: usuario.apelido, avatar: usuario.avatar }}
        aoClicarLogin={() => navigate('/')}
        aoClicarLogout={logout}
      />

      <main className="container py-8 max-w-4xl px-4 md:px-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Feed
        </Button>

        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <User className="mr-3 h-6 w-6 text-primary" />
          Meu Perfil
        </h1>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dados">
              <User className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
            <TabsTrigger value="historico">
              <FileText className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>
          
          {/* === ABA DE DADOS === */}
          <TabsContent value="dados" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Gerencie sua identidade no Confissão Leve.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={usuario.avatar} alt={usuario.apelido} />
                        <AvatarFallback className="text-2xl font-bold">{usuario.apelido[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left space-y-1">
                        <p className="text-2xl font-bold">@{usuario.apelido}</p>
                        <p className="text-sm text-muted-foreground">Membro desde: {dataCadastroFormatada}</p>
                        <div className="flex justify-center sm:justify-start gap-2 pt-1">
                             <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-primary text-primary-foreground">
                                {usuario.plano.toUpperCase()}
                             </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input defaultValue={usuario.email} readOnly disabled className="bg-muted" />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="apelido">Novo Apelido</Label>
                            <span className={`text-xs ${apelidoPodeSerTrocado() ? 'text-green-500' : 'text-orange-500'}`}>
                                {dataProximaTroca}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="apelido"
                                value={novoApelido}
                                onChange={(e) => setNovoApelido(e.target.value)}
                                placeholder="Novo apelido"
                                maxLength={20}
                                disabled={!apelidoPodeSerTrocado()}
                            />
                            <Button 
                                onClick={handleSalvarApelido} 
                                disabled={!apelidoPodeSerTrocado() || salvando || novoApelido.length < 3}
                            >
                                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                            </Button>
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">
                            Mínimo de 3 caracteres. Sem espaços.
                        </p>
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* === ESTATÍSTICAS ATUALIZADAS === */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Engajamento Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-muted/30 rounded-xl border hover:bg-muted/50 transition-colors">
                        <div className="flex justify-center mb-2">
                            <FileText className="h-6 w-6 text-primary opacity-80" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{estatisticas.publicacoes}</p>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                            Publicações
                        </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl border hover:bg-muted/50 transition-colors">
                        <div className="flex justify-center mb-2 gap-1">
                             <Heart className="h-4 w-4 text-red-500" />
                             <MessageCircle className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-foreground">{estatisticas.interacoes}</p>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                            Interações
                        </p>
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* === ABA DE CONFIGURAÇÕES === */}
          <TabsContent value="config" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Privacidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="space-y-0.5">
                    <Label className="text-base">Identificação Pública</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar meu apelido por padrão ao criar novos posts.
                    </p>
                  </div>
                  <Switch
                    checked={mudancaAnonimato}
                    onCheckedChange={handleToggleAnonimato}
                  />
                </div>
                
                <div className="pt-6 border-t">
                  <h4 className="text-sm font-medium text-destructive mb-4 flex items-center gap-2">
                      <Ban className="h-4 w-4" /> Zona de Perigo
                  </h4>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto">Excluir Conta</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação apagará seus dados permanentemente. Seus posts anônimos continuarão existindo, mas sem vínculo com você.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExcluirConta} className="bg-destructive hover:bg-destructive/90">
                          Sim, Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* === ABA DE HISTÓRICO === */}
          <TabsContent value="historico" className="mt-6 space-y-6 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                 <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Seus Posts ({meusPosts.length})
                 </h3>
                 
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                     <Filter className="h-4 w-4 text-muted-foreground" />
                     <Select 
                        value={filtroHistorico} 
                        onValueChange={(val: any) => setFiltroHistorico(val)}
                     >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filtrar por" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recentes">Mais Recentes</SelectItem>
                            <SelectItem value="antigas">Mais Antigos</SelectItem>
                            <SelectItem value="populares">Mais Populares</SelectItem>
                        </SelectContent>
                     </Select>
                 </div>
             </div>

             {carregandoHistorico ? (
                 <div className="flex justify-center py-12">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
             ) : meusPosts.length === 0 ? (
                 <Card className="text-center py-12 border-dashed">
                     <CardContent>
                         <p className="text-muted-foreground mb-4">Você ainda não postou nada.</p>
                         <Button onClick={() => navigate('/')}>Criar meu primeiro post</Button>
                     </CardContent>
                 </Card>
             ) : (
                 <div className="space-y-4">
                     {meusPosts.map((post) => (
                         <CartaoPost
                            key={post.id}
                            post={{
                                id: post.id,
                                autor_id: post.autor_id, // <--- GARANTINDO QUE O AUTOR_ID É PASSADO
                                tipo: post.tipo,
                                conteudo: post.conteudo,
                                dataPublicacao: post.created_at,
                                totalComentarios: post.total_comentarios,
                                totalReacoes: post.total_reacoes,
                                emAlta: post.em_alta,
                                novo: isNovo(post.created_at),
                                autor: post.profiles?.apelido || "Eu", 
                                anonimo: post.anonimo,
                                ja_curtiu: false
                            }}
                            aoClicar={() => navigate(`/post/${post.id}`)}
                            onCommentCountUpdate={() => {}} 
                         />
                     ))}
                 </div>
             )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default Perfil;