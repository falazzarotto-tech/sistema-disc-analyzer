import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import path from 'path';
import fastifyStatic from '@fastify/static';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// Configuração para servir os arquivos da pasta 'public'
app.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/', 
});

const DISC_INTERPRETATION: Record<string, any> = {
  D: { name: "Dominância (Executor)", traits: "Direto, decidido, focado em resultados.", strengths: "Decisão rápida.", growth: "Impaciência." },
  I: { name: "Influência (Comunicador)", traits: "Otimista, persuasivo, sociável.", strengths: "Networking.", growth: "Falta de foco." },
  S: { name: "Estabilidade (Planejador)", traits: "Calmo, paciente, leal.", strengths: "Trabalho em equipe.", growth: "Resistência a mudanças." },
  C: { name: "Conformidade (Analista)", traits: "Preciso, analítico, disciplinado.", strengths: "Qualidade técnica.", growth: "Perfeccionismo." }
};

// Rota para criar usuário (usada pelo Frontend)
app.post('/users', async (request, reply) => {
  const { name, email } = z.object({
    name: z.string(),
    email: z.string().email()
  }).parse(request.body);

  const user = await prisma.user.create({ data: { name, email } });
  return user;
});

app.get('/health', async () => ({ status: "ok" }));

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

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.fontSize(25).text('Relatório de Perfil DISC', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Candidato: ${user.name}`);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(18).fillColor('#2c3e50').text(`Perfil Dominante: ${info.name}`);
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('black').text(`Características:`, { underline: true });
      doc.text(info.traits);
      doc.moveDown();
      doc.fontSize(12).text(`Pontos Fortes:`, { underline: true });
      doc.text(info.strengths);
      doc.moveDown();
      doc.fontSize(12).text(`Áreas de Desenvolvimento:`, { underline: true });
      doc.text(info.growth);
      doc.moveDown(2);
      doc.fontSize(14).text('Pontuação Detalhada:');
      doc.fontSize(12)
        .text(`- Dominância (D): ${scores.D}`)
        .text(`- Influência (I): ${scores.I}`)
        .text(`- Estabilidade (S): ${scores.S}`)
        .text(`- Conformidade (C): ${scores.C}`);
      doc.end();
    });

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename=relatorio-${user.name.replace(/\s+/g, '-')}.pdf`)
      .send(pdfBuffer);
  } catch (error: any) {
    reply.status(500).send({ error: "Erro ao gerar PDF" });
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
