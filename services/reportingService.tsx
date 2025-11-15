
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectState, BuildingType, Module, Norma, Caminho, Trecho, MemorialVersion, CaminhoGas } from '../types';
import { REPORT_TEXTS } from '../constants';

// FIX: Replaced a problematic interface extension with a type intersection.
// This correctly combines the jsPDF type with autotable plugin properties,
// resolving all "Property does not exist on type 'jsPDFWithAutoTable'" errors.
type jsPDFWithAutoTable = jsPDF & {
  lastAutoTable: { finalY: number };
  y: number;
};

interface ReportProps {
    buildingTypes: BuildingType[];
    enabledModules: Module[];
}

const fNum = (num: number | string | undefined | null, p = 2) => {
    if (num === undefined || num === null) return "-";
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return String(num);
    return n.toLocaleString("pt-BR", { minimumFractionDigits: p, maximumFractionDigits: p });
};

// Componentes para DOCX (HTML)
const PageBreak: React.FC = () => <div style={{ pageBreakAfter: 'always' }}></div>;
const H2: React.FC<{children: React.ReactNode}> = ({children}) => <h2 style={{ color: '#166534', borderBottom: '2px solid #15803d', paddingBottom: '8px', fontSize: '16pt', pageBreakBefore: 'auto', pageBreakAfter: 'avoid' }}>{children}</h2>;
const H3: React.FC<{children: React.ReactNode}> = ({children}) => <h3 style={{ color: '#14532d', fontSize: '13pt', marginTop: '20px', pageBreakAfter: 'avoid' }}>{children}</h3>;
const Th: React.FC<{children: React.ReactNode, style?: React.CSSProperties}> = ({children, style}) => <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc', background: '#f2f2f2', fontSize: '8pt', color: '#333', ...style }}>{children}</th>;
const Td: React.FC<{children: React.ReactNode, style?: React.CSSProperties}> = ({children, style}) => <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc', fontSize: '8pt', color: '#333', ...style }}>{children}</td>;

// Gerador de PDF
class PdfGenerator {
    private pdf: jsPDFWithAutoTable;
    private state: ProjectState & ReportProps;
    private onProgress: (progress: number) => void;
    private y: number = 25;
    private page: number = 1;
    private tocEntries: { title: string, page: number, level: number }[] = [];
    private readonly PAGE_WIDTH: number;
    private readonly PAGE_HEIGHT: number;
    private readonly MARGIN: number = 20;

    constructor(state: ProjectState & ReportProps, onProgress: (progress: number) => void = () => {}) {
        // FIX: Cast the jsPDF instance to our extended interface to make plugin properties type-safe.
        this.pdf = new jsPDF('p', 'mm', 'a4') as jsPDFWithAutoTable;
        this.pdf.y = 0;
        this.state = state;
        this.onProgress = onProgress;
        this.PAGE_WIDTH = this.pdf.internal.pageSize.getWidth();
        this.PAGE_HEIGHT = this.pdf.internal.pageSize.getHeight();
    }
    
    private addPage() {
        this.pdf.addPage();
        this.page++;
        this.y = this.MARGIN;
        this.addHeaderFooter();
    }
    
    private checkPageBreak(height: number) {
        if (this.y + height > this.PAGE_HEIGHT - this.MARGIN) {
            this.addPage();
        }
    }
    
    private startNewSection() {
        if (this.y > this.MARGIN + 10) { // Add a threshold to avoid unnecessary new pages
            this.addPage();
        }
    }

    private addHeaderFooter() {
        if (this.page > 1 && !this.tocEntries.some(e => e.page === this.page)) {
            this.pdf.setFontSize(8);
            this.pdf.setTextColor(150);
            if (this.state.customLogo) {
                try { this.pdf.addImage(this.state.customLogo, 'PNG', this.MARGIN, 10, 15, 15); } 
                catch (e) { console.error("Could not add logo:", e); }
            }
            this.pdf.text(this.state.projectInfo.name, this.PAGE_WIDTH / 2, 15, { align: 'center' });
            this.pdf.setDrawColor(220);
            this.pdf.line(this.MARGIN, 18, this.PAGE_WIDTH - this.MARGIN, 18);

            this.pdf.line(this.MARGIN, this.PAGE_HEIGHT - 18, this.PAGE_WIDTH - this.MARGIN, this.PAGE_HEIGHT - 18);
            this.pdf.text(`${this.state.engenheiro.nome} - ${this.state.engenheiro.crea}`, this.MARGIN, this.PAGE_HEIGHT - 13);
            this.pdf.text(`Página ${this.page}`, this.PAGE_WIDTH - this.MARGIN, this.PAGE_HEIGHT - 13, { align: 'right' });
        }
    }
    
    private renderH2(text: string, addToc: boolean = true, level: number = 1) {
        this.checkPageBreak(20);
        this.pdf.setFontSize(16);
        this.pdf.setTextColor('#166534');
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(text, this.MARGIN, this.y);
        this.y += 10;
        if(addToc) this.tocEntries.push({ title: text, page: this.page, level });
    }

    private renderH3(text: string) {
        this.checkPageBreak(15);
        this.pdf.setFontSize(13);
        this.pdf.setTextColor('#14532d');
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(text, this.MARGIN, this.y);
        this.y += 8;
    }
    
    private renderText(text: string, size: number = 10, style: 'normal' | 'bold' = 'normal') {
        const maxWidth = this.PAGE_WIDTH - this.MARGIN * 2;
        const lineHeightRatio = 1.5;
        this.pdf.setFontSize(size);
        this.pdf.setTextColor(0); // Garante texto preto
        this.pdf.setFont('helvetica', style);
        this.pdf.setLineHeightFactor(lineHeightRatio);

        const lines = this.pdf.splitTextToSize(text, maxWidth);
        const textHeight = lines.length * this.pdf.getLineHeight();
        this.checkPageBreak(textHeight + 4);

        this.pdf.text(text, this.MARGIN, this.y, { maxWidth: maxWidth });
        
        this.y += textHeight + 4;
    }
    
    private renderHtml(html: string) {
        type LinePart = { text: string; isBold: boolean; isSub: boolean; };
        
        const cleanHtml = html
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '\n')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<li>/g, '• ')
            .replace(/<\/li>/g, '\n')
            .replace(/<\/?ul>/g, '\n')
            .replace(/<h[1-4]>/g, '\n')
            .replace(/<\/h[1-4]>/g, '\n')
            .trim();

        const lines = cleanHtml.split('\n');

        const baseFontSize = 10;
        const subFontSize = baseFontSize * 0.75;
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setTextColor(0); // Garante texto preto
        this.pdf.setFontSize(baseFontSize);
        const lineHeightRatio = 1.7; // Aumentado de 1.5 para evitar sobreposição de subscritos
        const lineHeight = baseFontSize * lineHeightRatio / this.pdf.internal.scaleFactor;
        const maxWidth = this.PAGE_WIDTH - this.MARGIN * 2;

        const printLine = (lineParts: LinePart[]) => {
            this.checkPageBreak(lineHeight);
            let currentX = this.MARGIN;
            const baselineY = this.y;

            for (const part of lineParts) {
                let partY = baselineY;
                let currentFontSize = baseFontSize;

                if (part.isSub) {
                    partY = baselineY + (subFontSize / 2.5);
                    currentFontSize = subFontSize;
                }

                this.pdf.setFont('helvetica', part.isBold ? 'bold' : 'normal');
                this.pdf.setFontSize(currentFontSize);
                this.pdf.text(part.text, currentX, partY, { charSpace: 0 });
                currentX += this.pdf.getTextWidth(part.text);
            }
            this.pdf.setFontSize(baseFontSize);
            this.y += lineHeight;
        };

        for (const line of lines) {
            if (line.trim() === '') {
                this.checkPageBreak(lineHeight / 2);
                this.y += lineHeight / 2;
                continue;
            }

            const parts = line.split(/(<\/?(?:strong|b|i|sub)>)/g).filter(p => p);
            const processedParts: { text: string; isBold: boolean; isSub: boolean; }[] = [];
            let isBold = false;
            let isSub = false;

            for (const part of parts) {
                if (part === '<strong>' || part === '<b>') isBold = true;
                else if (part === '</strong>' || part === '</b>') isBold = false;
                else if (part === '<sub>') isSub = true;
                else if (part === '</sub>') isSub = false;
                else if (part !== '<i>' && part !== '</i>') {
                    processedParts.push({ text: part.replace(/&[a-z]+;/g, ' '), isBold, isSub });
                }
            }

            const allWords: LinePart[] = [];
            for (const part of processedParts) {
                const words = part.text.split(/(\s+)/);
                for (const word of words) {
                    if (word) {
                        allWords.push({ text: word, isBold: part.isBold, isSub: part.isSub });
                    }
                }
            }

            let currentLineParts: LinePart[] = [];
            let currentLineWidth = 0;

            for (const word of allWords) {
                this.pdf.setFont('helvetica', word.isBold ? 'bold' : 'normal');
                this.pdf.setFontSize(word.isSub ? subFontSize : baseFontSize);
                const wordWidth = this.pdf.getTextWidth(word.text);

                if (currentLineWidth + wordWidth > maxWidth && currentLineParts.length > 0) {
                    printLine(currentLineParts);
                    currentLineParts = [];
                    currentLineWidth = 0;
                    if (word.text.trim() === '') continue;
                }
                currentLineParts.push(word);
                currentLineWidth += wordWidth;
            }
            if (currentLineParts.length > 0) {
                printLine(currentLineParts);
            }
        }
    }
    
    private renderCalculationStep(step: {description: string, detail: string}) {
        this.checkPageBreak(20); 
        this.renderText(step.description, 11, 'bold');
        this.renderHtml(step.detail);
        this.y += 4;
    }
    
    private renderCoverPage() {
        this.pdf.setDrawColor('#14532d');
        this.pdf.setLineWidth(1);
        this.pdf.rect(5, 5, this.PAGE_WIDTH - 10, this.PAGE_HEIGHT - 10);
        
        let y = 60;
        
        if (this.state.customLogo) {
             try { 
                 this.pdf.addImage(this.state.customLogo, 'PNG', (this.PAGE_WIDTH / 2) - 20, y, 40, 40);
                 y += 60;
             } catch(e) { console.error("Could not add logo:", e); }
        } else {
             y += 40;
        }

        this.pdf.setFontSize(28);
        this.pdf.setTextColor('#14532d');
        this.pdf.text('Memorial Descritivo e de Cálculo', this.PAGE_WIDTH / 2, y, { align: 'center' });
        y += 15;

        this.pdf.setFontSize(16);
        this.pdf.setTextColor('#15803d');
        this.pdf.text('Projeto Hidrossanitário', this.PAGE_WIDTH / 2, y, { align: 'center' });
        y += 50;

        this.pdf.setFontSize(14);
        this.pdf.setTextColor('#333333');
        this.pdf.text(`Projeto: ${this.state.projectInfo.name}`, this.PAGE_WIDTH / 2, y, { align: 'center' });
        y += 10;
        this.pdf.text(`Proprietário: ${this.state.projectInfo.proprietario}`, this.PAGE_WIDTH / 2, y, { align: 'center' });

        y = this.PAGE_HEIGHT - 60;
        const date = new Date(this.state.projectInfo.date);
        const formattedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString("pt-BR", { year: 'numeric', month: 'long', day: 'numeric' });
        this.pdf.text(this.state.projectInfo.location, this.PAGE_WIDTH / 2, y, { align: 'center' });
        y += 10;
        this.pdf.text(formattedDate, this.PAGE_WIDTH / 2, y, { align: 'center' });
    }
    
    private renderTOC() {
        this.addHeaderFooter();
        this.renderH2("ÍNDICE", false);
        const initialY = this.y;
        
        this.tocEntries.forEach(entry => {
            this.checkPageBreak(8);
            const indent = (entry.level - 1) * 10;
            this.pdf.setFontSize(entry.level === 1 ? 12 : 11);
            this.pdf.setTextColor(0); // Garante texto preto
            this.pdf.setFont('helvetica', 'normal');
            const title = entry.title;
            const pageNum = entry.page.toString();
            const titleWidth = this.pdf.getStringUnitWidth(title) * this.pdf.getFontSize() / this.pdf.internal.scaleFactor;
            const pageNumWidth = this.pdf.getStringUnitWidth(pageNum) * this.pdf.getFontSize() / this.pdf.internal.scaleFactor;
            const availableWidth = this.PAGE_WIDTH - (this.MARGIN * 2) - indent - titleWidth - pageNumWidth - 2;
            const dots = '.'.repeat(Math.max(0, Math.floor(availableWidth / (this.pdf.getStringUnitWidth('.') * this.pdf.getFontSize() / this.pdf.internal.scaleFactor))));
            
            this.pdf.text(`${title} ${dots}`, this.MARGIN + indent, this.y);
            this.pdf.text(pageNum, this.PAGE_WIDTH - this.MARGIN, this.y, { align: 'right'});
            this.y += 7;
        });

        this.y = initialY;
        this.tocEntries.forEach(entry => {
            if (this.y + 8 > this.PAGE_HEIGHT - this.MARGIN) {
                this.y = this.MARGIN;
            }
            const indent = (entry.level - 1) * 10;
            this.pdf.link(this.MARGIN + indent, this.y - 5, this.PAGE_WIDTH - (this.MARGIN*2) , 7, { pageNumber: entry.page });
            this.y += 7;
        });
    }

    public async generate() {
        this.onProgress(0);
        
        this.renderCoverPage();
        
        this.addPage();
        let sectionCounter = 1;
        this.renderH2(`${sectionCounter++}. OBJETIVO E ESCOPO`);
        this.renderHtml(REPORT_TEXTS.objetivoEscopo);
        
        this.startNewSection();
        this.renderH2(`${sectionCounter++}. INFORMAÇÕES GERAIS`);
        this.renderH3("2.1. Descrição da Edificação");
        this.renderText(`Trata-se de uma edificação de uso ${this.state.buildingTypes[this.state.selectedBuildingType].name}, com área construída de ${this.state.buildingData.areaTotal} m², localizada em ${this.state.projectInfo.location}.`);
        this.renderH3("2.2. Nome do Proprietário");
        this.renderText(`Nome: ${this.state.projectInfo.proprietario}\nInscrição Imobiliária: ${this.state.projectInfo.inscricaoImobiliaria}`);
        this.renderH3("2.3. Responsável Técnico do Projeto");
        this.renderText(`Nome: ${this.state.engenheiro.nome}\nTítulo/Conselho: Engenheiro Civil / ${this.state.engenheiro.crea}\nART/RRT: ${this.state.engenheiro.art}`);
        
        this.startNewSection();
        this.renderH2(`${sectionCounter++}. BASES NORMATIVAS`);
        this.renderHtml(REPORT_TEXTS.basesNormativas);
        const allNormas = this.state.enabledModules.reduce((acc: Norma[], mod) => {
            mod.normas.forEach(norma => { if (!acc.find(n => n.codigo === norma.codigo)) acc.push(norma); });
            return acc;
        }, []);
        const normasText = allNormas.map(n => `• ${n.codigo} - ${n.descricao}`).join('\n');
        this.renderText(normasText, 10);
        
        this.startNewSection();
        this.renderH2(`${sectionCounter++}. ESPECIFICAÇÕES GERAIS DE EXECUÇÃO`);
        this.renderHtml(REPORT_TEXTS.especificacoesGerais);

        for (const [index, module] of this.state.enabledModules.entries()) {
            this.onProgress(((index + 1) / this.state.enabledModules.length) * 80);
            
            this.startNewSection();
            const modCounter = sectionCounter++;
            this.renderH2(`${modCounter}. MEMORIAL DE ${module.name.toUpperCase()}`);

            this.renderH3(`${modCounter}.1. Descrição do Sistema`);
            const descKey = module.name.toLowerCase().replace(/ /g, '').replace(/[áàâã]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íìî]/g, 'i').replace(/[óòôõ]/g, 'o').replace(/[úùû]/g, 'u').replace(/ç/g, 'c');
            const desc = (REPORT_TEXTS as any)[descKey]?.descricao || '';
            this.renderHtml(desc);
            
            this.startNewSection();
            this.renderH3(`${modCounter}.2. Critérios de Projeto`);
            const crit = (REPORT_TEXTS as any)[descKey]?.criterios || '';
            this.renderHtml(crit);

            this.startNewSection();
            this.renderH3(`${modCounter}.3. Memorial de Cálculo`);
            for (const step of module.calculationSteps) {
                this.renderCalculationStep(step);
            }
            
            if(module.caminhos && module.caminhos.length > 0) {
                 this.renderH3(`${modCounter}.3.1. Tabelas de Perda de Carga`);
                 for (const caminho of module.caminhos) {
                     this.checkPageBreak(30 + caminho.trechos.length * 8);
                     this.renderText(caminho.nome, 11, 'bold');
                     autoTable(this.pdf, {
                         startY: this.y,
                         head: [['Trecho', 'Comp.(m)', 'Vazão(L/s)', 'Vel.(m/s)', 'DN(mm)', 'PD(mca)', 'Pressão(mca)']],
                         body: caminho.trechos.map(t => [t.descricao, fNum(t.comprimentoReal), fNum(t.vazao), fNum(t.velocidade), t.diametroNominal, fNum(t.perdaCargaTotal), fNum(t.pressaoFinal)]),
                         theme: 'grid',
                         headStyles: { fillColor: '#166534', textColor: 255 },
                         bodyStyles: { textColor: 0 },
                         didDrawPage: (data) => {
                            this.page = data.pageNumber;
                            this.addHeaderFooter();
                         },
                         didParseCell: (data) => {
                            const trecho = caminho.trechos[data.row.index];
                            if (data.column.index === 3 && trecho?.velocidadeExcessiva) {
                                data.cell.styles.textColor = '#ef4444';
                            }
                         }
                     });
                     this.y = this.pdf.lastAutoTable.finalY + 10;
                 };
            }

            if(module.caminhosGas && module.caminhosGas.length > 0) {
                 this.renderH3(`${modCounter}.3.2. Tabelas de Perda de Carga (Gás)`);
                 for (const caminho of module.caminhosGas) {
                     this.checkPageBreak(30 + caminho.trechos.length * 8);
                     this.renderText(caminho.nome, 11, 'bold');
                     autoTable(this.pdf, {
                         startY: this.y,
                         head: [['Trecho', 'Pot. Acum.(kW)', 'Vazão(m³/h)', 'DN(mm)', 'PD(mbar)', 'PD Acum.(mbar)']],
                         body: caminho.trechos.map(t => [t.descricao, fNum(t.potenciaAcumulada), fNum(t.vazao, 3), t.diametro, fNum(t.perdaCarga, 3), fNum(t.perdaCargaAcumulada, 3)]),
                         theme: 'grid',
                         headStyles: { fillColor: '#166534', textColor: 255 },
                         bodyStyles: { textColor: 0 },
                         didDrawPage: (data) => {
                            this.page = data.pageNumber;
                            this.addHeaderFooter();
                         }
                     });
                     this.y = this.pdf.lastAutoTable.finalY + 10;
                 }
            }
            
            this.startNewSection();
            this.renderH3(`${modCounter}.4. Recomendações de Execução`);
            const reco = (REPORT_TEXTS as any)[descKey]?.recomendacoes || '';
            this.renderHtml(reco);
        }
        
        this.startNewSection();
        this.renderH2(`${sectionCounter++}. APÊNDICE A - MANUAL DE USO E MANUTENÇÃO`);
        this.renderHtml(REPORT_TEXTS.manualUsoManutencao);

        this.startNewSection();
        this.renderH2(`${sectionCounter++}. APÊNDICE B - ASSINATURAS`);
        this.y = this.PAGE_HEIGHT / 2 - 40;
        this.pdf.setDrawColor(0);
        this.pdf.setTextColor(0);
        this.pdf.setLineWidth(0.3);
        
        this.pdf.line(this.MARGIN + 30, this.y, this.PAGE_WIDTH - this.MARGIN - 30, this.y);
        this.pdf.text(`${this.state.engenheiro.nome}\n${this.state.engenheiro.crea}\nResponsável Técnico`, this.PAGE_WIDTH/2, this.y + 5, { align: 'center' });
        
        this.y += 60;
        this.pdf.line(this.MARGIN + 30, this.y, this.PAGE_WIDTH - this.MARGIN - 30, this.y);
        this.pdf.text(`${this.state.projectInfo.proprietario}\nProprietário`, this.PAGE_WIDTH/2, this.y + 5, { align: 'center' });

        this.onProgress(90);

        const tocPageCount = Math.ceil(this.tocEntries.length / 38);
        this.tocEntries.forEach(e => e.page += tocPageCount);

        for (let i = 0; i < tocPageCount; i++) {
            this.pdf.insertPage(2 + i);
        }
        
        this.pdf.setPage(2);
        this.page = 2;
        this.y = this.MARGIN;
        this.renderTOC();

        this.onProgress(100);
        this.pdf.save(`${this.state.projectInfo.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    }
}


export const generateReport = async (fullState: ProjectState & ReportProps, onProgress?: (progress: number) => void) => {
    try {
        const generator = new PdfGenerator(fullState, onProgress);
        await generator.generate();
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Ocorreu um erro ao tentar gerar o PDF. Detalhes: " + (error as Error).message);
        throw error;
    }
};


const ReportTemplate: React.FC<ProjectState & ReportProps> = (props) => {
    const { projectInfo, engenheiro, buildingData, buildingTypes, selectedBuildingType, enabledModules, customLogo } = props;
    const buildingType = buildingTypes[selectedBuildingType];
    
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
            <div style={{textAlign: 'center', border: '2px solid #14532d', padding: '50px', minHeight: '297mm', boxSizing: 'border-box' }}>
                <h1 style={{ fontSize: '28pt', margin: '20px 0 10px 0', color: '#14532d' }}>Memorial Descritivo e de Cálculo</h1>
                <p>...</p>
            </div>
        </div>
    );
};

// FIX: Export getReportHtml to make it available for App.tsx to generate DOCX content.
export const getReportHtml = (props: ProjectState & ReportProps): string => {
    return ReactDOMServer.renderToString(<ReportTemplate {...props} />);
};

export const generateDocx = (htmlContent: string, projectName: string) => {
    if (typeof (window as any).htmlDocx === "undefined" || typeof (window as any).saveAs === "undefined") {
        alert("Bibliotecas para gerar DOCX não foram carregadas.");
        return;
    }
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${htmlContent}</body></html>`
    const converted = (window as any).htmlDocx.asBlob(fullHtml, {
        orientation: 'portrait',
        margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
    });
    (window as any).saveAs(converted, `memorial-${projectName.replace(/\s+/g, "-").toLowerCase()}.docx`);
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
