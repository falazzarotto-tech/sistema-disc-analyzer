import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const questions = [
    // Dominância (D)
    { id: 1, text: "Eu sou focado em resultados e objetivos claros.", dimension: "D" },
    { id: 2, text: "Eu tomo decisões rapidamente, mesmo sob pressão.", dimension: "D" },
    { id: 3, text: "Eu gosto de assumir o comando e liderar projetos.", dimension: "D" },
    // Influência (I)
    { id: 4, text: "Eu gosto de interagir e conhecer novas pessoas.", dimension: "I" },
    { id: 5, text: "Eu sou entusiasmado e otimista com novas ideias.", dimension: "I" },
    { id: 6, text: "Eu tenho facilidade em convencer os outros.", dimension: "I" },
    // Estabilidade (S)
    { id: 7, text: "Eu prefiro trabalhar em um ambiente calmo e previsível.", dimension: "S" },
    { id: 8, text: "Eu sou um bom ouvinte e apoio meus colegas.", dimension: "S" },
    { id: 9, text: "Eu prefiro terminar uma tarefa antes de começar outra.", dimension: "S" },
    // Conformidade (C)
    { id: 10, text: "Eu presto muita atenção aos detalhes e à precisão.", dimension: "C" },
    { id: 11, text: "Eu prefiro seguir regras e procedimentos claros.", dimension: "C" },
    { id: 12, text: "Eu analiso todos os fatos antes de tomar uma decisão.", dimension: "C" },
  ];

  console.log('Limpando banco...');
  await prisma.discAnswer.deleteMany();
  
  console.log('Semeando perguntas...');
  // Nota: Como nosso modelo atual não tem uma tabela de 'Question', 
  // vamos apenas garantir que o frontend saiba quais IDs usar.
  // Em um sistema avançado, criaríamos a tabela Question.
  
  console.log('Pronto! 12 perguntas estruturadas.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
