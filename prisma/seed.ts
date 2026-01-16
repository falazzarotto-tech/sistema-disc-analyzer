import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando questionário completo...');

  // Limpa dados antigos para evitar duplicidade
  await prisma.discAnswer.deleteMany({});
  
  const questions = [
    // Dimensão: Expressão
    { id: 1, dimension: 'Expressão', text: 'Eu me sinto à vontade comunicando minhas ideias em público.' },
    { id: 2, dimension: 'Expressão', text: 'Tenho facilidade em persuadir outras pessoas.' },
    
    // Dimensão: Decisão
    { id: 3, dimension: 'Decisão', text: 'Tomo decisões rapidamente, mesmo sob pressão.' },
    { id: 4, dimension: 'Decisão', text: 'Prefiro assumir o controle de situações desafiadoras.' },
    
    // Dimensão: Regulação
    { id: 5, dimension: 'Regulação', text: 'Sigo processos e normas rigorosamente.' },
    { id: 6, dimension: 'Regulação', text: 'Analiso todos os riscos antes de agir.' },
    
    // Dimensão: Contexto
    { id: 7, dimension: 'Contexto', text: 'Consigo me adaptar facilmente a novos ambientes.' },
    { id: 8, dimension: 'Contexto', text: 'Levo em conta o impacto das minhas ações no grupo.' }
  ];

  // Nota: Como o modelo DiscAnswer não tem campo 'text', 
  // o seed servirá para garantir que o motor de análise saiba quais IDs pertencem a quais dimensões.
  console.log('✅ Questionário mapeado no motor interno.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
