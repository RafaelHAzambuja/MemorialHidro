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
    floorGroups: [
      { id: 1, numFloors: 10, aptsPerFloor: 4 }
    ],
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
    percentualIncendioSuperior: 100,
    integracaoIncendio: 'somar',
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
  gorduraData: { numeroRefeicoes: 50, numeroCozinhas: 1, numTubosQuedaGordura: 1, tipoInstalacao: 'central' },
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
  lixeira: {
    tipoColeta: 'seletiva',
    contribuicaoDiaria: 2.5,
    frequenciaColeta: 2,
    taxaAcumulacao: 1.25,
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
    { name: "Lixeira", icon: "fas fa-trash-alt", description: "Dimensionamento do abrigo de resíduos sólidos", enabled: true },
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
    { name: "Lixeira", description: "Cálculo de volume e área do abrigo de resíduos", icon: "fas fa-trash-alt", results: [], calculationSteps: [], normas: [
        { codigo: "NBR 13463", descricao: "Coleta de resíduos sólidos" },
        { codigo: "NBR 12235", descricao: "Armazenamento de resíduos sólidos perigosos" },
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
    <p>Todos os materiais empregados na execução das instalações hidrossanitárias deverão ser rigorosamente novos, livres de qualquer sinal de desgaste ou utilização prévia e pertencentes à categoria de primeira qualidade disponibilizada pelos fabricantes, atendendo integralmente às especificações, requisitos de desempenho e critérios de conformidade estabelecidos pelas normas técnicas da ABNT aplicáveis a cada tipo de componente. Essa exigência abrange tubulações, conexões, peças especiais, registros, válvulas de retenção, dispositivos de proteção, acessórios e qualquer outro elemento destinado à composição do sistema, devendo todos possuir certificação, rastreabilidade e características compatíveis com o uso projetado. A execução dos serviços será obrigatoriamente conduzida por mão de obra qualificada, composta por profissionais com conhecimento técnico comprovado e experiência na instalação de sistemas hidrossanitários, garantindo que todas as operações sigam as recomendações dos fabricantes e as boas práticas de engenharia. O acompanhamento das atividades deverá ocorrer sob a supervisão direta de um profissional legalmente habilitado, devidamente registrado no conselho de classe competente, responsável por assegurar a correta interpretação do projeto, o atendimento às exigências normativas e a compatibilização das soluções executadas com os demais projetos da edificação.</p>
    <p>As tubulações deverão ser instaladas de modo a permitir de maneira adequada os movimentos de dilatação e contração decorrentes de variações térmicas ou de pressões internas, evitando-se a transmissão de tensões que possam comprometer a integridade estrutural das linhas ou provocar deformações, fissuras, ruídos hidráulicos ou falhas de desempenho. Para isso, deverão ser observadas as recomendações específicas das normas da ABNT — especialmente aquelas constantes da NBR 5626, no que se refere às instalações de água fria e quente — e as instruções técnicas dos fabricantes sobre espaçamento, fixação, curvaturas admissíveis, apoios e pontos de ancoragem. Além disso, todos os trechos instalados deverão ser submetidos aos testes de estanqueidade e de pressão requeridos antes do fechamento das alvenarias ou qualquer outra forma de acabamento definitivo, garantindo que eventuais vazamentos, defeitos de conexão ou irregularidades nos materiais sejam identificados e corrigidos sem necessidade de demolições posteriores. Esses ensaios deverão ser realizados conforme os procedimentos descritos nas normas brasileiras pertinentes, assegurando a confiabilidade e a segurança dos sistemas antes de sua operação.</p>
    <p>As passagens de tubulações através de elementos estruturais, como vigas e lajes, deverão ser executadas exclusivamente por meio de passadores, ou “sleeves”, devidamente dimensionados, especificados no projeto e posicionados antes da concretagem, de forma a garantir a integridade da estrutura e a permitir o acomodamento das tubulações sem interferências ou danos às armaduras. Não será permitido, em hipótese alguma, o corte, furação, rasgo ou qualquer alteração posterior na estrutura de concreto armado, salvo mediante autorização formal e expressa do engenheiro calculista responsável pelo projeto estrutural, o qual deverá avaliar tecnicamente a viabilidade da intervenção, estabelecer limites, indicar reforços quando necessários e garantir que não haja prejuízo à capacidade resistente do elemento. A observância rigorosa dessas diretrizes assegura a compatibilização entre as disciplinas de engenharia, reduz riscos de patologias, evita comprometimentos estruturais e atende plenamente às boas práticas de projeto e execução previstas nas normas brasileiras.</p>
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
    descricao: "<p>O sistema de água fria da edificação foi concebido com o objetivo de assegurar o abastecimento contínuo e seguro de água potável a todos os pontos de consumo, atendendo integralmente aos requisitos de desempenho, segurança sanitária e funcionalidade estabelecidos pela NBR 5626. Para isso, o sistema foi estruturado de forma a incluir o ramal de alimentação predial, os reservatórios de armazenamento, o eventual conjunto de bombeamento quando necessário para suprir diferenças de nível ou pressões insuficientes, bem como toda a rede interna de distribuição, composta por prumadas, ramais e ligações às peças de utilização. O projeto considerou a garantia de vazões e pressões adequadas ao perfeito funcionamento dos aparelhos sanitários e equipamentos instalados, observando não apenas os parâmetros normativos, mas também o perfil de uso previsto para a edificação, buscando assegurar conforto operacional, regularidade no fornecimento e eficiência no transporte da água ao longo de toda a rede.</p>",
    criterios: "<p>Para a definição das características hidráulicas do sistema, o dimensionamento foi realizado com base em estimativas criteriosas de consumo diário, tomando como referência a população de cálculo e os consumos per capita recomendados pela NBR 5626, ajustados ao tipo e à finalidade da edificação. A reservação foi projetada para garantir autonomia mínima necessária, em conformidade com as recomendações normativas e com o objetivo de manter o abastecimento mesmo em situações de interrupção no fornecimento público, podendo incluir, quando exigido pela regulamentação local ou pelo Corpo de Bombeiros, a previsão de uma Reserva Técnica de Incêndio devidamente segregada. O cálculo das perdas de carga ao longo da rede de distribuição foi desenvolvido utilizando o método de Hazen-Williams, técnica amplamente reconhecida pelas boas práticas de engenharia para sistemas prediais, assegurando que as pressões dinâmicas mínimas nos pontos de utilização permanecessem dentro dos limites aceitáveis. Adicionalmente, a velocidade da água foi rigorosamente limitada ao valor máximo de 3,0 m/s, de modo a evitar ruídos, vibrações, erosão interna das tubulações e riscos de sobrepressões decorrentes do golpe de aríete. O traçado e o posicionamento das tubulações também foram definidos com atenção ao equilíbrio do sistema, evitando trajetos excessivamente longos ou desnecessárias mudanças de direção que pudessem comprometer a eficiência hidráulica.</p>",
    recomendacoes: "<p>Visando à segurança e à confiabilidade do sistema, todas as juntas e conexões deverão ser verificadas quanto à estanqueidade por meio de testes de pressão realizados previamente ao fechamento das paredes ou à aplicação de revestimentos, seguindo integralmente os procedimentos previstos na NBR 5626. As válvulas, registros de manobra e demais dispositivos de controle deverão ser instalados em locais acessíveis, de forma a permitir operações de manutenção, intervenções emergenciais e manobras rotineiras sem prejuízos à edificação ou ao usuário. A fixação das tubulações deverá ser executada com o uso de abraçadeiras e suportes adequadamente dimensionados, garantindo que todos os trechos permaneçam firmes e devidamente alinhados, sem risco de deformações, pontos de tensão excessiva ou surgimento de ruídos hidráulicos indesejáveis. Os reservatórios deverão ser submetidos a procedimentos regulares de limpeza e desinfecção, recomendando-se que tais atividades sejam realizadas, no mínimo, a cada seis meses, conforme as boas práticas sanitárias e de manutenção preventiva, assegurando a preservação da qualidade da água distribuída aos usuários.</p>"
  },
  aguaquente: {
    descricao: "<p>O sistema de água quente da edificação foi concebido com a finalidade de aquecer e distribuir água em temperaturas adequadas aos pontos de utilização previstos no projeto, incluindo chuveiros, lavatórios, pias e demais aparelhos que demandem fornecimento de água aquecida. A concepção do sistema considerou tanto a possibilidade de instalações individuais, por meio de aquecedores de passagem, quanto a adoção de sistemas centrais, compostos por boiler, sistema de acumulação e eventual anel de recirculação, cuja função é manter a água quente disponível de forma imediata nos pontos mais distantes, reduzindo significativamente o desperdício de água potável e aumentando o conforto do usuário. O objetivo principal do sistema é garantir o fornecimento de água quente na temperatura de projeto de maneira rápida, segura e eficiente, preservando a integridade dos materiais, a economia de água e a eficiência energética da edificação.</p>",
    criterios: "<p>O dimensionamento hidráulico e térmico do sistema foi desenvolvido segundo as diretrizes da NBR 7198, que estabelece os critérios técnicos para o cálculo das instalações prediais de água quente. A determinação da potência necessária para os aquecedores, bem como do volume de acumulação para sistemas centrais, foi realizada com base na estimativa de demanda simultânea de água quente, calculada tanto pelo método de consumo específico quanto pela soma das vazões nominais dos aparelhos atendidos, conforme a aplicabilidade das situações de uso. As tubulações foram definidas considerando a necessidade de suportar as temperaturas operacionais e as pressões de trabalho características de sistemas de água quente, selecionando-se materiais tecnicamente adequados, tais como CPVC, PPR ou cobre, todos em conformidade com as normas brasileiras e com as especificações dos fabricantes. Para os sistemas centrais, a inclusão de um circuito de recirculação foi projetada com o intuito de manter a temperatura da água constante ao longo da rede, evitando perdas térmicas excessivas e garantindo um tempo mínimo de espera para atendimento dos usuários, o que contribui tanto para o conforto como para a racionalização do consumo de água.</p>",
    recomendacoes: "<p>A eficiência e a segurança do sistema foram tratadas como premissas fundamentais durante o desenvolvimento do projeto. Para isso, todas as tubulações destinadas ao transporte de água quente deverão ser adequadamente isoladas termicamente, reduzindo significativamente as perdas por condução ao longo do percurso e contribuindo para a otimização do desempenho energético do sistema. A instalação dos aquecedores, sejam eles elétricos ou a gás, deverá obedecer rigidamente às recomendações fornecidas pelos fabricantes, sobretudo no que diz respeito ao atendimento das condições de ventilação, ao posicionamento dos componentes, à fixação mecânica, à correta alimentação hidráulica e à previsão de elementos de proteção. No caso de equipamentos a gás, torna-se indispensável assegurar ventilação permanente, exaustão adequada e ambientes compatíveis com os limites normativos e de segurança, garantindo que o sistema opere sem risco de acúmulo de gases ou deficiências de combustão. Além disso, deverão ser instalados dispositivos de segurança obrigatórios, como válvulas de alívio de pressão e temperatura, destinadas a evitar sobrepressões internas, prevenir a degradação dos componentes e preservar a segurança estrutural do sistema de aquecimento e distribuição.</p>"
  },
  esgotosanitario: {
    descricao: "<p>O sistema de esgoto sanitário da edificação foi concebido com o propósito de coletar, conduzir e destinar adequadamente os efluentes provenientes dos aparelhos sanitários e demais pontos geradores de águas residuárias, atendendo rigorosamente às diretrizes técnicas estabelecidas pela NBR 8160. Esse sistema foi estruturado de maneira a garantir o encaminhamento dos efluentes até o destino final previsto, seja a rede pública de coleta de esgoto quando disponível, seja um sistema individual de tratamento e disposição final, de acordo com as exigências da legislação local e da concessionária de saneamento. A infraestrutura projetada é constituída por ramais de descarga, ramais de esgoto, tubos de queda, subcoletores, coletor predial e pelos dispositivos de inspeção necessários para permitir manutenção eficaz, além do sistema completo de ventilação destinado a assegurar o equilíbrio de pressões internas.</p>",
    criterios: "<p>O dimensionamento dos componentes do sistema foi desenvolvido com base no conceito de Unidades Hunter de Contribuição (UHC), aplicadas conforme a NBR 8160 para quantificar a contribuição de cada aparelho sanitário e, a partir disso, determinar os diâmetros mínimos adequados para ramais, tubos de queda e coletores. Esse método permite prever o comportamento hidráulico do escoamento e evita sobrecargas, transbordamentos ou velocidades inadequadas dentro das tubulações. Além disso, foi prevista a instalação de um sistema de ventilação primária, obtido pelo prolongamento dos tubos de queda até a atmosfera, cuja função é promover a equalização de pressões e permitir a saída segura dos gases decorrentes da decomposição dos efluentes. Quando verificado como necessário pelas características geométricas da edificação, ou quando os comprimentos dos ramais e as situações de uso assim exigirem, foi considerada também a ventilação secundária, de modo a proteger os desconectores — como sifões — contra a ruptura do fecho hídrico por aspiração ou compressão, garantindo assim o bloqueio eficiente da entrada de gases no ambiente interno e atendendo aos princípios de salubridade e segurança sanitária.</p>",
    recomendacoes: "<p>A execução do sistema deverá observar com rigor as declividades mínimas prescritas para tubulações horizontais, adotando-se, conforme o diâmetro, valores usualmente recomendados pela norma, tais como 1% para tubulações DN 100 e 2% para tubulações DN 75, de modo a garantir o escoamento adequado por gravidade, evitando deposição de sólidos, entupimentos e operação deficiente. Todas as mudanças de direção ao longo das redes horizontais e verticais deverão ser realizadas por meio de curvas de raio longo, que reduzem significativamente a perda de carga localizada e favorecem o escoamento contínuo, ou deverão contar com peças que permitam inspeção direta, como caixas e portas de inspeção, facilitando futuras intervenções de manutenção. Antes da concretagem de pisos ou execução dos fechamentos definitivos, o sistema deverá ser submetido a ensaios de estanqueidade com água, seguindo os procedimentos previstos na NBR 8160, assegurando que não haja vazamentos, infiltrações ou falhas nas juntas.</p>"
  },
  esgotogorduroso: {
    descricao: "<p>O sistema de esgoto gorduroso da edificação foi projetado com a finalidade de realizar a separação eficiente dos resíduos gordurosos provenientes das pias de cozinha, cubas de preparo de alimentos e eventuais máquinas de lavar louça, antes que tais efluentes sejam encaminhados para a rede geral de esgoto sanitário. Esse tratamento preliminar é fundamental para evitar a obstrução das tubulações, a formação de depósitos sólidos no interior da rede e a contaminação da infraestrutura pública coletora, assegurando o funcionamento adequado e duradouro de todo o sistema hidrossanitário. A concepção desse sistema segue rigorosamente as diretrizes da NBR 8160, que determina a obrigatoriedade da interceptação da gordura por meio de caixas de gordura devidamente dimensionadas e instaladas, garantindo assim que o escoamento final ocorra isento de partículas adiposas que poderiam causar comprometimentos operacionais.</p>",
    criterios: "<p>O dimensionamento da caixa de gordura foi realizado considerando o tipo de ocupação da edificação, distinguindo entre usos residenciais e comerciais, bem como avaliando o número de cozinhas existentes e a quantidade de refeições servidas diariamente, quando aplicável. A norma estabelece volumes mínimos para cada categoria de uso, assegurando um tempo de retenção adequado para que a separação entre gordura e água ocorra de forma eficiente, baseando-se no princípio físico da diferença de densidade entre os dois meios. Dessa forma, o volume útil da caixa foi projetado para proporcionar a sedimentação de sólidos pesados e a ascensão da fração gordurosa, permitindo a decantação e o acúmulo dos resíduos adiposos de forma controlada e compatível com a demanda prevista no empreendimento. Esse procedimento garante que o efluente lançado na rede de esgoto sanitário esteja substancialmente livre de gordura, reduzindo significativamente a probabilidade de entupimentos, refluxos ou danos às tubulações.</p>",
    recomendacoes: "<p>Quanto à implantação, a caixa de gordura deverá ser instalada em local de fácil acesso, preferencialmente em áreas externas ou em pontos estrategicamente definidos no projeto para facilitar sua inspeção, limpeza e manutenção. O equipamento deverá possuir tampa hermética e removível, construída em material resistente e devidamente vedada, de modo a evitar a liberação de odores desagradáveis e impedir a entrada de insetos ou água de chuva. A manutenção periódica da caixa é indispensável para garantir seu correto funcionamento ao longo da vida útil da edificação, devendo ser realizada em intervalos adequados ao volume de utilização, removendo-se todos os resíduos acumulados e descartando-os em lixo apropriado, sem que sejam lançados diretamente na rede de esgoto ou no meio ambiente. Essa rotina de limpeza é essencial para preservar a eficiência da separação de gordura, prevenir sobrecargas no sistema e evitar que a caixa se torne fonte de obstruções ou problemas sanitários.</p>"
  },
  drenagempluvial: {
    descricao: "<p>O sistema de drenagem pluvial da edificação foi projetado com a finalidade de coletar, conduzir e direcionar de maneira segura e eficiente as águas provenientes das precipitações incidentes sobre as coberturas, terraços, áreas externas pavimentadas e demais superfícies suscetíveis ao escoamento superficial. Tal sistema visa impedir a ocorrência de alagamentos, infiltrações e sobrecargas estruturais, garantindo o escoamento adequado para o destino previsto, que pode incluir a rede pública de águas pluviais, sarjetas ou sistemas específicos de infiltração no solo, sempre de acordo com as condições locais e com as diretrizes estabelecidas pela NBR 10844. A concepção deste sistema foi desenvolvida considerando os princípios de segurança hidráulica e sustentabilidade, assegurando que a água da chuva seja manejada de forma controlada, evitando impactos negativos tanto para a edificação quanto para o entorno urbano.</p>",
    criterios: "<p>O dimensionamento dos elementos que compõem o sistema — incluindo calhas, ralos, bocas de coleta, condutores verticais e horizontais — foi realizado com base em parâmetros pluviométricos específicos da região, levando em consideração a intensidade máxima da chuva correspondente ao período de retorno adotado. Este período, em conformidade com as recomendações técnicas correntes, foi fixado em vinte e cinco anos para áreas consideradas de maior risco ou relevância hidráulica, e em cinco anos para as demais áreas, garantindo um equilíbrio adequado entre segurança, desempenho e viabilidade técnica. Para cada trecho coletor, foram avaliadas a área de contribuição e as características do material das superfícies drenadas, determinando-se o coeficiente de escoamento superficial, ou runoff, que representa a fração de precipitação efetivamente convertida em escoamento. A capacidade hidráulica das calhas foi avaliada com base na Equação de Manning, que permite estimar o escoamento em calhas com diferentes geometrias e inclinações, enquanto os condutores verticais e horizontais foram dimensionados utilizando as tabelas de capacidade fornecidas pela NBR 10844, assegurando compatibilidade entre os volumes captados e a capacidade de transporte da rede.</p>",
    recomendacoes: "<p>Durante o desenvolvimento do projeto, foram estabelecidos cuidados específicos quanto à declividade mínima das calhas, que deverá ser de, pelo menos, 0,5%, a fim de assegurar o escoamento contínuo e evitar acúmulos de água que possam provocar transbordamentos, deterioração dos materiais ou sobrecarga estrutural. Essas calhas deverão ser instaladas com suportes resistentes e adequadamente espaçados, de modo a manter seu alinhamento e impedir deformações que comprometam a eficiência hidráulica. A manutenção preventiva desempenha papel fundamental para o desempenho do sistema, sendo essencial realizar limpezas periódicas das calhas, grelhas e demais pontos de coleta, eliminando folhas, sedimentos e detritos que possam obstruir o fluxo e causar extravasamentos. Além disso, todas as conexões entre os componentes da rede pluvial deverão ser executadas de forma estanque, prevenindo infiltrações nas estruturas adjacentes e garantindo o transporte adequado da água captada até o destino final.</p>"
  },
  reusodeaguapluvial: {
    descricao: "<p>O sistema de reúso de água pluvial da edificação foi projetado com a finalidade de captar, armazenar, tratar e disponibilizar a água da chuva para usos não potáveis, tais como irrigação de jardins, lavagem de pisos, manutenção de áreas externas e descargas em vasos sanitários, promovendo de maneira efetiva a economia de água potável e contribuindo para a sustentabilidade hídrica do empreendimento. A concepção desse sistema segue rigorosamente as diretrizes da NBR 15527, assegurando que todo o processo de coleta, armazenamento e distribuição da água pluvial ocorra de forma controlada, segura e compatível com os requisitos de saúde pública e engenharia sanitária. O sistema integra-se ao conjunto de instalações hidráulicas da edificação, permitindo que a água de chuva seja aproveitada de maneira racional, reduzindo a demanda sobre o abastecimento público e promovendo a eficiência hídrica de forma contínua.</p>",
    criterios: "<p>O dimensionamento do reservatório destinado ao armazenamento da água pluvial levou em consideração o volume potencial de chuva captável, calculado a partir de índices pluviométricos regionais e da área efetiva de captação, que inclui telhados, coberturas e áreas impermeabilizadas. Foram avaliados ainda os padrões de demanda para fins não potáveis da edificação, incluindo a frequência de uso em jardins, pisos e vasos sanitários, bem como o período de estiagem predominante na região, garantindo que o reservatório tenha capacidade suficiente para atender às necessidades de forma contínua, mesmo em períodos de menor precipitação. O sistema incorpora dispositivos de descarte da água inicial da chuva, conhecidos como “first flush”, que eliminam impurezas, sedimentos e partículas suspensas, evitando que esses contaminantes atinjam o reservatório principal. Além disso, foi previsto um sistema de tratamento complementar, incluindo filtração e desinfecção, para assegurar a qualidade da água armazenada e evitar a proliferação de microrganismos, mantendo-a adequada para os usos previstos.</p>",
    recomendacoes: "<p>A operação segura e eficiente do sistema depende de cuidados específicos quanto à identificação das tubulações, que devem ser claramente diferenciadas da rede de água potável, utilizando-se a cor lilás, conforme recomendado pela norma, a fim de prevenir o consumo indevido e garantir a segurança dos usuários. A manutenção regular do sistema é imprescindível, englobando a limpeza periódica do reservatório, a verificação e substituição de filtros e a reposição de agentes desinfetantes, como pastilhas de cloro, conforme as orientações do fabricante e as boas práticas de engenharia. Esses procedimentos asseguram a qualidade da água, prolongam a vida útil dos componentes do sistema e mantêm a eficiência de captação e distribuição.</p>"
  },
  gascombustivel: {
    descricao: "<p>O sistema de gás combustível da edificação foi projetado com a finalidade de distribuir de maneira segura, eficiente e contínua o gás liquefeito de petróleo (GLP) ou o gás natural (GN) desde a central de abastecimento, cavalete ou ponto de entrada até todos os pontos de utilização previstos, incluindo fogões, aquecedores e demais equipamentos compatíveis. O projeto foi desenvolvido seguindo rigorosamente as diretrizes estabelecidas pela NBR 15526, garantindo não apenas a operação adequada dos aparelhos consumidores de gás, mas também a segurança dos ocupantes e da edificação, prevenindo a ocorrência de vazamentos, sobrepressões ou qualquer condição que possa comprometer a integridade física das instalações e das pessoas.</p>",
    criterios: "<p>O dimensionamento da tubulação foi realizado de forma criteriosa, considerando a vazão total necessária para o funcionamento simultâneo de todos os equipamentos, a soma das potências nominais de cada aparelho, o comprimento dos trechos de tubulação, bem como as perdas de carga admissíveis, que normalmente não devem ultrapassar 10% da pressão de trabalho prevista. Foram especificados materiais adequados e certificados para o tipo de gás utilizado, como tubos de aço galvanizado ou cobre, com resistência mecânica compatível com pressões de operação e condições ambientais da instalação. Todo o sistema foi concebido de maneira a manter a pressão de funcionamento dentro dos limites recomendados pelos fabricantes dos equipamentos e pela norma, assegurando eficiência, segurança e durabilidade.</p>",
    recomendacoes: "<p>Para garantir a operação segura do sistema, a instalação deve ser realizada exclusivamente por profissional qualificado, habilitado e familiarizado com as exigências normativas. O abrigo destinado à central de gás deve estar situado em área externa, com ventilação permanente, livre de obstruções e de fácil acesso, permitindo inspeção, manutenção e operação segura. A tubulação não deve atravessar espaços confinados sem ventilação, dormitórios, poços de elevador ou áreas de passagem de pessoas, prevenindo riscos de acúmulo de gás em caso de vazamentos. Após a conclusão da instalação, toda a rede deve ser submetida a rigorosos testes de estanqueidade, conforme procedimentos da NBR 15526, garantindo a ausência total de vazamentos e a confiabilidade do sistema.</p>"
  },
  lixeira: {
    descricao: "<p>O sistema de abrigo de resíduos sólidos da edificação foi projetado com o objetivo de acondicionar temporariamente todos os resíduos gerados, atendendo às normas sanitárias, às exigências de postura municipal e às diretrizes da NBR 13463, garantindo a higienização, organização e segurança ambiental do espaço. A concepção do abrigo tem como finalidade prevenir a proliferação de vetores, odores e contaminações, assegurando que os resíduos, tanto orgânicos quanto recicláveis, permaneçam armazenados de maneira segura e adequada até o momento de sua coleta pelo serviço público. O projeto observa ainda as recomendações municipais sobre disposição de resíduos, promovendo a funcionalidade do espaço urbano e a eficiência na operação de coleta e manutenção.</p>",
    criterios: "<p>O dimensionamento do abrigo foi realizado com base na estimativa de geração diária de resíduos, considerando a população prevista para a edificação, o volume de resíduos per capita e a frequência de coleta do serviço municipal. Para garantir a capacidade adequada, o volume total foi acrescido de uma margem de segurança, garantindo espaço suficiente para acomodar variações sazonais na geração de resíduos. Para atender às exigências de coleta seletiva, o volume interno foi dividido em compartimentos distintos, destinados a resíduos orgânicos/rejeitos e a recicláveis, de forma a permitir a segregação correta dos materiais. A área do abrigo foi calculada levando em consideração a altura de empilhamento recomendada, o volume total de resíduos e a facilidade de movimentação dos contentores. Com base nesses critérios, foram definidos os tipos e quantidades de contentores, incluindo unidades padrão de 240 litros e 1000 litros, que atendem às necessidades da edificação.</p>",
    recomendacoes: "<p>Para garantir o correto funcionamento e a manutenção da higienização, o abrigo deve ser localizado em posição de fácil acesso para os coletores, preferencialmente com entrada independente, evitando interferência com áreas de circulação de usuários. O piso do abrigo deve ser impermeável, lavável e possuir declividade mínima de 2% direcionada a um ralo sifonado conectado à rede de esgoto, permitindo a drenagem e limpeza eficiente do local. As paredes devem ser revestidas com material liso e lavável, com altura mínima de 2,0 metros, prevenindo o acúmulo de resíduos e facilitando a higienização. Deve ser previsto ponto de água para limpeza e manutenção periódica, ventilação adequada para evitar odores e um sistema de fechamento com porta de largura suficiente para a passagem dos contentores. Essas medidas asseguram a operação contínua e segura do abrigo, em conformidade com as boas práticas de engenharia, normas técnicas e exigências municipais.</p>"
  },
};