import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import path from 'path';
import fastifyStatic from '@fastify/static';
import fs from 'fs';

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

app.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/', 
});

// Nova estrutura de interpretação baseada em Dinâmicas
const DYNAMICS_INTERPRETATION: Record<string, any> = {
  D: { name: "Dinâmica de Dominância", traits: "Tendência a operar com foco em resultados, rapidez e enfrentamento de desafios.", strengths: "Zonas de Alta Alocação: Decisões estratégicas e ambientes de alta pressão.", growth: "Ajustes de Alavancagem: Praticar a escuta ativa e reduzir a impulsividade." },
  I: { name: "Dinâmica de Influência", traits: "Tendência a operar através da conexão, entusiasmo e persuasão.", strengths: "Zonas de Alta Alocação: Networking, motivação de times e comunicação.", growth: "Ajustes de Alavancagem: Foco em processos e detalhamento técnico." },
  S: { name: "Dinâmica de Estabilidade", traits: "Tendência a operar com consistência, lealdade e ritmo cadenciado.", strengths: "Zonas de Alta Alocação: Planejamento, suporte e ambientes colaborativos.", growth: "Ajustes de Alavancagem: Flexibilidade para mudanças rápidas." },
  C: { name: "Dinâmica de Conformidade", traits: "Tendência a operar com precisão, disciplina e rigor analítico.", strengths: "Zonas de Alta Alocação: Qualidade, análise de dados e conformidade.", growth: "Ajustes de Alavancagem: Redução do perfeccionismo e abertura ao risco." }
};

app.post('/users', async (request) => {
  const { name, email, context } = z.object({ 
    name: z.string(), 
    email: z.string().email(),
    context: z.string().optional()
  }).parse(request.body);
  
  return await prisma.user.create({ 
    data: { name, email, context: context || "Profissional" } 
  });
});

app.get('/disc/:userId/pdf', async (request, reply) => {
  const { userId } = request.params as { userId: string };
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const results = await prisma.answer.groupBy({ by: ['dimension'], where: { userId }, _sum: { score: true } });

    if (!user || results.length === 0) return reply.status(404).send({ error: "Mapa não encontrado" });

    const scores: any = { D: 0, I: 0, S: 0, C: 0 };
    results.forEach(res => { scores[res.dimension] = res._sum.score || 0; });
    const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const info = DYNAMICS_INTERPRETATION[dominant];

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument({ margin: 0, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const publicPath = path.join(process.cwd(), 'public');

      // CAPA
      const coverPath = path.join(publicPath, 'cover-chain.png');
      if (fs.existsSync(coverPath)) doc.image(coverPath, 0, 0, { width: 595, height: 842 });
      
      const logoPath = path.join(publicPath, 'cover-logo.png');
      if (fs.existsSync(logoPath)) doc.image(logoPath, 60, 60, { width: 150 });

      doc.fillColor('#000000').fontSize(28).font('Helvetica-Bold').text('Mapa de Dinâmica', 60, 480);
      doc.fillColor('#F85E5E').text('Psico-Comportamental', 60, 515);
      doc.fillColor('#64748B').fontSize(12).font('Helvetica').text(`CONTEXTO: ${user.context.toUpperCase()}`, 60, 560);
      doc.fillColor('#000000').fontSize(18).font('Helvetica-Bold').text(user.name.toUpperCase(), 60, 585);

      // PÁGINA 2
      doc.addPage({ margin: 50 });
      doc.fillColor('#000000').fontSize(20).font('Helvetica-Bold').text('Estado Psico-Comportamental Atual');
      doc.moveDown();
      doc.fillColor('#F85E5E').fontSize(14).text(info.name);
      doc.fillColor('#334155').fontSize(11).font('Helvetica').text(info.traits, { width: 480 });
      
      doc.moveDown(2);
      doc.fillColor('#F85E5E').fontSize(12).font('Helvetica-Bold').text(info.strengths);
      doc.moveDown();
      doc.text(info.growth);

      doc.end();
    });

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename=Mapa-Dinamica-${user.name}.pdf`)
      .send(pdfBuffer);
  } catch (err) {
    reply.status(500).send({ error: "Erro ao gerar Mapa" });
  }
});

app.post('/disc/answers', async (request) => {
  const { userId, answers } = z.object({
    userId: z.string(),
    answers: z.array(z.object({ questionId: z.number(), dimension: z.enum(['D', 'I', 'S', 'C']), score: z.number() }))
  }).parse(request.body);

  await prisma.answer.createMany({ data: answers.map(a => ({ userId, questionId: a.questionId, dimension: a.dimension, score: a.score })) });
  const results = await prisma.answer.groupBy({ by: ['dimension'], where: { userId }, _sum: { score: true } });
  const scores: any = { D: 0, I: 0, S: 0, C: 0 };
  results.forEach(res => { scores[res.dimension] = res._sum.score || 0; });
  const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  return { userId, scores, profile: DYNAMICS_INTERPRETATION[dominant] };
});

app.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
