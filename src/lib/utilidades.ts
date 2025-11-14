/**
 * Funções utilitárias para o aplicativo
 */

/**
 * Formata uma data em formato "tempo atrás" (ex: "2 horas atrás")
 */
export function formatarTempoAtras(dataISO: string): string {
  const segundos = Math.floor((new Date().getTime() - new Date(dataISO).getTime()) / 1000);
  
  let intervalo = Math.floor(segundos / 31536000);
  if (intervalo >= 1) {
    return intervalo === 1 ? "1 ano atrás" : `${intervalo} anos atrás`;
  }
  
  intervalo = Math.floor(segundos / 2592000);
  if (intervalo >= 1) {
    return intervalo === 1 ? "1 mês atrás" : `${intervalo} meses atrás`;
  }
  
  intervalo = Math.floor(segundos / 86400);
  if (intervalo >= 1) {
    return intervalo === 1 ? "1 dia atrás" : `${intervalo} dias atrás`;
  }
  
  intervalo = Math.floor(segundos / 3600);
  if (intervalo >= 1) {
    return intervalo === 1 ? "1 hora atrás" : `${intervalo} horas atrás`;
  }
  
  intervalo = Math.floor(segundos / 60);
  if (intervalo >= 1) {
    return intervalo === 1 ? "1 minuto atrás" : `${intervalo} minutos atrás`;
  }
  
  return "Agora mesmo";
}

/**
 * Gera um avatar placeholder baseado nas iniciais
 */
export function gerarAvatarPlaceholder(texto: string): string {
  const inicial = texto[0]?.toUpperCase() || "?";
  return `https://ui-avatars.com/api/?name=${inicial}&background=0891b2&color=fff&size=128`;
}
