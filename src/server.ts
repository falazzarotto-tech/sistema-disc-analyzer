import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

console.log("🔧 DEBUG: Iniciando servidor DISC...");

const app = Fastify({ 
  logger: true
});

console.log("🔧 DEBUG: Fastify inicializado");

// Criamos o Prisma Client (mas não conectamos ainda)
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

console.log("🔧 DEBUG: PrismaClient criado");

// ========================================
// ROTAS DE HEALTH CHECK (SEM BANCO)
// ========================================

app.get('/health', async () => {
  console.log("✅ Health check chamado");
  return { 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "Sistema DISC Analyzer"
  };
});

app.get('/', async () => {
  console.log("✅ Rota raiz chamada");
  return { 
    message: "Sistema DISC Online", 
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  };
});

// ========================================
// ROTAS COM BANCO DE DADOS
// ========================================

// Rota: Listar Usuários
app.get('/users', async (request, reply) => {
  try {
    console.log("📊 Buscando usuários no banco...");
    const users = await prisma.user.findMany();
    console.log(`✅ ${users.length} usuários encontrados`);
    return users;
  } catch (error: any) {
    console.error("❌ Erro ao buscar usuários:", error.message);
    reply.status(500).send({ 
      error: "Erro ao acessar banco de dados", 
      message: error.message,
      code: error.code 
    });
  }
});

// Esquema de Validação
const UserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
});

// Rota: Criar Usuário
app.post('/users', async (request, reply) => {
  try {
    console.log("📝 Criando novo usuário...");
    const data = UserSchema.parse(request.body);
    const user = await prisma.user.create({ data });
    console.log(`✅ Usuário criado: ${user.id}`);
    return user;
  } catch (error: any) {
    console.error("❌ Erro ao criar usuário:", error.message);
    if (error.name === 'ZodError') {
      reply.status(400).send({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    } else {
      reply.status(500).send({ 
        error: "Erro ao criar usuário", 
        message: error.message 
      });
    }
  }
});

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = '0.0.0.0';

    console.log(`🚀 Tentando iniciar servidor na porta ${port}...`);
    
    await app.listen({ port, host });
    
    console.log(`✅ Servidor DISC rodando em http://${host}:${port}`);
    console.log(`✅ Health check: http://${host}:${port}/health`);
    console.log(`✅ Ambiente: ${process.env.NODE_ENV || 'development'}`);
    
    // Testa conexão com o banco (mas não trava se falhar)
    prisma.$connect()
      .then(() => console.log("✅ Prisma conectado ao banco de dados"))
      .catch((e) => console.error("⚠️  Aviso: Prisma não conectou ao banco:", e.message));
      
  } catch (err: any) {
    console.error("❌ ERRO FATAL ao iniciar servidor:", err.message);
    app.log.error(err);
    process.exit(1);
  }
};

// Tratamento de sinais de encerramento
process.on('SIGINT', async () => {
  console.log("🛑 Recebido SIGINT, encerrando...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log("🛑 Recebido SIGTERM, encerrando...");
  await prisma.$disconnect();
  process.exit(0);
});

start();