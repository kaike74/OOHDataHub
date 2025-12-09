// Configuração de ambiente
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ||
          (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
            ? 'https://ooh-system.kaike74.workers.dev' // Substitua pela URL do seu worker
            : 'http://localhost:8787'),

  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',

  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
