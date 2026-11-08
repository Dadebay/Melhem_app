import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import api, {unwrapData} from '.';
import {AddressInput, SavedAddress} from '../store/addressStore';

type BackendAddress = {
  id: number;
  label: string;
  city: string;
  district: string;
  street: string;
  house: string;
  apartment: string | null;
  latitude: number | string;
  longitude: number | string;
  is_default: boolean;
  created_at: string;
};

const ADDRESSES_KEY = ['addresses'];

const mapAddress = (a: BackendAddress): SavedAddress => ({
  id: String(a.id),
  label: a.label,
  city: a.city,
  district: a.district,
  street: a.street,
  house: a.house,
  apartment: a.apartment ?? undefined,
  coordinates: {
    latitude: Number(a.latitude),
    longitude: Number(a.longitude),
  },
  isDefault: a.is_default,
  createdAt: a.created_at,
});

const toPayload = (input: Partial<AddressInput>) => ({
  ...(input.label !== undefined && {label: input.label}),
  ...(input.city !== undefined && {city: input.city}),
  ...(input.district !== undefined && {district: input.district}),
  ...(input.street !== undefined && {street: input.street}),
  ...(input.house !== undefined && {house: input.house}),
  ...(input.apartment !== undefined && {apartment: input.apartment}),
  ...(input.coordinates && {
    latitude: input.coordinates.latitude,
    longitude: input.coordinates.longitude,
  }),
  ...(input.isDefault !== undefined && {isDefault: input.isDefault}),
});

const useGetAll = () =>
  useQuery<SavedAddress[], AxiosError<ApiErrorResponse>>({
    queryKey: ADDRESSES_KEY,
    queryFn: async () => {
      const res = await api.req({method: 'GET', url: '/addresses'});
      return unwrapData<BackendAddress[]>(res).map(mapAddress);
    },
  });

const useCreate = () => {
  const queryClient = useQueryClient();
  return useMutation<SavedAddress, AxiosError<ApiErrorResponse>, AddressInput>({
    mutationFn: async input => {
      const res = await api.req({
        method: 'POST',
        url: '/addresses',
        data: toPayload(input),
      });
      return mapAddress(unwrapData<BackendAddress>(res));
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ADDRESSES_KEY}),
  });
};

const useUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation<
    SavedAddress,
    AxiosError<ApiErrorResponse>,
    {id: string; input: Partial<AddressInput>}
  >({
    mutationFn: async ({id, input}) => {
      const res = await api.req({
        method: 'PATCH',
        url: `/addresses/${id}`,
        data: toPayload(input),
      });
      return mapAddress(unwrapData<BackendAddress>(res));
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ADDRESSES_KEY}),
  });
};

const useRemove = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiErrorResponse>, string>({
    mutationFn: async id => {
      const res = await api.req({method: 'DELETE', url: `/addresses/${id}`});
      return unwrapData(res);
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ADDRESSES_KEY}),
  });
};

const useSetDefault = () => {
  const queryClient = useQueryClient();
  return useMutation<SavedAddress, AxiosError<ApiErrorResponse>, string>({
    mutationFn: async id => {
      const res = await api.req({
        method: 'PATCH',
        url: `/addresses/${id}/default`,
      });
      return mapAddress(unwrapData<BackendAddress>(res));
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ADDRESSES_KEY}),
  });
};

const addressApi = {
  useGetAll,
  useCreate,
  useUpdate,
  useRemove,
  useSetDefault,
};

export default addressApi;
