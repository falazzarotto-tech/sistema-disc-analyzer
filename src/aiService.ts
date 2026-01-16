import { SYSTEM_IDENTITY, LANGUAGE_RULES, REPORT_STRUCTURE } from './systemConfig';

interface Score {
  dimension: string;
  avg: number;
}

export const generateMapReport = (userName: string, scores: Score[], context: string) => {
  // Função auxiliar para garantir as regras de linguagem (Sanitização)
  const sanitize = (text: string) => {
    let cleanText = text;
    LANGUAGE_RULES.forbidden.forEach(word => {
      const regex = new RegExp(word, 'gi');
      // Substitui termos proibidos por termos permitidos ou neutros
      cleanText = cleanText.replace(regex, 'Sua dinâmica atual indica');
    });
    return cleanText;
  };

  // Lógica de interpretação simplificada para o MVP (Baseada nas 4 camadas)
  const getScore = (dim: string) => scores.find(s => s.dimension === dim)?.avg || 3;

  const p = getScore('Percepção');
  const d = getScore('Decisão');
  const c = getScore('Comportamento');
  const r = getScore('Regulação');

  const report: any = {
    title: REPORT_STRUCTURE.title,
    userName,
    context,
    sections: {}
  };

  // 1. Abertura explicativa
  report.sections["Abertura explicativa"] = sanitize(`Olá, ${userName}. Este documento é um Mapa de sua dinâmica atual no contexto de ${context}. Ele deve ser lido como um retrato do momento, oferecendo consciência sobre como você está funcionando agora.`);

  // 2. Dinâmica Geral Observada
  report.sections["Dinâmica Geral Observada"] = sanitize(`A dinâmica observada sugere um estado atual onde a percepção (${p > 3 ? 'aberta a novas ideias' : 'focada em processos'}) se une a uma tomada de decisão (${d > 3 ? 'objetiva' : 'relacional'}).`);

  // 3. Como a Pessoa Tende a Atuar no Dia a Dia
  report.sections["Como a Pessoa Tende a Atuar no Dia a Dia"] = sanitize(`No momento, você tende a atuar com um ritmo ${c > 3 ? 'acelerado e voltado para resultados' : 'metódico e analítico'}. Sua comunicação indica uma busca por ${c > 3 ? 'influência e clareza' : 'precisão e segurança'}.`);

  // 4. Sustentação de Pressão no Momento
  report.sections["Sustentação de Pressão no Momento"] = sanitize(`O estado atual indica que, sob pressão, sua regulação emocional sugere ${r > 3 ? 'manutenção de clareza antes de reagir' : 'necessidade de pausa para recuperar o equilíbrio'}.`);

  // 5. Zona de Melhor Alocação Atual
  report.sections["Zona de Melhor Alocação Atual"] = sanitize(`A dinâmica observada pode favorecer atuações que exijam ${c > 3 ? 'autonomia e liderança de movimento' : 'organização, análise e suporte técnico'}.`);

  // 6. Pontos de Atenção no Momento
  report.sections["Pontos de Atenção no Momento"] = sanitize(`Pode gerar desgaste se mantido em excesso o foco em ${p > 4 ? 'muitas frentes simultâneas' : 'detalhes excessivamente minuciosos'}, especialmente sob alta demanda.`);

  // 7. Ajustes Conscientes de Alta Alavancagem
  report.sections["Ajustes Conscientes de Alta Alavancagem"] = [
    sanitize("Observar o tempo de resposta antes de decisões críticas."),
    sanitize("Validar expectativas com o ambiente para reduzir tensões desnecessárias."),
    sanitize("Reservar momentos de descompressão para sustentar o ritmo atual.")
  ];

  // 8. Ponte Suave para Outras Áreas
  report.sections["Ponte Suave para Outras Áreas"] = sanitize("Este mapa sugere um convite à observação de como essa dinâmica se repete em outros ambientes de sua vida.");

  // 9. Encerramento
  report.sections["Encerramento"] = sanitize(`Este mapa reforça sua autonomia e possibilidade de evolução. ${SYSTEM_IDENTITY.disclaimer}`);

  return report;
};
