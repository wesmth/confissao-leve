// src/hooks/use-auth.tsx (CÓDIGO COMPLETO E FINAL COM CORREÇÃO DE QUERY)

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase"; 
import { AuthUser, Session } from "@supabase/supabase-js"; 
import { gerarAvatarPlaceholder } from "@/lib/utilidades";

// --- 1. Tipagem da Estrutura de Dados do Usuário ---

interface Limites {
    postsDiarios: number;
    comentariosDiarios: number;
    proximaTrocaApelido: string; 
}

export interface Usuario {
    id: string; 
    apelido: string;
    email: string;
    plano: "gratuito" | "premium";
    avatar: string;
    dataCadastro: string;
    mostrarApelidoPublicamente: boolean;
    proximaTrocaApelido: string; 
    limites: Limites; 
}

interface AuthContextType {
    usuario: Usuario | null;
    estaLogado: boolean;
    estaCarregando: boolean; 
    
    loginGoogle: () => Promise<void>; 
    logout: () => Promise<void>;
    
    tornarPremium: () => void;
    atualizarPostsComentarios: (tipo: "post" | "comentario", valor: number) => void;
    updateUsuario: (updates: Partial<Usuario>) => Promise<boolean>; 
}

const VALORES_INICIAIS: AuthContextType = {
    usuario: null,
    estaLogado: false,
    estaCarregando: true, 
    loginGoogle: async () => {}, 
    logout: async () => {},
    tornarPremium: () => {},
    atualizarPostsComentarios: () => {},
    updateUsuario: async () => false,
};

const AuthContext = createContext<AuthContextType>(VALORES_INICIAIS);

export const useAuth = () => useContext(AuthContext);

// --- 2. Funções de Mapeamento e Busca ---

const mapProfileToUser = (profile: any, session: Session, postsFeitosHoje = 0, comentariosFeitosHoje = 0): Usuario => {
    const proximaTroca = profile.proxima_troca_apelido || profile.data_cadastro; 

    return {
        id: profile.id,
        apelido: profile.apelido,
        email: session.user.email || 'anonimo@desabafaai.com',
        plano: profile.plano as "gratuito" | "premium",
        avatar: profile.avatar_url || gerarAvatarPlaceholder(profile.apelido),
        dataCadastro: profile.data_cadastro,
        mostrarApelidoPublicamente: profile.mostrar_apelido_publicamente,
        proximaTrocaApelido: proximaTroca,
        
        limites: {
            postsDiarios: postsFeitosHoje,
            comentariosDiarios: comentariosFeitosHoje,
            proximaTrocaApelido: proximaTroca, 
        },
    };
};

// ** FUNÇÃO CORRIGIDA PARA O LOOP INFINITO **
const getPerfil = async (user: AuthUser, postsFeitosHoje = 0, comentariosFeitosHoje = 0): Promise<Usuario | null> => {
    // CORREÇÃO: Removemos o .single() para evitar falhas estritas (como o erro "Cannot coerce...")
    // A query agora retorna um array.
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

    if (error) {
        console.error("Erro ao buscar perfil:", error?.message);
        return null;
    }

    let profile = profiles?.[0]; // Pega o primeiro (e único) perfil do array.

    // Se não existir perfil, cria um perfil inicial (evita loops onde a sessão existe mas não há perfil)
    if (!profile) {
        const apelidoPadrao = `anonimo_${user.id.slice(0,6)}`;
        const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                apelido: apelidoPadrao,
                data_cadastro: new Date().toISOString(),
                avatar_url: gerarAvatarPlaceholder(apelidoPadrao),
                plano: 'gratuito',
                mostrar_apelido_publicamente: false,
            })
            .select('*')
            .single();

        if (createError) {
            console.error("Erro ao criar perfil inicial:", createError.message);
            return null;
        }

        profile = created;
    }

    const session: Session = { user: user as any, access_token: '' } as Session;
    return mapProfileToUser(profile, session, postsFeitosHoje, comentariosFeitosHoje);
};


// --- 3. Auth Provider Principal ---

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { toast } = useToast();
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [estaCarregando, setEstaCarregando] = useState(true);
    const [session, setSession] = useState<Session | null>(null);

    // Hook para Escutar Mudanças de Sessão
    useEffect(() => {
        const handleAuthStateChange = async (event: string, session: Session | null) => {
            console.log(`[AUTH] Evento: ${event}`);

            if (session) {
                setSession(session);
                const postsHoje = 0;
                const comentariosHoje = 0;

                const userProfile = await getPerfil(session.user, postsHoje, comentariosHoje);
                if (userProfile) {
                    setUsuario(userProfile);
                    if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') {
                        toast({ title: "Bem-vindo(a) de volta!", description: `Logado como @${userProfile.apelido}` });
                    }
                } else {
                    setUsuario(null);
                    setSession(null);
                }
            } else {
                setUsuario(null);
                setSession(null);
            }
            setEstaCarregando(false);
        };

        // Registra a listener e guarda a subscription de forma segura
        const { data } = supabase.auth.onAuthStateChange(handleAuthStateChange);
        const subscription = (data && (data as any).subscription) || null;

        // REMOVIDA: chamada redundante a getSession() — onAuthStateChange já envia INITIAL_SESSION normalmente
        // supabase.auth.getSession().then(({ data: { session } }) => {
        //     handleAuthStateChange('INITIAL_SESSION', session);
        // });

        return () => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        };
    }, []); // <-- removido 'toast' das deps para evitar múltiplas re-subscrições


    // 4. FUNÇÃO DE LOGIN COM GOOGLE (CORRIGIDA PORTA 8080 E REDIRECIONAMENTO)
    const loginGoogle = async () => {
        setEstaCarregando(true);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'http://localhost:8080', 
            }
        });

        if (error) {
            setEstaCarregando(false);
            toast({ title: "Erro de Login", description: error.message, variant: "destructive" });
            return;
        }
        
        if (data.url) {
            window.location.href = data.url;
        }
    };


    const logout = async () => {
        setEstaCarregando(true);
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Erro ao fazer logout:", error);
            toast({ title: "Erro de Logout", description: "Não foi possível desconectar.", variant: "destructive" });
        } else {
            setUsuario(null);
            setSession(null);
            toast({ title: "Desconectado!", description: "Você saiu da sua conta." });
            
            // LIMPEZA ROBUSTA PARA EVITAR CACHE TEIMOSO DO NAVEGADOR
            Object.keys(localStorage)
                .filter(key => key.startsWith('sb-'))
                .forEach(key => localStorage.removeItem(key));
        }
        setEstaCarregando(false);
    };
    
    
    // 5. FUNÇÕES DE PERFIL E LIMITES
    const updateUsuario = async (updates: Partial<Usuario>): Promise<boolean> => {
        if (!usuario) return false;
        
        setEstaCarregando(true);
        
        const updatesToDB: Record<string, any> = {};

        if (updates.apelido !== undefined) updatesToDB.apelido = updates.apelido;
        if (updates.plano !== undefined) updatesToDB.plano = updates.plano;
        if (updates.mostrarApelidoPublicamente !== undefined) updatesToDB.mostrar_apelido_publicamente = updates.mostrarApelidoPublicamente;
        if (updates.proximaTrocaApelido !== undefined) updatesToDB.proxima_troca_apelido = updates.proximaTrocaApelido;
        
        if (updates.apelido && updates.apelido !== usuario.apelido) {
            updatesToDB.avatar_url = gerarAvatarPlaceholder(updates.apelido);
        }

        const { data: updatedData, error } = await supabase
            .from('profiles')
            .update(updatesToDB)
            .eq('id', usuario.id)
            .select('*') 
            .single(); // Nota: Manter .single() aqui é aceitável, pois é uma atualização de perfil já existente

        setEstaCarregando(false);

        if (error) {
            if (error.code === '23505' && updates.apelido) { 
                toast({ title: "Erro", description: "Esse apelido já está em uso! Escolha outro, porra.", variant: "destructive" });
            } else {
                toast({ title: "Erro de Perfil", description: error.message, variant: "destructive" });
            }
            return false;
        }
        
        setUsuario((prev) => {
            if (!prev) return null;
            const novoUsuario = mapProfileToUser(updatedData, session as Session, prev.limites.postsDiarios, prev.limites.comentariosDiarios);
            return novoUsuario;
        });

        return true;
    };

    const tornarPremium = () => {
        if (!usuario) return;
        updateUsuario({ plano: 'premium' }); 
    };

    const atualizarPostsComentarios = (tipo: "post" | "comentario", valor: number) => {
        if (!usuario) return;

        setUsuario((prev) => {
            if (!prev) return null;
            
            const limiteAtual = tipo === "post" ? prev.limites.postsDiarios : prev.limites.comentariosDiarios;
            const limiteMaximo = tipo === "post" ? (prev.plano === "gratuito" ? 1 : Infinity) : (prev.plano === "gratuito" ? 3 : Infinity); 

            if (limiteAtual + valor > limiteMaximo) {
                return prev;
            }
            
            const novosLimites = { ...prev.limites };

            if (tipo === "post") {
                novosLimites.postsDiarios = limiteAtual + valor;
            } else { 
                novosLimites.comentariosDiarios = limiteAtual + valor;
            }

            return {
                ...prev,
                limites: novosLimites,
            };
        });
    };

    // 6. O Provider
    return (
        <AuthContext.Provider
            value={{
                usuario,
                estaLogado: !!usuario,
                estaCarregando,
                loginGoogle, 
                logout,
                tornarPremium,
                atualizarPostsComentarios,
                updateUsuario,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// exemplo (coloque no Index.tsx onde busca posts)
const { data, error } = await supabase
  .from('posts')
  .select('*,profiles(apelido)')
  .eq('status', 'ativo')
  .order('total_reacoes', { ascending: false })
  .order('criado_em', { ascending: false })
  .limit(50);