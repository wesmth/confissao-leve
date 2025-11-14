/**
 * Componente CaixaPostar
 * 
 * Formulário para criar um novo post
 * Inclui:
 * - Textarea com contador de caracteres
 * - Seleção de categoria (Desabafo/Confissão)
 * - Botão de postar
 * - Link para regras
 */

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CaixaPostarProps {
  aoPostar: (conteudo: string, categoria: "desabafo" | "confissao") => void;
  estaCarregando?: boolean;
}

export function CaixaPostar({ aoPostar, estaCarregando = false }: CaixaPostarProps) {
  const [conteudo, setConteudo] = useState("");
  const [categoria, setCategoria] = useState<"desabafo" | "confissao">("desabafo");
  
  const LIMITE_CARACTERES = 50000;
  const totalCaracteres = conteudo.length;
  const podePostar = totalCaracteres >= 10 && totalCaracteres <= LIMITE_CARACTERES;

  const handlePostar = () => {
    if (podePostar && !estaCarregando) {
      aoPostar(conteudo, categoria);
      setConteudo(""); // Limpa após postar
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

      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-0">
        {/* Seleção de categoria */}
        <div className="w-full sm:w-auto">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Categoria:
          </Label>
          <RadioGroup
            value={categoria}
            onValueChange={(value) => setCategoria(value as "desabafo" | "confissao")}
            className="flex gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="desabafo" id="desabafo" />
              <Label
                htmlFor="desabafo"
                className="cursor-pointer text-sm font-medium"
              >
                Desabafo
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="confissao" id="confissao" />
              <Label
                htmlFor="confissao"
                className="cursor-pointer text-sm font-medium"
              >
                Confissão
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Botão de postar */}
        <Button
          onClick={handlePostar}
          disabled={!podePostar || estaCarregando}
          className="w-full sm:w-auto bg-primary hover:bg-primary-hover"
        >
          <Send className="mr-2 h-4 w-4" />
          Postar
        </Button>
      </CardFooter>

      {/* Link para regras */}
      <div className="px-6 pb-4">
        <p className="text-xs text-center text-muted-foreground">
          Ao postar, você concorda com nossas{" "}
          <a href="#" className="text-primary hover:underline">
            Regras da Casa
          </a>
          .
        </p>
      </div>
    </Card>
  );
}
