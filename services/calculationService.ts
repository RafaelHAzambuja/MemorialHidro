import { ProjectState, Module, Trecho, Caminho, TrechoGas, AguaFria, RamalVentilacao, CaminhoGas, Bomba } from '../types';
import { CONEXOES_AGUA_DB, APARELHOS_SANITARIOS_UHC, APARELHOS_PRESSAO_MINIMA, MANNING_COEFFICIENTS, AGUA_PROPRIEDADES, ELASTICIDADE_MODULOS, VENTILACAO_DIAMETROS, buildingTypes, CONDUTIVIDADE_TERMICA, TANQUES_COMERCIAIS, HIDROMETROS_DB, BOMBAS_ESGOTO_DB, DIMENSOES_ABRIGO_GAS, APARELHOS_DESCARGA_DB, tubulacoesDB, APARELHOS_PESOS } from '../constants';
import { getDiametroInterno } from './utils';

const getPopulacao = (buildingType: string, buildingData: ProjectState['buildingData']): number => {
  if (buildingType === "Unifamiliar") {
    return buildingData.pessoas;
  }
  if (buildingType === "Multifamiliar") {
    return buildingData.pisos * buildingData.aptPorAndar * buildingData.pessoasPorApt;
  }
  return buildingData.pessoas;
};

export const calculateModule = (module: Module, state: ProjectState, buildingTypeName: string): Module => {
    const newModule: Module = { ...module, name: module.name, results: [], calculationSteps: [], caminhos: [], caminhosGas: [] };
    
    switch(module.name) {
        case 'Água Fria':
            return calculateAguaFria(newModule, state, buildingTypeName);
        case 'Água Quente':
            return calculateAguaQuente(newModule, state, buildingTypeName);
        case 'Esgoto Sanitário':
            return calculateEsgoto(newModule, state, buildingTypeName);
        case 'Esgoto Gorduroso':
            return calculateGordura(newModule, state, buildingTypeName);
        case 'Drenagem Pluvial':
            return calculatePluvial(newModule, state);
        case 'Reúso de Água Pluvial':
            return calculateReuso(newModule, state, buildingTypeName);
        case 'Gás Combustível':
            return calculateGas(newModule, state);
    }
    return newModule;
};


const calculateAguaFria = (module: Module, state: ProjectState, buildingType: string): Module => {
    const { buildingData, projectData, reservatorios, bombeamento, bombeamentoDetalhes, aguaFria, bombasDB } = state;
    
    let populacao = getPopulacao(buildingType, buildingData);
    let consumoDiario = 0;
    let consumoStepDetail = "";

    if(projectData.metodoConsumo === 'area') {
        consumoDiario = buildingData.areaTotal * projectData.consumoPorArea;
        consumoStepDetail = `Fórmula: A × C<br>Substituição: ${buildingData.areaTotal.toFixed(2)} m² × ${projectData.consumoPorArea} L/m².dia = <b>${consumoDiario.toFixed(0)} L/dia</b>`;
    } else {
        consumoDiario = populacao * projectData.consumoPerCapita;
        consumoStepDetail = `Fórmula: Pop. × C<br>Substituição: ${populacao} pessoas × ${projectData.consumoPerCapita} L/p.dia = <b>${consumoDiario.toFixed(0)} L/dia</b>`;
    }

    const reservaConsumo = consumoDiario * projectData.diasReserva;
    const reservaIncendio = reservatorios.reservaIncendio || 0;
    const volumeTotalReserva = reservaConsumo + reservaIncendio;

    const reservaSuperiorTotal = volumeTotalReserva * (reservatorios.percentualSuperior / 100);
    const reservaInferiorTotal = volumeTotalReserva - reservaSuperiorTotal;
    const capacidadeSuperiorPorRes = reservaSuperiorTotal / reservatorios.numSuperiores;
    const capacidadeInferiorPorRes = reservatorios.numInferiores > 0 ? reservaInferiorTotal / reservatorios.numInferiores : 0;
    
    const findCommercialTank = (volume: number) => TANQUES_COMERCIAIS.find(v => v >= volume) || TANQUES_COMERCIAIS[TANQUES_COMERCIAIS.length - 1];

    // Sugere um valor comercial se o usuário ainda não tiver escolhido um
    if(!state.reservatorios.volumeSuperiorComercial || state.reservatorios.volumeSuperiorComercial < capacidadeSuperiorPorRes) {
        state.reservatorios.volumeSuperiorComercial = findCommercialTank(capacidadeSuperiorPorRes);
    }
    if(reservatorios.numInferiores > 0 && (!state.reservatorios.volumeInferiorComercial || state.reservatorios.volumeInferiorComercial < capacidadeInferiorPorRes)) {
        state.reservatorios.volumeInferiorComercial = findCommercialTank(capacidadeInferiorPorRes);
    }

    module.results.push(
        { label: "População de Cálculo", value: populacao, unit: "pessoas" },
        { label: "Consumo Diário Total", value: consumoDiario, unit: "L" },
        { label: `Reserva Total (${projectData.diasReserva} dias + RTI)`, value: volumeTotalReserva, unit: "L" },
        { label: "Reserva Técnica Incêndio (RTI)", value: reservaIncendio, unit: "L"},
        { label: "Vol. Calculado Superior (por un.)", value: `${capacidadeSuperiorPorRes.toFixed(0)}`, unit: "L" },
        { label: "Vol. Calculado Inferior (por un.)", value: `${capacidadeInferiorPorRes.toFixed(0)}`, unit: "L" },
        { label: "Reservatório(s) Superior(es) Adotado(s)", value: `${reservatorios.numSuperiores} x ${state.reservatorios.volumeSuperiorComercial} L`, unit: "" }
    );
    if (reservatorios.numInferiores > 0) {
      module.results.push(
        { label: "Reservatório(s) Inferior(es) Adotado(s)", value: `${reservatorios.numInferiores} x ${state.reservatorios.volumeInferiorComercial} L`, unit: "" }
      );
    }
    
    const detailDistrib = `Volume Total: ${volumeTotalReserva.toFixed(0)} L<br>
Percentual Superior: ${reservatorios.percentualSuperior}%<br>
<b>Volume Superior:</b> ${reservaSuperiorTotal.toFixed(0)} L (${reservatorios.numSuperiores} un.) - Calculado: ${capacidadeSuperiorPorRes.toFixed(0)} L/un. - <b>Adotado: ${reservatorios.numSuperiores} x ${state.reservatorios.volumeSuperiorComercial} L</b><br>
<b>Volume Inferior:</b> ${reservaInferiorTotal.toFixed(0)} L ${reservatorios.numInferiores > 0 ? `(${reservatorios.numInferiores} un.)` : ''} - Calculado: ${capacidadeInferiorPorRes.toFixed(0)} L/un.
${reservatorios.numInferiores > 0 ? ` - <b>Adotado: ${reservatorios.numInferiores} x ${state.reservatorios.volumeInferiorComercial} L</b>` : ''}`;

    module.calculationSteps.push(
        { description: "Cálculo da Demanda de Água Diária", detail: consumoStepDetail},
        { description: "Cálculo do Volume de Reserva Total (NBR 5626)", detail: `Fórmula: (Demanda × Dias de Reserva) + RTI<br>Substituição: (${consumoDiario.toFixed(0)} L/dia × ${projectData.diasReserva}) + ${reservaIncendio} L = <b>${volumeTotalReserva.toFixed(0)} L</b>`},
        { description: "Distribuição do Volume de Reserva", detail: detailDistrib },
    );

    if (reservatorios.numInferiores > 0) {
        
        const horasFuncionamento = bombeamento.horasFuncionamento > 0 ? bombeamento.horasFuncionamento : 4;
        const vazaoRecalqueL_s = consumoDiario / (horasFuncionamento * 3600);
        const vazaoRecalqueM3_h = vazaoRecalqueL_s * 3.6;
        const vazaoRecalqueM3_s = vazaoRecalqueL_s / 1000;
        const alturaGeometrica = bombeamento.alturaSuccao + bombeamento.alturaRecalque;
        const D_recalque_mm = bombeamentoDetalhes.diametro;
        const D_interno_recalque_m = getDiametroInterno(bombeamentoDetalhes.material as any, D_recalque_mm) / 1000;
        const materialMap = { pvc: 150, aco: 130, ppr: 150 };
        const C_HW_recalque = materialMap[bombeamentoDetalhes.material as keyof typeof materialMap] || 150;

        let comprimentoEquivalente = 0;
        let pecasDetalhamento: string[] = [];
        bombeamentoDetalhes.pecas.forEach(peca => {
            const tabelaPeca = CONEXOES_AGUA_DB[peca.nome as keyof typeof CONEXOES_AGUA_DB];
            if (tabelaPeca && tabelaPeca[D_recalque_mm]) {
                const compEq = peca.quantidade * tabelaPeca[D_recalque_mm];
                comprimentoEquivalente += compEq;
                pecasDetalhamento.push(`<li>${peca.quantidade} x ${peca.nome}: ${compEq.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</li>`);
            }
        });
        const comprimentoVirtual = bombeamento.comprimentoReal + comprimentoEquivalente;
        const J_recalque = (10.67 * Math.pow(vazaoRecalqueM3_s, 1.852)) / (Math.pow(C_HW_recalque, 1.852) * Math.pow(D_interno_recalque_m, 4.87));
        const perdaCargaRecalque = J_recalque * comprimentoVirtual;
        const amt = alturaGeometrica + perdaCargaRecalque;
        const potenciaCV = (vazaoRecalqueL_s * amt) / (75 * (bombeamento.rendimento / 100));
        
        const temp = [10, 20, 30, 40].reduce((prev, curr) => Math.abs(curr - bombeamento.temperaturaAgua) < Math.abs(prev - bombeamento.temperaturaAgua) ? curr : prev) as keyof typeof AGUA_PROPRIEDADES;
        const propsAgua = AGUA_PROPRIEDADES[temp];
        const pVapor = propsAgua.vapor;
        const pAtm = bombeamento.pressaoAtmosferica;
        const pdSuccao = J_recalque * bombeamento.alturaSuccao * 1.5; // Simplified virtual length for suction
        const npshDisponivel = pAtm - bombeamento.alturaSuccao - pVapor - pdSuccao;

        const suggestedPumps = bombasDB
            .filter(b => b.curva.length > 0)
            .map(bomba => {
                const operatingPoint = bomba.curva.reduce((prev, curr) => {
                    const prevDist = Math.sqrt(Math.pow(prev[0] - vazaoRecalqueM3_h, 2) + Math.pow(prev[1] - amt, 2));
                    const currDist = Math.sqrt(Math.pow(curr[0] - vazaoRecalqueM3_h, 2) + Math.pow(curr[1] - amt, 2));
                    return currDist < prevDist ? curr : prev;
                });
                const status = npshDisponivel > bomba.npshRequerido ? 'NPSH OK' : 'Risco Cavitação';
                return { nome: bomba.nome, fabricante: bomba.fabricante, vazao: operatingPoint[0], amt: operatingPoint[1], status, dist: Math.sqrt(Math.pow(operatingPoint[0] - vazaoRecalqueM3_h, 2) + Math.pow(operatingPoint[1] - amt, 2))};
            })
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 3);
        bombeamento.suggestedPumps = suggestedPumps.map(({dist, ...rest}) => rest);

        module.results.push(
            { label: "Vazão da Bomba", value: vazaoRecalqueL_s.toFixed(2), unit: "L/s" },
            { label: "Altura Manométrica Total", value: amt.toFixed(2), unit: "mca" },
            { label: "Potência da Bomba", value: potenciaCV.toFixed(2), unit: "CV" },
            { label: "NPSH Disponível", value: npshDisponivel.toFixed(2), unit: "mca" }
        );

        if (bombeamento.bombaSelecionada && bombeamento.bombaSelecionada !== "nenhuma") {
            const bomba = bombasDB.find(b => b.nome === bombeamento.bombaSelecionada);
            if(bomba) {
                const npshCheck = npshDisponivel > bomba.npshRequerido;
                const statusNPSH = npshCheck ? 'OK' : 'RISCO DE CAVITAÇÃO';
                module.results.push({ label: `Status NPSH (${bomba.nome})`, value: statusNPSH, unit: npshCheck ? '✓' : '⚠️' });
                module.calculationSteps.push({ description: "Verificação da Bomba Selecionada", detail: `Fórmula: NPSHdisp > NPSHreq<br>Substituição: ${npshDisponivel.toFixed(2)} mca > ${bomba.npshRequerido} mca<br><b>Resultado: ${statusNPSH}</b>`})
            }
        }

         module.calculationSteps.push(
            { description: `Cálculo da Vazão de Recalque (${horasFuncionamento}h)`, detail: `Fórmula: Q = V / t<br>Substituição: Q = ${consumoDiario.toFixed(0)} L / (${horasFuncionamento}h × 3600s/h) = <b>${vazaoRecalqueL_s.toFixed(2)} L/s</b>` },
            { description: "Cálculo da Perda de Carga no Recalque (Hazen-Williams)", detail: `Fórmula: J = (10.67 × Q¹·⁸⁵²) / (C¹·⁸⁵² × D⁴·⁸⁷)<br>Comprimento Real: ${bombeamento.comprimentoReal} m<br>Comprimento Equivalente Peças: ${comprimentoEquivalente.toFixed(2)} m <ul>${pecasDetalhamento.join("")}</ul><b>Comprimento Total Virtual: ${comprimentoVirtual.toFixed(2)} m</b><br>Perda de Carga Unitária (J) = ${J_recalque.toFixed(5)} m/m <br><b>Perda de Carga Total (PD) = ${perdaCargaRecalque.toFixed(2)} mca</b>` },
            { description: "Cálculo da Altura Manométrica Total (AMT)", detail: `Fórmula: AMT = H_geo + PD_recalque<br>Substituição: AMT = ${alturaGeometrica.toFixed(2)} + ${perdaCargaRecalque.toFixed(2)} = <b>${amt.toFixed(2)} mca</b>`},
            { description: "Cálculo da Potência do Motor (CV)", detail: `Fórmula: Pot(CV) = (Q × AMT) / (75 × η)<br>Substituição: Pot = (${vazaoRecalqueL_s.toFixed(2)} L/s × ${amt.toFixed(2)} mca) / (75 × ${bombeamento.rendimento / 100}) = <b>${potenciaCV.toFixed(2)} CV</b>` },
            { description: "Verificação de Cavitação (NPSH)", detail: `Fórmula: NPSHdisp = P_atm - H_sucção - P_vapor - PD_sucção<br>Substituição: NPSHdisp = ${pAtm} - ${bombeamento.alturaSuccao} - ${pVapor} - ${pdSuccao.toFixed(2)} = <b>${npshDisponivel.toFixed(2)} mca</b><br><i>*Verificar se NPSHdisp > NPSHreq (do fabricante).</i>` }
        );

        const K_agua = propsAgua.moduloElasticidade; 
        const E_tubo = ELASTICIDADE_MODULOS[bombeamentoDetalhes.material] || ELASTICIDADE_MODULOS.pvc; 
        const e_espessura = D_recalque_mm * 0.1;
        const celeridade = Math.sqrt((K_agua / propsAgua.densidade) / (1 + (K_agua/E_tubo) * (D_interno_recalque_m * 1000 / e_espessura)));
        const velocidade_recalque = vazaoRecalqueM3_s / (Math.PI * Math.pow(D_interno_recalque_m, 2) / 4);
        const tempo_critico = (2 * bombeamento.comprimentoReal) / celeridade;
        const sobrepressao_mca = (bombeamento.tempoFechamentoValvula <= tempo_critico)
            ? (celeridade * velocidade_recalque) / 9.81
            : ((2 * bombeamento.comprimentoReal * velocidade_recalque) / (9.81 * bombeamento.tempoFechamentoValvula));

        const pressao_maxima = amt + pAtm + sobrepressao_mca;
        let sugestao = "Nenhuma proteção necessária.";
        if (sobrepressao_mca > amt * 0.4) {
            sugestao = "Recomenda-se instalar ventosa de triplo efeito e/ou válvula de alívio.";
        }

        module.results.push(
            { label: "Sobrepressão Máxima (Golpe de Aríete)", value: sobrepressao_mca.toFixed(2), unit: "mca" },
        );
        module.calculationSteps.push({
            description: "Análise de Transiente Hidráulico (Golpe de Aríete)",
            detail: `Fórmula (Joukowsky/Michaud): ΔH = f(a, L, V, t)<br>Celeridade da onda (a): ${celeridade.toFixed(2)} m/s<br>Tempo Crítico (2L/a): ${tempo_critico.toFixed(2)} s<br><b>Sobrepressão (ΔH): ${sobrepressao_mca.toFixed(2)} mca</b><br><b>Pressão Máxima (H_max): ${pressao_maxima.toFixed(2)} mca</b>`
        });
    }

    if (aguaFria.vrp.habilitado) {
        const status = aguaFria.vrp.pressaoMontante > aguaFria.vrp.pressaoJusanteDesejada + 5 ? 'OK' : 'Pressão insuficiente';
        module.results.push({ label: "Status da VRP", value: status, unit: "" });
        module.calculationSteps.push({ description: "Dimensionamento da VRP", detail: `Verifica se a pressão de entrada (${aguaFria.vrp.pressaoMontante} mca) é superior à de saída (${aguaFria.vrp.pressaoJusanteDesejada} mca) com folga.<br><b>Resultado: ${status}</b>` });
    }
    
    // Atualiza soma de pesos a partir dos aparelhos selecionados
    aguaFria.caminhos.forEach(c => {
        c.trechos.forEach(t => {
            // This now correctly calculates the sum from the 'aparelhos' array,
            // resetting to 0 if the array is empty or missing. This fixes the bug
            // where the sum of weights would not update if it became smaller or zero.
            t.somaPesos = t.aparelhos?.reduce((acc, ap) => acc + (APARELHOS_PESOS[ap.nome] || 0) * ap.quantidade, 0) || 0;
        });
    });


    const calculatedCaminhos = aguaFria.caminhos.map((caminho): Caminho => {
        let perdaAcumulada = 0;
        let pressaoAnterior = caminho.pressaoInicial || 0;

        const calculatedTrechos = caminho.trechos.map((trecho, index): Trecho => {
            const Q_L_s = 0.3 * Math.sqrt(trecho.somaPesos);
            const Q_m3_s = Q_L_s / 1000;

            let DN = 20;
            let V = 0;
            const diâmetros = Object.keys(tubulacoesDB[aguaFria.material as keyof typeof tubulacoesDB]).map(Number).sort((a,b) => a-b);

            for (let d of diâmetros) {
                const d_interno_m = getDiametroInterno(aguaFria.material as any, d) / 1000;
                V = Q_m3_s / ((Math.PI * Math.pow(d_interno_m, 2)) / 4);
                if (V <= 3.0) { DN = d; break; }
                DN = d;
            }

            const D_interno_m = getDiametroInterno(aguaFria.material as any, DN) / 1000;
            
            let comprimentoEquivalente = 0;
            if (trecho.conexoes) {
                trecho.conexoes.forEach(peca => {
                    const tabelaPeca = CONEXOES_AGUA_DB[peca.nome as keyof typeof CONEXOES_AGUA_DB];
                    if (tabelaPeca) {
                        const availableDNs = Object.keys(tabelaPeca).map(Number).sort((a,b) => a-b);
                        const closestDN = availableDNs.reduce((prev, curr) => Math.abs(curr - DN) < Math.abs(prev - DN) ? curr : prev);
                        comprimentoEquivalente += (tabelaPeca[closestDN as keyof typeof tabelaPeca] || 0) * peca.quantidade;
                    }
                });
            }

            const comprimentoVirtual = trecho.comprimentoReal + comprimentoEquivalente;
            let PD_total = 0;
            let J = 0;

            if (aguaFria.metodoCalculo === 'darcy-weisbach') {
                const temp = 20 as keyof typeof AGUA_PROPRIEDADES;
                const { densidade, viscosidade } = AGUA_PROPRIEDADES[temp];
                const Re = (densidade * V * D_interno_m) / viscosidade;
                const rugosidadeRelativa = aguaFria.rugosidade / D_interno_m;
                const f = 0.25 / Math.pow(Math.log10((rugosidadeRelativa / 3.7) + (5.74 / Math.pow(Re, 0.9))), 2); // Swamee-Jain
                PD_total = f * (comprimentoVirtual / D_interno_m) * (Math.pow(V, 2) / (2 * 9.81));
                J = PD_total / comprimentoVirtual;
            } else { // Hazen-Williams
                const C_HW_dist = aguaFria.coeficienteHW;
                J = (10.67 * Math.pow(Q_m3_s, 1.852)) / (Math.pow(C_HW_dist, 1.852) * Math.pow(D_interno_m, 4.87));
                PD_total = J * comprimentoVirtual;
            }

            const PD_dist = PD_total * (trecho.comprimentoReal / comprimentoVirtual);
            const PD_local = PD_total * (comprimentoEquivalente / comprimentoVirtual);
            const desnivel = trecho.alturaInicial - trecho.alturaFinal;
            const pressaoDisponivel = pressaoAnterior + desnivel;
            const pressaoFinal = pressaoDisponivel - PD_total;
            
            pressaoAnterior = pressaoFinal;
            perdaAcumulada += PD_total;

            const pressaoMinima = APARELHOS_PRESSAO_MINIMA[trecho.aparelho] || 0;
            const pressaoMinimaAtendida = pressaoFinal >= pressaoMinima;
            
            return {
                ...trecho,
                vazao: Q_L_s, velocidade: V, diametroNominal: DN, perdaCargaDistribuida: PD_dist, perdaCargaLocalizada: PD_local,
                perdaCargaTotal: PD_total, perdaCargaAcumulada: perdaAcumulada, perdaCargaUnitaria: J, comprimentoEquivalente, comprimentoVirtual,
                desnivel, pressaoDisponivel, pressaoFinal, pressaoAltura: pressaoFinal * 9.81, pressaoMinimaAtendida,
                velocidadeExcessiva: V > 3.0
            };
        });
        
        caminho.sugestoesOtimizacao = [];
        const diâmetrosDisponiveis = Object.keys(tubulacoesDB[aguaFria.material as keyof typeof tubulacoesDB]).map(Number).sort((a,b) => a-b);
        calculatedTrechos.forEach(t => {
            const pressaoMinimaRequerida = APARELHOS_PRESSAO_MINIMA[t.aparelho] || 0;
            const indexDN = diâmetrosDisponiveis.indexOf(t.diametroNominal || 20);

            if ((t.velocidade || 0) > 2.8 && indexDN < diâmetrosDisponiveis.length - 1) {
                 caminho.sugestoesOtimizacao?.push({ trechoId: t.id, descricao: t.descricao, novoDiametro: diâmetrosDisponiveis[indexDN + 1], justificativa: 'Velocidade alta' });
            }
            if ((t.velocidade || 0) < 0.6 && (t.pressaoFinal || 0) > pressaoMinimaRequerida + 5 && indexDN > 0) {
                 caminho.sugestoesOtimizacao?.push({ trechoId: t.id, descricao: t.descricao, novoDiametro: diâmetrosDisponiveis[indexDN - 1], justificativa: 'Velocidade baixa e folga de pressão' });
            }
        });

        return { ...caminho, trechos: calculatedTrechos, perdaTotal: perdaAcumulada };
    });
    
    module.caminhos = calculatedCaminhos;
    const maxPerda = Math.max(...calculatedCaminhos.map(c => c.perdaTotal || 0));
    module.results.push({ label: "Perda de Carga Máxima", value: maxPerda.toFixed(2), unit: "mca" });
    
    const maxStaticPressure = Math.max(...calculatedCaminhos.flatMap(c => c.trechos.map(t => (t.pressaoDisponivel || 0) - (t.pressaoFinal || 0) + (t.pressaoFinal || 0) )));
    const alturaTotalEdificio = buildingData.pavimentos * 3.0; // Estimate
    const pressaoEstaticaBase = (calculatedCaminhos[0]?.pressaoInicial || 0) + alturaTotalEdificio;
    if(pressaoEstaticaBase > 40 && !aguaFria.vrp.habilitado) {
        aguaFria.sugestaoVRP = { necessaria: true, pressaoEstaticaCalculada: pressaoEstaticaBase, pavimentoSugerido: Math.floor(buildingData.pavimentos / 2) };
        module.results.push({ label: "Alerta de Pressão Estática", value: `${pressaoEstaticaBase.toFixed(2)} mca`, unit: "⚠️" });
        module.calculationSteps.push({ description: "Verificação de Pressão Estática (NBR 5626)", detail: `A pressão estática na base da prumada (~${pressaoEstaticaBase.toFixed(2)} mca) excede o limite de 40 mca. <b>É recomendada a instalação de uma VRP.</b>` });
    } else {
        aguaFria.sugestaoVRP = { necessaria: false, pressaoEstaticaCalculada: pressaoEstaticaBase, pavimentoSugerido: 0 };
    }

    const uhcTotalAF = aguaFria.caminhos.reduce((sum, c) => sum + (c.trechos[0]?.somaPesos || 0), 0);
    const vazaoMaximaProvavel = 0.3 * Math.sqrt(uhcTotalAF); // L/s
    const qmp_m3h = vazaoMaximaProvavel * 3.6;
    const hidrometroSugerido = HIDROMETROS_DB.find(h => h.qmax >= qmp_m3h) || HIDROMETROS_DB[HIDROMETROS_DB.length - 1];
    aguaFria.hidrometro = {
        vazaoMaximaProvavel: qmp_m3h,
        diametroSugerido: hidrometroSugerido.diametro
    };
    module.results.push({ label: "Vazão Máx. Provável", value: qmp_m3h.toFixed(2), unit: "m³/h" });
    module.results.push({ label: "Hidrômetro Sugerido", value: hidrometroSugerido.nome, unit: "" });
    module.calculationSteps.push({ description: "Dimensionamento do Hidrômetro", detail: `Com base na vazão máxima provável de ${qmp_m3h.toFixed(2)} m³/h (NBR 5626, Anexo A), sugere-se um hidrômetro <b>${hidrometroSugerido.nome}</b>.` });

    // Cálculo do Alimentador Predial
    if (aguaFria.alimentadorPredial && qmp_m3h > 0) {
        const qmp_m3s = qmp_m3h / 3600;
        const vMax = aguaFria.alimentadorPredial.velocidadeMaxima;
        const diametroMinimo_m = Math.sqrt((4 * qmp_m3s) / (Math.PI * vMax));
        const diâmetrosDisponiveis = Object.keys(tubulacoesDB[aguaFria.alimentadorPredial.material as keyof typeof tubulacoesDB] || tubulacoesDB.pvc).map(Number).sort((a, b) => a - b);
        const diametroSugerido_mm = diâmetrosDisponiveis.find(d => (d * 0.9 / 1000) >= diametroMinimo_m) || diâmetrosDisponiveis[diâmetrosDisponiveis.length - 1];
        const D_interno_m = getDiametroInterno(aguaFria.alimentadorPredial.material as any, diametroSugerido_mm) / 1000;
        const C_HW = 150; // for PVC/PEAD
        const J = (10.67 * Math.pow(qmp_m3s, 1.852)) / (Math.pow(C_HW, 1.852) * Math.pow(D_interno_m, 4.87));
        const perdaCarga = J * aguaFria.alimentadorPredial.comprimento;
        aguaFria.alimentadorPredial.diametroSugerido = diametroSugerido_mm;
        aguaFria.alimentadorPredial.perdaCargaCalculada = perdaCarga;
        module.results.push({ label: "DN Alimentador Predial", value: diametroSugerido_mm, unit: "mm" });
        module.results.push({ label: "PD Alimentador Predial", value: perdaCarga.toFixed(2), unit: "mca" });
        module.calculationSteps.push({ description: "Dimensionamento do Alimentador Predial", detail: `Para Q=${qmp_m3s.toFixed(4)} m³/s e Vmax=${vMax} m/s, DN mínimo=${(diametroMinimo_m*1000).toFixed(2)}mm.<br><b>DN Adotado: ${diametroSugerido_mm} mm</b>.<br>Perda de Carga: <b>${perdaCarga.toFixed(2)} mca</b>.`});
    }

    return module;
};

const calculateAguaQuente = (module: Module, state: ProjectState, buildingType: string): Module => {
    const { buildingData, aguaQuente } = state;
    const ΔT = aguaQuente.tempAguaQuente - aguaQuente.tempAguaFria;

    if (aguaQuente.tipoSistema === 'central') {
        const populacaoAQ = getPopulacao(buildingType, buildingData);
        const escopo = `para a população total da edificação (${populacaoAQ} pessoas).`;
        const t = aguaQuente.tempoAquecimento;
        const consumoDiarioPessoa = 45;
        const demandaDiaria = populacaoAQ * consumoDiarioPessoa;
        
        let volumeBoiler = demandaDiaria;
        let potenciaAquecedor = (volumeBoiler * ΔT * 1.163) / (t * 1000);

        const aquecedorSelecionado = aguaQuente.aquecedoresDB.find(a => a.id === aguaQuente.aquecedorSelecionadoId);
        if (aquecedorSelecionado && aquecedorSelecionado.tipo === 'acumulacao') {
            volumeBoiler = aquecedorSelecionado.volume;
            potenciaAquecedor = aquecedorSelecionado.potencia;
        }

        module.results.push(
            { label: "População de Cálculo (AQ)", value: populacaoAQ, unit: "pessoas" },
            { label: "Volume do Boiler (Acumulação)", value: volumeBoiler, unit: "L" },
            { label: "Potência do Aquecedor Central", value: potenciaAquecedor.toFixed(2), unit: "kW" }
        );
        module.calculationSteps.push(
            { description: "Premissas de Cálculo (NBR 7198)", detail: `Sistema <b>central (acumulação)</b>, ${escopo}<br>Consumo: ${consumoDiarioPessoa} L/p.dia, Tempo de Aquecimento: ${t}h, ΔT: ${ΔT}°C` },
            { description: "Cálculo da Demanda Diária de Água Quente", detail: `Fórmula: D = Pop. × C<br>Substituição: D = ${populacaoAQ}p × ${consumoDiarioPessoa}L/p.dia = <b>${demandaDiaria.toFixed(0)} L/dia</b>` },
            { description: "Cálculo da Potência do Aquecedor", detail: `Fórmula: Pot(kW) = (V[L] × ΔT[°C] × 1,163) / (t[h] × 1000)<br>Substituição: Pot = (${volumeBoiler.toFixed(0)} × ${ΔT} × 1,163) / (${t} × 1000) = <b>${potenciaAquecedor.toFixed(2)} kW</b>` }
        );

    } else { // Sistema "individual" (Passagem)
        const populacaoAQ = buildingType === "Multifamiliar" ? buildingData.pessoasPorApt : buildingData.pessoas;
        const escopo = `para uma unidade habitacional típica (${populacaoAQ} pessoas).`;
        
        const somaPesosAQ = aguaQuente.caminhos.reduce((total, caminho) => {
            return total + caminho.trechos.reduce((subtotal, trecho) => {
                 const pesosTrecho = trecho.aparelhos.reduce((acc, ap) => acc + (APARELHOS_PESOS[ap.nome] || 0) * ap.quantidade, 0);
                return subtotal + pesosTrecho;
            }, 0);
        }, 0);

        const vazaoProvavel_L_s = 0.3 * Math.sqrt(somaPesosAQ);
        const vazaoProvavel_L_min = vazaoProvavel_L_s * 60;
        const potenciaAquecedor = (vazaoProvavel_L_min * ΔT) / 14.3;

        module.results.push(
            { label: "População de Cálculo (Unidade)", value: populacaoAQ, unit: "pessoas" },
            { label: "Vazão Máxima Provável (AQ)", value: vazaoProvavel_L_min.toFixed(2), unit: "L/min" },
            { label: "Potência Aquecedor de Passagem", value: potenciaAquecedor.toFixed(2), unit: "kW" }
        );
        module.calculationSteps.push(
            { description: "Premissas de Cálculo (NBR 5626)", detail: `Sistema <b>individual (passagem)</b>, ${escopo}<br>ΔT: ${ΔT}°C` },
            { description: "Cálculo da Vazão de Água Quente", detail: `Soma de Pesos (AQ): ${somaPesosAQ.toFixed(2)}<br>Fórmula: Q = 0.3 × √ΣP<br>Substituição: Q = 0.3 × √${somaPesosAQ.toFixed(2)} = <b>${vazaoProvavel_L_s.toFixed(2)} L/s</b> ou <b>${vazaoProvavel_L_min.toFixed(2)} L/min</b>` },
            { description: "Cálculo da Potência do Aquecedor de Passagem", detail: `Fórmula: Pot(kW) ≈ (Q[L/min] × ΔT[°C]) / 14.3<br>Substituição: Pot = (${vazaoProvavel_L_min.toFixed(2)} × ${ΔT}) / 14.3 = <b>${potenciaAquecedor.toFixed(2)} kW</b>` }
        );
    }

    if (aguaQuente.tipoSistema === 'central') {
        if (aguaQuente.recirculacao?.habilitado) {
            const U = CONDUTIVIDADE_TERMICA[aguaQuente.recirculacao.material];
            const L = aguaQuente.recirculacao.comprimentoAnel;
            const D_ext = aguaQuente.recirculacao.diametro * 1.1;
            const A = Math.PI * (D_ext/1000) * L;
            const dT_ambiente = aguaQuente.tempAguaQuente - 25;
            const perdaTermica = (U * A * dT_ambiente) / 1000;
            const C_HW = 150;
            const D_int_m = getDiametroInterno(aguaQuente.recirculacao.material as any, aguaQuente.recirculacao.diametro) / 1000;
            const Q_rec_m3s = 0.1 / 1000;
            const J = (10.67 * Math.pow(Q_rec_m3s, 1.852)) / (Math.pow(C_HW, 1.852) * Math.pow(D_int_m, 4.87));
            const PD_rec = J * L;
            const potBomba = ( (Q_rec_m3s * 1000) * PD_rec) / (75 * 0.4);
            module.results.push({ label: "Perda Térmica Recirculação", value: perdaTermica.toFixed(2), unit: "kW" });
            module.results.push({ label: "Potência Bomba Recirc.", value: potBomba.toFixed(3), unit: "CV" });
            module.calculationSteps.push({ description: "Cálculo do Sistema de Recirculação", detail: `Fórmula (Perda Térmica): Q = U × A × ΔT<br>Substituição: Q = ${U} × ${A.toFixed(2)} × ${dT_ambiente} = <b>${(perdaTermica*1000).toFixed(2)} W</b><br>Perda de Carga no anel: ${PD_rec.toFixed(2)} mca<br><b>Potência da Bomba: ${potBomba.toFixed(3)} CV</b>`});
        }

        if (aguaQuente.vasoExpansao?.habilitado) {
            const volBoilerResult = module.results.find(r => r.label.includes("Volume do Boiler"))?.value as number || 0;
            const V_boiler = volBoilerResult;
            const T_fria = aguaQuente.tempAguaFria;
            const T_quente = aguaQuente.tempAguaQuente;
            const p_fria = AGUA_PROPRIEDADES[Object.keys(AGUA_PROPRIEDADES).reduce((a, b) => Math.abs(Number(b) - T_fria) < Math.abs(Number(a) - T_fria) ? b : a) as any].densidade;
            const p_quente = AGUA_PROPRIEDADES[Object.keys(AGUA_PROPRIEDADES).reduce((a, b) => Math.abs(Number(b) - T_quente) < Math.abs(Number(a) - T_quente) ? b : a) as any].densidade;
            const V_expansao = V_boiler * ((p_fria/p_quente) - 1);
            const P_min_abs = (aguaQuente.vasoExpansao.pressaoMinimaRede + 1.013) * 0.9;
            const P_max_abs = (aguaQuente.vasoExpansao.pressaoMaximaRede + 1.013) * 0.9;
            const V_tanque = V_expansao / (1 - (P_min_abs / P_max_abs));
            module.results.push({ label: "Volume Vaso de Expansão", value: V_tanque.toFixed(2), unit: "L" });
            module.calculationSteps.push({ description: "Cálculo do Vaso de Expansão", detail: `Fórmula: Vt = [Vb × ((ρf/ρq)-1)] / (1 - (Pi/Pf))<br>Substituição: Vt = [${V_boiler.toFixed(0)} × ((${p_fria}/${p_quente})-1)] / (1-(${P_min_abs.toFixed(2)}/${P_max_abs.toFixed(2)})) = <b>${V_tanque.toFixed(2)} L</b>`});
        }
    }
    
    aguaQuente.caminhos.forEach(c => {
        c.trechos.forEach(t => {
            // This now correctly calculates the sum from the 'aparelhos' array,
            // resetting to 0 if the array is empty or missing. This fixes the bug
            // where the sum of weights would not update if it became smaller or zero.
            t.somaPesos = t.aparelhos?.reduce((acc, ap) => acc + (APARELHOS_PESOS[ap.nome] || 0) * ap.quantidade, 0) || 0;
        });
    });

    const calculatedCaminhos = aguaQuente.caminhos.map(caminho => {
        let perdaAcumulada = 0;
        let pressaoAnterior = caminho.pressaoInicial || 0;
        const C_HW_dist = 140; 
        const calculatedTrechos = caminho.trechos.map((trecho) => {
            const Q = 0.3 * Math.sqrt(trecho.somaPesos);
            let DN = 20; let V = 0;
            const diâmetros = [15, 20, 25, 32, 40, 50];
            for (let d of diâmetros) { const d_interno_m = getDiametroInterno("ppr", d) / 1000; V = Q / 1000 / ((Math.PI * Math.pow(d_interno_m, 2)) / 4); if (V <= 3.0) { DN = d; break; } }
            if (V > 3.0) { for (let d of diâmetros) { const d_interno_m = getDiametroInterno("ppr", d) / 1000; V = Q / 1000 / ((Math.PI * Math.pow(d_interno_m, 2)) / 4); DN = d; if (V <= 3.0) break;} }
            
            let comprimentoEquivalente = 0;
            if (trecho.conexoes) {
                trecho.conexoes.forEach(peca => {
                    const tabelaPeca = CONEXOES_AGUA_DB[peca.nome as keyof typeof CONEXOES_AGUA_DB];
                    if (tabelaPeca) {
                        const availableDNs = Object.keys(tabelaPeca).map(Number).sort((a,b) => a-b);
                        const closestDN = availableDNs.reduce((prev, curr) => Math.abs(curr - DN) < Math.abs(prev - DN) ? curr : prev);
                        comprimentoEquivalente += (tabelaPeca[closestDN as keyof typeof tabelaPeca] || 0) * peca.quantidade;
                    }
                });
            }

            const comprimentoVirtual = trecho.comprimentoReal + comprimentoEquivalente;
            const D_interno_dist = getDiametroInterno("ppr", DN) / 1000;
            const J = (10.67 * Math.pow(Q / 1000, 1.852)) / (Math.pow(C_HW_dist, 1.852) * Math.pow(D_interno_dist, 4.87));
            const PD_total = J * comprimentoVirtual;
            const PD_dist = PD_total * (trecho.comprimentoReal / comprimentoVirtual);
            const PD_local = PD_total * (comprimentoEquivalente / comprimentoVirtual);
            const desnivel = trecho.alturaInicial - trecho.alturaFinal;
            const pressaoDisponivel = pressaoAnterior + desnivel;
            const pressaoFinal = pressaoDisponivel - PD_total;
            pressaoAnterior = pressaoFinal;
            perdaAcumulada += PD_total;
            const pressaoMinima = APARELHOS_PRESSAO_MINIMA[trecho.aparelho] || 0;
            const pressaoMinimaAtendida = pressaoFinal >= pressaoMinima;
            return { ...trecho, vazao: Q, velocidade: V, diametroNominal: DN, perdaCargaTotal: PD_total, perdaCargaAcumulada: perdaAcumulada, perdaCargaUnitaria: J, pressaoFinal, perdaCargaDistribuida: PD_dist, perdaCargaLocalizada: PD_local, comprimentoEquivalente, comprimentoVirtual, desnivel, pressaoDisponivel, pressaoAltura: pressaoFinal * 9.81, pressaoMinimaAtendida, velocidadeExcessiva: V > 3.0 };
        });
        return { ...caminho, trechos: calculatedTrechos, perdaTotal: perdaAcumulada };
    });
    
    module.caminhos = calculatedCaminhos;
    const maxPerda = Math.max(...calculatedCaminhos.map(c => c.perdaTotal || 0));
    module.results.push({ label: "Perda de Carga Máxima (AQ)", value: maxPerda.toFixed(2), unit: "mca" });
    return module;
};

const calculateEsgoto = (module: Module, state: ProjectState, buildingType: string): Module => {
    const { buildingData, esgotoItens, esgotoSanitario, esgotoTratamento, projectData } = state;
    const numUnidades = buildingType === "Multifamiliar" ? buildingData.pisos * buildingData.aptPorAndar : 1;
    
    let totalUHC = 0;
    let vazaoEsgotoTotal = 0;
    let calculoVazaoDetail = "";

    const getDiametroEsgoto = (q: number) => {
        if (q <= 1.8) return { diametro: 75, declividade: "2,0%" };
        if (q <= 6.0) return { diametro: 100, declividade: "1,0%" };
        if (q <= 21.0) return { diametro: 150, declividade: "0,5%" };
        return { diametro: 200, declividade: "0,5%" };
    };

    if (esgotoSanitario.metodoCalculo === 'probabilistico') {
        const totalUD = esgotoItens.reduce((acc, item) => acc + item.quantidade * (APARELHOS_DESCARGA_DB[item.aparelho] || 0), 0) * numUnidades;
        const C = 0.14; // Coeficiente para apartamentos
        vazaoEsgotoTotal = C * Math.sqrt(totalUD);
        calculoVazaoDetail = `<strong>Método Probabilístico (Hunter-Russo)</strong><br>Fórmula: Q = C × √ΣUD<br>Substituição: Q = ${C} × √(${totalUD.toFixed(2)}) = <b>${vazaoEsgotoTotal.toFixed(2)} L/s</b>`;
        module.results.push({ label: "Soma Unidades de Descarga", value: totalUD.toFixed(2), unit: "UD" });
    } else { // UHC
        const uhcPorUnidade = esgotoItens.reduce((acc, item) => acc + item.quantidade * (APARELHOS_SANITARIOS_UHC[item.aparelho] || 0), 0);
        totalUHC = uhcPorUnidade * numUnidades;
        vazaoEsgotoTotal = 0.3 * Math.sqrt(totalUHC);
        const uhcList = esgotoItens.map(item => `<li>${item.quantidade} x ${item.aparelho} (${APARELHOS_SANITARIOS_UHC[item.aparelho]} UHC) = ${item.quantidade * (APARELHOS_SANITARIOS_UHC[item.aparelho] || 0)} UHC</li>`).join("");
        let uhcDetail = `<strong>UHC por Unidade: ${uhcPorUnidade}</strong><ul>${uhcList}</ul>`;
        if (buildingType === "Multifamiliar") {
          uhcDetail += `<strong>UHC Total:</strong> ${uhcPorUnidade} UHC/unidade × ${numUnidades} unidades = <strong>${totalUHC} UHC</strong>`;
        }
        calculoVazaoDetail = `<strong>Método UHC</strong><br>${uhcDetail}<br>Fórmula: Q = 0,3 × √UHC<br>Substituição: Q = 0,3 × √(${totalUHC}) = <b>${vazaoEsgotoTotal.toFixed(2)} L/s</b>`;
        module.results.push({ label: "Soma de UHC Total", value: totalUHC, unit: "UHC" });
    }
    
    const vazaoEsgotoColuna = vazaoEsgotoTotal / esgotoSanitario.numTubosQueda;
    
    let dimColuna = getDiametroEsgoto(vazaoEsgotoColuna);
    if(esgotoItens.some(i => i.aparelho.includes("Bacia")) && dimColuna.diametro < 100) {
        dimColuna = getDiametroEsgoto(6.0); // Força 100mm se tiver bacia
    }
    let dimColetor = getDiametroEsgoto(vazaoEsgotoTotal);
    if (dimColetor.diametro < 100 && totalUHC > 0) dimColetor = getDiametroEsgoto(6.0);
    
    const numPavimentos = buildingType === "Multifamiliar" ? buildingData.pisos : buildingData.pavimentos;
    const uhcPorColunaVentilacao = totalUHC / (esgotoSanitario.numColunasVentilacao || 1);
    
    // NBR 8160 - Tabela 7: Diâmetros para Coluna de Ventilação
    let diametroVentilacao = 75;
    if (uhcPorColunaVentilacao > 180 || numPavimentos > 10) diametroVentilacao = 100;
    else if (uhcPorColunaVentilacao > 30) diametroVentilacao = 75;
    else if (uhcPorColunaVentilacao > 10) diametroVentilacao = 50;
    else diametroVentilacao = 40;

    // A coluna de ventilação não pode ser menor que o tubo de queda que ela ventila.
    // Para corrigir o cálculo, comparamos com um tubo de queda equivalente à carga da ventilação.
    const vazaoPorColunaVentilacao = vazaoEsgotoTotal / (esgotoSanitario.numColunasVentilacao || 1);
    const diametroTuboQuedaEquivalente = getDiametroEsgoto(vazaoPorColunaVentilacao).diametro;
    if(diametroTuboQuedaEquivalente > diametroVentilacao) {
        diametroVentilacao = diametroTuboQuedaEquivalente;
    }

    esgotoSanitario.ramaisVentilacao.forEach((ramal: RamalVentilacao) => {
        ramal.diametro = VENTILACAO_DIAMETROS(ramal.uhc, ramal.comprimento);
        module.results.push({ label: `Ramal Vent. '${ramal.descricao}'`, value: ramal.diametro, unit: "mm" });
    });

    module.results.push(
        { label: `Diâmetro Tubo de Queda (${esgotoSanitario.numTubosQueda} un.)`, value: dimColuna.diametro, unit: `mm` },
        { label: `Diâmetro Coluna Ventilação (${esgotoSanitario.numColunasVentilacao} un.)`, value: diametroVentilacao, unit: "mm" },
        { label: "Diâmetro Coletor Predial", value: dimColetor.diametro, unit: `mm (decl. ${dimColetor.declividade})` }
    );
    
    const sugestoes: string[] = [];
    sugestoes.push("Instalar caixa de inspeção no início do coletor predial.");
    const numCaixasDistancia = Math.floor(esgotoSanitario.comprimentoColetor / 25);
    if (numCaixasDistancia > 0) {
        sugestoes.push(`Instalar ${numCaixasDistancia} caixa(s) de inspeção ao longo do coletor para atender ao espaçamento máximo de 25m.`);
    }
    if ((esgotoSanitario.numCurvas90 || 0) > 0 || (esgotoSanitario.numCurvas45 || 0) > 0) {
        sugestoes.push("Instalar caixas de inspeção em todas as mudanças de direção (curvas).");
    }
    sugestoes.push("Instalar caixa de inspeção na junção com o coletor público ou sistema de tratamento.");
    esgotoSanitario.sugestoesInspecao = sugestoes;

    module.results.push({ label: "Caixas de Inspeção", value: `~${sugestoes.length}`, unit: "unidades" });

    module.calculationSteps.push(
      { description: "Cálculo da Vazão de Esgoto", detail: calculoVazaoDetail },
      { description: "Dimensionamento da Coluna de Esgoto", detail: `Vazão por coluna: ${vazaoEsgotoColuna.toFixed(2)} L/s.<br>Para esta vazão, adota-se DN <b>${dimColuna.diametro}mm</b> (NBR 8160).`},
      { description: "Dimensionamento da Coluna de Ventilação", detail: `UHC por coluna de ventilação: ${uhcPorColunaVentilacao.toFixed(2)} UHC. Baseado neste valor e em ${numPavimentos} pavimentos, adota-se DN <b>${diametroVentilacao}mm</b> (NBR 8160).`},
      { description: "Recomendação de Caixas de Inspeção (NBR 8160)", detail: `<ul>${sugestoes.map(s => `<li>${s}</li>`).join('')}</ul>` }
    );
     esgotoSanitario.ramaisVentilacao.forEach((ramal) => {
        module.calculationSteps.push({ description: `Dimensionamento do Ramal de Ventilação '${ramal.descricao}'`, detail: `Para ${ramal.uhc} UHC e comprimento de ${ramal.comprimento}m, adota-se DN <b>${ramal.diametro}mm</b> (NBR 8160, Tabela 8).`});
    });

    if (esgotoTratamento.habilitado) {
        const N = getPopulacao(buildingType, buildingData);
        const C = esgotoTratamento.contribuicaoEsgoto;
        const T_limpeza_anos = Math.max(1, Math.min(5, Math.round(esgotoTratamento.intervaloLimpeza)));
        const K_tabela = { 1: 94, 2: 134, 3: 174, 4: 214, 5: 254 } as const;
        const K = K_tabela[T_limpeza_anos as keyof typeof K_tabela] || 94;
        
        // Fossa Séptica (NBR 7229)
        const T_detencao_dias = C <= 100 ? 1.0 : Math.max(0.5, 1 - 0.0004 * (C - 100));
        const volumeUtilFossaTotal = 1000 + N * (C * T_detencao_dias + K);
        const vFossaUnitario = volumeUtilFossaTotal / esgotoTratamento.numFossas;
        const vFossaUnitarioM3 = vFossaUnitario / 1000;
        
        const hFossa = Math.min(Math.max(1.2, vFossaUnitarioM3 * 0.4), 2.2); 
        const areaFossa = vFossaUnitarioM3 / hFossa;
        const wFossa = Math.max(0.8, Math.sqrt(areaFossa / 2));
        const lFossa = Math.max(1.0, 2 * wFossa);

        esgotoTratamento.fossaComprimento = lFossa; esgotoTratamento.fossaLargura = wFossa; esgotoTratamento.fossaProfundidadeUtil = hFossa;
        module.results.push({ label: `Volume Útil Fossa Séptica (${esgotoTratamento.numFossas} un.)`, value: (volumeUtilFossaTotal/1000).toFixed(2), unit: "m³" });
        module.results.push({ label: `Dimensões Fossa (${esgotoTratamento.numFossas} un.)`, value: `${lFossa.toFixed(2)}x${wFossa.toFixed(2)}x${hFossa.toFixed(2)}`, unit: "m (CxLxH)" });

        // Filtro Anaeróbio (NBR 13969)
        const volumeUtilFiltroTotal = 1.6 * N * C;
        const vFiltroUnitario = volumeUtilFiltroTotal / esgotoTratamento.numFiltros;
        const vFiltroUnitarioM3 = vFiltroUnitario / 1000;
        const hFiltro = Math.max(1.2, vFiltroUnitarioM3 * 0.5);
        const areaFiltro = vFiltroUnitarioM3 / hFiltro;
        const dFiltro = Math.sqrt(4 * areaFiltro / Math.PI);
        
        esgotoTratamento.filtroDiametro = dFiltro; esgotoTratamento.filtroAlturaUtil = hFiltro;
        module.results.push({ label: `Volume Útil Filtro Anaeróbio (${esgotoTratamento.numFiltros} un.)`, value: (volumeUtilFiltroTotal/1000).toFixed(2), unit: "m³" });
        module.results.push({ label: `Dimensões Filtro (${esgotoTratamento.numFiltros} un.)`, value: `Ø${dFiltro.toFixed(2)} x ${hFiltro.toFixed(2)}`, unit: "m (DxH)" });
        
        // Disposição Final (NBR 13969)
        const contribuicaoTotalDiaria = N * C;
        const areaInfiltracao = esgotoTratamento.taxaInfiltracao > 0 ? contribuicaoTotalDiaria / esgotoTratamento.taxaInfiltracao : 0;
        
        let infiltracaoCalcDetail = `<strong>Dimensionamento Disposição Final (NBR 13969)</strong><br>Fórmula (Área de Infiltração Necessária): A = (N × C) / Ta<br>
            <u>Onde:</u><br>A: Área de infiltração (m²)<br>N: Número de contribuintes (${N} pessoas)<br>C: Contribuição diária de esgoto (${C} L/p.dia)<br>Ta: Taxa de aplicação diária (${esgotoTratamento.taxaInfiltracao} L/m².dia)<br>
            <u>Substituição:</u><br>A = (${N} × ${C}) / ${esgotoTratamento.taxaInfiltracao} = <b>${areaInfiltracao.toFixed(2)} m²</b> total.`;
        
        if (esgotoTratamento.tipoDisposicaoFinal === 'valaInfiltracao') {
            const L_vala = areaInfiltracao / (esgotoTratamento.valaLargura || 0.5);
            module.results.push({ label: "Comp. Vala de Infiltração", value: L_vala.toFixed(2), unit: "m" });
            infiltracaoCalcDetail += `<br><br><strong>Dimensionamento da Vala de Infiltração:</strong><br>Fórmula: L = A / Largura<br>
            <u>Onde:</u><br>L: Comprimento da vala (m)<br>A: Área de infiltração (${areaInfiltracao.toFixed(2)} m²)<br>Largura: Largura da vala (${esgotoTratamento.valaLargura || 0.5} m)<br>
            <u>Substituição:</u><br>L = ${areaInfiltracao.toFixed(2)} / ${esgotoTratamento.valaLargura || 0.5} = <b>${L_vala.toFixed(2)} m</b>`;
        } else { // Sumidouro
             const areaSumidouroUnit = areaInfiltracao / esgotoTratamento.numSumidouros; 
             const dSumidouro = 1.5; // Adotando diâmetro padrão
             const areaFundo = (Math.PI * Math.pow(dSumidouro, 2)) / 4;
             let hSumidouro = 0;
             let sumidouroDimDetail = "";

             if (areaSumidouroUnit <= areaFundo) {
                 hSumidouro = 1.0; // Adotar altura mínima
                 sumidouroDimDetail = `A área do fundo (<b>${areaFundo.toFixed(2)} m²</b>) já atende à área necessária de <b>${areaSumidouroUnit.toFixed(2)} m²</b>. Adotou-se altura útil mínima de <b>1.00 m</b>.`;
             } else {
                 const areaLateralNecessaria = areaSumidouroUnit - areaFundo;
                 hSumidouro = areaLateralNecessaria / (Math.PI * dSumidouro);
                 sumidouroDimDetail = `Fórmula: h = (A_total - A_fundo) / (π × D)<br>
                 <u>Onde:</u><br>h: Altura útil do sumidouro (m)<br>A_total: Área de infiltração por unidade (${areaSumidouroUnit.toFixed(2)} m²)<br>A_fundo: Área do fundo do sumidouro (${areaFundo.toFixed(2)} m²)<br>D: Diâmetro do sumidouro (${dSumidouro} m)<br>
                 <u>Substituição:</u><br>h = (${areaSumidouroUnit.toFixed(2)} - ${areaFundo.toFixed(2)}) / (π × ${dSumidouro}) = <b>${hSumidouro.toFixed(2)} m</b>`;
             }
             
             esgotoTratamento.sumidouroDiametro = dSumidouro; esgotoTratamento.sumidouroAlturaUtil = hSumidouro;
             module.results.push({ label: `Área Infiltração Necessária`, value: areaInfiltracao.toFixed(2), unit: "m²" });
             module.results.push({ label: `Dim. Sumidouro (${esgotoTratamento.numSumidouros} un.)`, value: `Ø${dSumidouro.toFixed(2)} x ${hSumidouro.toFixed(2)}`, unit: "m (DxH)" });
             infiltracaoCalcDetail += `<br><br><strong>Dimensionamento do Sumidouro (${esgotoTratamento.numSumidouros} unidade(s)):</strong><br>Área por unidade: ${areaSumidouroUnit.toFixed(2)} m².<br>Diâmetro adotado: ${dSumidouro} m.<br>${sumidouroDimDetail}`;
        }
        if(esgotoTratamento.leitoSecagem?.habilitado) {
            const areaLeito = N * 0.08;
            module.results.push({ label: "Área Leito de Secagem", value: areaLeito.toFixed(2), unit: "m²"});
        }
        
        const fossaCalcDetail = `<strong>Dimensionamento Fossa Séptica (NBR 7229)</strong><br>Fórmula: V = 1000 + N × (C × T + K)<br><u>Onde:</u><br>V: Volume útil (L)<br>N: Número de contribuintes (${N} pessoas)<br>C: Contribuição diária de esgoto (${C} L/pessoa.dia)<br>T: Período de detenção (${T_detencao_dias.toFixed(2)} dias)<br>K: Taxa de acúmulo de lodo (${K} L/pessoa para limpeza em ${T_limpeza_anos} ano(s))<br><u>Substituição:</u><br>V = 1000 + ${N} × (${C} × ${T_detencao_dias.toFixed(2)} + ${K}) = <b>${volumeUtilFossaTotal.toFixed(0)} L</b> total (para <b>${esgotoTratamento.numFossas}</b> unidade(s)).`;
        
        const fossaDimDetail = `Com base no volume útil de <b>${(vFossaUnitario/1000).toFixed(2)} m³</b> por unidade e nas proporções da NBR 7229 (L ≈ 2W, 1.2m ≤ H ≤ 2.2m), as dimensões internas adotadas são:<br>
        <b>Comprimento: ${lFossa.toFixed(2)} m, Largura: ${wFossa.toFixed(2)} m, Altura útil: ${hFossa.toFixed(2)} m</b>`;
    
        const filtroCalcDetail = `<strong>Dimensionamento Filtro Anaeróbio (NBR 13969)</strong><br>Fórmula: V = 1.6 × N × C<br><u>Onde:</u><br>V: Volume útil do leito filtrante (L)<br>N: Número de contribuintes (${N} pessoas)<br>C: Contribuição diária de esgoto (${C} L/p.dia)<br><u>Substituição:</u><br>V = 1.6 × ${N} × ${C} = <b>${volumeUtilFiltroTotal.toFixed(0)} L</b> total (para <b>${esgotoTratamento.numFiltros}</b> unidade(s)).`;

        const filtroDimDetail = `Com base no volume útil de <b>${(vFiltroUnitario/1000).toFixed(2)} m³</b> por unidade e altura útil mínima de 1.2m (NBR 13969), as dimensões internas adotadas são:<br>
        <b>Diâmetro: ${dFiltro.toFixed(2)} m, Altura Útil: ${hFiltro.toFixed(2)} m</b>`;

        module.calculationSteps.push(
            { description: "Cálculo do Volume da Fossa Séptica", detail: fossaCalcDetail },
            { description: "Dimensionamento Físico da Fossa Séptica", detail: fossaDimDetail },
            { description: "Cálculo do Volume do Filtro Anaeróbio", detail: filtroCalcDetail },
            { description: "Dimensionamento Físico do Filtro Anaeróbio", detail: filtroDimDetail },
            { description: "Dimensionamento da Disposição Final", detail: infiltracaoCalcDetail }
        );
    }
    
    if(esgotoSanitario.elevatoria?.habilitado) {
        const elev = esgotoSanitario.elevatoria;
        const vazaoBomba_ls = vazaoEsgotoTotal > 0.5 ? vazaoEsgotoTotal : 0.5; // Minimum flow
        const tempoCicloMin = 5; // minutes
        const volumeUtilPoco = (vazaoBomba_ls * 1000 * tempoCicloMin * 60) / (4 * 1000); // in Liters
        elev.volumePocoCalculado = volumeUtilPoco;
        
        // Simplified head calculation
        const amtBomba = elev.alturaRecalque + (elev.comprimentoRecalque * 0.05); // 5% friction loss
        
        const bombaSugerida = BOMBAS_ESGOTO_DB.find(b => b.vazao_max_ls > vazaoBomba_ls && b.amt_max > amtBomba);
        elev.bombaSugerida = bombaSugerida ? bombaSugerida.nome : "Nenhum modelo compatível";
        
        module.results.push({ label: "Volume Útil Poço Elevatório", value: volumeUtilPoco.toFixed(0), unit: "L" });
        module.results.push({ label: "Bomba Esgoto Sugerida", value: elev.bombaSugerida, unit: "" });
        module.calculationSteps.push({ description: "Dimensionamento da Elevatória de Esgoto", detail: `Para uma vazão de <b>${vazaoBomba_ls.toFixed(2)} L/s</b> e um tempo de ciclo de ${tempoCicloMin} min, o volume útil do poço é de <b>${volumeUtilPoco.toFixed(0)} L</b>. Para uma AMT de ~<b>${amtBomba.toFixed(2)} mca</b>, a bomba sugerida é <b>${elev.bombaSugerida}</b>.`});
    }

    return module;
};

const calculateGordura = (module: Module, state: ProjectState, buildingType: string): Module => {
    const { buildingData, gorduraData } = state;
    let volumeMin = 0;
    let tipoCaixa = '';
    let diametroTuboGordura = 75;

    const getDiametroEsgoto = (q: number) => {
        if (q <= 1.8) return { diametro: 75, declividade: "2,0%" };
        if (q <= 6.0) return { diametro: 100, declividade: "1,0%" };
        return { diametro: 100, declividade: "1,0%" };
    };

    if (["Unifamiliar", "Multifamiliar"].includes(buildingType)) {
        const cozinhas = buildingType === "Multifamiliar" ? buildingData.pisos * buildingData.aptPorAndar * gorduraData.numeroCozinhas : gorduraData.numeroCozinhas;
        
        // Dimensionamento da Caixa de Gordura (com base no total de cozinhas)
        if (cozinhas >= 2 && cozinhas <= 12) { tipoCaixa = "Dupla (CD)"; volumeMin = 31; }
        else if (cozinhas > 12) { tipoCaixa = "Especial (CE)"; volumeMin = 120; }
        else { tipoCaixa = "Simples (CS)"; volumeMin = 18; }
        module.results.push({ label: "Nº de Cozinhas", value: cozinhas, unit: "" }, { label: "Tipo de Caixa", value: tipoCaixa, unit: "" }, { label: "Volume Mínimo", value: volumeMin, unit: "L" });
        module.calculationSteps.push({ description: "Dimensionamento da Caixa de Gordura (NBR 8160)", detail: `Para ${cozinhas} cozinha(s), recomenda-se <b>${tipoCaixa}</b> com volume útil mínimo de <b>${volumeMin} L</b>. A caixa é dimensionada para a carga total.`});
        
        // Dimensionamento do Tubo de Queda (com base na carga dividida)
        const uhcTotalGordura = cozinhas * (APARELHOS_SANITARIOS_UHC["Pia de Cozinha"] || 2);
        const uhcPorTubo = uhcTotalGordura / (gorduraData.numTubosQuedaGordura || 1);
        const vazaoPorTubo = 0.3 * Math.sqrt(uhcPorTubo);
        diametroTuboGordura = Math.max(75, getDiametroEsgoto(vazaoPorTubo).diametro);
        module.calculationSteps.push({ description: "Dimensionamento do Tubo de Queda de Gordura", detail: `UHC total de gordura: ${uhcTotalGordura}.<br>UHC por tubo de queda: ${uhcPorTubo.toFixed(2)}.<br>Vazão por tubo: ${vazaoPorTubo.toFixed(2)} L/s.<br>Adota-se DN <b>${diametroTuboGordura}mm</b> (mínimo 75mm).`});

    } else { 
        // Lógica para Comercial/Industrial
        const N = gorduraData.numeroRefeicoes;
        volumeMin = 2 * N + 20;
        tipoCaixa = "Especial (CE)";
        module.results.push({ label: "Nº de Refeições/dia (N)", value: N, unit: "" }, { label: "Tipo de Caixa de Gordura", value: tipoCaixa, unit: "" }, { label: "Volume Útil Calculado", value: volumeMin, unit: "L" });
        module.calculationSteps.push({ description: "Dimensionamento Não Residencial (NBR 8160)", detail: `Fórmula: V = 2 × N + 20<br>Substituição: V = 2 × ${N} + 20 = <b>${volumeMin.toLocaleString("pt-BR")} L</b>` });
        
        // Para cozinhas não residenciais, o diâmetro mínimo é geralmente maior e não se baseia em UHC.
        diametroTuboGordura = 100;
        module.calculationSteps.push({ description: "Dimensionamento do Tubo de Queda de Gordura", detail: `Para a caixa de gordura tipo <b>${tipoCaixa}</b> (uso não residencial), o diâmetro mínimo recomendado para o tubo de queda é de <b>DN ${diametroTuboGordura}mm</b>, conforme NBR 8160.`});
    }

    module.results.push({ label: `Diâmetro Tubo Queda Gordura (${gorduraData.numTubosQuedaGordura} un.)`, value: diametroTuboGordura, unit: "mm" });
    return module;
};


const calculatePluvial = (module: Module, state: ProjectState): Module => {
    const { areasPluviais, drenagem } = state;
    const getDiametroPluvial = (vazao: number) => { if (vazao <= 2.22) return 75; if (vazao <= 6.84) return 100; if (vazao <= 12.5) return 125; if (vazao <= 21) return 150; return 200; };
    let areaTotal = 0; let vazaoTotal = 0;

    areasPluviais.forEach((area, index) => {
        areaTotal += area.area;
        const vazaoArea = (drenagem.intensidade * area.area) / 3600;
        vazaoTotal += vazaoArea;
        const vazaoPorTubo = area.tubosQueda > 0 ? vazaoArea / area.tubosQueda : 0;
        const diametro = getDiametroPluvial(vazaoPorTubo);
        module.results.push({ label: `Área ${index + 1} - Condutor`, value: `${diametro} mm`, unit: `(${area.tubosQueda} un.)` });
        module.calculationSteps.push({ description: `Cálculo da Área ${index + 1} (NBR 10844)`, detail: `Fórmula: Q = (I×A)/3600<br>Substituição: Q = (${drenagem.intensidade}×${area.area})/3600 = <b>${vazaoArea.toFixed(2)} L/s</b>.<br>Vazão por condutor: ${vazaoPorTubo.toFixed(2)} L/s.<br>Diâmetro Adotado: <b>${diametro} mm</b>` });
        
    });
    
    let areaSecao = 0, perimetroMolhado = 0;
    switch(drenagem.tipoCalha) {
        case 'semicircular': const r = drenagem.diametroCalha / 2; areaSecao = (Math.PI * r * r) / 2; perimetroMolhado = Math.PI * r; break;
        case 'trapezoidal': const { larguraCalha: B, baseMenorCalha: b, alturaCalha: h } = drenagem; areaSecao = ((B + b) / 2) * h; const ladoInclinado = Math.sqrt(Math.pow((B - b) / 2, 2) + Math.pow(h, 2)); perimetroMolhado = b + 2 * ladoInclinado; break;
        case 'retangular': default: areaSecao = drenagem.larguraCalha * drenagem.alturaCalha; perimetroMolhado = drenagem.larguraCalha + 2 * drenagem.alturaCalha; break;
    }
    if(areaSecao > 0 && perimetroMolhado > 0) {
        const n = MANNING_COEFFICIENTS[drenagem.materialCalha] || 0.011; const raioHidraulico = areaSecao / perimetroMolhado; const declividade = drenagem.declividadeCalha / 100;
        const capacidadeCalha = (areaSecao * Math.pow(raioHidraulico, 2/3) * Math.pow(declividade, 1/2)) / n;
        const capacidadeCalhaL_s = capacidadeCalha * 1000;
        const statusCalha = capacidadeCalhaL_s > vazaoTotal ? `OK` : `SUBDIMENSIONADA`;
        module.results.push({ label: "Capacidade da Calha", value: capacidadeCalhaL_s.toFixed(2), unit: "L/s" }, { label: "Status da Calha", value: statusCalha, unit: "" });
        module.calculationSteps.push({ description: "Verificação da Calha (Manning)", detail: `Fórmula: Q = (A × R^(2/3) × S^(1/2)) / n<br>Substituição: Q = (${areaSecao.toFixed(3)} × ${raioHidraulico.toFixed(3)}^(2/3) × ${declividade}^(1/2)) / ${n} = <b>${capacidadeCalhaL_s.toFixed(2)} L/s</b>` });
    }
    
    drenagem.coletores.forEach(coletor => {
        coletor.vazao = (drenagem.intensidade * coletor.areaServida) / 3600; // L/s
        const Q = coletor.vazao / 1000; // m³/s
        const D = coletor.diametro / 1000; // m
        const S = coletor.declividade / 100;
        const n_manning = MANNING_COEFFICIENTS['pvc'];

        // Iterative solver for water depth (y)
        let y = D / 2; // Initial guess
        for (let i = 0; i < 10; i++) { // 10 iterations are enough
            const theta = 2 * Math.acos(1 - 2 * y / D);
            const A = (D*D/8) * (theta - Math.sin(theta));
            const P = D * theta / 2;
            const Rh = A / P;
            const Q_calc = (1/n_manning) * A * Math.pow(Rh, 2/3) * Math.pow(S, 1/2);
            y = y * Math.pow(Q / Q_calc, 0.4); // Adjust guess
        }
        
        const A_final = (D*D/8) * (2 * Math.acos(1 - 2*y/D) - Math.sin(2 * Math.acos(1 - 2*y/D)));
        const P_final = D * Math.acos(1 - 2*y/D);
        const Rh_final = A_final / P_final;

        coletor.laminaAgua = y * 1000; // mm
        coletor.velocidade = Q / A_final; // m/s
        coletor.tensaoArrasto = 1000 * 9.81 * Rh_final * S; // Pa
        coletor.autolimpante = coletor.tensaoArrasto >= 1.0;
        
        module.results.push({ label: `Coletor '${coletor.descricao}' - Lâmina`, value: coletor.laminaAgua.toFixed(1), unit: `mm (${(coletor.laminaAgua/coletor.diametro*100).toFixed(0)}%)` });
        module.results.push({ label: `Coletor '${coletor.descricao}' - Velocidade`, value: coletor.velocidade.toFixed(2), unit: "m/s" });
        module.results.push({ label: `Coletor '${coletor.descricao}' - Autolimpeza`, value: coletor.autolimpante ? 'OK' : 'Verificar', unit: `(${coletor.tensaoArrasto.toFixed(2)} Pa)` });
    });
    
    if(drenagem.tanqueRetencao.habilitado) {
        const V = (drenagem.intensidade * drenagem.tanqueRetencao.tempoChuva * areaTotal) / 60000;
        module.results.push({ label: "Volume Tanque de Retenção", value: V.toFixed(2), unit: "m³" });
        module.calculationSteps.push({ description: "Dimensionamento do Tanque de Retenção", detail: `Fórmula: V = (I×T×A)/60000<br>Substituição: V = (${drenagem.intensidade}×${drenagem.tanqueRetencao.tempoChuva}×${areaTotal})/60000 = <b>${V.toFixed(2)} m³</b>`});
    }

    return module;
};

const calculateReuso = (module: Module, state: ProjectState, buildingTypeName: string): Module => {
    const { reusoPluvial, projectData, buildingData } = state;
    const populacao = getPopulacao(buildingTypeName, buildingData);
    const consumoTotalAnual = (populacao * projectData.consumoPerCapita) * 365;

    const volumeCaptadoAnual = (reusoPluvial.precipitacaoMedia / 1000) * reusoPluvial.areaCaptacao * reusoPluvial.coeficienteRunoff * (reusoPluvial.eficienciaFiltro / 100);
    const demandaNaoPotavelAnual = reusoPluvial.demandaNaoPotavel * 365;
    const volumeUtilizadoAnual = Math.min(volumeCaptadoAnual * 1000, demandaNaoPotavelAnual); // em Litros

    let volumeReservatorioFinal = 0;
    let periodoArmazenamentoFinal = reusoPluvial.periodoArmazenamento;
    let calculoReservatorioDetail = "";

    if (reusoPluvial.metodoDimensionamentoReservatorio === 'manual' && reusoPluvial.volumeReservatorioAdotado > 0) {
        volumeReservatorioFinal = reusoPluvial.volumeReservatorioAdotado;
        if(reusoPluvial.demandaNaoPotavel > 0) {
            periodoArmazenamentoFinal = volumeReservatorioFinal / reusoPluvial.demandaNaoPotavel;
        } else {
            periodoArmazenamentoFinal = 0;
        }
        calculoReservatorioDetail = `Método <b>Manual</b>: Volume Adotado = <b>${volumeReservatorioFinal.toFixed(0)} L</b>.<br>Com uma demanda de ${reusoPluvial.demandaNaoPotavel} L/dia, este volume garante <b>${periodoArmazenamentoFinal.toFixed(1)} dias</b> de autonomia.`;
    } else {
        volumeReservatorioFinal = reusoPluvial.demandaNaoPotavel * reusoPluvial.periodoArmazenamento * (1 / (reusoPluvial.eficienciaReservatorio / 100));
        calculoReservatorioDetail = `Método <b>Automático</b>:<br>Fórmula: V_res = Demanda_diaria × N_dias / E_res<br>Substituição: V_res = ${reusoPluvial.demandaNaoPotavel} × ${reusoPluvial.periodoArmazenamento} / ${reusoPluvial.eficienciaReservatorio/100} = <b>${volumeReservatorioFinal.toFixed(0)} L</b>`;
    }
    
    // Asignar o volume final para o estado para consistência
    reusoPluvial.volumeReservatorio = volumeReservatorioFinal;

    const reducaoConsumo = consumoTotalAnual > 0 ? (volumeUtilizadoAnual / consumoTotalAnual) * 100 : 0;
    const economiaAnual = (volumeUtilizadoAnual / 1000) * reusoPluvial.custoAguaPotavel;

    module.results = [
        { label: "Volume de Chuva Captado", value: (volumeCaptadoAnual).toFixed(2), unit: "m³/ano" },
        { label: "Demanda Não Potável", value: (demandaNaoPotavelAnual / 1000).toFixed(2), unit: "m³/ano" },
        { label: "Volume de Reservatório", value: volumeReservatorioFinal.toFixed(0), unit: "L" },
        { label: "Período de Armazenamento", value: periodoArmazenamentoFinal.toFixed(1), unit: "dias" },
        { label: "Redução no Consumo Potável", value: reducaoConsumo.toFixed(2), unit: "%" },
        { label: "Economia Anual Estimada", value: `R$ ${economiaAnual.toFixed(2)}`, unit: "" },
    ];
    
    module.calculationSteps = [
        { description: "Cálculo do Volume Captável (NBR 15527)", detail: `Fórmula: V = P × A × C × E_filtro<br>Substituição: V = (${reusoPluvial.precipitacaoMedia}/1000) × ${reusoPluvial.areaCaptacao} × ${reusoPluvial.coeficienteRunoff} × ${reusoPluvial.eficienciaFiltro/100} = <b>${volumeCaptadoAnual.toFixed(2)} m³/ano</b>` },
        { description: "Cálculo do Volume do Reservatório", detail: calculoReservatorioDetail },
        { description: "Estimativa de Economia", detail: `Volume Anual Utilizado: ${ (volumeUtilizadoAnual/1000).toFixed(2) } m³<br>Redução Consumo: <b>${reducaoConsumo.toFixed(2)}%</b><br>Economia Financeira: <b>R$ ${economiaAnual.toFixed(2)}/ano</b>` },
    ];

    return module;
};
const calculateGas = (module: Module, state: ProjectState): Module => { 
    const { gas } = state;
    let abrigo;

    if (gas.tipo === 'gn') {
        abrigo = DIMENSOES_ABRIGO_GAS['central_gn'];
    } else { // GLP
        const tipoCilindro = gas.tipoCilindro || 'P13';
        const numCilindros = gas.numCilindros || 1;
        const key = `${numCilindros}x${tipoCilindro}`;
        abrigo = DIMENSOES_ABRIGO_GAS[key] || DIMENSOES_ABRIGO_GAS['1xP13'];
    }

    gas.abrigo = abrigo;
    module.results.push({ label: "Dimensões Abrigo Gás", value: abrigo.dimensoes, unit: "" });
    module.results.push({ label: "Ventilação Abrigo Gás", value: abrigo.ventilacao, unit: "" });
    module.calculationSteps.push({ description: "Dimensionamento do Abrigo de Gás (NBR 15526)", detail: `Para a configuração de ${gas.numCilindros || 1} cilindro(s) ${gas.tipoCilindro || ''}, o abrigo deve ter as dimensões mínimas de <b>${abrigo.dimensoes}</b> e ventilação de <b>${abrigo.ventilacao}</b>.`});
    
    const d_glp = 1.55; const d_gn = 0.6;
    const pci_glp_kw_kg = 12.8; const pci_gn_kw_m3 = 9.4;
    const d = gas.tipo === 'glp' ? d_glp : d_gn;
    const P_saida_mbar = gas.pressaoSaida * 1000;

    const calculatedCaminhosGas = gas.caminhos.map(caminho => {
        let potenciaAcumuladaTotal = 0;
        caminho.trechos.forEach(t => potenciaAcumuladaTotal += t.potencia);

        let perdaAcumulada = 0;
        let potenciaAcumulada = 0;

        const trechosComCalculo = [...caminho.trechos].reverse().map(trecho => {
            potenciaAcumulada += trecho.potencia;
            const Q_kw = potenciaAcumulada;
            const Q_m3h = gas.tipo === 'glp' ? (Q_kw / pci_glp_kw_kg) / 0.47 : Q_kw / pci_gn_kw_m3;
            
            let DN_mm = 15;
            let PD_mbar = Infinity;
            const diâmetros = [15, 22, 28, 35, 42]; // Cobre
            
            for(let dn of diâmetros) {
                const D_interno_mm = dn * 0.9;
                const PD_trecho_bar = (2.316e-7 * Math.pow(Q_m3h, 1.82) * trecho.comprimento * d) / Math.pow(D_interno_mm, 4.82);
                PD_mbar = PD_trecho_bar * 1000;
                DN_mm = dn;
                if ((PD_mbar / P_saida_mbar) < 0.1) { // Basic check
                    break;
                }
            }
            perdaAcumulada += PD_mbar;
            return { ...trecho, potenciaAcumulada: Q_kw, vazao: Q_m3h, diametro: DN_mm, perdaCarga: PD_mbar, perdaCargaAcumulada: perdaAcumulada };
        }).reverse();
        
        return { ...caminho, trechos: trechosComCalculo, perdaTotal: perdaAcumulada };
    });
    
    module.caminhosGas = calculatedCaminhosGas;
    
    return module; 
};