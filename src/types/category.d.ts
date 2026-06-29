declare namespace Category {
  type Item = {
    id: number;
    name: string;
    icon?: string | null;
  };

  namespace API {
    type GetAllResponse = Category.Item[];
  }
}
