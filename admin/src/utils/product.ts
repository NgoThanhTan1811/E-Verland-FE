import type { ProductVariant, CreateProductSku } from "../types";

export const generateSKUs = (
  variants: ProductVariant[],
): CreateProductSku[] => {
  function getCombinations(arrays: string[][]): string[][] {
    if (arrays.length === 0) return [[]];

    return arrays.reduce<string[][]>(
      (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
      [[]],
    );
  }

  if (variants.length === 0) {
    return [];
  }

  const options = variants.map((variant) => variant.options);
  const combinations = getCombinations(options);

  return combinations.map((combination) => ({
    value: combination.join("-"),
    price: 0,
    stock: 100,
    image: "",
  }));
};
