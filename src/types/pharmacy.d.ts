declare namespace Pharmacy {
  type Contact = {
    phoneNumbers: string[];
    email?: string;
    website?: string;
  };

  type DailyHours = {
    open: string;
    close: string;
  };

  type ListItem = {
    id: number;
    name: string;
    address: string;
    image: string;
    location_id: number;
    location_name: string;
  };

  type Item = {
    id: number;
    name: string;
    address: string;
    image: string;
    location_id?: number;
    contact: Pharmacy.Contact;
    operatingHours: Record<WeekDays, Pharmacy.DailyHours>;
  };

  namespace API {
    type GetAllVars = {
      page: number;
      size: number;
      search?: string;
      location_id?: number;
    };
    type GetAllResponse = {
      pharmacies: Pharmacy.ListItem[];
      total: number;
    };
  }
}
