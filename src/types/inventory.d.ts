declare namespace Inventory {
  /**
   * Drug shape embedded in inventory rows.
   * The inventory feature still consumes the legacy `/inventories` API, which
   * returns per-language translations, so it keeps its own drug shape instead
   * of reusing the (now flat/localized) `Drug.ListItem`.
   */
  type EmbeddedDrug = {
    _id: string;
    translations: Record<ContentLanguage, {name: string}>;
    imageUrls: string[];
    formulation: {
      form: Drug.FormulationForm;
      strength?: string;
      unit?: string;
      count?: string;
      volume?: string;
    };
    manufacturer: Manufacturer.Item;
    country: {
      _id: string;
      translations: Record<ContentLanguage, {name: string}>;
    };
    categories: {
      _id: string;
      translations: Record<ContentLanguage, {name: string}>;
    }[];
  };

  type ListItem = {
    _id: string;
    inventoryId: string;
    type: 'inventory';
    drug: Inventory.EmbeddedDrug;
    stockCount: number;
    price: number;
    pharmacy: {
      _id: string;
      name: string;
      logo: string;
      hasDelivery?: boolean;
      hasPickup?: boolean;
    };
    updatedAt: string;
    createdAt: string;
  };

  namespace API {
    type GetAllVars = {
      page: number;
      limit: number;
      pharmacyId?: string;
      drugId?: string;
      onlyInStock?: boolean;
    };
    type GetAllResponse = {
      inventories: Inventory.ListItem[];
      totalInventories: number;
    };
  }
}
