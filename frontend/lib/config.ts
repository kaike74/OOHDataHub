// Configuração de ambiente

// Detectar se está em produção
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// URL da API
const getApiUrl = () => {
  // Prioridade: variável de ambiente
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Desenvolvimento: localhost
  if (!isProduction) {
    return 'http://localhost:8787';
  }

  // Produção: mostrar erro claro se não configurado
  console.error(
    '⚠️ NEXT_PUBLIC_API_URL não configurada! Configure as variáveis de ambiente no Cloudflare Pages.\n' +
    'Veja DEPLOY_CLOUDFLARE.md para instruções.'
  );
  return '';
};

export const config = {
  apiUrl: getApiUrl(),
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
