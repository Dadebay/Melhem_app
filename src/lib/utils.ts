import i18n from './i18n';

// Fallback labels (Turkmen) used only if a translation key is missing.
const formTranslations: Record<Drug.FormulationForm, string> = {
  topical: 'Üstki derman',
  inhaler: 'Dem alyş',
  other: 'Beýleki',
  tablet: 'Tabletka',
  capsule: 'Kapsula',
  liquid: 'Suwuklyk',
  injection: 'Sanjym',
};

/**
 * Localized label for a medication form (e.g. "Таблетка" / "Tabletka").
 * The backend may send the form in any case ("Other", "TABLET") or an
 * unmapped value — normalize the case and fall back to the localized "other"
 * label so a raw English token like "Other" is never shown to the user.
 */
const getFormLabel = (
  form: Drug.FormulationForm | string | null | undefined,
): string => {
  const normalized = String(form ?? '')
    .trim()
    .toLowerCase();
  const key = `drug.forms.${normalized}`;
  const label = i18n.t(key);
  if (label !== key) {
    return label;
  }
  return i18n.t('drug.forms.other');
};

const getPrettyFormulation = (formulation: Drug.Formulation) => {
  let base = getFormLabel(formulation.form);

  // strength already carries its unit from the backend (e.g. "400 mg"),
  // so we render it as-is rather than appending unit again.
  if (formulation.strength) {
    base += ` - ${formulation.strength}`;
  }

  return base;
};

type PriceInfo = {
  min_price: number | null;
  max_price: number | null;
  stock_count: number | null;
};

/**
 * Builds the price label / availability flag shared by drug cards.
 * When several pharmacies offer different prices, the card shows the minimum
 * price prefixed with a localized "from" label (e.g. "от 5.00 TMT") instead of
 * a min–max range. Pass `fromLabel` (e.g. t('drug.fromPrice')) to localize it.
 */
const getDrugPriceText = (
  {min_price, max_price, stock_count}: PriceInfo,
  fromLabel = '',
) => {
  const hasPrice = min_price != null;
  const isRange =
    hasPrice && max_price != null && Number(max_price) !== Number(min_price);
  const minText = hasPrice ? `${Number(min_price).toFixed(2)} TMT` : null;
  const priceText = !hasPrice
    ? null
    : isRange
    ? `${fromLabel ? `${fromLabel} ` : ''}${minText}`
    : minText;

  const isOutOfStock = !hasPrice && !(stock_count != null && stock_count > 0);

  return {priceText, isOutOfStock, isRange};
};

const NBSP = ' ';

/** A line's trailing word this short (chars) gets pulled up to avoid an orphan. */
const MIN_TAIL_CHARS = 3;

/**
 * Typographic tightening for product names shown in cards. Prevents a short
 * trailing token from being orphaned onto its own line — e.g.
 * "Новатенол Крем 5 % 25 г" no longer wraps with a lone "г".
 *
 * Rules (generic, not unit-specific):
 * - A number is bound to the token that follows it ("25 г", "5 %", "10 мг") —
 *   a number and its unit should never split, wherever they appear.
 * - The final word is bound to the previous word when it is ≤ `minTail` chars,
 *   collapsing any short orphan regardless of what the word is.
 */
const tightenName = <T extends string | null | undefined>(
  text: T,
  minTail = MIN_TAIL_CHARS,
): T => {
  if (!text) return text;
  return text
    .replace(
      new RegExp(`(\\d)\\s+(\\S{1,${minTail}})(?=\\s|$)`, 'gu'),
      `$1${NBSP}$2`,
    )
    .replace(
      new RegExp(`(\\S)\\s+(\\S{1,${minTail}})$`, 'u'),
      `$1${NBSP}$2`,
    ) as T;
};

const utils = {
  formTranslations,
  getFormLabel,
  getPrettyFormulation,
  getDrugPriceText,
  tightenName,
};

export default utils;
