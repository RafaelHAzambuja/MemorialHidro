export interface ProjectInfo {
  name: string;
  location: string;
  date: string;
  proprietario: string;
  inscricaoImobiliaria: string;
  memorialVersions: MemorialVersion[];
}

export interface MemorialVersion {
  id: number;
  version: string;
  date: string;
  description: string;
  author: string;
}

export interface Engenheiro {
  nome: string;
  crea: string;
  cpf: string;
  telefone: string;
  art: string;
}

export interface BuildingData {
  pavimentos: number;
  pessoas: number;
  dormitorios: number;
  pisos: number;
  aptPorAndar: number;
  pessoasPorApt: number;
  areaTotal: number;
}

export interface ProjectData {
  consumoPerCapita: number;
  diasReserva: number;
  metodoConsumo: 'perCapita' | 'area';
  consumoPorArea: number; // L/m²/dia
}

export interface Reservatorios {
  numSuperiores: number;
  numInferiores: number;
  percentualSuperior: number;
  material: string;
  reservaIncendio: number;
  volumeSuperiorComercial?: number;
  volumeInferiorComercial?: number;
}

export interface PecaRecalque {
  id: number;
  nome: string;
  quantidade: number;
}

export interface Bomba {
  id: number;
  nome: string;
  fabricante: string;
  npshRequerido: number;
  curva: [number, number][]; // [vazao_m3h, amt_mca]
}

export interface Bombeamento {
  alturaSuccao: number;
  alturaRecalque: number;
  comprimentoReal: number;
  rendimento: number;
  configuracao: 'simples' | 'serie' | 'paralelo';
  numBombas: number;
  potenciaPorBomba: number;
  pressaoAtmosferica: number;
  temperaturaAgua: number;
  tempoFechamentoValvula: number; // New for transient analysis
  bombaSelecionada: string; // New for pump library
  horasFuncionamento: number; // New
  suggestedPumps?: { nome: string; fabricante: string; vazao: number; amt: number; status: string }[];
}

export interface BombeamentoDetalhes {
  material: string;
  diametro: number;
  pecas: PecaRecalque[];
}

export interface AparelhoConsumo {
  nome: string;
  quantidade: number;
}

export interface PecaConexao {
  nome: string;
  quantidade: number;
}

export interface Trecho {
  id: number;
  descricao: string;
  somaPesos: number; // Continuará sendo calculado, mas a fonte de dados muda
  aparelhos: AparelhoConsumo[]; // Nova fonte de dados para cálculo de pesos
  comprimentoReal: number;
  alturaInicial: number;
  alturaFinal: number;
  conexoes: PecaConexao[];
  aparelho: string;
  // Propriedades calculadas
  pressaoMinimaAtendida?: boolean;
  velocidadeExcessiva?: boolean; // New
  vazao?: number;
  velocidade?: number;
  diametroNominal?: number;
  perdaCargaDistribuida?: number;
  perdaCargaLocalizada?: number;
  perdaCargaTotal?: number;
  perdaCargaAcumulada?: number;
  perdaCargaUnitaria?: number;
  comprimentoEquivalente?: number;
  comprimentoVirtual?: number;
  desnivel?: number;
  pressaoDisponivel?: number;
  pressaoFinal?: number;
  pressaoAltura?: number;
}


export interface Caminho {
  id: number;
  nome: string;
  pressaoInicial: number;
  trechos: Trecho[];
  perdaTotal?: number;
  sugestoesOtimizacao?: { trechoId: number, descricao: string, novoDiametro: number, justificativa: string }[];
}

export interface VRP {
  id: number;
  habilitado: boolean;
  localizacao: string;
  pressaoMontante: number;
  pressaoJusanteDesejada: number;
  status?: string;
}

export interface AguaFria {
  material: string;
  coeficienteHW: number;
  metodoCalculo: 'hazen-williams' | 'darcy-weisbach';
  rugosidade: number;
  caminhos: Caminho[];
  vrp: VRP;
  hidrometro?: {
    vazaoMaximaProvavel: number;
    diametroSugerido: number;
  };
  sugestaoVRP?: {
    necessaria: boolean;
    pavimentoSugerido: number;
    pressaoEstaticaCalculada: number;
  };
  alimentadorPredial: { // Novo
    comprimento: number;
    material: 'pvc' | 'pead';
    velocidadeMaxima: number;
    diametroSugerido?: number;
    perdaCargaCalculada?: number;
  };
}

export interface Aquecedor {
    id: number;
    nome: string;
    tipo: 'acumulacao' | 'passagem';
    fabricante: string;
    volume: number; // 0 para passagem
    potencia: number; // kW
}

export interface AguaQuente {
  tipoSistema: 'individual' | 'central';
  tempAguaFria: number;
  tempAguaQuente: number;
  tempoAquecimento: number;
  caminhos: Caminho[];
  recirculacao: {
    habilitado: boolean;
    comprimentoAnel: number;
    material: 'cobre' | 'ppr' | 'cpvc';
    diametro: number;
    potenciaBomba?: number;
    perdaCarga?: number;
    perdaTermica?: number;
  };
  vasoExpansao: {
    habilitado: boolean;
    pressaoMinimaRede: number; // bar
    pressaoMaximaRede: number; // bar
    volumeCalculado?: number; // Litros
  };
  aquecedoresDB: Aquecedor[]; // Novo
  aquecedorSelecionadoId: number | null; // Novo
}

export interface RamalVentilacao { // New
  id: number;
  descricao: string;
  uhc: number;
  comprimento: number;
  diametro?: number;
}

export interface ElevatoriaEsgoto {
  habilitado: boolean;
  alturaRecalque: number;
  comprimentoRecalque: number;
  materialRecalque: 'pvc' | 'ferro';
  volumePocoCalculado?: number;
  bombaSugerida?: string;
  vazaoBomba?: number;
  amtBomba?: number;
}

export interface EsgotoSanitario {
  metodoCalculo: 'uhc' | 'probabilistico';
  numTubosQueda: number;
  numColunasVentilacao: number;
  diametroVentilacao?: number;
  ramaisVentilacao: RamalVentilacao[]; // New
  comprimentoColetor: number;
  numCurvas90: number; // Novo
  numCurvas45: number; // Novo
  sugestoesInspecao?: string[]; // Novo
  elevatoria?: ElevatoriaEsgoto;
}

export interface EsgotoItem {
  aparelho: string;
  quantidade: number;
}

export interface EsgotoTratamento {
  habilitado: boolean;
  contribuicaoEsgoto: number;
  intervaloLimpeza: number;
  taxaInfiltracao: number;
  numFossas: number;
  fossaComprimento?: number;
  fossaLargura?: number;
  fossaProfundidadeUtil?: number;
  numFiltros: number;
  filtroDiametro?: number;
  filtroAlturaUtil?: number;
  numSumidouros: number;
  sumidouroDiametro?: number;
  sumidouroAlturaUtil?: number;
  tipoDisposicaoFinal: 'sumidouro' | 'valaInfiltracao';
  valaLargura?: number;
  leitoSecagem: {
    habilitado: boolean;
    area?: number;
  };
}

export interface GorduraData {
  numeroRefeicoes: number;
  numeroCozinhas: number;
  numTubosQuedaGordura: number;
}

export interface ColetorPluvial {
  id: number;
  descricao: string;
  areaServida: number; // m²
  comprimento: number; // m
  declividade: number; // %
  diametro: number; // mm
  // Calculated
  vazao?: number; // L/s
  laminaAgua?: number; // mm
  velocidade?: number; // m/s
  tensaoArrasto?: number; // Pa
  autolimpante?: boolean;
}

export interface Drenagem {
  intensidade: number;
  periodoRetorno: number;
  larguraCalha: number; // Represents top width for trapezoidal
  alturaCalha: number;
  materialCalha: string;
  declividadeCalha: number;
  tipoCalha: 'retangular' | 'semicircular' | 'trapezoidal'; // New
  diametroCalha: number; // for semicircular
  baseMenorCalha: number; // for trapezoidal
  tanqueRetencao: {
    habilitado: boolean;
    tempoChuva: number; // em minutos
  };
  coletores: ColetorPluvial[];
}

export interface AreaPluvial {
  id: number;
  area: number;
  coeficiente: number;
  tubosQueda: number;
  usarParaReuso: boolean;
}

export interface ReusoPluvial {
  habilitado: boolean;
  areaCaptacao: number;
  coeficienteRunoff: number;
  demandaNaoPotavel: number;
  periodoArmazenamento: number;
  eficienciaFiltro: number;
  eficienciaReservatorio: number;
  profundidadeReservatorio: number;
  larguraReservatorio: number;
  comprimentoReservatorio: number;
  tipoReservatorio: string;
  materialReservatorio: string;
  sistemaFiltragem: string;
  tratamentoQuimico: boolean;
  cloroAtivo: number;
  tempoContato: number;
  usoIrrigacao: boolean;
  usoLimpeza: boolean;
  usoDescarga: boolean;
  usoCombateIncendio: boolean;
  custoAguaPotavel: number;
  custoEnergia: number;
  vidaUtil: number;
  taxaJuros: number;
  manutencaoAnual: number;
  precipitacaoMedia: number;
  intensidadeChuva: number;
  periodoRetorno: number;
  volumeCaptado: number;
  volumeReservatorio: number;
  economiaAnual: number;
  payback: number;
  reducaoConsumo: number;
  metodoDimensionamentoReservatorio: 'automatico' | 'manual'; // New
  volumeReservatorioAdotado: number; // New
}

export interface TrechoGas {
  id: number;
  descricao: string;
  comprimento: number;
  potencia: number;
  // Propriedades calculadas
  potenciaAcumulada?: number;
  vazao?: number;
  diametro?: number;
  perdaCarga?: number;
  perdaCargaAcumulada?: number;
}

export interface CaminhoGas {
    id: number;
    nome: string;
    trechos: TrechoGas[];
    perdaTotal?: number;
}

export interface Gas {
  tipo: 'glp' | 'gn';
  tipoCentral: 'individual' | 'central';
  capacidadeCentral: number;
  tipoCilindro?: 'P13' | 'P45' | 'P190';
  numCilindros?: number;
  pressaoEntrada: number;
  pressaoSaida: number;
  caminhos: CaminhoGas[];
  abrigo?: {
    dimensoes: string;
    ventilacao: string;
  }
}

export interface Plantas {
  plantaBaixa: File | null;
  cortes: File | null;
  drenagem: File | null;
}

export interface PlantasBase64 {
  plantaBaixa: string | null;
  cortes: string | null;
  drenagem: string | null;
}

export interface BuildingType {
  name: string;
  icon: string;
  description: string;
}

export interface CalculationResult {
  label: string;
  value: string | number;
  unit: string;
}

export interface CalculationStep {
  description: string;
  detail: string;
}

export interface Norma {
    codigo: string;
    descricao: string;
}

export interface Module {
  name: string;
  description: string;
  icon: string;
  results: CalculationResult[];
  calculationSteps: CalculationStep[];
  normas: Norma[];
  // Dados detalhados calculados para tabelas e relatórios
  caminhos?: Caminho[];
  caminhosGas?: CaminhoGas[];
}

export interface System {
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export interface ComplianceItem {
  id: string;
  norma: string;
  item: string;
  status: 'atendido' | 'pendente' | 'na';
  justificativa: string;
}

export interface ProjectState {
  selectedBuildingType: number;
  projectInfo: ProjectInfo;
  engenheiro: Engenheiro;
  buildingData: BuildingData;
  projectData: ProjectData;
  reservatorios: Reservatorios;
  bombeamento: Bombeamento;
  bombeamentoDetalhes: BombeamentoDetalhes;
  bombasDB: Bomba[]; // Novo
  aguaFria: AguaFria;
  aguaQuente: AguaQuente;
  esgotoSanitario: EsgotoSanitario;
  esgotoItens: EsgotoItem[];
  esgotoTratamento: EsgotoTratamento;
  gorduraData: GorduraData;
  drenagem: Drenagem;
  reusoPluvial: ReusoPluvial;
  areasPluviais: AreaPluvial[];
  gas: Gas;
  plantas: Plantas;
  plantasBase64: PlantasBase64;
  customLogo: string | null;
  systems: System[];
  modules: Module[];
}