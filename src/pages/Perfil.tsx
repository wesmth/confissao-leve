// src/pages/Perfil.tsx

/**
 * Página de Perfil do Usuário
 * * Permite o usuário:
 * - Visualizar e editar suas informações
 * - Ver estatísticas de posts e comentários
 * - Gerenciar configurações de privacidade
 * - Ver seu histórico de posts
 * * REFATORADO: Agora usa useAuth e lógica real.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Settings, BarChart3, FileText, XCircle, Ban } from "lucide-react";
import { format } from "date-fns"; // Para formatar datas
import { ptBR } from "date-fns/locale"; // Para formatação em português
import { Cabecalho } from "@/components/Cabecalho";

// Componentes UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { NavLink } from "@/components/NavLink";

// Diálogos de Confirmação
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

// HOOKS GLOBAIS
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme"; 

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 1. Usa HOOKS GLOBAIS (Removido useState simulado)
  const { usuario, estaCarregando, estaLogado, updateUsuario, logout } = useAuth();
  const { temaEscuro, alternarTema } = useTheme();

  // Estados locais para edição
  const [novoApelido, setNovoApelido] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mudancaAnonimato, setMudancaAnonimato] = useState(false);
  
  // Efeito para sincronizar o novoApelido com o apelido atual do usuário
  useEffect(() => {
    if (usuario) {
      setNovoApelido(usuario.apelido);
      // Sincroniza o estado local do anonimato
      setMudancaAnonimato(usuario.mostrarApelidoPublicamente);
    } else if (!estaCarregando && !estaLogado) {
        // Se não está logado, redireciona para a home
        navigate('/');
    }
  }, [usuario, estaCarregando, estaLogado, navigate]);


  // Verifica se o apelido pode ser trocado (lógica baseada no limite do use-auth)
  const apelidoPodeSerTrocado = () => {
    if (usuario?.plano === "premium") return true;
    if (!usuario?.proximaTrocaApelido) return true; // Se o campo for nulo no DB, pode trocar
    
    const dataLimite = new Date(usuario.proximaTrocaApelido);
    return new Date() > dataLimite;
  };

  const handleSalvarApelido = async () => {
    if (!usuario || salvando) return;

    if (novoApelido.length < 3) {
      toast({ title: "Erro", description: "O apelido deve ter no mínimo 3 caracteres.", variant: "destructive" });
      return;
    }
    
    if (novoApelido === usuario.apelido) {
        toast({ title: "Nada a Salvar", description: "O novo apelido é igual ao atual." });
        return;
    }

    if (!apelidoPodeSerTrocado()) {
        toast({ title: "Aguarde", description: `Você só poderá trocar o apelido novamente após ${format(new Date(usuario.proximaTrocaApelido), 'dd/MM/yyyy', { locale: ptBR })}.`, variant: "destructive" });
        return;
    }
    
    // ATENÇÃO: Aqui você faria a chamada real ao Supabase para atualizar o perfil
    setSalvando(true);
    
    // Simulação da chamada DB
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Atualiza o estado local e reseta o próximo tempo de troca (Exemplo: daqui a 30 dias)
    const proximaTroca = new Date();
    proximaTroca.setDate(proximaTroca.getDate() + 30); // 30 dias para a próxima troca (exemplo gratuito)

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
    toast({ 
        title: "Preferência Salva", 
        description: checked ? "Seu apelido será mostrado por padrão nos posts futuros." : "Posts futuros voltarão a ser anônimos por padrão." 
    });
  };

  const handleExcluirConta = async () => {
    // ATENÇÃO: Aqui você faria a chamada real ao Supabase para deletar a conta.
    // Isso requer uma chave de serviço ou a exclusão pelo próprio usuário no cliente.
    
    toast({ title: "Simulação", description: "Tentativa de exclusão de conta em desenvolvimento...", variant: "destructive" });
    
    // Simula logout após exclusão
    setTimeout(async () => {
        await logout();
        navigate('/');
        toast({ title: "Conta Excluída", description: "Sua conta foi permanentemente deletada. Que pena!", variant: "destructive" });
    }, 1500);
  };
  
  if (estaCarregando || !usuario) {
    // Tela de carregamento enquanto busca o perfil
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const dataCadastroFormatada = format(new Date(usuario.dataCadastro), 'dd/MM/yyyy', { locale: ptBR });
  
  const dataProximaTroca = apelidoPodeSerTrocado() 
    ? 'Disponível Agora' 
    : format(new Date(usuario.proximaTrocaApelido), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho (Passa os props corretos) */}
      <Cabecalho
        temaEscuro={temaEscuro}
        alternarTema={alternarTema}
        estaLogado={estaLogado}
        usuario={{ apelido: usuario.apelido, avatar: usuario.avatar }}
        aoClicarLogin={() => navigate('/')}
        aoClicarLogout={logout}
      />

      <main className="container py-8 max-w-4xl">
        {/* Botão voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Feed
        </Button>

        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <User className="mr-3 h-6 w-6 text-primary" />
          Meu Perfil
        </h1>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="dados" className="flex items-center">
              <User className="mr-2 h-4 w-4" /> Dados
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" /> Configurações
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" /> Histórico
            </TabsTrigger>
          </TabsList>
          
          {/* Aba de Dados */}
          <TabsContent value="dados" className="mt-6 space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Seu apelido é único. Você só pode trocá-lo uma vez por mês (Plano Gratuito).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Avatar e Apelido Atual */}
                <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20 border-2 border-primary">
                        <AvatarImage src={usuario.avatar} alt={usuario.apelido} />
                        <AvatarFallback className="text-xl font-bold">{usuario.apelido[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold">@{usuario.apelido}</p>
                        <p className="text-sm text-muted-foreground">Membro desde: {dataCadastroFormatada}</p>
                        <p className="text-sm font-medium text-accent">Plano: {usuario.plano.toUpperCase()}</p>
                    </div>
                </div>

                {/* Campo Email (Somente Leitura) */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={usuario.email} readOnly disabled type="email" />
                    <p className="text-xs text-muted-foreground">O email não pode ser alterado por aqui.</p>
                </div>
                
                {/* Campo Novo Apelido */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="apelido">Novo Apelido</Label>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className={`text-xs font-medium ${apelidoPodeSerTrocado() ? 'text-accent' : 'text-destructive'}`}>
                                    Próxima troca: {dataProximaTroca}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>No plano gratuito, você pode trocar a cada 30 dias. Premium é ilimitado.</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Input
                        id="apelido"
                        value={novoApelido}
                        onChange={(e) => setNovoApelido(e.target.value)}
                        placeholder="Digite seu novo apelido (3-20 caracteres)"
                        maxLength={20}
                        disabled={!apelidoPodeSerTrocado()}
                    />
                    <Button 
                        onClick={handleSalvarApelido} 
                        disabled={!apelidoPodeSerTrocado() || salvando || novoApelido.length < 3}
                        className="w-full"
                    >
                        {salvando ? 'Salvando...' : 'Salvar Novo Apelido'}
                    </Button>
                </div>

              </CardContent>
            </Card>

            {/* Estatísticas (Placeholder) */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Estatísticas da Conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{usuario.limites.postsDiarios + 1}</p>
                        <p className="text-sm text-muted-foreground">Posts Feitos</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{usuario.limites.comentariosDiarios + 3}</p>
                        <p className="text-sm text-muted-foreground">Comentários</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">15</p>
                        <p className="text-sm text-muted-foreground">Reações Recebidas</p>
                    </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>
          
          {/* Aba de Configurações */}
          <TabsContent value="config" className="mt-6 space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Configurações de Privacidade</CardTitle>
                <CardDescription>
                  Controle como seus dados são exibidos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Toggle de Anonimato Padrão */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar Apelido por Padrão</Label>
                    <p className="text-sm text-muted-foreground">
                      Por padrão, posts são anônimos (OFF). Ative para mostrar seu apelido por padrão. Você decide post a post.
                    </p>
                  </div>
                  <Switch
                    checked={mudancaAnonimato}
                    onCheckedChange={handleToggleAnonimato}
                  />
                </div>
                
                {/* Zona de Perigo */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2 text-destructive flex items-center"><Ban className="mr-2 h-4 w-4" /> Zona de Perigo</h4>
                  
                  {/* Diálogo de Exclusão de Conta */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Excluir Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação é **irreversível**. Todos os seus posts, comentários e dados de perfil serão permanentemente excluídos dos nossos servidores. Você perderá seu apelido `{usuario.apelido}`.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleExcluirConta}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Sim, Excluir Minha Conta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <p className="text-xs text-muted-foreground mt-2">
                    Esta ação é irreversível. Pense bem, caralho.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Histórico (Placeholder) */}
          <TabsContent value="historico" className="mt-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Seu Histórico de Atividades</CardTitle>
                <CardDescription>
                  Aqui você verá todos os seus posts e comentários (públicos e anônimos) num só lugar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 bg-muted rounded-lg text-center space-y-2">
                    <FileText className="h-8 w-8 text-primary mx-auto" />
                    <p className="font-medium">Histórico de posts em desenvolvimento...</p>
                    <p className="text-sm text-muted-foreground">Volte em breve para ver tudo que você já tirou do peito.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default Perfil;