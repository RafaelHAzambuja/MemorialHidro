import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { ProjectState, BuildingType, Module, Norma, Caminho, Trecho, MemorialVersion } from '../types';
import { REPORT_TEXTS } from '../constants';


declare const htmlDocx: any;
declare const saveAs: any;
declare const jspdf: any;
declare const html2canvas: any;

interface ReportProps {
    buildingTypes: BuildingType[];
    enabledModules: Module[];
}

const fNum = (num: number | string | undefined | null, p = 2) => {
    if (num === undefined || num === null) return "-";
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return num;
    return n.toLocaleString("pt-BR", { minimumFractionDigits: p, maximumFractionDigits: p });
};

const PageBreak: React.FC = () => <div style={{ pageBreakAfter: 'always' }}></div>;

const H2: React.FC<{children: React.ReactNode}> = ({children}) => <h2 style={{ color: '#166534', borderBottom: '2px solid #15803d', paddingBottom: '8px', fontSize: '16pt', pageBreakBefore: 'auto', pageBreakAfter: 'avoid' }}>{children}</h2>;
const H3: React.FC<{children: React.ReactNode}> = ({children}) => <h3 style={{ color: '#14532d', fontSize: '13pt', marginTop: '20px', pageBreakAfter: 'avoid' }}>{children}</h3>;
const Th: React.FC<{children: React.ReactNode, style?: React.CSSProperties}> = ({children, style}) => <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc', background: '#f2f2f2', fontSize: '8pt', color: '#333', ...style }}>{children}</th>;
const Td: React.FC<{children: React.ReactNode, style?: React.CSSProperties}> = ({children, style}) => <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc', fontSize: '8pt', color: '#333', ...style }}>{children}</td>;

const DetailedHeadLossTable: React.FC<{caminho: Caminho}> = ({caminho}) => (
    <div style={{marginTop: '15px', pageBreakInside: 'avoid'}}>
        <h5 style={{fontSize: '11pt', fontWeight: 'bold'}}>{caminho.nome}</h5>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '5px' }}>
            <thead>
                <tr>
                    <Th style={{textAlign: 'left'}}>Trecho</Th>
                    <Th>Comp. Real (m)</Th>
                    <Th>Comp. Eq. (m)</Th>
                    <Th>Vazão (L/s)</Th>
                    <Th>Veloc. (m/s)</Th>
                    <Th>DN (mm)</Th>
                    <Th>PD Unit. (m/m)</Th>
                    <Th>PD Total (mca)</Th>
                    <Th>Pressão Final (mca)</Th>
                </tr>
            </thead>
            <tbody>
                {caminho.trechos.map((t: Trecho) => (
                    <tr key={t.id}>
                        <Td style={{textAlign: 'left'}}>{t.descricao}</Td>
                        <Td>{fNum(t.comprimentoReal)}</Td>
                        <Td>{fNum(t.comprimentoEquivalente)}</Td>
                        <Td>{fNum(t.vazao)}</Td>
                        <Td>{fNum(t.velocidade)}</Td>
                        <Td>{t.diametroNominal}</Td>
                        <Td>{fNum(t.perdaCargaUnitaria, 5)}</Td>
                        <Td>{fNum(t.perdaCargaTotal)}</Td>
                        <Td>{fNum(t.pressaoFinal)}</Td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ReportTemplate: React.FC<ProjectState & ReportProps> = (props) => {
    const { projectInfo, engenheiro, buildingData, buildingTypes, selectedBuildingType, enabledModules, customLogo } = props;
    const buildingType = buildingTypes[selectedBuildingType];
    
    const pageStyle: React.CSSProperties = {
        width: '210mm',
        minHeight: '297mm',
        padding: '25mm 20mm 25mm 20mm',
        boxSizing: 'border-box',
        display: 'block',
        position: 'relative',
    };
    
    const allNormas = enabledModules.reduce((acc: Norma[], mod) => {
      mod.normas.forEach(norma => {
        if (!acc.find(n => n.codigo === norma.codigo)) {
          acc.push(norma);
        }
      });
      return acc;
    }, []);

    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString("pt-BR");
      } catch {
        return dateString;
      }
    }

    const getModuleText = (moduleName: string, section: 'descricao' | 'recomendacoes' | 'criterios') => {
        const key = moduleName.toLowerCase().replace(/ /g, '').replace(/[áàâã]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íìî]/g, 'i').replace(/[óòôõ]/g, 'o').replace(/[úùû]/g, 'u').replace(/ç/g, 'c');
        const textObject = (REPORT_TEXTS as any)[key];
        return textObject ? (textObject[section] || '') : '';
    };

    return (
        <div style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: 1.6, color: '#333333', fontSize: '12pt', background: 'white' }}>
            
            {/* --- CAPA --- */}
            <div className="report-page" style={{ ...pageStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', border: '2px solid #14532d', textAlign: 'center' }}>
                <div>
                    {customLogo ? <img src={customLogo} alt="Logo" style={{ maxHeight: '100px', marginBottom: '30px', display: 'block', margin: '0 auto' }} /> : <div style={{height: '100px', fontSize: '48px', color: '#14532d'}}><i className="fas fa-tint"></i></div>}
                    <h1 style={{ fontSize: '28pt', margin: '20px 0 10px 0', color: '#14532d' }}>Memorial Descritivo e de Cálculo</h1>
                    <p style={{ fontSize: '16pt', margin: '5px 0', color: '#15803d' }}>Projeto Hidrossanitário</p>
                </div>
                <div>
                    <p style={{ fontSize: '14pt' }}><strong>Projeto:</strong> {projectInfo.name}</p>
                    <p style={{ fontSize: '14pt' }}><strong>Proprietário:</strong> {projectInfo.proprietario}</p>
                </div>
                <div>
                    <p style={{ fontSize: '14pt' }}>{projectInfo.location}</p>
                    <p style={{ fontSize: '14pt', marginTop: '50px' }}>{new Date(projectInfo.date).toLocaleDateString("pt-BR", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
            
            <PageBreak />

            {/* --- CONTROLE DE VERSÃO --- */}
            <div className="report-page" style={{...pageStyle}}>
                <H2>CONTROLE DE VERSÃO</H2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead><tr><Th>Versão</Th><Th>Data</Th><Th style={{textAlign:'left'}}>Descrição</Th><Th>Autor</Th></tr></thead>
                    <tbody>
                        {projectInfo.memorialVersions.map((v: MemorialVersion) => (
                           <tr key={v.id}>
                               <Td>{v.version}</Td>
                               <Td>{formatDate(v.date)}</Td>
                               <Td style={{textAlign:'left'}}>{v.description}</Td>
                               <Td>{v.author}</Td>
                           </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PageBreak />

            {/* --- ÍNDICE --- */}
            <div className="report-page" style={{...pageStyle}}>
                <H2>ÍNDICE</H2>
                <ol style={{ listStyle: 'decimal', paddingLeft: '20px', fontSize: '13pt' }}>
                    <li style={{marginTop: '10px'}}>OBJETIVO E ESCOPO</li>
                    <li style={{marginTop: '10px'}}>INFORMAÇÕES GERAIS</li>
                    <li style={{marginTop: '10px'}}>BASES NORMATIVAS</li>
                    <li style={{marginTop: '10px'}}>ESPECIFICAÇÕES GERAIS DE EXECUÇÃO</li>
                    {enabledModules.map((module, index) => (
                        <li key={module.name} style={{marginTop: '10px'}}>{index + 5}. MEMORIAL DE {module.name.toUpperCase()}
                           <ul style={{ listStyle: 'none', paddingLeft: '20px', fontSize: '11pt' }}>
                                <li style={{padding: '2px 0'}}>{index + 5}.1. Descrição do Sistema</li>
                                <li style={{padding: '2px 0'}}>{index + 5}.2. Critérios de Projeto</li>
                                <li style={{padding: '2px 0'}}>{index + 5}.3. Memorial de Cálculo</li>
                                <li style={{padding: '2px 0'}}>{index + 5}.4. Recomendações de Execução</li>
                            </ul>
                        </li>
                    ))}
                    <li style={{marginTop: '10px'}}>{enabledModules.length + 5}. APÊNDICE A - MANUAL DE USO E MANUTENÇÃO</li>
                    <li style={{marginTop: '10px'}}>{enabledModules.length + 6}. APÊNDICE B - ASSINATURAS</li>
                </ol>
            </div>

            <PageBreak />

            <div className="report-page" style={{...pageStyle}}>
                <H2>1. OBJETIVO E ESCOPO</H2>
                <div style={{textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: REPORT_TEXTS.objetivoEscopo }} />
            </div>

            <PageBreak />
            
            <div className="report-page" style={{...pageStyle}}>
                <H2>2. INFORMAÇÕES GERAIS</H2>
                <H3>2.1. Descrição da Edificação</H3>
                <p>Trata-se de uma edificação de uso <strong>{buildingType.name}</strong>, com área construída de <strong>{buildingData.areaTotal} m²</strong>, localizada em <strong>{projectInfo.location}</strong>.</p>
                <H3>2.2. Nome do Proprietário</H3>
                <p><strong>Nome:</strong> {projectInfo.proprietario}</p>
                <p><strong>Inscrição Imobiliária:</strong> {projectInfo.inscricaoImobiliaria}</p>
                <H3>2.3. Responsável Técnico do Projeto</H3>
                <p><strong>Nome:</strong> {engenheiro.nome}</p>
                <p><strong>Título/Conselho:</strong> Engenheiro Civil / {engenheiro.crea}</p>
                <p><strong>Anotação de Responsabilidade Técnica (ART/RRT):</strong> {engenheiro.art}</p>
            </div>

            <PageBreak />

            <div className="report-page" style={{...pageStyle}}>
                <H2>3. BASES NORMATIVAS</H2>
                <div style={{textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: REPORT_TEXTS.basesNormativas }} />
                <ul style={{ listStyle: 'disc', paddingLeft: '40px', marginTop: '20px' }}>
                  {allNormas.map(norma => (
                    <li key={norma.codigo}><strong>{norma.codigo}</strong> - {norma.descricao}</li>
                  ))}
                </ul>
            </div>
            
            <PageBreak />

            <div className="report-page" style={{...pageStyle}}>
                <H2>4. ESPECIFICAÇÕES GERAIS DE EXECUÇÃO</H2>
                <div style={{textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: REPORT_TEXTS.especificacoesGerais }} />
            </div>

            {enabledModules.map((module, index) => (
                <React.Fragment key={module.name}>
                    <PageBreak />
                    <div className="report-page" style={{...pageStyle}}>
                        <H2>{index + 5}. MEMORIAL DE {module.name.toUpperCase()}</H2>
                        
                        <H3>{index + 5}.1. Descrição do Sistema</H3>
                        <div style={{textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: getModuleText(module.name, 'descricao') }} />

                        <PageBreak />
                        
                        <H3>{index + 5}.2. Critérios de Projeto</H3>
                        <div style={{textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: getModuleText(module.name, 'criterios') }} />
                    </div>

                    <PageBreak />
                    <div className="report-page" style={{...pageStyle}}>
                        <H3>{index + 5}.3. Memorial de Cálculo</H3>
                        {module.calculationSteps.map(step => (
                            <div key={step.description} style={{ marginTop: '15px', pageBreakInside: 'avoid' }}>
                                <p><strong>{step.description}</strong></p>
                                <div style={{ background:'#f8fafc', padding:'12px', borderRadius:'4px', border: '1px solid #f1f5f9', fontSize: '10pt', wordWrap: 'break-word', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: step.detail }} />
                            </div>
                        ))}
                    </div>
                    
                    {module.caminhos && module.caminhos.length > 0 && (
                        <React.Fragment>
                            <PageBreak />
                            <div className="report-page" style={{...pageStyle}}>
                                <h4 style={{ color: '#14532d', fontSize: '13pt', marginTop: '20px', pageBreakAfter: 'avoid' }}>Tabelas de Perda de Carga Detalhadas</h4>
                                {module.caminhos.map(caminho => (
                                    <DetailedHeadLossTable key={caminho.id} caminho={caminho} />
                                ))}
                            </div>
                        </React.Fragment>
                    )}

                    <PageBreak />
                    <div className="report-page" style={{...pageStyle}}>
                        <H3>{index + 5}.4. Recomendações de Execução</H3>
                        <div style={{textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: getModuleText(module.name, 'recomendacoes') }} />
                    </div>
                </React.Fragment>
            ))}
            
            <PageBreak />

            <div className="report-page" style={{...pageStyle}}>
                <H2>{enabledModules.length + 5}. APÊNDICE A - MANUAL DE USO, OPERAÇÃO E MANUTENÇÃO</H2>
                <div style={{textAlign: 'justify'}} dangerouslySetInnerHTML={{ __html: REPORT_TEXTS.manualUsoManutencao }} />
            </div>

            <PageBreak />

             <div className="report-page" style={{...pageStyle, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '25mm 20mm 25mm 20mm', pageBreakAfter: 'avoid'}}>
                <H2>{enabledModules.length + 6}. APÊNDICE B - ASSINATURAS</H2>
                <div style={{ marginTop: 'auto', paddingTop: '40px', textAlign: 'center' }}>
                    <div style={{ width: '350px', borderTop: '1px solid #333', margin: '80px auto 10px' }}></div>
                    <p style={{margin: 0}}><strong>{engenheiro.nome}</strong></p>
                    <p style={{margin: 0}}>{engenheiro.crea}</p>
                    <p style={{margin: 0}}>Responsável Técnico</p>

                     <div style={{ width: '350px', borderTop: '1px solid #333', margin: '80px auto 10px' }}></div>
                    <p style={{margin: 0}}><strong>{projectInfo.proprietario}</strong></p>
                    <p style={{margin: 0}}>Proprietário</p>
                </div>
            </div>
        </div>
    );
};


export const getReportHtml = (props: ProjectState & ReportProps): string => {
  return ReactDOMServer.renderToStaticMarkup(<ReportTemplate {...props} />);
};

export const generateReport = async (htmlContent: string, state: ProjectState, onProgress?: (progress: number) => void) => {
    try {
        onProgress?.(0);
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const container = document.createElement('div');
        // Position the container off-screen but keep it 'visible' for html2canvas to render it properly.
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '-9999px';
        container.style.zIndex = '-1';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        const pages = Array.from(container.querySelectorAll('.report-page')) as HTMLElement[];
        if (pages.length === 0) {
            throw new Error("Nenhuma página com a classe 'report-page' foi encontrada para a geração do PDF.");
        }
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        for (let i = 0; i < pages.length; i++) {
            onProgress?.(((i) / pages.length) * 100);
            const page = pages[i];

            const canvas = await html2canvas(page, {
                scale: 3, 
                useCORS: true,
                logging: false,
                width: page.scrollWidth,
                height: page.scrollHeight,
                windowWidth: page.scrollWidth,
                windowHeight: page.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            const imgProps = pdf.getImageProperties(imgData);
            const ratio = imgProps.height / imgProps.width;
            let pageImageHeight = pdfWidth * ratio;
            
            if (i > 0) {
                pdf.addPage();
            }

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pageImageHeight, pdfHeight), undefined, 'FAST');
            
            // Add Header and Footer to each page (except cover)
            if (i > 0) {
                pdf.setFontSize(8);
                pdf.setTextColor(150);
                if (state.customLogo) {
                    try {
                      pdf.addImage(state.customLogo, 'PNG', 20, 10, 20, 10);
                    } catch(e) { console.error("Could not add logo:", e); }
                }
                pdf.text(state.projectInfo.name, pdfWidth / 2, 15, { align: 'center' });
                pdf.line(20, 20, pdfWidth - 20, 20);

                pdf.line(20, 277, pdfWidth - 20, 277);
                pdf.text(`${state.engenheiro.nome} - ${state.engenheiro.crea}`, 20, 282);
                pdf.text(`Página ${i + 1} de ${pages.length}`, pdfWidth - 20, 282, { align: 'right' });
            }
        }

        document.body.removeChild(container);
        onProgress?.(100);
        pdf.save(`${state.projectInfo.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
        
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Ocorreu um erro ao tentar gerar o PDF. Detalhes: " + (error as Error).message);
    }
};

export const generateDocx = (htmlContent: string, projectName: string) => {
    if (typeof htmlDocx === "undefined" || typeof saveAs === "undefined") {
        alert("Bibliotecas para gerar DOCX não foram carregadas.");
        return;
    }
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${htmlContent}</body></html>`
    const converted = htmlDocx.asBlob(fullHtml, {
        orientation: 'portrait',
        margins: { top: 720, right: 720, bottom: 720, left: 720 } // 1 inch = 720
    });
    saveAs(converted, `memorial-${projectName.replace(/\s+/g, "-").toLowerCase()}.docx`);
};

export const generateART = (props: ProjectState & ReportProps): string => {
    const { projectInfo, engenheiro, enabledModules } = props;
    return `
    <!DOCTYPE html><html><head><title>Rascunho ART/RRT - ${projectInfo.name}</title></head><body>
        <h1>RASCUNHO ART/RRT</h1>
        <h2>DADOS DO RESPONSÁVEL TÉCNICO</h2>
        <p>Nome: ${engenheiro.nome}</p>
        <p>CREA/CAU: ${engenheiro.crea}</p>
        <h2>DADOS DO PROJETO</h2>
        <p>Nome: ${projectInfo.name}</p>
        <p>Localização: ${projectInfo.location}</p>
        <h2>SERVIÇOS EXECUTADOS</h2>
        <p>Sistemas: ${enabledModules.map(m => m.name).join(', ')}</p>
    </body></html>
    `;
};