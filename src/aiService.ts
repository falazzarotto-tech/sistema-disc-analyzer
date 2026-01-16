export interface DiscScore {
  dimension: string;
  avg: number;
}

const ROUTE_LLM_URL = 'https://routellm.abacus.ai/v1/chat/completions';
const MODEL = 'claude-3-5-sonnet';
const API_KEY = process.env.ROUTELLM_API_KEY;

/**
 * Gera análise via Claude 3.5 Sonnet (RouteLLM). Usa fetch global via globalThis.
 * Retorna um objeto JS (parsed JSON) ou lança erro.
 */
export async function generateAiAnalysis(userName: string, scores: DiscScore[]): Promise<any> {
  if (!API_KEY) throw new Error('ROUTELLM_API_KEY não configurada em variáveis de ambiente');

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

EXEMPLO DE SAÍDA:
{
  "perfil_dominante":"Expressão",
  "resumo_executivo":"Texto...",
  "pontos_fortes":["...","..."],
  "desafios":["...","..."],
  "conselho_carreira":"..."
}
`;

  const body = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    // ajuste conforme política do RouteLLM/provider
  };

  const fetchFn = (globalThis as any).fetch;
  if (typeof fetchFn !== 'function') {
    throw new Error('Fetch global não disponível no runtime. Atualize node ou instale polyfill.');
  }

  const res = await fetchFn(ROUTE_LLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body),
    // timeout não incluído aqui; em produção use abort controller
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Erro LLM ${res.status}: ${txt}`);
  }

  const data = await res.json();
  // tentativa robusta de extrair conteúdo (compatível com respostas estilo chat/completions)
  const content = data?.choices?.[0]?.message?.content ?? data?.output ?? JSON.stringify(data);

  // extrai JSON embutido ou tenta parse direto
  const jsonMatch = String(content).match(/\{[\s\S]*\}/);
  try {
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(String(content));
    return parsed;
  } catch (err) {
    // log e rethrow com contexto
    const errMsg = typeof content === 'string' ? content.slice(0, 1000) : JSON.stringify(content).slice(0, 1000);
    throw new Error('Falha ao parsear resposta LLM. Conteúdo: ' + errMsg);
  }
}
