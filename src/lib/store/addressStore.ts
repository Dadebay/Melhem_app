// Saved addresses are now persisted on the backend (see lib/api/addressApi.ts).
// This module keeps the shared types and the formatting helper that screens use.

export interface AddressCoordinates {
  latitude: number;
  longitude: number;
}

export interface SavedAddress {
  id: string;
  label: string;
  city: string;
  district: string;
  street: string;
  house: string;
  apartment?: string;
  coordinates: AddressCoordinates;
  isDefault: boolean;
  createdAt: string;
}

export type AddressInput = Omit<SavedAddress, 'id' | 'createdAt'>;

/**
 * Mirrors the backend snapshot format: "city, district, street, house" plus an
 * optional ", <apartmentLabel> <apartment>" suffix. Pass `apartmentLabel`
 * (e.g. t('address.apartmentShort')) to localize the abbreviation.
 */
export const formatAddress = (
  addr: Pick<SavedAddress, 'city' | 'district' | 'street' | 'house' | 'apartment'>,
  apartmentLabel = 'kw.',
): string => {
  const parts = [addr.city, addr.district, addr.street, addr.house].filter(
    p => p && String(p).trim(),
  );
  const base = parts.join(', ');
  return addr.apartment && addr.apartment.trim()
    ? `${base}, ${apartmentLabel} ${addr.apartment}`
    : base;
};
