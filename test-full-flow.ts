async function main() {
  // 1. Criar ou atualizar usuário
  const userRes = await fetch('https://sistema-anima-analyzer-production.up.railway.app/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'TESTE PADRÃO AUTOMÁTICO',
      email: 'teste.automatico@anima.com',
      context: 'Validação Automática'
    })
  });
  const user = await userRes.json();
  console.log('Usuário criado/atualizado:', user);

  // 2. Enviar respostas para o userId criado
  const answersRes = await fetch('https://sistema-anima-analyzer-production.up.railway.app/disc/answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      answers: [
        { questionId: 1, dimension: 'Expressão', score: 5 },
        { questionId: 2, dimension: 'Decisão', score: 4 }
      ]
    })
  });
  const answersResult = await answersRes.json();
  console.log('Resultado do envio das respostas:', answersResult);
}

main().catch(err => {
  console.error('ERRO NO SCRIPT:', err);
  process.exit(1);
});
