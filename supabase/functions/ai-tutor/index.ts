import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não está configurada');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Get user info from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { message, context, conversationHistory } = await req.json();

    if (!message) {
      throw new Error('Mensagem é obrigatória');
    }

    // Build system prompt with educational context
    const systemPrompt = `Você é um IA Tutor educacional especializado em fornecer suporte personalizado para estudantes. Seu papel é:

1. **Feedback Personalizado**: Analise o desempenho do estudante e forneça feedback construtivo
2. **Sugestões de Aprendizado**: Recomende caminhos de estudo e recursos baseados nas necessidades do aluno
3. **Resposta Automática**: Responda dúvidas de forma clara e didática
4. **Motivação**: Incentive o estudante e celebre seus progressos

CONTEXTO DO ESTUDANTE:
- Nome: ${profile?.name || 'Estudante'}
- Turma: ${profile?.class || 'Não informada'}
- RA: ${profile?.ra || 'Não informado'}
- Moedas IFCoins: ${profile?.coins || 0}
- Papel: ${profile?.role || 'student'}

INFORMAÇÕES ADICIONAIS:
${context || 'Nenhuma informação adicional fornecida'}

DIRETRIZES:
- Seja sempre positivo e encorajador
- Use linguagem apropriada para estudantes
- Forneça exemplos práticos quando possível
- Sugira atividades ou recursos específicos
- Mantenha respostas concisas mas completas
- Sempre termine com uma pergunta ou sugestão para continuar aprendendo

Responda em português brasileiro de forma amigável e educativa.`;

    // Prepare conversation history for Gemini
    const conversationParts = [];
    
    // Add system prompt
    conversationParts.push({
      text: systemPrompt
    });

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        conversationParts.push({
          text: `${msg.role === 'user' ? 'Estudante' : 'IA Tutor'}: ${msg.content}`
        });
      });
    }

    // Add current message
    conversationParts.push({
      text: `Estudante: ${message}`
    });

    console.log('Enviando mensagem para Gemini:', { message, context });

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: conversationParts
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Gemini:', errorText);
      throw new Error(`Erro da API Gemini: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta do Gemini:', data);

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Nenhuma resposta gerada pela IA');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    // Log the interaction for analytics (optional)
    try {
      await supabase.from('security_logs').insert({
        user_id: user.id,
        action: 'ai_tutor_interaction',
        metadata: {
          message_length: message.length,
          response_length: aiResponse.length,
          context: context || null
        }
      });
    } catch (logError) {
      console.error('Erro ao registrar interação:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro na função ai-tutor:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno do servidor',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});