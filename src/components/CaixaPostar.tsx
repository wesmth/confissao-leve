// src/components/CaixaPostar.tsx (CÓDIGO COMPLETO E FINAL - FIX DE LAYOUT)

import { useState } from "react";
import { Send, User } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch"; 
import { useAuth } from "@/hooks/use-auth"; // Adicionado useAuth para pegar o apelido

interface CaixaPostarProps {
  aoPostar: (conteudo: string, categoria: "desabafo" | "confissao" | "fofoca", compartilharNome: boolean) => void;
  estaCarregando?: boolean;
}

export function CaixaPostar({ aoPostar, estaCarregando = false }: CaixaPostarProps) {
  const { usuario } = useAuth(); // Pega o usuário logado para mostrar o apelido
  const [conteudo, setConteudo] = useState("");
  const [categoria, setCategoria] = useState<"desabafo" | "confissao" | "fofoca">("desabafo");
  
  // Por padrão, NÃO compartilhamos o nome (ou seja, é anônimo = false)
  const [compartilharNome, setCompartilharNome] = useState(false);
  
  const LIMITE_CARACTERES = 50000;
  const totalCaracteres = conteudo.length;
  const podePostar = totalCaracteres >= 10 && totalCaracteres <= LIMITE_CARACTERES;

  const handlePostar = () => {
    if (podePostar && !estaCarregando) {
      aoPostar(conteudo, categoria, compartilharNome);
      setConteudo(""); 
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Textarea */}
        <Textarea
          placeholder="O que você quer tirar do peito hoje?"
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          className="min-h-[120px] resize-none text-sm"
          maxLength={LIMITE_CARACTERES}
        />
        
        {/* Contador de caracteres */}
        <div className="mt-2 text-right">
          <span className="text-xs text-muted-foreground">
            {totalCaracteres} / {LIMITE_CARACTERES}
          </span>
        </div>
      </CardContent>

      {/* AJUSTE DE LAYOUT AQUI */}
      <CardFooter className="flex flex-col gap-4 pt-0">
        
        {/* LINHA 1: TOGGLE DE ANONIMATO E BOTÃO (Horizontal no Mobile também) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
            
            {/* Toggle de Anonimato (NOVO LAYOUT) */}
            <div className="flex items-center space-x-2">
                <Switch
                    id="anonimato-mode"
                    checked={compartilharNome}
                    onCheckedChange={setCompartilharNome}
                />
                <Label htmlFor="anonimato-mode" className="flex items-center text-sm font-medium cursor-pointer whitespace-nowrap">
                    {compartilharNome ? (
                        <>
                            <User className="mr-2 h-4 w-4 text-primary" />
                            Postar como: {usuario?.apelido || 'Você'}
                        </>
                    ) : (
                        <>
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            Postar como: Anônimo
                        </>
                    )}
                </Label>
            </div>
            
            {/* Botão de postar (Movido para o final da LINHA 2) */}
            
        </div>
        
        {/* LINHA 2: CATEGORIA E BOTÃO FINAL (Ajuste para Mobile/Desktop) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end w-full gap-3">
            
            {/* Seleção de categoria */}
            <div className="w-full sm:w-auto">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Categoria:
              </Label>
              <RadioGroup
                value={categoria}
                onValueChange={(value) => setCategoria(value as "desabafo" | "confissao" | "fofoca")}
                className="flex gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="desabafo" id="desabafo" />
                  <Label htmlFor="desabafo" className="cursor-pointer text-sm font-medium">
                    Desabafo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="confissao" id="confissao" />
                  <Label htmlFor="confissao" className="cursor-pointer text-sm font-medium">
                    Confissão
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fofoca" id="fofoca" />
                  <Label htmlFor="fofoca" className="cursor-pointer text-sm font-medium">
                    Fofoca
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Botão de postar (Movido para o final da LINHA 2) */}
            <Button
              onClick={handlePostar}
              disabled={!podePostar || estaCarregando}
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover"
            >
              <Send className="mr-2 h-4 w-4" />
              Postar
            </Button>
            
        </div>

      </CardFooter>

      {/* Link para regras */}
      <div className="px-6 pb-4">
        <p className="text-xs text-center text-muted-foreground">
          Ao postar, você concorda com nossas{" "}
          <a href="/regras" className="text-primary hover:underline">
            Regras da Casa
          </a>
          .
        </p>
      </div>
    </Card>
  );
}