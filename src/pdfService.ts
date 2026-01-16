import puppeteer from 'puppeteer';
import { SYSTEM_IDENTITY } from './systemConfig';

export const generateProfessionalPDF = async (mapData: any) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #1d1d1f; line-height: 1.6; }
        .page { height: 297mm; width: 210mm; padding: 25mm; box-sizing: border-box; page-break-after: always; position: relative; }
        .red-text { color: #E30613; }
        .gray-text { color: #86868b; }
        h1 { font-size: 32pt; font-weight: 700; margin-bottom: 10px; }
        h2 { font-size: 22pt; font-weight: 600; border-bottom: 1px solid #d2d2d7; padding-bottom: 10px; margin-top: 40px; }
        h3 { font-size: 16pt; font-weight: 600; margin-top: 30px; }
        p { font-size: 11pt; margin-bottom: 15px; }
        .footer { position: absolute; bottom: 20mm; left: 25mm; right: 25mm; font-size: 9pt; color: #86868b; border-top: 0.5px solid #d2d2d7; pt: 10px; }
        
        /* Capa */
        .capa { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        .logo { height: 60px; margin-bottom: 40px; }
        
        /* Gráficos Simples (CSS) */
        .chart-bar { background: #f5f5f7; height: 12px; border-radius: 6px; width: 100%; margin: 10px 0; overflow: hidden; }
        .chart-fill { background: #E30613; height: 100%; }
      </style>
    </head>
    <body>
      <!-- PÁGINA 0: CAPA -->
      <div class="page capa">
        <img src="https://sistema-anima-analyzer-production.up.railway.app/logo-anima.png" class="logo">
        <h1 class="red-text">Análise de Dinâmica Psico-Comportamental</h1>
        <p class="gray-text" style="font-size: 18pt;">Uma leitura do funcionamento no momento atual</p>
        <div style="margin-top: 100px;">
          <p><strong>Respondente:</strong> ${mapData.userName}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
          <p><strong>Contexto:</strong> ${mapData.context}</p>
        </div>
      </div>

      <!-- PÁGINA 1: RESUMO EXECUTIVO -->
      <div class="page">
        <h2>Resumo Executivo (Estado Atual)</h2>
        <p><em>Objetivo: Visão clara em 30–60 segundos.</em></p>
        <div style="background: #f5f5f7; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p><strong>Síntese:</strong> ${mapData.sections["Dinâmica Geral Observada"]}</p>
        </div>
        <h3>Principais Pontos de Destaque</h3>
        <p>${mapData.sections["Como a Pessoa Tende a Atuar no Dia a Dia"]}</p>
        <h3>Zonas de Atenção</h3>
        <p>${mapData.sections["Pontos de Atenção no Momento"]}</p>
        <h3>Ajustes de Alta Alavancagem</h3>
        <ul>
          ${mapData.sections["Ajustes Conscientes de Alta Alavancagem"].map((a: string) => `<li>${a}</li>`).join('')}
        </ul>
        <div class="footer">${SYSTEM_IDENTITY.disclaimer}</div>
      </div>

      <!-- PÁGINA 2: MÓDULO 1 - PERCEPÇÃO -->
      <div class="page">
        <h2>Módulo 1: Percepção & Energia</h2>
        <p class="gray-text">Como você percebe a realidade e direciona energia e atenção.</p>
        <div class="chart-bar"><div class="chart-fill" style="width: 70%;"></div></div>
        <p>${mapData.sections["Dinâmica Geral Observada"]}</p>
        <div class="footer">Página 2 | Mapa de Dinâmica Anima</div>
      </div>

      <!-- PÁGINA 3: MÓDULO 2 - DECISÃO -->
      <div class="page">
        <h2>Módulo 2: Decisão & Julgamento</h2>
        <p class="gray-text">Critérios de escolha, avaliação de impacto e prioridades.</p>
        <div class="chart-bar"><div class="chart-fill" style="width: 55%;"></div></div>
        <p>A dinâmica atual sugere uma tendência a equilibrar lógica e impacto relacional.</p>
        <div class="footer">Página 3 | Mapa de Dinâmica Anima</div>
      </div>

      <!-- PÁGINA 4: MÓDULO 3 - COMPORTAMENTO -->
      <div class="page">
        <h2>Módulo 3: Dinâmica Comportamental</h2>
        <p class="gray-text">Expressão comportamental observável (ação, influência, ritmo, estrutura).</p>
        <p>${mapData.sections["Como a Pessoa Tende a Atuar no Dia a Dia"]}</p>
        <div class="footer">Página 4 | Mapa de Dinâmica Anima</div>
      </div>

      <!-- PÁGINA 5: MÓDULO 4 - REGULAÇÃO -->
      <div class="page">
        <h2>Módulo 4: Regulação Emocional & Contexto</h2>
        <p class="gray-text">Sustentação emocional, pressão atual, clareza e sustentabilidade.</p>
        <p>${mapData.sections["Sustentação de Pressão no Momento"]}</p>
        <div class="footer">Página 5 | Mapa de Dinâmica Anima</div>
      </div>

      <!-- PÁGINA 6: INTEGRAÇÃO -->
      <div class="page">
        <h2>Integração das Camadas</h2>
        <p><em>Objetivo: Mostrar o todo, não as partes.</em></p>
        <p>A integração das camadas sugere que seu funcionamento atual é impulsionado por uma busca de clareza contextual, onde a regulação emocional atua como o fiel da balança para a sustentação do ritmo.</p>
        <div class="footer">Página 6 | Mapa de Dinâmica Anima</div>
      </div>

      <!-- PÁGINA 7: ORIENTAÇÕES PRÁTICAS -->
      <div class="page">
        <h2>Orientações Práticas</h2>
        <p><em>Objetivo: Transformar consciência em ação possível.</em></p>
        <h3>Ajustes Conscientes</h3>
        <ul>
          ${mapData.sections["Ajustes Conscientes de Alta Alavancagem"].map((a: string) => `<li>${a}</li>`).join('')}
        </ul>
        <div class="footer">Página 7 | Mapa de Dinâmica Anima</div>
      </div>

      <!-- PÁGINA 8: FECHAMENTO -->
      <div class="page capa">
        <h2>Fechamento do Relatório</h2>
        <p style="max-width: 500px; margin: 40px auto;">Este mapa representa um momento e uma fotografia de sua dinâmica atual. Você tem a autonomia para revisitar e ajustar seu funcionamento conforme suas escolhas conscientes.</p>
        <h3 class="red-text">Você não é este mapa.</h3>
        <p>Este mapa existe para orientar escolhas mais conscientes.</p>
        <div class="footer">Fim do Relatório | ${SYSTEM_IDENTITY.name}</div>
      </div>

    </body>
    </html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdfBuffer;
};
