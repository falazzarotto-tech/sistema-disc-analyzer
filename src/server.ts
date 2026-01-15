import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import puppeteer from 'puppeteer';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

const DISC_INTERPRETATION: Record<string, any> = {
  D: { name: "Dominância (Executor)", traits: "Direto, decidido, focado em resultados.", strengths: "Decisão rápida.", growth: "Impaciência." },
  I: { name: "Influência (Comunicador)", traits: "Otimista, persuasivo, sociável.", strengths: "Networking.", growth: "Falta de foco." },
  S: { name: "Estabilidade (Planejador)", traits: "Calmo, paciente, leal.", strengths: "Trabalho em equipe.", growth: "Resistência a mudanças." },
  C: { name: "Conformidade (Analista)", traits: "Preciso, analítico, disciplinado.", strengths: "Qualidade técnica.", growth: "Perfeccionismo." }
};

app.get('/health', async () => ({ status: "ok" }));
app.get('/users', async () => await prisma.user.findMany());

app.get('/disc/:userId/pdf', async (request, reply) => {
  const { userId } = request.params as { userId: string };
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const results = await prisma.discAnswer.groupBy({
      by: ['dimension'],
      where: { userId },
      _sum: { score: true }
    });

    if (!user || results.length === 0) {
      return reply.status(404).send({ error: "Usuário ou teste não encontrado" });
    }

    const scores: any = { D: 0, I: 0, S: 0, C: 0 };
    results.forEach(res => { scores[res.dimension] = res._sum.score || 0; });
    const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const info = DISC_INTERPRETATION[dominant];

    const htmlContent = `
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h1 style="color: #2c3e50;">Relatório de Perfil DISC</h1>
          <p><strong>Nome:</strong> ${user.name}</p>
          <hr>
          <h2>Seu Perfil Dominante: ${info.name}</h2>
          <p><strong>Características:</strong> ${info.traits}</p>
          <p><strong>Pontos Fortes:</strong> ${info.strengths}</p>
          <p><strong>Áreas de Desenvolvimento:</strong> ${info.growth}</p>
          <br>
          <h3>Pontuação Detalhada:</h3>
          <ul>
            <li>Dominância: ${scores.D}</li>
            <li>Influência: ${scores.I}</li>
            <li>Estabilidade: ${scores.S}</li>
            <li>Conformidade: ${scores.C}</li>
          </ul>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename=relatorio-disc.pdf')
      .send(pdfBuffer);

  } catch (error: any) {
    reply.status(500).send({ error: "Erro ao gerar PDF", details: error.message });
  }
});

app.post('/disc/answers', async (request, reply) => {
  try {
    const { userId, answers } = z.object({
      userId: z.string(),
      answers: z.array(z.object({ questionId: z.number(), dimension: z.enum(['D', 'I', 'S', 'C']), score: z.number() }))
    }).parse(request.body);

    await prisma.discAnswer.createMany({ data: answers.map(a => ({ userId, questionId: a.questionId, dimension: a.dimension, score: a.score })) });
    const results = await prisma.discAnswer.groupBy({ by: ['dimension'], where: { userId }, _sum: { score: true } });
    const scores: any = { D: 0, I: 0, S: 0, C: 0 };
    results.forEach(res => { scores[res.dimension] = res._sum.score || 0; });
    const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    return { userId, scores, profile: DISC_INTERPRETATION[dominant] };
  } catch (error: any) {
    reply.status(500).send({ error: "Erro ao processar teste" });
  }
});

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};
start();
