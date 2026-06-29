import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import api, {unwrapData} from '.';
import i18n from '../i18n';
import utils from '../utils';
import {
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderStatus,
} from '../store/orderStore';

type Multilang = {ru?: string; tk?: string} | null;

type BackendOrderItem = {
  drug_id: number | null;
  drug_name: Multilang;
  drug_image: string | null;
  drug_form: string | null;
  drug_strength: string | null;
  drug_unit: string | null;
  unit_price: number | string;
  quantity: number;
};

type BackendOrder = {
  id: number;
  pharmacy_id: number;
  pharmacy?: {name?: Multilang; image?: string | null} | null;
  status: OrderStatus;
  delivery_method: 'pickup' | 'delivery';
  payment_method: 'cash' | 'card';
  delivery_fee: number | string;
  discount: number | string;
  total: number | string;
  delivery_date: string | null;
  comment: string | null;
  recipient_phone: string | null;
  delivery_address: string | null;
  created_at: string;
  items: BackendOrderItem[];
};

type PaginatedOrders = {totalCount: number; items: BackendOrder[]; page?: number};

const lang = (): 'ru' | 'tk' => (i18n.language === 'ru' ? 'ru' : 'tk');

const pickLang = (value: Multilang): string =>
  value?.[lang()] ?? value?.tk ?? value?.ru ?? '';

const mapItem = (it: BackendOrderItem): OrderItem => ({
  drugId: it.drug_id != null ? String(it.drug_id) : '',
  drugName: pickLang(it.drug_name),
  drugImage: it.drug_image ?? '',
  formulation: it.drug_form
    ? utils.getPrettyFormulation({
        form: it.drug_form as any,
        strength: it.drug_strength ?? undefined,
        unit: it.drug_unit as any,
      })
    : '',
  price: Number(it.unit_price),
  quantity: it.quantity,
});

const mapOrder = (o: BackendOrder): Order => ({
  id: String(o.id),
  pharmacyId: String(o.pharmacy_id),
  pharmacyName: pickLang(o.pharmacy?.name ?? null),
  pharmacyLogo: o.pharmacy?.image ?? '',
  items: (o.items ?? []).map(mapItem),
  deliveryMethod: o.delivery_method,
  paymentMethod: o.payment_method,
  deliveryAddress: o.delivery_address ?? undefined,
  deliveryFee: Number(o.delivery_fee),
  deliveryDate: o.delivery_date ?? undefined,
  comment: o.comment ?? undefined,
  recipientPhone: o.recipient_phone ?? undefined,
  discount: Number(o.discount),
  total: Number(o.total),
  status: o.status,
  createdAt: o.created_at,
});

const ORDERS_KEY = ['orders'];

// A single page large enough for the Orders screen tabs to filter client-side.
const LIST_PAGE_SIZE = 50;

const useCreate = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, AxiosError<ApiErrorResponse>, CreateOrderPayload>({
    mutationFn: async payload => {
      const res = await api.req({method: 'POST', url: '/orders', data: payload});
      return mapOrder(unwrapData<BackendOrder>(res));
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ORDERS_KEY}),
  });
};

const useGetAll = () =>
  useQuery<Order[], AxiosError<ApiErrorResponse>>({
    queryKey: ORDERS_KEY,
    queryFn: async () => {
      const res = await api.req({
        method: 'GET',
        url: '/orders',
        params: {page: 1, size: LIST_PAGE_SIZE},
      });
      return unwrapData<PaginatedOrders>(res).items.map(mapOrder);
    },
  });

const useGet = (orderId?: string) =>
  useQuery<Order, AxiosError<ApiErrorResponse>>({
    queryKey: ['order', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const res = await api.req({method: 'GET', url: `/orders/${orderId}`});
      return mapOrder(unwrapData<BackendOrder>(res));
    },
  });

const useCancel = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, AxiosError<ApiErrorResponse>, string>({
    mutationFn: async orderId => {
      const res = await api.req({
        method: 'PATCH',
        url: `/orders/${orderId}/cancel`,
      });
      return mapOrder(unwrapData<BackendOrder>(res));
    },
    onSuccess: order => {
      queryClient.invalidateQueries({queryKey: ORDERS_KEY});
      queryClient.invalidateQueries({queryKey: ['order', order.id]});
    },
  });
};

const orderApi = {
  useCreate,
  useGetAll,
  useGet,
  useCancel,
};

export default orderApi;
