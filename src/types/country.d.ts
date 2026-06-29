declare namespace Country {
  type Translations = {
    name: string;
  };

  type Item = {
    _id: string;
    translations: Record<ContentLanguage, Translations>;
    flag: string;
    drugCount: number;
  };

  namespace API {
    type GetAllVars = {
      page: number;
      limit: number;
    };
    type GetAllResponse = {
      countries: Item[];
      totalCountries: number;
    };
  }
}
