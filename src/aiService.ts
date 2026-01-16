export interface DiscScore {
  dimension: string;
  avg: number;
}

// No padrão RouteLLM da Abacus, o roteamento é automático
const ROUTE_LLM_URL = 'https://routellm.abacus.ai/v1/chat/completions';

export async function generateAiAnalysis(userName: string, scores: DiscScore[]) {
  const prompt = `Analise os resultados DISC de ${userName}: ${JSON.stringify(scores)}. 
  Retorne um JSON com: perfil_dominante, resumo_executivo, pontos_fortes (array), desafios (array), conselho_carreira. 
  Use tom profissional. Retorne APENAS o JSON.`;

  try {
    const response = await fetch(ROUTE_LLM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Removida a obrigatoriedade da API_KEY fixa se o ambiente já estiver autenticado via infra
      },
      body: JSON.stringify({
        // Removido o modelo fixo para permitir que o RouteLLM escolha
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5 
      })
    });

    const data: any = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
  } catch (error) {
    console.error('Falha na análise RouteLLM:', error);
    return {
      perfil_dominante: "Análise em processamento",
      resumo_executivo: "A análise detalhada está sendo gerada pelo motor de IA.",
      pontos_fortes: ["Processamento de dados"],
      desafios: ["Latência de rede"],
      conselho_carreira: "Aguarde a consolidação dos dados."
    };
  }
}
