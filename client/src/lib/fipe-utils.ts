/**
 * FIPE API Utilities
 */

export const fetchFipeBrands = async () => {
    const response = await fetch('https://fipe.parallelum.com.br/api/v2/cars/brands');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
};

export const fetchFipeModels = async (brandCode: string) => {
    const response = await fetch(`https://fipe.parallelum.com.br/api/v2/cars/brands/${brandCode}/models`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
};

export const fetchFipeYears = async (brandCode: string, modelCode: string) => {
    const response = await fetch(`https://fipe.parallelum.com.br/api/v2/cars/brands/${brandCode}/models/${modelCode}/years`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
};

export const fetchFipePrice = async (brandCode: string, modelCode: string, yearCode: string) => {
    const response = await fetch(
        `https://fipe.parallelum.com.br/api/v2/cars/brands/${brandCode}/models/${modelCode}/years/${yearCode}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
};

export const parseFipeValue = (value: string): number => {
    const cleanValue = value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
};
