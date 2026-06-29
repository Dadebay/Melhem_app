import {InfiniteData, useInfiniteQuery, useQuery} from '@tanstack/react-query';
import api from '.';
import {AxiosError} from 'axios';

const useGetAll = (params: Inventory.API.GetAllVars) => {
  const query = useQuery<
    Inventory.API.GetAllResponse,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ['inventories', params],
    queryFn: async () => {
      const req = await api.req({
        method: 'GET',
        url: '/inventories',
        params: params,
      });

      return req.data;
    },
  });

  return query;
};

const useGetAllInfiniteList = (params: Inventory.API.GetAllVars) => {
  const query = useInfiniteQuery<
    Inventory.API.GetAllResponse,
    AxiosError<ApiErrorResponse>,
    InfiniteData<Inventory.API.GetAllResponse>,
    ['inventories-infinite', Inventory.API.GetAllVars],
    number
  >({
    queryKey: ['inventories-infinite', params],
    initialPageParam: 0,
    queryFn: async ({pageParam}) => {
      const req = await api.req({
        method: 'GET',
        url: '/inventories',
        params: {
          ...params,
          page: pageParam,
        },
      });

      return req.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.inventories.length < params.limit) {
        return undefined;
      }

      return allPages.length + 1;
    },
  });

  return query;
};

const inventoryApi = {
  useGetAll,
  useGetAllInfiniteList,
};

export default inventoryApi;
