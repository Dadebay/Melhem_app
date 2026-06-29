declare namespace Manufacturer {
  type Item = {
    _id: string;
    title: string;
    logo: string;
    drugCount: number;
  };

  namespace API {
    type GetAllVars = {
      page: number;
      limit: number;
    };
    type GetAllResponse = {
      manufacturers: Manufacturer.Item[];
      totalManufacturers: number;
    };
  }
}
