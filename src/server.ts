import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import path from 'path';
import fastifyStatic from '@fastify/static';
import fs from 'fs';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// Servir arquivos estáticos da pasta public
app.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/', 
});

const DISC_INTERPRETATION: Record<string, any> = {
  D: { name: "Dominância (Executor)", traits: "Direto, decidido, focado em resultados e desafios.", strengths: "Tomada de decisão rápida e visão estratégica.", growth: "Desenvolver paciência e escuta ativa." },
  I: { name: "Influência (Comunicador)", traits: "Otimista, persuasivo, sociável e entusiasta.", strengths: "Capacidade de networking e motivação de times.", growth: "Foco em detalhes e organização de processos." },
  S: { name: "Estabilidade (Planejador)", traits: "Calmo, paciente, leal e bom ouvinte.", strengths: "Trabalho em equipe e consistência na entrega.", growth: "Agilidade em mudanças e assertividade em conflitos." },
  C: { name: "Conformidade (Analista)", traits: "Preciso, analítico, disciplinado e detalhista.", strengths: "Qualidade técnica e conformidade com regras.", growth: "Flexibilidade e redução do perfeccionismo excessivo." }
};

app.post('/users', async (request) => {
  const { name, email } = z.object({ name: z.string(), email: z.string().email() }).parse(request.body);
  return await prisma.user.create({ data: { name, email } });
});

app.get('/disc/:userId/pdf', async (request, reply) => {
  const { userId } = request.params as { userId: string };
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const results = await prisma.discAnswer.groupBy({ by: ['dimension'], where: { userId }, _sum: { score: true } });

    if (!user || results.length === 0) return reply.status(404).send({ error: "Dados não encontrados" });

    const scores: any = { D: 0, I: 0, S: 0, C: 0 };
    results.forEach(res => { scores[res.dimension] = res._sum.score || 0; });
    const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const info = DISC_INTERPRETATION[dominant];

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const publicPath = path.join(process.cwd(), 'public');

      // --- PÁGINA 1: CAPA ---
      const coverPath = path.join(publicPath, 'cover-chain.png');
      if (fs.existsSync(coverPath)) {
        doc.image(coverPath, 0, 0, { width: 595, height: 842 });
      } else {
        doc.rect(0, 0, 595, 842).fill('#F1F5F9'); // Fundo reserva se imagem sumir
      }

      const logoPath = path.join(publicPath, 'cover-logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 60, 60, { width: 150 });
      }

      doc.fillColor('#000000').fontSize(32).font('Helvetica-Bold').text('Relatório de Perfil', 60, 480);
      doc.fillColor('#F85E5E').text('Comportamental', 60, 520);
      doc.fillColor('#000000').fontSize(20).text(user.name.toUpperCase(), 60, 600);

      // --- PÁGINA 2: CONTEÚDO ---
      doc.addPage({ margin: 50 });
      
      const bar1Path = path.join(publicPath, 'bar1.png');
      if (fs.existsSync(bar1Path)) doc.image(bar1Path, 0, 0, { width: 595, height: 15 });

      doc.moveDown(4);
      doc.fillColor('#F85E5E').fontSize(10).font('Helvetica-Bold').text('RESULTADO');
      doc.fillColor('#000000').fontSize(26).text(info.name);

      doc.moveDown(2);
      ['D', 'I', 'S', 'C'].forEach(d => {
        const barWidth = (scores[d] / 15) * 350;
        doc.fillColor('#64748B').fontSize(10).text(d, 50, doc.y + 10);
        doc.rect(80, doc.y - 10, 350, 12).fill('#F1F5F9');
        doc.rect(80, doc.y - 10, Math.max(barWidth, 5), 12).fill('#F85E5E');
        doc.moveDown(1.2);
      });

      doc.end();
    });

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename=Relatorio-${userId}.pdf`)
      .send(pdfBuffer);

  } catch (err) {
    app.log.error(err);
    reply.status(500).send({ error: "Erro interno ao gerar PDF" });
  }
});

app.post('/disc/answers', async (request) => {
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
});

app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
