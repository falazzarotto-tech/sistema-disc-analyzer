import puppeteer from 'puppeteer';

type User = {
  id: string;
  name: string;
  email: string;
  context: string | null;
};

type Score = {
  dimension: string;
  avg: number;
};

export async function generateDiscPdf(user: User, scores: Score[]) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process'
    ]
  });

  const page = await browser.newPage();

  const today = new Date().toLocaleDateString('pt-BR');

  const html = `
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <title>Relatório Ânima - ${user.name}</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
      .page { padding: 40px 60px; }
      h1, h2, h3, h4 { margin: 0; }
      .header { border-bottom: 4px solid #F85E5E; padding-bottom: 16px; margin-bottom: 24px; }
      .logo { font-size: 24px; font-weight: 800; color: #111827; }
      .tagline { font-size: 12px; color: #6B7280; margin-top: 4px; }
      .meta { font-size: 11px; color: #6B7280; margin-top: 12px; }
      .section-title { font-size: 14px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; color: #111827; }
      .section-text { font-size: 11px; color: #4B5563; line-height: 1.5; }
      .score-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
      .score-table th, .score-table td { border: 1px solid #E5E7EB; padding: 6px 8px; text-align: left; }
      .score-table th { background-color: #F9FAFB; font-weight: 600; }
      .bar { height: 6px; border-radius: 999px; background-color: #F3F4F6; overflow: hidden; }
      .bar-fill { height: 100%; background: linear-gradient(90deg, #F85E5E, #F97316); }
      .footer { margin-top: 32px; font-size: 9px; color: #9CA3AF; text-align: right; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div class="logo">Ânima</div>
        <div class="tagline">Análise de Dinâmica Comportamental</div>
        <div class="meta">
          Nome: <strong>${user.name}</strong><br />
          E-mail: ${user.email}<br />
          Contexto da análise: ${user.context || '—'}<br />
          Data: ${today}
        </div>
      </div>

      <h2 class="section-title">Resumo Executivo</h2>
      <p class="section-text">
        Este relatório apresenta uma leitura sintética das suas principais dinâmicas comportamentais
        a partir das respostas fornecidas na avaliação Ânima.
      </p>

      <h3 class="section-title">Perfil de Pontuações</h3>
      <table class="score-table">
        <thead>
          <tr>
            <th>Dimensão</th>
            <th>Média</th>
            <th>Intensidade</th>
          </tr>
        </thead>
        <tbody>
          ${scores.map(s => {
            const pct = Math.min(100, (s.avg / 5) * 100);
            return `
              <tr>
                <td>${s.dimension}</td>
                <td>${s.avg.toFixed(2)}</td>
                <td>
                  <div class="bar">
                    <div class="bar-fill" style="width: ${pct}%"></div>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <h3 class="section-title">Observações Iniciais</h3>
      <p class="section-text">
        Este documento é um ponto de partida para conversas de desenvolvimento, tomada de decisão
        de carreira e autoconhecimento. A interpretação deve sempre considerar o contexto real em
        que você está inserido(a).
      </p>

      <div class="footer">
        Relatório gerado automaticamente pelo Sistema Ânima.
      </div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdf;
}
