declare namespace Nav {
  type Shared = {
    Drugs: {
      queries: Partial<Drug.API.GetAllVars>;
      title: string;
    };
    Drug: {
      id: string;
      price?: number;
      pharmacy?: {
        _id: string;
        name: string;
        logo: string;
      };
    };
  };
  type Home = Shared & {
    Home: undefined;
    Pharmacies: undefined;
    Countries: undefined;
    Manufacturers: undefined;
    Pharmacy: {
      id: string;
    };
    Inventory: {
      pharmacyId: string;
      pharmacyName: string;
    };
    Search: undefined;
    Cart: undefined;
    AddressPicker: {mode?: 'pick' | 'manage'; currentAddressId?: string};
    Auth: {
      redirectTo?: 'Checkout';
      pharmacyId?: string;
      /** When true, the screen is the last onboarding step (shows Skip; on
       *  success/skip it finishes onboarding instead of going back). */
      onboarding?: boolean;
    };
    Checkout: {
      pharmacyId: string;
    };
    OrderCreated: {
      orderId: string;
    };
  };
  type Onboarding = {
    OnbLanguage: undefined;
    OnbLocation: undefined;
    Auth: {
      onboarding?: boolean;
    };
  };
  type Categories = Shared & {
    Categories: undefined;
  };
  type Bookmark = Shared & {
    Bookmark: undefined;
  };
  type Settings = Shared & {
    Settings: undefined;
    Bookmark: undefined;
    Languages: undefined;
    Addresses: {mode?: 'pick' | 'manage'} | undefined;
    Auth: Home['Auth'];
    AddressDetail: {
      addressId?: string; // undefined = create new
    };
    Orders: {
      initialTab?: 'active' | 'completed' | 'cancelled';
    };
    OrderDetail: {
      orderId: string;
    };
  };
  type Reminder = {
    Reminders: undefined;
    MedicationsList: {
      memberId?: string;
    };
    AddMedication: {
      memberId?: string;
      drugId?: string;
      drugName?: string;
    };
    EditMedication: {
      medicationId: string;
    };
    MedicationDetail: {
      medicationId: string;
    };
    CalendarView: {
      memberId?: string;
      medicationId?: string;
    };
    Statistics: {
      memberId?: string;
    };
    FamilyMembers: undefined;
    AddFamilyMember: {
      memberId?: string;
    };
    MealTimes: undefined;
    Auth: Home['Auth'];
  };
}
