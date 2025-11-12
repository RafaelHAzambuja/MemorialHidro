
import { tubulacoesDB } from '../constants';
import { BuildingData, ReusoPluvial, AreaPluvial } from '../types';

/**
 * Converte um arquivo para Base64.
 * @param {File} file - O arquivo a ser convertido.
 * @returns {Promise<string>} Uma string Base64.
 */
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

/**
 * Estima a população com base no número de dormitórios.
 * @param {number} dormitorios - Número de dormitórios.
 * @returns {number} População estimada.
 */
export const estimatePopulation = (dormitorios: number): number => {
  if (dormitorios > 0) {
    return Math.ceil(dormitorios * 2.5);
  }
  return 0;
};


/**
 * Calcula a demanda de água não potável para reúso.
 * @param {BuildingData} buildingData - Dados da edificação.
 * @param {string} tipoEdificacao - Nome do tipo de edificação.
 * @param {ReusoPluvial} reusoPluvial - Objeto reativo do reúso pluvial.
 * @param {AreaPluvial[]} areasPluviais - Array reativo das áreas pluviais.
 * @returns {{demanda: number, area: number}}
 */
export const calculateDemandaReuso = (
  buildingData: BuildingData,
  tipoEdificacao: string,
  reusoPluvial: ReusoPluvial,
  areasPluviais: AreaPluvial[]
): { demanda: number; area: number } => {
  const pessoas = buildingData.pessoas || 0;
  const areaTotal = buildingData.areaTotal || 0;
  let demandaBase = 0;
  let areaCaptacao = 0;

  // Calcular área de captação
  const areaTotalPluviais = areasPluviais.reduce(
    (total, area) => total + (area.usarParaReuso ? (Number(area.area) || 0) : 0),
    0
  );

  if (areaTotalPluviais > 0) {
    areaCaptacao = areaTotalPluviais;
  } else {
    switch (tipoEdificacao) {
      case "Unifamiliar": areaCaptacao = Math.max(150, areaTotal * 0.6); break;
      case "Multifamiliar": areaCaptacao = Math.max(800, areaTotal * 0.16); break;
      case "Comercial": areaCaptacao = Math.max(400, areaTotal * 0.27); break;
      case "Industrial": areaCaptacao = Math.max(600, areaTotal * 0.2); break;
      default: areaCaptacao = Math.max(300, areaTotal * 0.3);
    }
  }

  // Calcular demanda base
  switch (tipoEdificacao) {
    case "Unifamiliar": demandaBase = pessoas * 50; break;
    case "Multifamiliar": demandaBase = pessoas * 40; break;
    case "Comercial": demandaBase = pessoas * 16; break;
    case "Industrial": demandaBase = pessoas * 30; break;
    default: demandaBase = pessoas * 35;
  }

  // Ajustar demanda pelos usos
  let multiplicador = 1;
  if (reusoPluvial.usoIrrigacao) multiplicador += 0.3;
  if (reusoPluvial.usoLimpeza) multiplicador += 0.2;
  if (reusoPluvial.usoDescarga) multiplicador += 0.4;
  if (reusoPluvial.usoCombateIncendio) multiplicador += 0.1;

  return {
    demanda: Math.round(demandaBase * multiplicador),
    area: Math.round(areaCaptacao),
  };
};

/**
 * Obtém o diâmetro interno real (em mm) do banco de dados.
 * @param {string} material - (ex: 'pvc').
 * @param {number} diametroNominal - (ex: 25).
 * @returns {number} Diâmetro interno em mm.
 */
export const getDiametroInterno = (material: keyof typeof tubulacoesDB, diametroNominal: number): number => {
    const materialData = tubulacoesDB[material];
    if (materialData && (materialData as any)[diametroNominal]) {
        return (materialData as any)[diametroNominal].interno;
    }
    // Fallback para aproximação
    return diametroNominal * 0.9;
};