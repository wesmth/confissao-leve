// src/components/LoginModal.tsx

import { LogIn, Send, Mail, Globe, Lock, User, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"; 
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// REMOVIDO: O formulário de email/senha para focar APENAS no Google

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
    const { loginGoogle, estaCarregando } = useAuth();
    const { toast } = useToast();
    const [carregandoGoogle, setCarregandoGoogle] = useState(false);

    const handleLoginGoogle = async () => {
        if (estaCarregando || carregandoGoogle) return;

        setCarregandoGoogle(true);
        // Chama a função do hook para iniciar o fluxo OAuth (redirecionamento)
        await loginGoogle(); 
        
        // Note: O estado de carregamento será resetado no retorno da página
        // ou se houver erro antes do redirecionamento.
        setCarregandoGoogle(false); 
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-6">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl flex items-center justify-center">
                        <LogIn className="mr-2 h-6 w-6 text-primary" />
                        Acessar DesabafaAí
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Conecte-se para postar, comentar e interagir.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 pt-4">

                    {/* Botão de Login com Google (Principal) */}
                    <Button 
                        onClick={handleLoginGoogle} 
                        disabled={carregandoGoogle}
                        className="w-full h-12 text-lg bg-primary hover:bg-primary-hover transition-colors"
                    >
                        {carregandoGoogle ? (
                            <>
                                <Globe className="mr-2 h-5 w-5 animate-spin" />
                                Redirecionando...
                            </>
                        ) : (
                            <>
                                <Globe className="mr-2 h-5 w-5" />
                                Continuar com Google
                            </>
                        )}
                    </Button>
                    
                    {/* Mensagem de Confiança */}
                    <p className="text-xs text-center text-muted-foreground pt-2">
                        Seu primeiro acesso será seu cadastro. Usamos o Google apenas para autenticação.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}