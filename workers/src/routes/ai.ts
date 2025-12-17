
import OpenAI from 'openai';
import { Env } from '../index';

export const handleAIChat = async (request: Request, env: Env) => {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { messages, context, mode } = await request.json() as any;

        // Mode: 'chat' (General) or 'recommend' (Specific Calculation)

        if (!env.OPENAI_API_KEY) {
            return new Response(JSON.stringify({ error: 'OpenAI API Key not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

        const systemPrompt = `Você é um assistente especializado em planejamento de mídia OOH (Out of Home) para a plataforma OOHDataHub.
        
        SEU OBJETIVO: Ajudar o usuário a encontrar os melhores pontos de mídia baseados em:
        1. Briefing (texto ou PDF extraído)
        2. Localização (proximidade de lojas/pontos de interesse)
        3. Perfil de público

        CONTEXTO FORNECIDO:
        ${JSON.stringify(context || {})}

        Se o usuário fornecer uma lista de locais (Excel), sugira filtros de cidade/bairro ou peça para o backend calcular distâncias.
        
        Retorne SEMPRE um JSON estruturado se identificar uma intenção de busca, no formato:
        {
            "intent": "search" | "chat",
            "search_params": {
                "city": string | null,
                "uf": string | null,
                "radius_km": number | null,
                "center": { "lat": number, "lng": number } | null,
                "keywords": string[]
            },
            "reply": "Texto de resposta para o usuário"
        }
        `;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            model: "gpt-4-turbo-preview", // Or gpt-3.5-turbo
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;

        // Parse the response
        let parsedContent;
        try {
            parsedContent = JSON.parse(content || '{}');
        } catch (e) {
            parsedContent = { intent: 'chat', reply: content };
        }

        // If intent is search, we could optionally perform the DB search here or on frontend.
        // For now, let's return the structured intent to the frontend so it can filter the store or map.

        return new Response(JSON.stringify(parsedContent), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
