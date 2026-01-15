import puppeteer from 'puppeteer';

export async function generateDiscPdf(userData: any, scores: any) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Lógica simples para determinar a "Frase Âncora" baseada nos scores
    // Em um estágio futuro, isso pode ser muito mais complexo/IA
    const dominant = scores.find((s: any) => s.dimension === 'Expressão')?.avg || 0;
    const regulacao = scores.find((s: any) => s.dimension === 'Regulação')?.avg || 0;
    
    let fraseAncora = "No momento, você apresenta um funcionamento equilibrado e atento, com boa capacidade de análise e espaço para ajustes finos de ritmo e foco.";
    if (dominant >= 4) {
        fraseAncora = "No momento, você apresenta um funcionamento predominantemente ativo, estratégico e comunicativo, com boa integração emocional sob pressão e espaço para ajustes finos de foco e ritmo.";
    } else if (dominant <= 2.5) {
        fraseAncora = "No momento, você apresenta um funcionamento reflexivo, analítico e cauteloso, priorizando a segurança e a precisão nas suas entregas atuais.";
    }

    const date = new Date().toLocaleDateString('pt-BR');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1A1A1A; margin: 0; padding: 40px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid #EEE; padding-bottom: 20px; }
            .logo { font-weight: 800; font-size: 20px; letter-spacing: -1px; }
            .logo-dot { color: #F85E5E; }
            .report-title { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; font-weight: 600; }
            
            .section-meta { margin-bottom: 40px; }
            .main-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
            .subtitle { color: #666; font-size: 14px; }
            .context-tag { font-size: 11px; color: #999; margin-top: 10px; font-weight: 600; }

            .ancora-box { background: #F9FAFB; border-radius: 24px; padding: 32px; margin-bottom: 40px; border: 1px solid #F3F4F6; }
            .ancora-text { font-size: 18px; font-weight: 600; color: #1A1A1A; line-height: 1.4; }

            .grid { display: grid; grid-cols: 1; gap: 30px; }
            .card { margin-bottom: 30px; }
            .card-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #F85E5E; margin-bottom: 15px; }
            
            .indicator-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; }
            .indicator-name { font-weight: 500; }
            .indicator-val { font-weight: 700; color: #F85E5E; }

            .list-item { display: flex; gap: 10px; margin-bottom: 12px; font-size: 14px; color: #444; }
            .list-bullet { color: #F85E5E; font-weight: bold; }

            .footer-note { font-size: 11px; color: #999; margin-top: 40px; font-style: italic; }
            .highlight-box { background: #FFF5F5; border-radius: 16px; padding: 20px; border: 1px solid #FED7D7; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">ânima<span class="logo-dot">.</span></div>
            <div class="report-title">Relatório de Dinâmica</div>
        </div>

        <div class="section-meta">
            <div class="main-title">Resumo Executivo</div>
            <div class="subtitle">Estado Atual de Funcionamento</div>
            <div class="context-tag">CONTEXTO: ${userData.context || 'Não informado'} | DATA: ${date} | CLIENTE: ${userData.name}</div>
        </div>

        <div class="ancora-box">
            <div class="ancora-text">"${fraseAncora}"</div>
        </div>

        <div class="card">
            <div class="card-title">Panorama Geral</div>
            <div class="indicator-row">
                <span class="indicator-name">Expressão Comportamental</span>
                <span class="indicator-val">${getNivel(scores, 'Expressão')}</span>
            </div>
            <div class="indicator-row">
                <span class="indicator-name">Decisão e Percepção</span>
                <span class="indicator-val">${getNivel(scores, 'Decisão')}</span>
            </div>
            <div class="indicator-row">
                <span class="indicator-name">Regulação Emocional</span>
                <span class="indicator-val">${getNivel(scores, 'Regulação')}</span>
            </div>
            <div class="indicator-row">
                <span class="indicator-name">Contexto e Pressão</span>
                <span class="indicator-val">${getNivel(scores, 'Contexto')}</span>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div class="card">
                <div class="card-title">O que se destaca agora</div>
                <div class="list-item"><span class="list-bullet">•</span> Iniciativa e capacidade de agir diante de desafios</div>
                <div class="list-item"><span class="list-bullet">•</span> Comunicação como principal ferramenta de influência</div>
                <div class="list-item"><span class="list-bullet">•</span> Boa clareza emocional mesmo sob pressão</div>
            </div>
            <div class="card">
                <div class="card-title">Zonas de atenção</div>
                <div class="list-item"><span class="list-bullet">•</span> Possível sobrecarga por assumir muitas frentes</div>
                <div class="list-item"><span class="list-bullet">•</span> Ritmo elevado mantido por longos períodos</div>
                <div class="list-item"><span class="list-bullet">•</span> Necessidade consciente de priorização</div>
            </div>
        </div>

        <div class="highlight-box">
            <div class="card-title" style="margin-bottom: 10px;">Ajustes de Alta Alavancagem</div>
            <div class="list-item"><strong>Foco seletivo:</strong> Escolher onde sua energia gera maior efeito.</div>
            <div class="list-item"><strong>Ritmo sustentável:</strong> Alternar ação intensa com pausas intencionais.</div>
            <div class="list-item"><strong>Delegação consciente:</strong> Preservar iniciativa sem centralizar execução.</div>
        </div>

        <div class="footer-note">
            Este resumo oferece uma visão rápida do seu momento atual. As próximas páginas detalham cada dimensão, ajudando você a compreender melhor os padrões por trás dessa síntese.
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return pdf;
}

function getNivel(scores: any[], dimension: string) {
    const score = scores.find(s => s.dimension === dimension)?.avg || 0;
    if (score >= 4) return "Alta / Intensa";
    if (score >= 3) return "Moderada / Integrada";
    return "Suave / Reflexiva";
}
