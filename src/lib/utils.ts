const formTranslations: Record<Drug.FormulationForm, string> = {
  topical: 'Üstki derman',
  inhaler: 'Dem alyş',
  other: 'Beýleki',
  tablet: 'Tabletka',
  capsule: 'Kapsula',
  liquid: 'Suwuklyk',
  injection: 'Sanjym',
};

const getPrettyFormulation = (formulation: Drug.Formulation) => {
  let base = `${formTranslations[formulation.form]}`;

  if (formulation.strength && formulation.unit) {
    base += ` - ${formulation.strength} ${formulation.unit}`;
  }

  return base;
};

type PriceInfo = {
  min_price: number | null;
  max_price: number | null;
  stock_count: number | null;
};

/** Builds the price label / availability flag shared by drug cards. */
const getDrugPriceText = ({min_price, max_price, stock_count}: PriceInfo) => {
  const hasPrice = min_price != null;
  const priceText = hasPrice
    ? min_price === max_price
      ? `${Number(min_price).toFixed(2)} TMT`
      : `${Number(min_price).toFixed(2)}-${Number(max_price || min_price).toFixed(2)} TMT`
    : null;

  const isOutOfStock = !hasPrice && !(stock_count != null && stock_count > 0);

  return {priceText, isOutOfStock};
};

const utils = {
  formTranslations,
  getPrettyFormulation,
  getDrugPriceText,
};

export default utils;
