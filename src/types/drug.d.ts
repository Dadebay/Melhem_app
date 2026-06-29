declare namespace Drug {
  type FormulationForm =
    | 'tablet'
    | 'capsule'
    | 'liquid'
    | 'injection'
    | 'topical'
    | 'inhaler'
    | 'other';

  /** Minimal formulation info used to build the human readable label. */
  type Formulation = {
    form: Drug.FormulationForm;
    strength?: string | null;
    unit?: string | null;
  };

  /** A localized reference to a related entity (category, country, ...). */
  type Ref = {
    id: number;
    name: string | null;
  };

  /** A pharmacy that stocks the drug, returned by `GET /drugs/client/:id`. */
  type Pharmacy = {
    id: number;
    name: string;
    image: string | null;
    price: number;
    stock: number;
  };

  /**
   * List item returned by `GET /drugs/client`.
   * The backend localizes text server-side (Content-Language header) and
   * returns a flat row, so there are no per-language translations here.
   */
  type ListItem = {
    id: number;
    name: string;
    images: string[] | null;
    min_price: number | null;
    max_price: number | null;
    stock_count: number | null;
    /**
     * Pharmacy-specific price/stock. Only present when the list is filtered by
     * `pharmacy_id` (e.g. the pharmacy detail screen) — the backend then joins
     * `pharmacy_drugs` and returns that pharmacy's row. Raw query, so numbers
     * may arrive as strings; coerce with `Number(...)` before use.
     */
    price?: number | string | null;
    stock?: number | string | null;
  };

  /**
   * Detail item returned by `GET /drugs/client/:id`.
   * All text is already localized for the requested language.
   */
  type Item = {
    id: number;
    name: string | null;
    description: string | null;
    instructions: string | null;
    form: Drug.FormulationForm;
    unit: string | null;
    strength: string | null;
    count: number | null;
    volume: number | null;
    barcode: string | null;
    images: string[];
    category: Drug.Ref | null;
    manufacturer: (Drug.Ref & {logo: string | null}) | null;
    country: Drug.Ref | null;
    pharmclass: (Drug.Ref & {code: string | null}) | null;
    activeSubstances: Drug.Ref[];
    pharmacies: Drug.Pharmacy[] | null;
    min_price: number | null;
    max_price: number | null;
    stock_count: number | null;
  };

  namespace API {
    type GetAllVars = {
      page: number;
      size: number;
      search?: string;
      ids?: string;
      category_id?: number | string;
      country_id?: number | string;
      location_id?: number | string;
      manufacturer_id?: number | string;
      pharmacy_id?: number | string;
    };
    /** `GET /drugs/client` responds with a raw array of rows. */
    type GetAllResponse = {
      drugs: Drug.ListItem[];
      total: number;
    };
    /** `GET /drugs/client/:id` responds with a single localized drug. */
    type GetOneResponse = Drug.Item;
  }
}
