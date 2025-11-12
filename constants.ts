import { BuildingType, ProjectState, ComplianceItem, Bomba } from './types';

export const buildingTypes: BuildingType[] = [
  { name: "Unifamiliar", icon: "fas fa-home", description: "Casas unifamiliares" },
  { name: "Multifamiliar", icon: "fas fa-building", description: "Prédios de apartamentos" },
  { name: "Comercial", icon: "fas fa-store", description: "Lojas e escritórios" },
  { name: "Industrial", icon: "fas fa-industry", description: "Fábricas e galpões" },
];

export const projectTemplates = [
  { name: "Casa Popular", description: "Residência econômica com 2-3 dormitórios", config: { pavimentos: 1, dormitorios: 2, pessoas: 4, areaTotal: 80 } },
  { name: "Casa Média", description: "Residência padrão com 3-4 dormitórios", config: { pavimentos: 2, dormitorios: 3, pessoas: 6, areaTotal: 150 } },
  { name: "Edifício de Luxo", description: "Apartamento premium com acabamento superior", config: { pavimentos: 20, aptPorAndar: 2, pessoasPorApt: 4, areaTotal: 200 } },
  { name: "Comercial Padrão", description: "Loja ou escritório comercial", config: { pavimentos: 1, pessoas: 10, areaTotal: 100 } },
];

const initialBombasDB: Bomba[] = [
    { id: 1, nome: "Nenhuma", fabricante: "", npshRequerido: 0, curva: [] },
    { id: 2, nome: "Dancor Pratika CP-4R (1 CV)", fabricante: "Dancor", npshRequerido: 4.0, curva: [[1, 30], [2, 29], [4, 26], [6, 22], [8, 16], [10, 8]] }, // vazao m3/h, amt mca
    { id: 3, nome: "Schneider BC-92S 1CV (1.0 CV)", fabricante: "Schneider", npshRequerido: 4.0, curva: [[1.8, 30], [3.6, 28], [5.4, 25], [7.2, 21], [9.0, 15]] },
    { id: 4, nome: "Schneider ME-1620 (2 CV)", fabricante: "Schneider", npshRequerido: 4.5, curva: [[5, 35], [10, 33], [15, 29], [20, 22], [25, 12]] },
    { id: 5, nome: "Thebe THA-16 (1.5 CV)", fabricante: "Thebe", npshRequerido: 3.8, curva: [[2, 32], [4, 30], [6, 27], [8, 22], [10, 15]] },
];


export const initialProjectState: ProjectState = {
  selectedBuildingType: 0,
  projectInfo: {
    name: "Residência Unifamiliar",
    location: "São Paulo, SP",
    date: new Date().toISOString().split("T")[0],
    proprietario: "João da Silva",
    inscricaoImobiliaria: "123.456.789-0",
    memorialVersions: [
      { id: 1, version: 'R00', date: new Date().toISOString().split("T")[0], description: 'Emissão inicial para aprovação', author: 'Eng. Civil João Silva' }
    ]
  },
  engenheiro: {
    nome: "Eng. Civil João Silva",
    crea: "CREA-SP 123456/D",
    cpf: "123.456.789-00",
    telefone: "(11) 99999-9999",
    art: "987654321",
  },
  buildingData: {
    pavimentos: 2,
    pessoas: 4,
    dormitorios: 2,
    pisos: 10,
    aptPorAndar: 4,
    pessoasPorApt: 3,
    areaTotal: 250,
  },
  projectData: {
    consumoPerCapita: 150,
    diasReserva: 2,
    metodoConsumo: 'perCapita',
    consumoPorArea: 5,
  },
  reservatorios: {
    numSuperiores: 1,
    numInferiores: 0,
    percentualSuperior: 100,
    material: "polietileno",
    reservaIncendio: 0,
    volumeSuperiorComercial: 0,
    volumeInferiorComercial: 0,
  },
  bombeamento: {
    alturaSuccao: 2,
    alturaRecalque: 8,
    comprimentoReal: 15,
    rendimento: 60,
    configuracao: "simples",
    numBombas: 2,
    potenciaPorBomba: 1.0,
    pressaoAtmosferica: 10.33,
    temperaturaAgua: 20,
    tempoFechamentoValvula: 5,
    bombaSelecionada: "nenhuma",
    horasFuncionamento: 4,
  },
  bombeamentoDetalhes: {
    material: "pvc",
    diametro: 32,
    pecas: [
      { id: 1, nome: "Cotovelo 90°", quantidade: 4 },
      { id: 2, nome: "Registro Gaveta Aberto", quantidade: 1 },
      { id: 3, nome: "Válvula Retenção Leve", quantidade: 1 },
      { id: 4, nome: "Entrada Normal", quantidade: 1 },
      { id: 5, nome: "Saída de Canalização", quantidade: 1 },
    ],
  },
  bombasDB: initialBombasDB,
  aguaFria: {
    material: "pvc",
    coeficienteHW: 150,
    metodoCalculo: 'hazen-williams',
    rugosidade: 0.00015,
    caminhos: [
      {
        id: 1,
        nome: "Ponto Desfavorável 1 (ex: Chuveiro Cobertura)",
        pressaoInicial: 10,
        trechos: [
          { id: 1, descricao: "Reservatório -> Prumada", somaPesos: 15, aparelhos: [{nome: 'Chuveiro', quantidade: 1}, {nome: 'Caixa Acoplada', quantidade: 1}, {nome: 'Torneira de Lavatório', quantidade: 1}], comprimentoReal: 10, alturaInicial: 10, alturaFinal: 10, conexoes: [{ nome: "Registro Gaveta Aberto", quantidade: 1 }, { nome: "Cotovelo 90°", quantidade: 2 }], aparelho: "Chuveiro" },
          { id: 2, descricao: "Prumada AF-01", somaPesos: 10, aparelhos: [], comprimentoReal: 12, alturaInicial: 10, alturaFinal: -2, conexoes: [{ nome: "Tê 90° Saída Lateral", quantidade: 1 }], aparelho: "Chuveiro" },
          { id: 3, descricao: "Ramal Banheiro", somaPesos: 2.7, aparelhos: [], comprimentoReal: 5, alturaInicial: -2, alturaFinal: -1.5, conexoes: [{ nome: "Cotovelo 90°", quantidade: 3 }, { nome: "Registro Pressão Aberto", quantidade: 1 }], aparelho: "Chuveiro" },
        ],
      },
    ],
    vrp: {
      id: 1,
      habilitado: false,
      localizacao: "Prumada pav. 10",
      pressaoMontante: 60,
      pressaoJusanteDesejada: 35,
    },
    sugestaoVRP: {
        necessaria: false,
        pavimentoSugerido: 0,
        pressaoEstaticaCalculada: 0,
    },
    alimentadorPredial: {
      comprimento: 20,
      material: 'pvc',
      velocidadeMaxima: 2.5,
    },
  },
  aguaQuente: {
    tipoSistema: "individual",
    tempAguaFria: 20,
    tempAguaQuente: 60,
    tempoAquecimento: 4,
    caminhos: [
      {
        id: 1,
        nome: "Ponto Desfavorável AQ 1",
        pressaoInicial: 10,
        trechos: [
          { id: 1, descricao: "Saída Boiler", somaPesos: 2.7, aparelhos: [{nome: 'Chuveiro', quantidade: 1}], comprimentoReal: 5, alturaInicial: 0, alturaFinal: 0, conexoes: [{ nome: "Cotovelo 90°", quantidade: 2 }], aparelho: "Chuveiro" },
          { id: 2, descricao: "Prumada AQ-01", somaPesos: 2.0, aparelhos: [], comprimentoReal: 3, alturaInicial: 0, alturaFinal: 3, conexoes: [], aparelho: "Chuveiro" },
        ],
      },
    ],
    recirculacao: {
      habilitado: false,
      comprimentoAnel: 50,
      material: 'cpvc',
      diametro: 20,
    },
    vasoExpansao: {
      habilitado: false,
      pressaoMinimaRede: 2.0,
      pressaoMaximaRede: 4.0,
    },
    aquecedoresDB: [],
    aquecedorSelecionadoId: null,
  },
  esgotoSanitario: { 
    metodoCalculo: 'uhc',
    numTubosQueda: 1,
    numColunasVentilacao: 1,
    ramaisVentilacao: [
        { id: 1, descricao: 'Ramal BWC Social', uhc: 6, comprimento: 2.5 }
    ],
    comprimentoColetor: 30,
    numCurvas45: 1,
    numCurvas90: 2,
    elevatoria: {
      habilitado: false,
      alturaRecalque: 5,
      comprimentoRecalque: 50,
      materialRecalque: 'pvc',
    }
  },
  esgotoItens: [
    { aparelho: "Bacia Sanitária (caixa acoplada)", quantidade: 2 },
    { aparelho: "Lavatório", quantidade: 2 },
    { aparelho: "Chuveiro", quantidade: 2 },
  ],
  esgotoTratamento: {
    habilitado: false,
    contribuicaoEsgoto: 120,
    intervaloLimpeza: 1,
    taxaInfiltracao: 50,
    numFossas: 1,
    numFiltros: 1,
    numSumidouros: 1,
    tipoDisposicaoFinal: 'sumidouro',
    valaLargura: 0.5,
    leitoSecagem: { habilitado: false }
  },
  gorduraData: { numeroRefeicoes: 50, numeroCozinhas: 1, numTubosQuedaGordura: 1 },
  drenagem: {
    intensidade: 150,
    periodoRetorno: 25,
    larguraCalha: 0.3, // Represents top width for trapezoidal
    alturaCalha: 0.2,
    materialCalha: "pvc",
    declividadeCalha: 1,
    tipoCalha: 'retangular',
    diametroCalha: 0.15,
    baseMenorCalha: 0.1,
    tanqueRetencao: {
      habilitado: false,
      tempoChuva: 10,
    },
    coletores: [
      { id: 1, descricao: 'Coletor Principal', areaServida: 150, comprimento: 20, declividade: 1, diametro: 150 },
    ],
  },
  reusoPluvial: {
    habilitado: true,
    areaCaptacao: 150,
    coeficienteRunoff: 0.95,
    demandaNaoPotavel: 200,
    periodoArmazenamento: 7,
    eficienciaFiltro: 85,
    eficienciaReservatorio: 0.95,
    profundidadeReservatorio: 2.0,
    larguraReservatorio: 3.0,
    comprimentoReservatorio: 4.0,
    tipoReservatorio: "enterrado",
    materialReservatorio: "concreto",
    sistemaFiltragem: "filtro_areia",
    tratamentoQuimico: false,
    cloroAtivo: 0.5,
    tempoContato: 30,
    usoIrrigacao: true,
    usoLimpeza: true,
    usoDescarga: false,
    usoCombateIncendio: false,
    custoAguaPotavel: 4.5,
    custoEnergia: 0.6,
    vidaUtil: 20,
    taxaJuros: 8.0,
    manutencaoAnual: 500.0,
    precipitacaoMedia: 1400,
    intensidadeChuva: 150,
    periodoRetorno: 25,
    volumeCaptado: 0,
    volumeReservatorio: 0,
    economiaAnual: 0,
    payback: 0,
    reducaoConsumo: 0,
    metodoDimensionamentoReservatorio: 'automatico',
    volumeReservatorioAdotado: 0,
  },
  areasPluviais: [
    { id: 1, area: 150, coeficiente: 0.95, tubosQueda: 2, usarParaReuso: true },
  ],
  gas: {
    tipo: "glp",
    tipoCentral: "central",
    capacidadeCentral: 90,
    tipoCilindro: 'P45',
    numCilindros: 2,
    pressaoEntrada: 2.8,
    pressaoSaida: 0.028,
    caminhos: [
      {
        id: 1,
        nome: "Caminho Principal (Aquecedor + Fogão)",
        trechos: [
          { id: 1, descricao: "Medidor -> Ponto Aquecedor", comprimento: 15, potencia: 25 },
          { id: 2, descricao: "Derivação -> Ponto Fogão", comprimento: 8, potencia: 11 },
        ],
      },
    ],
  },
  plantas: { plantaBaixa: null, cortes: null, drenagem: null },
  plantasBase64: { plantaBaixa: null, cortes: null, drenagem: null },
  customLogo: null,
  systems: [
    { name: "Água Fria", icon: "fas fa-faucet", description: "Abastecimento, recalque e perda de carga", enabled: true },
    { name: "Água Quente", icon: "fas fa-hot-tub", description: "Aquecimento de água sanitária", enabled: true },
    { name: "Esgoto Sanitário", icon: "fas fa-toilet", description: "Coleta de esgoto primário e secundário", enabled: true },
    { name: "Esgoto Gorduroso", icon: "fas fa-bacon", description: "Dimensionamento de caixas de gordura", enabled: true },
    { name: "Drenagem Pluvial", icon: "fas fa-cloud-rain", description: "Drenagem de águas pluviais", enabled: true },
    { name: "Reúso de Água Pluvial", icon: "fas fa-recycle", description: "Aproveitamento de água da chuva (NBR 15527)", enabled: true },
    { name: "Gás Combustível", icon: "fas fa-burn", description: "Distribuição de gás (GLP/GN)", enabled: true },
  ],
  modules: [
    { name: "Água Fria", description: "Demanda, reservatórios, bombeamento e perda de carga", icon: "fas fa-faucet", results: [], calculationSteps: [], normas: [
        { codigo: "NBR 5626", descricao: "Instalação predial de água fria e água quente" },
        { codigo: "NBR 12218", descricao: "Projeto de rede de distribuição de água para abastecimento público" },
    ] },
    { name: "Água Quente", description: "Dimensionamento de aquecedores e tubulações", icon: "fas fa-hot-tub", results: [], calculationSteps: [], normas: [
        { codigo: "NBR 5626", descricao: "Instalação predial de água fria e água quente" },
        { codigo: "NBR 7198", descricao: "Projeto e execução de instalações prediais de água quente" },
    ] },
    { name: "Esgoto Sanitário", description: "Dimensionamento de ramais, colunas e tratamento", icon: "fas fa-toilet", results: [], calculationSteps: [], normas: [
        { codigo: "NBR 8160", descricao: "Sistemas prediais de esgoto sanitário - Projeto e execução" },
        { codigo: "NBR 7229", descricao: "Projeto, construção e operação de sistemas de tanques sépticos" },
        { codigo: "NBR 13969", descricao: "Tanques sépticos - Unidades de tratamento complementar e disposição final" },
    ] },
    { name: "Esgoto Gorduroso", description: "Dimensionamento de caixas de gordura e inspeção", icon: "fas fa-bacon", results: [], calculationSteps: [], normas: [
        { codigo: "NBR 8160", descricao: "Sistemas prediais de esgoto sanitário - Projeto e execução" },
    ] },
    { name: "Drenagem Pluvial", description: "Cálculo de vazão e dimensionamento de calhas e condutores", icon: "fas fa-cloud-rain", results: [], calculationSteps: [], normas: [
        { codigo: "NBR 10844", descricao: "Instalações prediais de águas pluviais" },
    ] },
    { name: "Reúso de Água Pluvial", description: "Dimensionamento de sistemas de aproveitamento de água da chuva", icon: "fas fa-recycle", results: [], calculationSteps: [], normas: [
        { codigo: "NBR 15527", descricao: "Água de chuva - Aproveitamento de coberturas em áreas urbanas para fins não potáveis" },
    ] },
    { name: "Gás Combustível", description: "Dimensionamento de tubulação de gás", icon: "fas fa-burn", results: [], calculationSteps: [], normas: [
        { codigo: "NBR 15526", descricao: "Redes de distribuição interna para gases combustíveis em instalações residenciais" },
    ] },
  ]
};

// Database-like constants
export const TANQUES_COMERCIAIS = [500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7500, 8000, 10000, 12000, 15000, 16000, 20000, 25000, 30000, 40000, 50000];

export const HIDROMETROS_DB = [
    { qn: 1.5, qmax: 3, diametro: 20, nome: 'DN 20 (3/4")' },
    { qn: 2.5, qmax: 5, diametro: 25, nome: 'DN 25 (1")' },
    { qn: 3.5, qmax: 7, diametro: 32, nome: 'DN 32 (1 1/4")' },
    { qn: 5, qmax: 10, diametro: 40, nome: 'DN 40 (1 1/2")' },
    { qn: 10, qmax: 20, diametro: 50, nome: 'DN 50 (2")' },
];

export const BOMBAS_ESGOTO_DB = [
    { nome: 'Schneider BCS-250 (1 CV)', vazao_max_ls: 10, amt_max: 12, passagem_solidos: 50 },
    { nome: 'Dancor DS-32 (1.5 CV)', vazao_max_ls: 15, amt_max: 15, passagem_solidos: 35 },
    { nome: 'Thebe THES-16 (2 CV)', vazao_max_ls: 20, amt_max: 18, passagem_solidos: 50 },
];

export const DIMENSOES_ABRIGO_GAS: { [key: string]: { dimensoes: string, ventilacao: string } } = {
    '1xP13': { dimensoes: '0.60 x 0.40 x 0.80 m', ventilacao: 'Superior e inferior (200 cm² cada)' },
    '2xP13': { dimensoes: '1.00 x 0.40 x 0.80 m', ventilacao: 'Superior e inferior (200 cm² cada)' },
    '1xP45': { dimensoes: '0.80 x 0.60 x 1.50 m', ventilacao: 'Superior e inferior (400 cm² cada)' },
    '2xP45': { dimensoes: '1.20 x 0.60 x 1.50 m', ventilacao: 'Superior e inferior (400 cm² cada)' },
    '4xP45': { dimensoes: '2.00 x 0.80 x 1.50 m', ventilacao: 'Superior e inferior (600 cm² cada)' },
    '2xP190': { dimensoes: '2.50 x 1.20 x 2.20 m', ventilacao: 'Conforme NBR 13523' },
    'central_gn': { dimensoes: 'Conforme projeto específico e norma da concessionária', ventilacao: 'Ventilação permanente' }
};

export const CHECKLIST_ITEMS: {[key: string]: {id: string, item: string, check: (state: ProjectState) => boolean | undefined}[]} = {
    NBR5626: [
        { id: '5626-vmax', item: "Velocidade máxima da água < 3.0 m/s", check: (state: ProjectState) => state.modules.find(m => m.name === 'Água Fria')?.caminhos?.every(c => c.trechos.every(t => (t.velocidade ?? 0) <= 3.0)) },
        { id: '5626-pmin', item: "Pressão dinâmica mínima nos pontos atendida", check: (state: ProjectState) => state.modules.find(m => m.name === 'Água Fria')?.caminhos?.every(c => c.trechos.every(t => t.pressaoMinimaAtendida === true)) },
        { id: '5626-pmax', item: "Pressão estática máxima < 40 mca (ou uso de VRP)", check: (state: ProjectState) => state.aguaFria.vrp.habilitado || !state.aguaFria.caminhos.some(c => c.trechos.some(t => t.pressaoDisponivel && t.pressaoDisponivel > 40)) },
        { id: '5626-reserva', item: "Volume de reservação atende à demanda", check: (state: ProjectState) => ((state.reservatorios.volumeSuperiorComercial ?? 0) + (state.reservatorios.volumeInferiorComercial ?? 0)) >= Number(state.modules.find(m => m.name === 'Água Fria')?.results.find(r => r.label.includes('Reserva Total'))?.value ?? 0) },
    ],
    NBR8160: [
        { id: '8160-dn-bacia', item: "DN mínimo de 100mm para ramal com bacia sanitária", check: (state: ProjectState) => (Number(state.modules.find(m=>m.name==='Esgoto Sanitário')?.results.find(r=>r.label.includes('Tubo de Queda'))?.value ?? 0) >= 100 || !state.esgotoItens.some(i => i.aparelho.includes('Bacia'))) },
        { id: '8160-declividade', item: "Declividade mínima do coletor predial atendida", check: (state: ProjectState) => { const res = state.modules.find(m=>m.name==='Esgoto Sanitário')?.results.find(r=>r.label.includes('Coletor Predial')); return res ? res.unit.includes('%') : true; } },
    ],
    NBR15526: [
        { id: '15526-pdmax', item: "Perda de carga na rede de gás < 10% da pressão de saída", check: (state: ProjectState) => state.modules.find(m => m.name === 'Gás Combustível')?.caminhosGas?.every(c => (c.perdaTotal ?? 0) < (state.gas.pressaoSaida * 0.1)) },
    ]
};


export const tubulacoesDB = {
  pvc: { 20: { interno: 18.4 }, 25: { interno: 23.2 }, 32: { interno: 29.8 }, 40: { interno: 36.6 }, 50: { interno: 46.2 }, 60: { interno: 56.6 }, 75: { interno: 71.0 }, 100: { interno: 94.0 }, 125: { interno: 117.4 }, 150: { interno: 140.8 } },
  ppr: { 15: { interno: 10.2 }, 20: { interno: 16.2 }, 25: { interno: 20.4 }, 32: { interno: 26.0 }, 40: { interno: 32.6 }, 50: { interno: 40.8 } },
  aco: { 25: { interno: 26.6 }, 32: { interno: 35.1 }, 40: { interno: 40.9 }, 50: { interno: 52.5 } },
  cpvc: { 15: { interno: 12.5 }, 22: { interno: 18.1 }, 28: { interno: 23.7 }, 35: { interno: 29.7 }, 42: { interno: 36.3 }, 54: { interno: 47.5 } },
  cobre: { 15: { interno: 13.0 }, 22: { interno: 19.8 }, 28: { interno: 25.8 }, 35: { interno: 32.4 }, 42: { interno: 39.2 }, 54: { interno: 50.8 } },
  pead: { 20: { interno: 16.0 }, 25: { interno: 20.4 }, 32: { interno: 26.2 }, 40: { interno: 32.8 }, 50: { interno: 41.0 }, 63: { interno: 51.6 } },
};

export const CONEXOES_AGUA_DB: { [key: string]: { [dn: number]: number } } = {
  "Cotovelo 90°":              { 20: 0.7, 25: 0.8, 32: 1.0, 40: 1.2, 50: 1.7, 60: 2.0, 75: 2.5 },
  "Cotovelo 45°":              { 20: 0.3, 25: 0.4, 32: 0.5, 40: 0.6, 50: 0.8, 60: 1.0, 75: 1.2 },
  "Curva 90° Raio Longo":      { 20: 0.4, 25: 0.5, 32: 0.6, 40: 0.8, 50: 1.0, 60: 1.2, 75: 1.5 },
  "Tê 90° Passagem Direta":    { 20: 0.3, 25: 0.4, 32: 0.5, 40: 0.6, 50: 0.9, 60: 1.1, 75: 1.4 },
  "Tê 90° Saída Lateral":      { 20: 1.2, 25: 1.5, 32: 1.8, 40: 2.2, 50: 2.8, 60: 3.4, 75: 4.0 },
  "Registro Gaveta Aberto":    { 20: 0.15, 25: 0.2, 32: 0.2, 40: 0.3, 50: 0.4, 60: 0.5, 75: 0.6 },
  "Registro Globo Aberto":     { 20: 4.0, 25: 5.0, 32: 6.0, 40: 8.0, 50: 10.0, 60: 12.0, 75: 15.0 },
  "Registro Pressão Aberto":   { 20: 3.5, 25: 4.0, 32: 5.5, 40: 8.0, 50: 12.0, 60: 15.0, 75: 18.0 },
  "Válvula Retenção Leve":     { 20: 1.0, 25: 1.2, 32: 1.6, 40: 2.0, 50: 2.5, 60: 3.0, 75: 3.5 },
  "Entrada Normal":            { 20: 0.4, 25: 0.5, 32: 0.7, 40: 0.9, 50: 1.2, 60: 1.5, 75: 1.8 },
  "Saída de Canalização":      { 20: 0.8, 25: 1.0, 32: 1.2, 40: 1.5, 50: 2.0, 60: 2.4, 75: 3.0 },
};

export const APARELHOS_PESOS: { [key: string]: number } = {
    "Chuveiro": 0.4,
    "Ducha Higiênica": 0.1,
    "Torneira de Lavatório": 0.2,
    "Torneira de Pia": 0.3,
    "Caixa Acoplada": 0.3,
    "Válvula de Descarga": 3.2,
    "Máquina de Lavar Roupa": 0.4,
    "Máquina de Lavar Louça": 0.3,
    "Tanque": 0.3,
    "Torneira de Jardim": 0.2,
    "Mictório (caixa)": 0.1,
    "Mictório (válvula)": 0.4,
};

export const APARELHOS_SANITARIOS_UHC: { [key: string]: number } = {
    "Bacia Sanitária (caixa acoplada)": 3,
    "Bacia Sanitária (válvula descarga)": 6,
    "Lavatório": 1,
    "Chuveiro": 2,
    "Banheira": 2,
    "Pia de Cozinha": 2,
    "Máquina de Lavar Louça": 2,
    "Máquina de Lavar Roupa": 3,
    "Tanque": 3,
    "Mictório (válvula)": 4,
    "Mictório (caixa)": 2,
    "Ralo Seco": 1,
};

export const APARELHOS_DESCARGA_DB: { [key: string]: number } = {
    "Bacia Sanitária (caixa acoplada)": 1.3,
    "Bacia Sanitária (válvula descarga)": 10.2,
    "Lavatório": 0.3,
    "Chuveiro": 0.4,
    "Banheira": 0.8,
    "Pia de Cozinha": 0.8,
    "Máquina de Lavar Louça": 0.8,
    "Máquina de Lavar Roupa": 0.8,
    "Tanque": 0.8,
    "Mictório (válvula)": 0.2,
    "Mictório (caixa)": 0.1,
    "Ralo Seco": 0,
};

export const APARELHOS_PRESSAO_MINIMA: { [key: string]: number } = {
    "Chuveiro": 1.0,
    "Ducha Higiênica": 2.0,
    "Torneira de Lavatório": 1.0,
    "Torneira de Pia": 1.0,
    "Caixa Acoplada": 0.5,
    "Válvula de Descarga": 1.5,
    "Máquina de Lavar": 2.0,
};

export const MANNING_COEFFICIENTS: { [key: string]: number } = {
    "pvc": 0.009,
    "concreto": 0.013,
    "metal_liso": 0.011,
    "aluminio": 0.010,
};

export const AGUA_PROPRIEDADES: { [temp: number]: { vapor: number, densidade: number, viscosidade: number, moduloElasticidade: number, calorEspecifico: number } } = {
    10: { vapor: 0.125, densidade: 999.7, viscosidade: 1.307e-3, moduloElasticidade: 2.03e9, calorEspecifico: 4.192 },
    20: { vapor: 0.238, densidade: 998.2, viscosidade: 1.002e-3, moduloElasticidade: 2.15e9, calorEspecifico: 4.182 },
    30: { vapor: 0.432, densidade: 995.7, viscosidade: 0.798e-3, moduloElasticidade: 2.24e9, calorEspecifico: 4.178 },
    40: { vapor: 0.752, densidade: 992.2, viscosidade: 0.653e-3, moduloElasticidade: 2.28e9, calorEspecifico: 4.179 },
    60: { vapor: 2.03, densidade: 983.2, viscosidade: 0.467e-3, moduloElasticidade: 2.25e9, calorEspecifico: 4.184 },
};

export const ELASTICIDADE_MODULOS: { [material: string]: number } = { // in Pa (N/m²)
    "pvc": 2.8e9,
    "ppr": 0.8e9,
    "aco": 200e9,
};

export const CONDUTIVIDADE_TERMICA: { [material: string]: number } = { // W/(m·K)
    'cobre': 401,
    'ppr': 0.24,
    'cpvc': 0.14,
};

// NBR 8160 - Tabela 8: Diâmetros mínimos para ramais de ventilação
export const VENTILACAO_DIAMETROS = (uhc: number, comp: number): number => {
    if (uhc <= 2) return comp <= 2.4 ? 40 : 50;
    if (uhc <= 8) return comp <= 4.0 ? 40 : 50;
    if (uhc <= 24) return comp <= 18 ? 50 : 75;
    if (uhc <= 42) return 75;
    if (uhc <= 72) return 75;
    return 100; // Default for higher values
};
export const REPORT_TEXTS = {
  objetivoEscopo: `
    <p>O presente memorial tem como objetivo descrever e justificar as soluções adotadas no projeto hidrossanitário da edificação, em conformidade com as normas técnicas brasileiras vigentes da ABNT (Associação Brasileira de Normas Técnicas), as legislações locais da concessionária de saneamento e as boas práticas de engenharia.</p>
    <p>O escopo deste documento abrange o dimensionamento e a especificação dos seguintes sistemas: alimentação e distribuição de água fria, produção e distribuição de água quente, coleta e afastamento de esgoto sanitário, tratamento de esgoto gorduroso, drenagem de águas pluviais, aproveitamento de água de chuva e distribuição de gás combustível, conforme os sistemas habilitados para este projeto.</p>
  `,
  basesNormativas: `
    <p>Os projetos foram desenvolvidos em estrita conformidade com as seguintes normas técnicas da ABNT, além das legislações e posturas municipais e estaduais aplicáveis:</p>
  `,
  especificacoesGerais: `
    <p>Todos os materiais empregados na execução das instalações deverão ser novos, de primeira qualidade e atender às especificações das normas da ABNT. A execução dos serviços deverá ser realizada por mão de obra qualificada e sob a supervisão de um profissional habilitado.</p>
    <p>As tubulações deverão ser instaladas de forma a permitir dilatações e contrações sem gerar tensões prejudiciais. Todos os testes de estanqueidade e pressão deverão ser realizados antes do fechamento das alvenarias, conforme preconizam as normas técnicas.</p>
    <p>As passagens de tubulações através de elementos estruturais (vigas, lajes) deverão ser executadas utilizando-se passadores ("sleeves") previamente posicionados na concretagem, não sendo permitido o corte ou furação da estrutura sem prévia autorização do engenheiro calculista.</p>
  `,
  manualUsoManutencao: `
    <h4>Manutenção Preventiva</h4>
    <ul>
      <li><strong>Caixas d'água:</strong> Limpeza e desinfecção a cada 6 meses (NBR 5626, Anexo C).</li>
      <li><strong>Caixas de gordura:</strong> Limpeza a cada 3 meses ou quando a camada de gordura atingir 5 cm. O material retido deve ser acondicionado em sacos plásticos e descartado no lixo comum.</li>
      <li><strong>Calhas e condutores:</strong> Inspeção e limpeza semestral, principalmente antes do período de chuvas, para remoção de folhas, galhos e outros detritos que possam causar obstrução.</li>
      <li><strong>Ralos e sifões:</strong> Limpeza mensal para evitar entupimentos e maus odores, garantindo o fecho hídrico.</li>
      <li><strong>Válvulas e registros:</strong> Operar (abrir e fechar) todos os registros a cada 6 meses para evitar que travem por acúmulo de sedimentos ou oxidação.</li>
      <li><strong>Sistema de tratamento de esgoto (Fossa/Filtro):</strong> Inspeção anual do nível de lodo e remoção por empresa especializada conforme a periodicidade de projeto.</li>
    </ul>
    <h4>Uso Correto</h4>
    <ul>
      <li>Não descartar óleo de cozinha, restos de comida, fios de cabelo, cotonetes, preservativos, absorventes, fio dental ou qualquer outro material sólido nas pias, ralos e vasos sanitários.</li>
      <li>Utilizar as instalações de forma consciente, evitando desperdício de água e verificando periodicamente a existência de vazamentos.</li>
      <li>Em caso de vazamentos, fechar o registro geral correspondente e contatar um profissional qualificado.</li>
    </ul>
  `,
  aguafria: {
    descricao: "<p>O sistema de água fria foi projetado para abastecer todos os pontos de consumo da edificação com água potável, garantindo vazão e pressão adequadas conforme a NBR 5626. O sistema compreende o ramal de alimentação predial, reservatórios, sistema de bombeamento (se necessário) e a rede de distribuição com prumadas e ramais. O objetivo é fornecer água de forma contínua, em quantidade suficiente e com as pressões corretas para o funcionamento de todos os aparelhos sanitários e equipamentos.</p>",
    criterios: "<p>O dimensionamento foi baseado na estimativa de consumo diário, considerando uma população de cálculo e um consumo per capita definidos pela NBR 5626 e pelo tipo de edificação. A reservação foi calculada para garantir autonomia de no mínimo 2 dias, conforme recomendação normativa, podendo incluir uma Reserva Técnica de Incêndio (RTI) quando aplicável. A perda de carga na rede de distribuição foi calculada pelo método de Hazen-Williams, garantindo as pressões dinâmicas mínimas nos pontos de utilização e limitando a velocidade máxima da água em 3,0 m/s para evitar ruídos, vibrações e sobrepressões (golpe de aríete).</p>",
    recomendacoes: "<p>Verificar a estanqueidade de todas as juntas e conexões através de teste de pressão antes do fechamento das paredes, conforme procedimento da NBR 5626. Instalar todas as válvulas e registros em locais de fácil acesso para operação e manutenção. Garantir a correta fixação das tubulações com abraçadeiras e suportes adequados para evitar deformações e ruídos. A limpeza e desinfecção dos reservatórios deve ser realizada semestralmente.</p>"
  },
  aguaquente: {
    descricao: "<p>O sistema de água quente destina-se ao aquecimento e distribuição de água para os pontos de consumo designados, como chuveiros e lavatórios. O sistema pode ser individual (por aquecedor de passagem) ou central (com boiler e recirculação). O objetivo é fornecer água na temperatura de projeto, de forma rápida e segura, minimizando o desperdício de água e energia.</p>",
    criterios: "<p>O dimensionamento baseia-se na NBR 7198, determinando o volume de acumulação e a potência do aquecedor com base na demanda de água quente, calculada pelo método de consumo ou pela soma das vazões dos aparelhos. As tubulações foram dimensionadas para suportar as temperaturas e pressões de trabalho, utilizando materiais adequados como CPVC, PPR ou cobre. Para sistemas centrais, foi previsto um anel de recirculação para manter a água quente disponível nos pontos mais distantes, reduzindo o tempo de espera do usuário.</p>",
    recomendacoes: "<p>As tubulações de água quente devem ser isoladas termicamente para minimizar perdas de calor e otimizar a eficiência energética. A instalação dos aquecedores deve seguir rigorosamente as recomendações do fabricante, garantindo ventilação adequada (para equipamentos a gás) e dispositivos de segurança como válvulas de alívio de pressão e temperatura.</p>"
  },
  esgotosanitario: {
    descricao: "<p>O sistema de esgoto sanitário foi projetado para coletar e conduzir os efluentes dos aparelhos sanitários para o destino final adequado (rede pública ou sistema de tratamento individual), conforme a NBR 8160. O sistema é composto por ramais de descarga, ramais de esgoto, tubos de queda, subcoletores, coletor predial e dispositivos de inspeção, além do sistema de ventilação.</p>",
    criterios: "<p>O dimensionamento dos ramais e colunas de esgoto foi realizado com base nas Unidades Hunter de Contribuição (UHC) de cada aparelho. Foi previsto um sistema de ventilação primária (prolongamento dos tubos de queda) e, se necessário, ventilação secundária, para proteger o fecho hídrico dos desconectores (sifões) contra a ruptura por aspiração ou compressão e permitir o escoamento dos gases para a atmosfera.</p>",
    recomendacoes: "<p>Garantir as declividades mínimas para as tubulações horizontais (DN100: 1%, DN75: 2%). Todas as mudanças de direção devem ser feitas com peças de inspeção ou curvas de raio longo. O sistema deve ser testado com água para verificar a estanqueidade antes da concretagem dos pisos. Os tubos de queda não devem ser instalados em paredes de dormitórios e salas, para evitar problemas com ruídos.</p>"
  },
  esgotogorduroso: {
    descricao: "<p>O sistema de esgoto gorduroso prevê a separação dos resíduos gordurosos provenientes de pias de cozinha e máquinas de lavar louça antes de serem lançados na rede de esgoto principal. Isso é feito através de caixas de gordura dimensionadas conforme a NBR 8160, que evitam a obstrução das tubulações e a contaminação da rede coletora.</p>",
    criterios: "<p>O volume da caixa de gordura foi determinado com base no tipo de ocupação (residencial ou comercial) e no número de cozinhas ou refeições servidas. A norma estabelece volumes mínimos para cada situação, garantindo um tempo de retenção adequado para que a gordura se separe da água por diferença de densidade.</p>",
    recomendacoes: "<p>A caixa de gordura deve ser instalada em local de fácil acesso, com tampa hermética e removível, para permitir a limpeza e manutenção periódica, que é fundamental para o seu correto funcionamento. A limpeza deve ser feita regularmente, descartando-se os resíduos sólidos em lixo apropriado.</p>"
  },
  drenagempluvial: {
    descricao: "<p>O sistema de drenagem pluvial tem como finalidade coletar e conduzir as águas provenientes das chuvas nas áreas de cobertura e pisos para um destino seguro (rede pública, sarjeta ou sistema de infiltração), evitando alagamentos e infiltrações, conforme a NBR 10844.</p>",
    criterios: "<p>O dimensionamento de calhas, ralos e condutores foi baseado na intensidade pluviométrica da região para um determinado período de retorno (tipicamente 25 anos para áreas de risco e 5 anos para as demais), na área de contribuição e no coeficiente de escoamento superficial (runoff) do material da superfície. A capacidade de escoamento foi verificada utilizando a Equação de Manning para calhas e as tabelas da norma para condutores.</p>",
    recomendacoes: "<p>As calhas devem ter declividade adequada para o escoamento (mínimo 0,5%) e serem instaladas com suportes resistentes. É essencial realizar a limpeza periódica de calhas e grelhas para evitar obstruções por folhas e detritos. As conexões entre os elementos do sistema devem ser estanques.</p>"
  },
  reusodeaguapluvial: {
    descricao: "<p>O sistema de reúso de água pluvial visa captar, armazenar e tratar a água da chuva para fins não potáveis, como irrigação de jardins, lavagem de pisos e descargas em vasos sanitários, promovendo a economia de água potável e a sustentabilidade hídrica da edificação, conforme a NBR 15527.</p>",
    criterios: "<p>O dimensionamento do reservatório considera o volume de chuva captável (baseado em índices pluviométricos e área de captação), a demanda para fins não potáveis e o período de estiagem. O sistema inclui dispositivos de descarte de água inicial (\"first flush\") para eliminar as impurezas da primeira chuva e um sistema de tratamento (filtração e desinfecção) para garantir a qualidade da água armazenada.</p>",
    recomendacoes: "<p>A identificação das tubulações de água não potável deve ser clara e distinta da rede de água potável (cor lilás) para evitar consumo indevido. A manutenção dos filtros e do sistema de tratamento (ex: troca de pastilhas de cloro) é crucial para a qualidade da água e deve ser feita conforme as orientações do fabricante.</p>"
  },
  gascombustivel: {
    descricao: "<p>O sistema de gás combustível (GLP ou GN) foi projetado para distribuir o gás de forma segura e eficiente desde a central (ou cavalete) até os pontos de utilização (fogões, aquecedores), de acordo com a NBR 15526. O projeto visa garantir a segurança contra vazamentos e a correta operação dos aparelhos.</p>",
    criterios: "<p>A tubulação foi dimensionada para garantir a vazão necessária aos equipamentos com uma perda de carga admissível (geralmente 10% da pressão de trabalho), assegurando a pressão correta de funcionamento. Foram especificados materiais resistentes e adequados para o tipo de gás (ex: aço ou cobre). O dimensionamento considera a potência somada dos equipamentos, o comprimento dos trechos e o tipo de gás.</p>",
    recomendacoes: "<p>A instalação deve ser realizada por profissional qualificado. O abrigo de gás deve possuir ventilação permanente e estar localizado em área externa e de fácil acesso. Após a instalação, toda a rede deve ser submetida a um teste de estanqueidade para garantir a ausência de vazamentos. É proibida a passagem da tubulação de gás por espaços confinados sem ventilação, dormitórios e poços de elevador.</p>"
  },
};