import { ProjectState, Module, Trecho, Caminho, TrechoGas, AguaFria, RamalVentilacao, CaminhoGas, Bomba, Lixeira } from '../types';
import { CONEXOES_AGUA_DB, APARELHOS_SANITARIOS_UHC, APARELHOS_PRESSAO_MINIMA, MANNING_COEFFICIENTS, AGUA_PROPRIEDADES, ELASTICIDADE_MODULOS, VENTILACAO_DIAMETROS, buildingTypes, CONDUTIVIDADE_TERMICA, TANQUES_COMERCIAIS, HIDROMETROS_DB, BOMBAS_ESGOTO_DB, DIMENSOES_ABRIGO_GAS, APARELHOS_DESCARGA_DB, tubulacoesDB, APARELHOS_PESOS } from '../constants';
import { getDiametroInterno } from './utils';

const getPopulacao = (buildingType: string, buildingData: ProjectState['buildingData']): number => {
  if (buildingType === "Unifamiliar") {
    return buildingData.pessoas;
  }
  if (buildingType === "Multifamiliar") {
    const totalApts = buildingData.floorGroups.reduce((acc, group) => acc + ((Number(group.numFloors) || 0) * (Number(group.aptsPerFloor) || 0)), 0);
    return totalApts * buildingData.pessoasPorApt;
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
        case 'Lixeira':
            return calculateLixeira(newModule, state, buildingTypeName);
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
        consumoStepDetail = `
            <p>O consumo diário foi calculado com base na área da edificação, conforme NBR 5626 para fins não residenciais.</p>
            <p><strong>Fórmula:</strong> C = A × C<sub>A</sub></p>
            <p><strong>Onde:</strong><br/>- C = Consumo diário (L/dia)<br/>- A = Área total (m²)<br/>- C<sub>A</sub> = Consumo por área (L/m².dia)</p>
            <p><strong>Substituição:</strong> C = ${buildingData.areaTotal.toFixed(2)} m² × ${projectData.consumoPorArea} L/m².dia</p>
            <p><strong>Resultado:</strong> Consumo Diário = <b>${consumoDiario.toFixed(0)} L/dia</b></p>
        `;
    } else {
        consumoDiario = populacao * projectData.consumoPerCapita;
        consumoStepDetail = `
            <p>O consumo diário foi calculado com base na população estimada para a edificação, conforme NBR 5626 para fins residenciais.</p>
            <p><strong>Fórmula:</strong> C = P × q</p>
            <p><strong>Onde:</strong><br/>- C = Consumo diário (L/dia)<br/>- P = População (pessoas)<br/>- q = Consumo per capita (L/pessoa.dia)</p>
            <p><strong>Substituição:</strong> C = ${populacao} pessoas × ${projectData.consumoPerCapita} L/pessoa.dia</p>
            <p><strong>Resultado:</strong> Consumo Diário = <b>${consumoDiario.toFixed(0)} L/dia</b></p>
        `;
    }

    const reservaConsumo = consumoDiario * projectData.diasReserva;
    const reservaIncendio = reservatorios.reservaIncendio || 0;
    let volumeTotalReserva = 0;
    let reservaSuperiorTotal = 0;
    let reservaInferiorTotal = 0;
    let detailDistrib = "";
    let warning = "";

    if (reservatorios.integracaoIncendio === 'integrada') {
        volumeTotalReserva = reservaConsumo;
        if (reservaConsumo < reservaIncendio) {
            warning = `<br><b style='color: #ef4444;'>Atenção:</b> O volume de reserva de consumo (${reservaConsumo.toFixed(0)} L) é menor que a reserva de incêndio (${reservaIncendio} L). Recomenda-se aumentar os dias de reserva.`;
        }
        reservaSuperiorTotal = volumeTotalReserva * (reservatorios.percentualSuperior / 100);
        reservaInferiorTotal = volumeTotalReserva - reservaSuperiorTotal;

        detailDistrib = `Modo: <b>Integrada</b>. Volume Total (baseado no consumo): <b>${volumeTotalReserva.toFixed(0)} L</b><br>
        Distribuição: ${reservatorios.percentualSuperior}% Superior (${reservaSuperiorTotal.toFixed(0)} L) / ${100 - reservatorios.percentualSuperior}% Inferior (${reservaInferiorTotal.toFixed(0)} L).<br>
        <i>(RTI de ${reservaIncendio} L deve ser garantida dentro deste volume).</i>${warning}`;

    } else { // 'somar'
        volumeTotalReserva = reservaConsumo + reservaIncendio;
        const reservaIncendioSuperior = reservaIncendio * (reservatorios.percentualIncendioSuperior / 100);
        const reservaIncendioInferior = reservaIncendio - reservaIncendioSuperior;
        const reservaConsumoSuperior = reservaConsumo * (reservatorios.percentualSuperior / 100);
        const reservaConsumoInferior = reservaConsumo - reservaConsumoSuperior;
        reservaSuperiorTotal = reservaConsumoSuperior + reservaIncendioSuperior;
        reservaInferiorTotal = reservaConsumoInferior + reservaIncendioInferior;
        
        detailDistrib = `Modo: <b>Somar</b>. Volume Total (Consumo + Incêndio): <b>${volumeTotalReserva.toFixed(0)} L</b><br>
        Distribuição do Consumo: ${reservatorios.percentualSuperior}% Superior (${reservaConsumoSuperior.toFixed(0)} L) e ${100 - reservatorios.percentualSuperior}% Inferior (${reservaConsumoInferior.toFixed(0)} L).<br>
        Volume Superior Total: ${reservaConsumoSuperior.toFixed(0)} L (consumo) + ${reservaIncendioSuperior.toFixed(0)} L (RTI) = <b>${reservaSuperiorTotal.toFixed(0)} L</b><br>
        Volume Inferior Total: ${reservaConsumoInferior.toFixed(0)} L (consumo) + ${reservaIncendioInferior.toFixed(0)} L (RTI) = <b>${reservaInferiorTotal.toFixed(0)} L</b>`;
    }

    const capacidadeSuperiorPorRes = reservaSuperiorTotal > 0 ? reservaSuperiorTotal / reservatorios.numSuperiores : 0;
    const capacidadeInferiorPorRes = reservatorios.numInferiores > 0 && reservaInferiorTotal > 0 ? reservaInferiorTotal / reservatorios.numInferiores : 0;
    
    const findCommercialTank = (volume: number) => TANQUES_COMERCIAIS.find(v => v >= volume) || TANQUES_COMERCIAIS[TANQUES_COMERCIAIS.length - 1];

    if(!state.reservatorios.volumeSuperiorComercial || state.reservatorios.volumeSuperiorComercial < capacidadeSuperiorPorRes) {
        state.reservatorios.volumeSuperiorComercial = findCommercialTank(capacidadeSuperiorPorRes);
    }
    if(reservatorios.numInferiores > 0 && (!state.reservatorios.volumeInferiorComercial || state.reservatorios.volumeInferiorComercial < capacidadeInferiorPorRes)) {
        state.reservatorios.volumeInferiorComercial = findCommercialTank(capacidadeInferiorPorRes);
    }

    module.results.push(
        { label: "População de Cálculo", value: populacao, unit: "pessoas" },
        { label: "Consumo Diário Total", value: consumoDiario, unit: "L" },
        { label: `Reserva Total`, value: volumeTotalReserva, unit: "L" },
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
    
    const finalDetailDistrib = `${detailDistrib}<br><br>
<b>Volume Superior Adotado:</b> ${reservatorios.numSuperiores} x ${state.reservatorios.volumeSuperiorComercial || 0} L = <b>${reservatorios.numSuperiores * (state.reservatorios.volumeSuperiorComercial || 0)} L</b><br>
${reservatorios.numInferiores > 0 ? `<b>Volume Inferior Adotado:</b> ${reservatorios.numInferiores} x ${state.reservatorios.volumeInferiorComercial || 0} L = <b>${reservatorios.numInferiores * (state.reservatorios.volumeInferiorComercial || 0)} L</b>` : ''}`;

    const reservaFormula = reservatorios.integracaoIncendio === 'somar' ? 'V<sub>T</sub> = (C × D) + RTI' : 'V<sub>T</sub> = C × D';
    const reservaSubst = `(${consumoDiario.toFixed(0)} L/dia × ${projectData.diasReserva}) ${reservatorios.integracaoIncendio === 'somar' ? `+ ${reservaIncendio} L` : ''} = <b>${reservatorios.integracaoIncendio === 'somar' ? (reservaConsumo + reservaIncendio).toFixed(0) : reservaConsumo.toFixed(0)} L</b>`
    module.calculationSteps.push(
        { description: "Cálculo da Demanda de Água Diária", detail: consumoStepDetail},
        { description: "Cálculo do Volume de Reserva Total (NBR 5626)", detail: `<p>A reserva total deve garantir o abastecimento por um período determinado, além da reserva de incêndio, se aplicável.</p><p><strong>Fórmula:</strong> ${reservaFormula}</p><p><strong>Onde:</strong><br/>- V<sub>T</sub> = Volume Total (L)<br/>- C = Consumo diário (L/dia)<br/>- D = Dias de reserva<br/>- RTI = Reserva Técnica de Incêndio (L)</p><p><strong>Substituição:</strong> ${reservaSubst}</p>`},
        { description: "Distribuição do Volume de Reserva", detail: `<p>O volume total é distribuído entre os reservatórios superior e inferior conforme percentual definido.</p><p>${finalDetailDistrib}</p>` },
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
            { description: `Cálculo da Vazão de Recalque (${horasFuncionamento}h)`, detail: `<p>A vazão é calculada para recalcar o volume diário no tempo de funcionamento especificado.</p><p><strong>Fórmula:</strong> Q = V / t</p><p><strong>Onde:</strong><br/>- Q = Vazão (L/s)<br/>- V = Volume Diário (L)<br/>- t = Tempo (s)</p><p><strong>Substituição:</strong> Q = ${consumoDiario.toFixed(0)} L / (${horasFuncionamento}h × 3600s/h) = <b>${vazaoRecalqueL_s.toFixed(2)} L/s</b></p>` },
            { description: "Cálculo da Perda de Carga no Recalque (Hazen-Williams)", detail: `<p>A perda de carga é calculada considerando o atrito na tubulação (distribuída) e a passagem por conexões (localizada).</p><p><strong>Fórmula:</strong> PD = J × L<sub>virtual</sub></p><p><strong>Onde:</strong><br/>- PD = Perda de Carga (mca)<br/>- J = Perda de Carga Unitária (m/m)<br/>- L<sub>virtual</sub> = Comprimento Virtual (m)</p><p><strong>Detalhes:</strong><br/>Comprimento Real: ${bombeamento.comprimentoReal} m<br>Comprimento Equivalente Peças: ${comprimentoEquivalente.toFixed(2)} m <ul>${pecasDetalhamento.join("")}</ul><b>Comprimento Total Virtual: ${comprimentoVirtual.toFixed(2)} m</b><br>Perda de Carga Unitária (J) = ${J_recalque.toFixed(5)} m/m <br><b>Perda de Carga Total (PD) = ${perdaCargaRecalque.toFixed(2)} mca</b></p>` },
            { description: "Cálculo da Altura Manométrica Total (AMT)", detail: `<p>A AMT representa a energia total que a bomba deve fornecer à água.</p><p><strong>Fórmula:</strong> AMT = H<sub>geo</sub> + PD<sub>recalque</sub></p><p><strong>Onde:</strong><br/>- AMT = Altura Manométrica Total (mca)<br/>- H<sub>geo</sub> = Altura Geométrica (m)<br/>- PD<sub>recalque</sub> = Perda de Carga (mca)</p><p><strong>Substituição:</strong> AMT = ${alturaGeometrica.toFixed(2)} + ${perdaCargaRecalque.toFixed(2)} = <b>${amt.toFixed(2)} mca</b></p>`},
            { description: "Cálculo da Potência do Motor (CV)", detail: `<p>Cálculo da potência necessária para o motor da bomba.</p><p><strong>Fórmula:</strong> Pot(CV) = (Q × AMT) / (75 × η)</p><p><strong>Onde:</strong><br/>- Pot = Potência (CV)<br/>- Q = Vazão (L/s)<br/>- AMT = Altura Manométrica (mca)<br/>- η = Rendimento do conjunto (%)</p><p><strong>Substituição:</strong> Pot = (${vazaoRecalqueL_s.toFixed(2)} L/s × ${amt.toFixed(2)} mca) / (75 × ${bombeamento.rendimento / 100}) = <b>${potenciaCV.toFixed(2)} CV</b></p>` },
            { description: "Verificação de Cavitação (NPSH)", detail: `<p>Verifica se a pressão na sucção da bomba está acima da pressão de vapor da água, evitando cavitação.</p><p><strong>Fórmula:</strong> NPSH<sub>disp</sub> = P<sub>atm</sub> - H<sub>sucção</sub> - P<sub>vapor</sub> - PD<sub>sucção</sub></p><p><strong>Onde:</strong><br/>- NPSH<sub>disp</sub> = Net Positive Suction Head Disponível (mca)<br/>- P<sub>atm</sub> = Pressão atmosférica local (mca)<br/>- H<sub>sucção</sub> = Altura de sucção (m)<br/>- P<sub>vapor</sub> = Pressão de vapor da água (mca)<br/>- PD<sub>sucção</sub> = Perda de carga na sucção (mca)</p><p><strong>Substituição:</strong> NPSH<sub>disp</sub> = ${pAtm} - ${bombeamento.alturaSuccao} - ${pVapor} - ${pdSuccao.toFixed(2)} = <b>${npshDisponivel.toFixed(2)} mca</b><br><i>*Verificar se NPSHdisp > NPSHreq (do fabricante).</i></p>` }
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
            detail: `<p>Análise da sobrepressão causada pelo fechamento de válvulas ou parada da bomba.</p><p><strong>Fórmula (Joukowsky/Michaud):</strong> ΔH = f(a, L, V, t)</p><p><strong>Onde:</strong><br/>- ΔH = Sobrepressão (mca)<br/>- a = Celeridade da onda (m/s)<br/>- L = Comprimento da tubulação (m)<br/>- V = Velocidade da água (m/s)<br/>- t = Tempo de fechamento (s)</p><p><strong>Resultados:</strong><br/>Celeridade da onda (a): ${celeridade.toFixed(2)} m/s<br>Tempo Crítico (2L/a): ${tempo_critico.toFixed(2)} s<br><b>Sobrepressão (ΔH): ${sobrepressao_mca.toFixed(2)} mca</b><br><b>Pressão Máxima (H_max): ${pressao_maxima.toFixed(2)} mca</b></p>`
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

const calculateGordura = (module: Module, state: ProjectState, buildingTypeName: string): Module => {
    const { gorduraData } = state;
    let volumeCalculado = 0;
    let calculoDetail = "";
    let perApartmentNote = "";

    if (buildingTypeName === "Multifamiliar" && gorduraData.tipoInstalacao === 'individual') {
        volumeCalculado = 18; // Caixa Simples por apartamento
        calculoDetail = `<p><strong>Critério (NBR 8160):</strong> Para cozinhas residenciais em unidades autônomas, adota-se Caixa de Gordura Simples (CS).</p>
                         <p><strong>Volume Mínimo:</strong> 18 L</p>
                         <p><strong>Resultado:</strong> Adotado <strong>1 Caixa de 18L por apartamento</strong>.</p>`;
        perApartmentNote = " (por apartamento)";
    } else if (["Unifamiliar", "Multifamiliar"].includes(buildingTypeName)) {
        const numCozinhas = gorduraData.numeroCozinhas || 1;
        let boxType = "", formula = "", subst = "";
        if (numCozinhas === 1) {
            volumeCalculado = 18;
            boxType = "Simples (CS)";
            formula = "Volume Mínimo (Tabela 3)";
            subst = `Para 1 cozinha, volume tabelado = <b>18 L</b>`;
        } else if (numCozinhas === 2) {
            volumeCalculado = 31;
            boxType = "Dupla (CD)";
            formula = "Volume Mínimo (Tabela 3)";
            subst = `Para 2 cozinhas, volume tabelado = <b>31 L</b>`;
        } else {
             volumeCalculado = 30 + 20 * (numCozinhas - 2);
             boxType = "Especial (CE)";
             formula = "V = 30 + 20 × (N - 2)";
             subst = `V = 30 + 20 × (${numCozinhas} - 2) = <b>${volumeCalculado} L</b>`;
        }
        calculoDetail = `<p><strong>Critério (NBR 8160):</strong> Para ${numCozinhas} cozinha(s), adota-se Caixa de Gordura ${boxType}.</p>
                         <p><strong>Fórmula:</strong> ${formula}</p>
                         <p><strong>Substituição:</strong> ${subst}</p>
                         <p><strong>Resultado:</strong> Volume calculado de <strong>${volumeCalculado} L</strong>.</p>`;
    } else { // Comercial / Industrial
        const numRefeicoes = gorduraData.numeroRefeicoes || 0;
        volumeCalculado = 2 * numRefeicoes;
        calculoDetail = `<p><strong>Critério (NBR 8160):</strong> Para cozinhas não residenciais, o volume é calculado com base no número de refeições diárias.</p>
                         <p><strong>Fórmula:</strong> V = 2 × N</p>
                         <p><strong>Onde:</strong><br/>- V = Volume (L)<br/>- N = Número de refeições</p>
                         <p><strong>Substituição:</strong> V = 2 × ${numRefeicoes} = <b>${volumeCalculado} L</b></p>
                         <p><strong>Resultado:</strong> Volume calculado de <strong>${volumeCalculado} L</strong>.</p>`;
    }

    // Dimensionamento do tubo de queda
    const uhcTotalGordura = (gorduraData.numeroCozinhas || 1) * 2; // UHC=2 para pia de cozinha
    const uhcPorTubo = gorduraData.numTubosQuedaGordura > 0 ? uhcTotalGordura / gorduraData.numTubosQuedaGordura : uhcTotalGordura;

    const getDiametroTuboQuedaGordura = (uhc: number) => {
        if (uhc <= 10) return 75;
        if (uhc <= 160) return 100;
        return 150;
    };
    const diametroTuboQuedaGordura = getDiametroTuboQuedaGordura(uhcPorTubo);

    module.results.push(
        { label: `Volume da Caixa de Gordura${perApartmentNote}`, value: volumeCalculado, unit: "L" },
        { label: "Nº Tubos de Queda Gordura", value: gorduraData.numTubosQuedaGordura, unit: ""},
        { label: "DN Tubo Queda Gordura", value: diametroTuboQuedaGordura, unit: "mm" }
    );

    module.calculationSteps.push(
        { description: "Dimensionamento da Caixa de Gordura (NBR 8160)", detail: calculoDetail },
        { description: "Dimensionamento do Tubo de Queda de Gordura", detail: `UHC por tubo de queda: ${uhcPorTubo.toFixed(2)}.<br>Conforme NBR 8160 (Tabela 5), para esta UHC, o diâmetro nominal mínimo do tubo de queda que recebe efluentes de pias de cozinha é de <b>${diametroTuboQuedaGordura} mm</b>.` }
    );

    return module;
};

const calculatePluvial = (module: Module, state: ProjectState): Module => {
    const { drenagem, areasPluviais } = state;
    const I = drenagem.intensidade;

    const areaTotalCobertura = areasPluviais.reduce((acc, a) => acc + a.area, 0);
    const vazaoTotal = (I * areaTotalCobertura) / 60000; // Q em L/s

    module.results.push(
        { label: "Área Total de Cobertura", value: areaTotalCobertura, unit: "m²" },
        { label: "Vazão Total de Projeto", value: vazaoTotal.toFixed(2), unit: "L/s" },
    );
    module.calculationSteps.push(
        { 
            description: "Cálculo da Vazão de Projeto (NBR 10844)", 
            detail: `<p>A vazão de projeto é a máxima vazão de chuva que o sistema deve ser capaz de escoar.</p>
                     <p><strong>Fórmula:</strong> Q = (I × A) / 60000</p>
                     <p><strong>Onde:</strong><br/>- Q = Vazão (L/s)<br/>- I = Intensidade pluviométrica (mm/h)<br/>- A = Área de contribuição (m²)</p>
                     <p><strong>Substituição:</strong> Q = (${I} mm/h × ${areaTotalCobertura.toFixed(2)} m²) / 60000 = <b>${vazaoTotal.toFixed(2)} L/s</b></p>`
        }
    );

    areasPluviais.forEach((area, index) => {
        const Q_area = (I * area.area) / 60000;
        const Q_por_tubo = area.tubosQueda > 0 ? Q_area / area.tubosQueda : 0;
        
        const getDiametroCondutorVertical = (q: number) => {
            if (q <= 1.4) return 75;
            if (q <= 4.5) return 100;
            if (q <= 12) return 125;
            if (q <= 20) return 150;
            return 200;
        };
        const diametro = getDiametroCondutorVertical(Q_por_tubo);
        module.results.push(
            { label: `DN Condutor Vertical (Área ${index+1})`, value: diametro, unit: "mm" }
        );
        module.calculationSteps.push(
             { 
                description: `Dimensionamento Condutor Vertical (Área ${index+1})`, 
                detail: `<p><strong>Critério:</strong> O diâmetro do condutor vertical é selecionado da Tabela 1 da NBR 10844 com base na vazão por tubo.</p>
                         <p><strong>Dados:</strong><br/>- Vazão na área: ${Q_area.toFixed(2)} L/s<br/>- Vazão por condutor (${area.tubosQueda} un.): ${Q_por_tubo.toFixed(2)} L/s</p>
                         <p><strong>Resultado:</strong> Diâmetro mínimo adotado = <b>${diametro} mm</b>.</p>`
             }
        );
    });

    const n_manning = MANNING_COEFFICIENTS[drenagem.materialCalha] || 0.011;
    const S = drenagem.declividadeCalha / 100;
    
    let A_molhada=0, P_molhado=0, RH=0, V=0, Q_calha_ls=0;
    let calhaDetail = "";

    if (drenagem.tipoCalha === 'retangular') {
        A_molhada = drenagem.larguraCalha * drenagem.alturaCalha;
        P_molhado = drenagem.larguraCalha + 2 * drenagem.alturaCalha;
    } else if (drenagem.tipoCalha === 'semicircular') {
        const raio = drenagem.diametroCalha / 2;
        A_molhada = (Math.PI * Math.pow(raio, 2)) / 2;
        P_molhado = Math.PI * raio;
    } else { // trapezoidal
        const z = 1; 
        A_molhada = (drenagem.larguraCalha + drenagem.baseMenorCalha) / 2 * drenagem.alturaCalha;
        P_molhado = drenagem.baseMenorCalha + 2 * drenagem.alturaCalha * Math.sqrt(1 + z*z);
    }
    
    if (P_molhado > 0) {
        RH = A_molhada / P_molhado;
        V = (1/n_manning) * Math.pow(RH, 2/3) * Math.pow(S, 1/2);
        Q_calha_ls = V * A_molhada * 1000;
    }

    module.results.push(
        { label: "Vazão Máxima da Calha", value: Q_calha_ls.toFixed(2), unit: "L/s" }
    );
     module.calculationSteps.push(
        { 
            description: `Dimensionamento da Calha (${drenagem.tipoCalha})`, 
            detail: `<p>A capacidade de escoamento da calha é calculada pela Equação de Manning.</p>
                     <p><strong>Fórmula:</strong> Q = A × (1/n) × R<sub>h</sub><sup>2/3</sup> × S<sup>1/2</sup></p>
                     <p><strong>Onde:</strong><br/>- Q = Vazão (m³/s)<br/>- A = Área molhada (m²)<br/>- n = Coef. de Manning<br/>- R<sub>h</sub> = Raio hidráulico (m)<br/>- S = Declividade (m/m)</p>
                     <p><strong>Cálculo:</strong><br/>- Área Molhada: ${A_molhada.toFixed(4)} m²<br/>- Perímetro Molhado: ${P_molhado.toFixed(4)} m<br/>- Velocidade: ${V.toFixed(2)} m/s</p>
                     <p><strong>Resultado:</strong> Capacidade de Vazão = <b>${Q_calha_ls.toFixed(2)} L/s</b></p>`
        }
    );
    
    drenagem.coletores.forEach((coletor) => {
        const vazao = (I * coletor.areaServida) / 60000; // L/s
        coletor.vazao = vazao;
        const D = coletor.diametro / 1000;
        if (D > 0) {
            const S_col = coletor.declividade / 100;
            const A_col = Math.PI * D*D / 4;
            const RH_col = D/4;
            const V_col = (1/0.009) * Math.pow(RH_col, 2/3) * Math.pow(S_col, 1/2);
            coletor.velocidade = vazao > 0 ? (vazao/1000) / A_col : 0;
            coletor.autolimpante = coletor.velocidade >= 0.6;
        }
    });

    return module;
};

const calculateReuso = (module: Module, state: ProjectState, buildingTypeName: string): Module => {
    const { reusoPluvial, buildingData } = state;

    const volCaptadoAnual = reusoPluvial.precipitacaoMedia / 1000 * reusoPluvial.areaCaptacao * reusoPluvial.coeficienteRunoff * (reusoPluvial.eficienciaFiltro / 100); // m³
    
    let volReservatorio = 0;
    if (reusoPluvial.metodoDimensionamentoReservatorio === 'automatico') {
        volReservatorio = reusoPluvial.demandaNaoPotavel * reusoPluvial.periodoArmazenamento;
    } else {
        volReservatorio = reusoPluvial.volumeReservatorioAdotado;
    }
    
    const volUtilizadoAnual = Math.min(reusoPluvial.demandaNaoPotavel * 365, volCaptadoAnual * 1000); // L
    const economiaAnual = (volUtilizadoAnual / 1000) * reusoPluvial.custoAguaPotavel;

    const populacao = getPopulacao(buildingTypeName, buildingData);
    const consumoTotalPotavelDiario = populacao * state.projectData.consumoPerCapita;
    const reducaoConsumo = (consumoTotalPotavelDiario + reusoPluvial.demandaNaoPotavel) > 0 ? (reusoPluvial.demandaNaoPotavel / (consumoTotalPotavelDiario + reusoPluvial.demandaNaoPotavel)) * 100 : 0;
    
    // Financial Analysis - Payback
    const CUSTO_SISTEMA_REUSO_POR_LITRO = 2.0; // R$/L - Custo estimado para reservatório, bomba, filtro, etc.
    const custoInvestimento = volReservatorio * CUSTO_SISTEMA_REUSO_POR_LITRO;
    const custoManutencaoAnual = reusoPluvial.manutencaoAnual;
    const lucroLiquidoAnual = economiaAnual - custoManutencaoAnual;
    const payback = (lucroLiquidoAnual > 0) ? custoInvestimento / lucroLiquidoAnual : Infinity;

    // Update state directly (side effect, following existing pattern)
    state.reusoPluvial.volumeCaptado = volCaptadoAnual * 1000;
    state.reusoPluvial.volumeReservatorio = volReservatorio;
    state.reusoPluvial.economiaAnual = economiaAnual;
    state.reusoPluvial.payback = payback;
    state.reusoPluvial.reducaoConsumo = reducaoConsumo;

    module.results.push(
        { label: "Volume Anual Captado", value: (volCaptadoAnual * 1000).toFixed(0), unit: "L" },
        { label: "Volume de Reservatório", value: volReservatorio, unit: "L" },
        { label: "Economia Anual Estimada", value: economiaAnual.toFixed(2), unit: "R$" },
        { label: "Redução no Consumo de Água", value: reducaoConsumo.toFixed(1), unit: "%" },
        { label: "Payback Simples", value: isFinite(payback) ? payback.toFixed(1) : "Nunca", unit: "anos" }
    );

    module.calculationSteps.push(
        { description: "Potencial de Captação Anual (NBR 15527)", detail: `Fórmula: V = P × A × C × η<br>Substituição: V = ${reusoPluvial.precipitacaoMedia}mm × ${reusoPluvial.areaCaptacao}m² × ${reusoPluvial.coeficienteRunoff} × ${reusoPluvial.eficienciaFiltro/100} = <b>${(volCaptadoAnual*1000).toFixed(0)} L/ano</b>`},
        { description: "Dimensionamento do Reservatório", detail: `Com base na demanda diária (${reusoPluvial.demandaNaoPotavel} L) e período de armazenamento (${reusoPluvial.periodoArmazenamento} dias), o volume adotado é de <b>${volReservatorio} L</b>.`},
        { description: "Análise de Viabilidade Econômica", detail: `Volume anual aproveitado: ${volUtilizadoAnual.toFixed(0)} L.<br>
            Custo da água: R$ ${reusoPluvial.custoAguaPotavel}/m³.<br><b>Economia Anual Bruta: R$ ${economiaAnual.toFixed(2)}</b>.<br>
            Custo de Investimento Estimado: R$ ${custoInvestimento.toFixed(2)}.<br>
            Custo de Manutenção Anual: R$ ${custoManutencaoAnual.toFixed(2)}.<br>
            <b>Payback Simples: ${isFinite(payback) ? payback.toFixed(1) + ' anos' : 'Não se paga'}</b>.`
        }
    );
    
    return module;
};

const calculateGas = (module: Module, state: ProjectState): Module => {
    const { gas } = state;

    const DENSIDADE_RELATIVA = gas.tipo === 'glp' ? 1.55 : 0.6;
    const PODER_CALORIFICO = gas.tipo === 'glp' ? 24000 : 8600; // kcal/m³
    const PRESSAO_SAIDA_MBAR = gas.pressaoSaida * 1000;

    const calculatedCaminhos = gas.caminhos.map((caminho): CaminhoGas => {
        let perdaAcumulada = 0;
        let potenciaAcumulada = 0;

        const trechosReversed = [...caminho.trechos].reverse();
        const calculatedTrechosReversed = trechosReversed.map(trecho => {
             potenciaAcumulada += trecho.potencia;
             const vazao_kW = potenciaAcumulada;
             const vazao_kcal_h = vazao_kW * 860.421;
             const vazao_m3_h = PODER_CALORIFICO > 0 ? vazao_kcal_h / PODER_CALORIFICO : 0;
             const Q = vazao_m3_h;

             const K = 26.9;
             const L = trecho.comprimento * 1.2;
             const H_max = PRESSAO_SAIDA_MBAR * 0.1;
             const totalLength = caminho.trechos.reduce((s, t) => s + t.comprimento, 0);
             const H_trecho_max = totalLength > 0 ? H_max * (trecho.comprimento / totalLength) : H_max;

             const D_cm = H_trecho_max > 0 ? Math.pow((Math.pow(Q, 2) * DENSIDADE_RELATIVA * L) / (Math.pow(K, 2) * H_trecho_max), 1/5) : 0;
             const D_mm = D_cm * 10;
             
             const diâmetrosDisponiveis = [15, 22, 28, 35, 42, 54];
             const diametroAdotado = diâmetrosDisponiveis.find(d => d * 0.9 > D_mm) || diâmetrosDisponiveis[diâmetrosDisponiveis.length - 1];

             const D_adotado_cm = (diametroAdotado * 0.9) / 10;
             const perdaCarga = D_adotado_cm > 0 ? (Math.pow(Q, 2) * DENSIDADE_RELATIVA * L) / (Math.pow(K, 2) * Math.pow(D_adotado_cm, 5)) : 0;
             perdaAcumulada += perdaCarga;

             return { ...trecho, potenciaAcumulada, vazao: Q, diametro: diametroAdotado, perdaCarga: perdaCarga, perdaCargaAcumulada: 0 };
        });
        
        const calculatedTrechos = calculatedTrechosReversed.reverse();
        let perdaAcumuladaFinal = 0;
        calculatedTrechos.forEach(t => {
            perdaAcumuladaFinal += t.perdaCarga || 0;
            t.perdaCargaAcumulada = perdaAcumuladaFinal;
        });

        return { ...caminho, trechos: calculatedTrechos, perdaTotal: perdaAcumuladaFinal };
    });
    
    module.caminhosGas = calculatedCaminhos;
    const maxPerda = Math.max(...calculatedCaminhos.map(c => c.perdaTotal || 0));
    const perdaAdmissivel = PRESSAO_SAIDA_MBAR * 0.1;

    module.results.push(
        { label: "Perda de Carga Máxima", value: maxPerda.toFixed(3), unit: "mbar" },
        { label: "Perda Admissível", value: perdaAdmissivel.toFixed(3), unit: "mbar" }
    );
    
    module.calculationSteps.push({
        description: "Dimensionamento da Tubulação de Gás (Fórmula de Pole)",
        detail: `<p>O diâmetro de cada trecho foi calculado para atender à vazão exigida, limitando a perda de carga total a 10% da pressão de saída (${perdaAdmissivel.toFixed(3)} mbar). A fórmula de Pole foi utilizada:</p>
                 <p><strong>Fórmula:</strong> D<sup>5</sup> = (Q<sup>2</sup> × d × L) / (K<sup>2</sup> × ΔP)</p>
                 <p><strong>Onde:</strong><br/>
                 - D = Diâmetro interno do tubo (cm)<br/>
                 - Q = Vazão de gás (m³/h)<br/>
                 - d = Densidade relativa do gás (GLP: ${DENSIDADE_RELATIVA}, GN: 0.6)<br/>
                 - L = Comprimento equivalente do trecho (m)<br/>
                 - K = Constante (26.9 para GLP/GN)<br/>
                 - ΔP = Perda de carga no trecho (mbar)</p>
                 <p>Para cada trecho, o diâmetro comercial imediatamente superior ao calculado foi adotado, e a perda de carga foi verificada.</p>`
    });

    let keyAbrigo = '';
    if (gas.tipo === 'gn') {
        keyAbrigo = 'central_gn';
    } else if (gas.tipoCilindro && gas.numCilindros) {
        keyAbrigo = `${gas.numCilindros}x${gas.tipoCilindro}`;
    }
    const abrigoInfo = DIMENSOES_ABRIGO_GAS[keyAbrigo];
    if (abrigoInfo) {
        gas.abrigo = abrigoInfo;
        module.results.push(
            { label: "Dimensões do Abrigo", value: abrigoInfo.dimensoes, unit: ""},
            { label: "Ventilação do Abrigo", value: abrigoInfo.ventilacao, unit: ""}
        );
    }

    return module;
};

const calculateLixeira = (module: Module, state: ProjectState, buildingTypeName: string): Module => {
    const { lixeira, buildingData } = state;
    const populacao = getPopulacao(buildingTypeName, buildingData);
    
    const volumeTotalDiario = populacao * lixeira.contribuicaoDiaria;
    const volumeTotalAcumulado = volumeTotalDiario * lixeira.frequenciaColeta * lixeira.taxaAcumulacao;
    
    let volOrganico = 0;
    let volReciclavel = 0;

    if (lixeira.tipoColeta === 'seletiva') {
        volOrganico = volumeTotalAcumulado * 0.5;
        volReciclavel = volumeTotalAcumulado * 0.5;
    } else {
        volOrganico = volumeTotalAcumulado;
    }

    const alturaEmpilhamento = 1.0; // m
    const areaOrganico = (volOrganico / 1000) / alturaEmpilhamento;
    const areaReciclavel = (volReciclavel / 1000) / alturaEmpilhamento;
    const areaTotal = areaOrganico + areaReciclavel;
    
    const numContentores240L = volumeTotalAcumulado > 0 ? Math.ceil(volumeTotalAcumulado / 240) : 0;
    const numContentores1000L = volumeTotalAcumulado > 0 ? Math.ceil(volumeTotalAcumulado / 1000) : 0;

    module.results.push(
        { label: "População de Cálculo", value: populacao, unit: "pessoas" },
        { label: "Volume Total Acumulado", value: volumeTotalAcumulado.toFixed(0), unit: "L" },
        { label: "Volume Orgânico/Rejeito", value: volOrganico.toFixed(0), unit: "L" },
        { label: "Volume Reciclável", value: volReciclavel.toFixed(0), unit: "L" },
        { label: "Área Mínima do Abrigo", value: areaTotal.toFixed(2), unit: "m²" },
        { label: "Sugestão de Contentores (240L)", value: numContentores240L, unit: "un." },
        { label: "Sugestão de Contentores (1000L)", value: numContentores1000L, unit: "un." }
    );

    let contentoresDetail = '';
    if (lixeira.tipoColeta === 'seletiva') {
        const numOrg240 = Math.ceil(volOrganico / 240);
        const numRec240 = Math.ceil(volReciclavel / 240);
        const numOrg1000 = Math.ceil(volOrganico / 1000);
        const numRec1000 = Math.ceil(volReciclavel / 1000);
        contentoresDetail = `<p>O dimensionamento considera a separação entre resíduos orgânicos/rejeitos e recicláveis.</p>
        <p><strong>Para contentores de 240 L:</strong><br/>
        - Orgânico: ${volOrganico.toFixed(0)} L / 240 L/un. = ${numOrg240} un.<br/>
        - Reciclável: ${volReciclavel.toFixed(0)} L / 240 L/un. = ${numRec240} un.<br/>
        - <b>Total: ${numOrg240 + numRec240} unidades de 240 L.</b></p>
        <p><strong>Para contentores de 1000 L:</strong><br/>
        - Orgânico: ${volOrganico.toFixed(0)} L / 1000 L/un. = ${numOrg1000} un.<br/>
        - Reciclável: ${volReciclavel.toFixed(0)} L / 1000 L/un. = ${numRec1000} un.<br/>
        - <b>Total: ${numOrg1000 + numRec1000} unidades de 1000 L.</b></p>`;
    } else {
        contentoresDetail = `<p>O dimensionamento considera o volume total de resíduos.</p>
        <p><strong>Para contentores de 240 L:</strong><br/>
        - Total: ${volumeTotalAcumulado.toFixed(0)} L / 240 L/un. = <b>${numContentores240L} unidades</b>.</p>
        <p><strong>Para contentores de 1000 L:</strong><br/>
        - Total: ${volumeTotalAcumulado.toFixed(0)} L / 1000 L/un. = <b>${numContentores1000L} unidades</b>.</p>`;
    }

    module.calculationSteps.push(
        { description: "Cálculo do Volume Diário de Resíduos", detail: `Fórmula: Vd = Pop. × C<br>Substituição: Vd = ${populacao}p × ${lixeira.contribuicaoDiaria} L/p.dia = <b>${volumeTotalDiario.toFixed(0)} L/dia</b>`},
        { description: "Cálculo do Volume Total Acumulado", detail: `Fórmula: Vt = Vd × f × Ta<br>Substituição: Vt = ${volumeTotalDiario.toFixed(0)} × ${lixeira.frequenciaColeta} dias × ${lixeira.taxaAcumulacao} = <b>${volumeTotalAcumulado.toFixed(0)} L</b>`},
        { description: "Cálculo da Área do Abrigo", detail: `Considerando altura de empilhamento de ${alturaEmpilhamento.toFixed(2)} m.<br>Área Orgânico: ${(volOrganico/1000).toFixed(2)} m²<br>Área Reciclável: ${(volReciclavel/1000).toFixed(2)} m²<br><b>Área Total: ${areaTotal.toFixed(2)} m²</b>`},
        { description: "Dimensionamento dos Contentores", detail: contentoresDetail }
    );

    return module;
};


const calculateEsgoto = (module: Module, state: ProjectState, buildingType: string): Module => {
    const { buildingData, esgotoItens, esgotoSanitario, esgotoTratamento, projectData } = state;
    const numUnidades = buildingType === "Multifamiliar" ? buildingData.floorGroups.reduce((acc, g) => acc + ((Number(g.numFloors) || 0) * (Number(g.aptsPerFloor) || 0)), 0) : 1;
    
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
        calculoVazaoDetail = `<strong>Método Probabilístico (Comercial/Industrial)</strong><br>
Fórmula: Q = C × √ΣUD<br>Substituição: Q = ${C} × √${totalUD.toFixed(2)} = <b>${vazaoEsgotoTotal.toFixed(2)} L/s</b>`;
    } else { // uhc
        totalUHC = esgotoItens.reduce((acc, item) => acc + item.quantidade * (APARELHOS_SANITARIOS_UHC[item.aparelho] || 0), 0) * numUnidades;
        const Q = 0.3 * Math.sqrt(totalUHC);
        vazaoEsgotoTotal = Q;
        calculoVazaoDetail = `<strong>Método UHC (Residencial)</strong><br>
Fórmula: Q = 0.3 × √ΣUHC<br>Substituição: Q = 0.3 × √${totalUHC} = <b>${vazaoEsgotoTotal.toFixed(2)} L/s</b>`;
    }
    
    // Dimensionamento do Tubo de Queda
    const uhcPorPrumada = totalUHC / esgotoSanitario.numTubosQueda;
    const getDiametroTuboQueda = (uhc: number) => {
        if (uhc <= 10) return 75;
        if (uhc <= 160) return 100;
        if (uhc <= 500) return 150;
        return 200;
    };
    const diametroTuboQueda = getDiametroTuboQueda(uhcPorPrumada);
    
    // Dimensionamento do Coletor Predial
    const { diametro: diametroColetor, declividade: declividadeColetor } = getDiametroEsgoto(vazaoEsgotoTotal);

    module.results.push(
        { label: "Total UHC (ou ΣUD)", value: esgotoSanitario.metodoCalculo === 'uhc' ? totalUHC : (esgotoItens.reduce((acc, item) => acc + item.quantidade * (APARELHOS_DESCARGA_DB[item.aparelho] || 0), 0) * numUnidades).toFixed(2), unit: "" },
        { label: "Vazão de Esgoto", value: vazaoEsgotoTotal.toFixed(2), unit: "L/s" },
        { label: "DN Tubo de Queda", value: diametroTuboQueda, unit: `mm (${esgotoSanitario.numTubosQueda} un.)` },
        { label: "DN Coletor Predial", value: diametroColetor, unit: "mm" },
        { label: "Declividade Coletor", value: declividadeColetor, unit: "" }
    );
    
    module.calculationSteps.push(
        { description: "Cálculo da Vazão de Esgoto (NBR 8160)", detail: calculoVazaoDetail },
        { description: "Dimensionamento dos Tubos de Queda", detail: `UHC por prumada: ${uhcPorPrumada.toFixed(2)}<br>Com base na NBR 8160 (Tabela 5), o diâmetro mínimo é <b>${diametroTuboQueda} mm</b>.` },
        { description: "Dimensionamento do Coletor Predial", detail: `Vazão: ${vazaoEsgotoTotal.toFixed(2)} L/s<br>Com base na NBR 8160 (Tabela 6), o diâmetro mínimo é <b>${diametroColetor} mm</b> com declividade de <b>${declividadeColetor}</b>.` }
    );
    
    // Dimensionamento da Ventilação
    const totalUHCVentilacao = totalUHC / esgotoSanitario.numColunasVentilacao;
    const getDiametroVentilacao = (uhc: number) => {
        if (uhc <= 16) return 50;
        if (uhc <= 80) return 75;
        return 100;
    };
    const diametroVentilacao = getDiametroVentilacao(totalUHCVentilacao);
    esgotoSanitario.diametroVentilacao = diametroVentilacao;
    
    module.results.push({ label: "DN Coluna de Ventilação", value: diametroVentilacao, unit: `mm (${esgotoSanitario.numColunasVentilacao} un.)` });
    module.calculationSteps.push({ description: "Dimensionamento da Coluna de Ventilação", detail: `UHC por coluna: ${totalUHCVentilacao.toFixed(2)}<br>Com base na NBR 8160 (Tabela 7), o diâmetro mínimo é <b>${diametroVentilacao} mm</b>.`});
    
    esgotoSanitario.ramaisVentilacao.forEach(ramal => {
        ramal.diametro = VENTILACAO_DIAMETROS(ramal.uhc, ramal.comprimento);
    });
    
    // Elevatória de Esgoto
    if(esgotoSanitario.elevatoria?.habilitado) {
        const populacaoElevatoria = getPopulacao(buildingType, buildingData);
        const contribuicaoDiaria = populacaoElevatoria * (projectData.consumoPerCapita * 0.8); // 80% do consumo de água
        const vazaoElevatoria = (contribuicaoDiaria / (24 * 3600)) * 2; // Fator de pico
        const volumePoco = contribuicaoDiaria / 4; // 1/4 da contribuição diária
        const amtElevatoria = esgotoSanitario.elevatoria.alturaRecalque + 5; // Simplicado
        
        const bombaSugerida = BOMBAS_ESGOTO_DB.find(b => b.vazao_max_ls >= vazaoElevatoria && b.amt_max >= amtElevatoria);
        
        esgotoSanitario.elevatoria.volumePocoCalculado = volumePoco;
        esgotoSanitario.elevatoria.bombaSugerida = bombaSugerida?.nome;
        
        module.results.push({ label: "Volume Poço Elevatória", value: volumePoco.toFixed(0), unit: "L" });
        module.results.push({ label: "Bomba de Esgoto Sugerida", value: bombaSugerida?.nome || "Não encontrada", unit: "" });
        module.calculationSteps.push({ description: "Dimensionamento da Elevatória de Esgoto", detail: `Vazão: ${vazaoElevatoria.toFixed(2)} L/s, AMT: ${amtElevatoria.toFixed(2)} mca. Poço: ${volumePoco.toFixed(0)} L. Bomba sugerida: <b>${bombaSugerida?.nome || "Não encontrada"}</b>` });
    }

    if (esgotoTratamento.habilitado) {
        const N = getPopulacao(buildingType, buildingData);
        const C = esgotoTratamento.contribuicaoEsgoto; // L/p.dia
        const T = esgotoTratamento.intervaloLimpeza; // anos
        const K = 94; // Taxa de acumulação de lodo (L/p.ano), para T=1 ano, Temp > 20C.
        const Lf = 1; // Fator de lodo fresco
    
        // Fossa Séptica (NBR 7229)
        const volumeUtilFossaTotal = (1000 + N * (C * T + K * Lf)) / 1000; // m³
        const volumePorFossa = esgotoTratamento.numFossas > 0 ? volumeUtilFossaTotal / esgotoTratamento.numFossas : 0;
        const hFossa = 1.5; // Profundidade útil adotada (m)
        const larguraFossa = Math.max(0.8, Math.sqrt(volumePorFossa / (2 * hFossa))); // L=2W
        const comprimentoFossa = 2 * larguraFossa;
        esgotoTratamento.fossaComprimento = Number(comprimentoFossa.toFixed(2));
        esgotoTratamento.fossaLargura = Number(larguraFossa.toFixed(2));
        esgotoTratamento.fossaProfundidadeUtil = hFossa;
    
        // Filtro Anaeróbio (NBR 13969)
        const volumeUtilFiltroTotal = (1.6 * N * C) / 1000; // m³
        const volumePorFiltro = esgotoTratamento.numFiltros > 0 ? volumeUtilFiltroTotal / esgotoTratamento.numFiltros : 0;
        const hFiltro = 1.2; // Altura útil do leito filtrante (m)
        const diametroFiltro = Math.sqrt((4 * volumePorFiltro) / (Math.PI * hFiltro));
        esgotoTratamento.filtroDiametro = Number(diametroFiltro.toFixed(2));
        esgotoTratamento.filtroAlturaUtil = hFiltro;
    
        // Sumidouro (NBR 7229 / NBR 13969)
        const areaInfiltracaoTotal = esgotoTratamento.taxaInfiltracao > 0 ? (N * C) / esgotoTratamento.taxaInfiltracao : 0; // m²
        const areaPorSumidouro = esgotoTratamento.numSumidouros > 0 ? areaInfiltracaoTotal / esgotoTratamento.numSumidouros : 0;
        const diametroSumidouro = Math.sqrt(areaPorSumidouro / (1.75 * Math.PI)); // A = 1.75 * PI * D^2 for h=1.5D
        const alturaSumidouro = 1.5 * diametroSumidouro;
        esgotoTratamento.sumidouroDiametro = Number(diametroSumidouro.toFixed(2));
        esgotoTratamento.sumidouroAlturaUtil = Number(alturaSumidouro.toFixed(2));
    
        module.results.push(
            { label: "Volume Útil Total (Fossa)", value: volumeUtilFossaTotal.toFixed(2), unit: "m³" },
            { label: "Dimensões Fossa (por un.)", value: `${comprimentoFossa.toFixed(2)}x${larguraFossa.toFixed(2)}x${hFossa.toFixed(2)}`, unit: "m" },
            { label: "Volume Útil Total (Filtro)", value: volumeUtilFiltroTotal.toFixed(2), unit: "m³" },
            { label: "Dimensões Filtro (por un.)", value: `Ø${diametroFiltro.toFixed(2)} x ${hFiltro.toFixed(2)}`, unit: "m" },
            { label: "Área Infiltração Total", value: areaInfiltracaoTotal.toFixed(2), unit: "m²" },
            { label: "Dimensões Sumidouro (por un.)", value: `Ø${diametroSumidouro.toFixed(2)} x ${alturaSumidouro.toFixed(2)}`, unit: "m" }
        );
    
        module.calculationSteps.push(
            {
                description: "Dimensionamento da Fossa Séptica (NBR 7229)",
                detail: `<p><strong>Fórmula (Volume):</strong> V = 1000 + N × (C×T + K×Lf)</p>
                         <p><strong>Onde:</strong><br/>- V = Volume útil (L)<br/>- N = População (pessoas)<br/>- C = Contribuição de esgoto (L/p.dia)<br/>- T = Período de Limpeza (anos)<br/>- K = Taxa de acumulação de lodo (L/p.ano)<br/>- Lf = Fator de lodo fresco</p>
                         <p><strong>Substituição:</strong> V = 1000 + ${N} × (${C}×${T} + ${K}×${Lf}) = <b>${(volumeUtilFossaTotal*1000).toFixed(0)} L</b></p>
                         <p><strong>Resultado:</strong><br/>- Volume por unidade (${esgotoTratamento.numFossas} un.): <b>${(volumePorFossa*1000).toFixed(0)} L</b><br/>
                         - Dimensões Adotadas (L=2W, h=${hFossa}m): <b>${comprimentoFossa.toFixed(2)}m (C) x ${larguraFossa.toFixed(2)}m (L) x ${hFossa.toFixed(2)}m (h)</b></p>`
            },
            {
                description: "Dimensionamento do Filtro Anaeróbio (NBR 13969)",
                detail: `<p><strong>Fórmula (Volume):</strong> V = 1.6 × N × C</p>
                         <p><strong>Onde:</strong><br/>- V = Volume útil (L)<br/>- N = População (pessoas)<br/>- C = Contribuição de esgoto (L/p.dia)</p>
                         <p><strong>Substituição:</strong> V = 1.6 × ${N} × ${C} = <b>${(volumeUtilFiltroTotal*1000).toFixed(0)} L</b></p>
                         <p><strong>Resultado:</strong><br/>- Volume por unidade (${esgotoTratamento.numFiltros} un.): <b>${(volumePorFiltro*1000).toFixed(0)} L</b><br/>
                         - Dimensões Adotadas (h=${hFiltro}m): <b>Ø${diametroFiltro.toFixed(2)}m x ${hFiltro.toFixed(2)}m (h)</b></p>`
            },
            {
                description: `Dimensionamento do ${esgotoTratamento.tipoDisposicaoFinal === 'sumidouro' ? 'Sumidouro' : 'Vala de Infiltração'} (NBR 13969)`,
                detail: `<p><strong>Fórmula (Área):</strong> A = (N × C) / Ta</p>
                         <p><strong>Onde:</strong><br/>- A = Área de infiltração (m²)<br/>- N = População (pessoas)<br/>- C = Contribuição de esgoto (L/p.dia)<br/>- Ta = Taxa de infiltração (L/m².dia)</p>
                         <p><strong>Substituição:</strong> A = (${N} × ${C}) / ${esgotoTratamento.taxaInfiltracao} = <b>${areaInfiltracaoTotal.toFixed(2)} m²</b></p>
                         <p><strong>Resultado:</strong><br/>- Área por unidade (${esgotoTratamento.numSumidouros} un.): <b>${areaPorSumidouro.toFixed(2)} m²</b><br/>
                         - Dimensões Adotadas (h=1.5D): <b>Ø${diametroSumidouro.toFixed(2)}m x ${alturaSumidouro.toFixed(2)}m (h)</b></p>`
            }
        );
    }
    return module;
};