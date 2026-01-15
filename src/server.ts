import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import PDFDocument from 'pdfkit';

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

    const doc = new PDFDocument({ margin: 50 });
    const chunks: any[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Conteúdo do PDF
    doc.fontSize(25).text('RELATORIO DISC', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Nome: ${user.name}`);
    doc.moveDown();
    doc.fontSize(18).text(`Perfil: ${info.name}`);
    doc.moveDown();
    doc.fontSize(12).text(`D: ${scores.D} | I: ${scores.I} | S: ${scores.S} | C: ${scores.C}`);
    
    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename=resultado-final.pdf')
      .send(pdfBuffer);

  } catch (error: any) {
    reply.status(500).send({ error: "Erro interno" });
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
    reply.status(500).send({ error: "Erro" });
  }
});

app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
