import {useQuery} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import api, {unwrapData} from '.';
import i18n from '../i18n';

type BackendOperatingHour = {
  id: number;
  day: WeekDays;
  open: string;
  close: string;
  pharmacy_id: number;
};

type BackendPharmacyDetail = {
  id: number;
  name: string;
  address: string;
  contact: Pharmacy.Contact;
  image?: string | null;
  location_id?: number | null;
  operatingHours?: BackendOperatingHour[];
  location?: {
    id: number;
    name: string;
    parent?: {
      id: number;
      name: string;
    };
  };
};

const toBackendLanguage = (): 'tk' | 'ru' =>
  i18n.language === 'ru' ? 'ru' : 'tk';

const mapOperatingHours = (
  hours: BackendOperatingHour[] = [],
): Record<WeekDays, Pharmacy.DailyHours> => {
  const result: Partial<Record<WeekDays, Pharmacy.DailyHours>> = {};

  for (const hour of hours) {
    result[hour.day] = {open: hour.open, close: hour.close};
  }

  return result as Record<WeekDays, Pharmacy.DailyHours>;
};

const mapPharmacyDetail = (pharmacy: BackendPharmacyDetail): Pharmacy.Item => ({
  id: pharmacy.id,
  name: pharmacy.name,
  address: pharmacy.address,
  image: pharmacy.image ?? '',
  location_id: pharmacy.location_id ?? undefined,
  contact: pharmacy.contact,
  operatingHours: mapOperatingHours(pharmacy.operatingHours),
});

const useGetAll = (params: Pharmacy.API.GetAllVars) => {
  const language = toBackendLanguage();

  const query = useQuery<
    Pharmacy.API.GetAllResponse,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ['pharmacies', params, language],
    queryFn: async () => {
      const res = await api.req({
        method: 'GET',
        url: '/pharmacies/client',
        params,
        headers: {
          'Content-Language': language,
        },
      });

      return unwrapData<Pharmacy.API.GetAllResponse>(res);
    },
  });

  return query;
};

const useGet = ({pharmacyId}: {pharmacyId: string}) => {
  const language = toBackendLanguage();

  const query = useQuery<Pharmacy.Item, AxiosError<ApiErrorResponse>>({
    queryKey: ['pharmacy', pharmacyId, language],
    queryFn: async () => {
      const res = await api.req({
        method: 'GET',
        url: `/pharmacies/client/${pharmacyId}`,
        headers: {
          'Content-Language': language,
        },
      });

      return mapPharmacyDetail(unwrapData<BackendPharmacyDetail>(res));
    },
  });

  return query;
};

const pharmacyApi = {
  useGetAll,
  useGet,
};

export default pharmacyApi;
