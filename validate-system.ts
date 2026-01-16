async function runValidation() {
  const BASE_URL = 'https://sistema-anima-analyzer-production.up.railway.app';
  
  console.log('🚀 Iniciando Validação de Sistema...');

  // Passo 1: Garantir Usuário (Upsert)
  const userRes = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'SÊNIOR TESTER',
      email: 'senior.test@anima.com',
      context: 'Auditoria Técnica'
    })
  });
  const user = await userRes.json();
  if (!user.id) throw new Error('Falha ao obter ID do usuário');
  console.log(`✅ Usuário validado: ${user.id}`);

  // Passo 2: Persistir Respostas
  const answersRes = await fetch(`${BASE_URL}/disc/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      answers: [{ questionId: 1, dimension: 'Expressão', score: 5 }]
    })
  });
  const result = await answersRes.json();
  console.log('📊 Resultado do Diagnóstico:', result);

  if (result.message === 'OK') {
    console.log('✨ SISTEMA OPERACIONAL E ÍNTEGRO.');
  } else {
    console.error('❌ FALHA NA VALIDAÇÃO:', result);
  }
}

runValidation().catch(console.error);
