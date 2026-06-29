declare namespace Location {
  /** Top-level location returned by `GET /locations/client` (already localized). */
  type Item = {
    id: number;
    name: string;
  };

  namespace API {
    type GetAllResponse = Location.Item[];
  }
}
