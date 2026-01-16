import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Ajuste para seu endpoint real se estiver no Railway

async function runTest() {
  try {
    console.log('🚀 Iniciando teste do Sistema Anima...');

    // 1. Criar Usuário
    const userRes = await axios.post(`${API_URL}/users`, {
      name: "Usuário Teste Real",
      email: "teste@anima.com",
      context: "Profissional (Liderança)"
    });
    const userId = userRes.data.id;
    console.log(`✅ Usuário criado: ${userId}`);

    // 2. Simular 32 Respostas (valores aleatórios entre 1 e 5)
    const dimensions = ['Percepção', 'Decisão', 'Comportamento', 'Regulação', 'Contexto'];
    const answers = [];
    for (let i = 1; i <= 32; i++) {
      answers.push({
        questionId: i,
        dimension: dimensions[Math.floor(Math.random() * dimensions.length)],
        score: Math.floor(Math.random() * 5) + 1
      });
    }

    await axios.post(`${API_URL}/disc/answers`, { userId, answers });
    console.log('✅ Respostas enviadas.');

    console.log('\n--- RESULTADO ---');
    console.log(`🔗 Link do Mapa (JSON): ${API_URL}/disc/${userId}/map`);
    console.log(`🔗 Link do PDF (8 Páginas): ${API_URL}/disc/${userId}/pdf`);
    console.log('-----------------\n');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

runTest();
