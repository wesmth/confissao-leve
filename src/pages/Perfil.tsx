/**
 * Página de Perfil do Usuário
 * 
 * Permite o usuário:
 * - Visualizar e editar suas informações
 * - Ver estatísticas de posts e comentários
 * - Gerenciar configurações de privacidade
 * - Ver seu histórico de posts
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Settings, BarChart3, FileText } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { gerarAvatarPlaceholder } from "@/lib/utilidades";

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [temaEscuro, setTemaEscuro] = useState(
    document.documentElement.classList.contains("dark")
  );

  // Estado do usuário (simulado)
  const [usuario, setUsuario] = useState({
    apelido: "JamantaBombada",
    email: "usuario@email.com",
    avatar: gerarAvatarPlaceholder("JamantaBombada"),
    dataCadastro: "2025-11-01",
    plano: "Gratuito",
    postsPublicados: 12,
    comentariosFeitos: 45,
    reacoesRecebidas: 234,
    mostrarApelidoPublicamente: false,
  });

  const alternarTema = () => {
    setTemaEscuro((prev) => {
      const novoTema = !prev;
      if (novoTema) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("tema", "escuro");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("tema", "claro");
      }
      return novoTema;
    });
  };

  const salvarAlteracoes = () => {
    toast({
      title: "Perfil atualizado!",
      description: "Suas alterações foram salvas com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Cabecalho
        temaEscuro={temaEscuro}
        alternarTema={alternarTema}
        estaLogado={true}
        usuario={usuario}
        aoClicarLogin={() => {}}
        aoClicarLogout={() => navigate("/")}
      />

      <main className="container py-8 max-w-4xl">
        {/* Botão voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Feed
        </Button>

        {/* Header do perfil */}
        <div className="flex items-center gap-6 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage src={usuario.avatar} />
            <AvatarFallback>{usuario.apelido[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{usuario.apelido}</h1>
            <p className="text-muted-foreground">
              Membro desde {new Date(usuario.dataCadastro).toLocaleDateString("pt-BR")}
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted">
                Plano {usuario.plano}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="geral">
              <User className="mr-2 h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="estatisticas">
              <BarChart3 className="mr-2 h-4 w-4" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="privacidade">
              <Settings className="mr-2 h-4 w-4" />
              Privacidade
            </TabsTrigger>
          </TabsList>

          {/* Aba Geral */}
          <TabsContent value="geral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apelido">Apelido</Label>
                  <Input
                    id="apelido"
                    value={usuario.apelido}
                    onChange={(e) =>
                      setUsuario({ ...usuario, apelido: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Seu apelido único na plataforma
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={usuario.email}
                    onChange={(e) =>
                      setUsuario({ ...usuario, email: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado apenas para notificações e recuperação de conta
                  </p>
                </div>

                <Button onClick={salvarAlteracoes} className="w-full">
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Estatísticas */}
          <TabsContent value="estatisticas" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Posts Publicados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{usuario.postsPublicados}</div>
                  <p className="text-xs text-muted-foreground">
                    Desabafos e confissões
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Comentários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{usuario.comentariosFeitos}</div>
                  <p className="text-xs text-muted-foreground">
                    Interações com a comunidade
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Reações Recebidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{usuario.reacoesRecebidas}</div>
                  <p className="text-xs text-muted-foreground">
                    Apoio da comunidade
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Seus Posts Recentes</CardTitle>
                <CardDescription>
                  Últimos desabafos e confissões publicados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm line-clamp-2">
                        Não aguento mais meu chefe. Ele fica pedindo coisas...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Há 2 dias • 18 comentários
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm line-clamp-2">
                        Descobri que meu melhor amigo está saindo com minha ex...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Há 5 dias • 32 comentários
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Privacidade */}
          <TabsContent value="privacidade" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Privacidade</CardTitle>
                <CardDescription>
                  Controle como seus dados são exibidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar Apelido nos Posts</Label>
                    <p className="text-sm text-muted-foreground">
                      Por padrão, posts são anônimos. Ative para mostrar seu apelido.
                    </p>
                  </div>
                  <Switch
                    checked={usuario.mostrarApelidoPublicamente}
                    onCheckedChange={(checked) =>
                      setUsuario({ ...usuario, mostrarApelidoPublicamente: checked })
                    }
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2 text-destructive">Zona de Perigo</h4>
                  <Button variant="destructive" className="w-full">
                    Excluir Conta
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
                  </p>
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
