export interface DiscScore {
  dimension: string;
  avg: number;
}

interface RouteLLMChoice {
  message: {
    content: string;
  };
}

interface RouteLLMResponse {
  choices: RouteLLMChoice[];
}

const ROUTE_LLM_URL = 'https://routellm.abacus.ai/v1/chat/completions';
const API_KEY = process.env.ROUTELLM_API_KEY;

export async function generateAiAnalysis(userName: string, scores: DiscScore[]) {
  if (!API_KEY) {
    console.error('ERRO: ROUTELLM_API_KEY não configurada.');
    return null;
  }

  const prompt = `
Você é um Especialista Sênior em Psicometria e Metodologia DISC.
Analise os resultados abaixo para o usuário "${userName}":

${scores.map(s => `- ${s.dimension}: ${s.avg.toFixed(1)}`).join('\n')}

REGRAS:
1) Retorne APENAS um objeto JSON válido (sem texto adicional).
2) Tom: profissional, executivo e encorajador.
3) O JSON deve conter as chaves:
   - perfil_dominante (string)
   - resumo_executivo (string, max 3-4 frases)
   - pontos_fortes (array de strings)
   - desafios (array de strings)
   - conselho_carreira (string)
4) Se a saída contiver texto extra, extraia o JSON contido no texto.
`;

  const body = {
    model: 'claude-3-5-sonnet',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  };

  try {
    const res = await fetch(ROUTE_LLM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Erro API: ${res.status}`);

    const data = (await res.json()) as RouteLLMResponse;
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
  } catch (err) {
    console.error('Erro na análise IA:', err);
    return null;
  }
}
