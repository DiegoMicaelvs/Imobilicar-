/**
 * FIPE API integration utilities
 * FIPE (Fundação Instituto de Pesquisas Econômicas) provides vehicle pricing data
 */

const FIPE_BASE_URL = 'https://parallelum.com.br/fipe/api/v2/cars';

export interface FipeBrand {
  name: string;
  code: string;
}

export interface FipeModel {
  name: string;
  code: string;
}

export interface FipeYear {
  name: string;
  code: string;
}

export interface FipePrice {
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
}

export interface FipeVehicleData {
  brand: string;
  model: string;
  year: string;
  price: string;
  fuel: string;
}

/**
 * Fetches all available car brands from FIPE API
 * 
 * @returns Promise resolving to array of brand objects
 * @throws Error if the API request fails
 */
export const fetchFipeBrands = async (): Promise<FipeBrand[]> => {
  try {
    const response = await fetch(`${FIPE_BASE_URL}/brands`);
    if (!response.ok) {
      throw new Error('Erro ao buscar marcas FIPE');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro ao buscar marcas FIPE:', error);
    throw new Error('Não foi possível carregar a lista de marcas FIPE');
  }
};

/**
 * Fetches all models for a specific brand from FIPE API
 * 
 * @param brandCode - The brand code from FIPE
 * @returns Promise resolving to array of model objects
 * @throws Error if the API request fails
 */
export const fetchFipeModels = async (brandCode: string): Promise<FipeModel[]> => {
  try {
    const response = await fetch(`${FIPE_BASE_URL}/brands/${brandCode}/models`);
    if (!response.ok) {
      throw new Error('Erro ao buscar modelos FIPE');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro ao buscar modelos FIPE:', error);
    throw new Error('Não foi possível carregar os modelos');
  }
};

/**
 * Fetches all available years for a specific brand/model from FIPE API
 * 
 * @param brandCode - The brand code from FIPE
 * @param modelCode - The model code from FIPE
 * @returns Promise resolving to array of year objects
 * @throws Error if the API request fails
 */
export const fetchFipeYears = async (brandCode: string, modelCode: string): Promise<FipeYear[]> => {
  try {
    const response = await fetch(`${FIPE_BASE_URL}/brands/${brandCode}/models/${modelCode}/years`);
    if (!response.ok) {
      throw new Error('Erro ao buscar anos FIPE');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro ao buscar anos FIPE:', error);
    throw new Error('Não foi possível carregar os anos disponíveis');
  }
};

/**
 * Fetches the FIPE price and details for a specific vehicle
 * 
 * @param brandCode - The brand code from FIPE
 * @param modelCode - The model code from FIPE
 * @param yearCode - The year code from FIPE
 * @returns Promise resolving to vehicle price data
 * @throws Error if the API request fails
 */
export const fetchFipePrice = async (
  brandCode: string,
  modelCode: string,
  yearCode: string
): Promise<FipePrice> => {
  try {
    const response = await fetch(
      `${FIPE_BASE_URL}/brands/${brandCode}/models/${modelCode}/years/${yearCode}`
    );
    if (!response.ok) {
      throw new Error('Erro ao consultar FIPE');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao consultar FIPE:', error);
    throw new Error('Não foi possível buscar o valor do veículo');
  }
};

/**
 * Fetches complete FIPE data for a vehicle (convenience function)
 * 
 * @param brandCode - The brand code from FIPE
 * @param modelCode - The model code from FIPE
 * @param yearCode - The year code from FIPE
 * @returns Promise resolving to complete vehicle data
 */
export const fetchFipeVehicleData = async (
  brandCode: string,
  modelCode: string,
  yearCode: string
): Promise<FipeVehicleData> => {
  const priceData = await fetchFipePrice(brandCode, modelCode, yearCode);
  
  return {
    brand: priceData.brand,
    model: priceData.model,
    year: priceData.modelYear.toString(),
    price: priceData.price,
    fuel: priceData.fuel,
  };
};

/**
 * Parses a FIPE price string to a numeric value
 * FIPE prices are formatted as "R$ 45.000,00"
 * 
 * @param priceString - The FIPE formatted price string
 * @returns Numeric value
 */
export const parseFipePrice = (priceString: string): number => {
  const cleaned = priceString
    .replace(/[^\d,.]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleaned) || 0;
};
