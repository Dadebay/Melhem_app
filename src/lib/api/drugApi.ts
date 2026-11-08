import {InfiniteData, useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import api, {unwrapData} from '.';
import i18n from '../i18n';

const toBackendLanguage = (): 'tk' | 'ru' =>
  i18n.language === 'ru' ? 'ru' : 'tk';

const useGetAll = (
  params: Drug.API.GetAllVars,
  options?: {enabled?: boolean},
) => {
  const language = toBackendLanguage();

  const query = useQuery<Drug.API.GetAllResponse, AxiosError<ApiErrorResponse>>(
    {
      enabled: options?.enabled,
      queryKey: ['drugs', params, language],
      queryFn: async () => {
        const res = await api.req({
          method: 'GET',
          url: '/drugs/client',
          params: params,
          headers: {
            'Content-Language': language,
          },
        });

        return unwrapData<Drug.API.GetAllResponse>(res);
      },
    },
  );

  return query;
};

const useGetAllInfiniteList = (
  params: Drug.API.GetAllVars,
  options?: {enabled?: boolean},
) => {
  const language = toBackendLanguage();

  const query = useInfiniteQuery<
    Drug.API.GetAllResponse,
    AxiosError<ApiErrorResponse>,
    InfiniteData<Drug.API.GetAllResponse>,
    ['drugs-infinite', Drug.API.GetAllVars, string],
    number
  >({
    enabled: options?.enabled,
    queryKey: ['drugs-infinite', params, language],
    initialPageParam: 1,
    queryFn: async ({pageParam}) => {
      const res = await api.req({
        method: 'GET',
        url: '/drugs/client',
        params: {
          ...params,
          page: pageParam,
        },
        headers: {
          'Content-Language': language,
        },
      });

      return unwrapData<Drug.API.GetAllResponse>(res);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.drugs.length < params.size) {
        return undefined;
      }

      return allPages.length + 1;
    },
  });

  return query;
};

const useGet = ({drugId}: {drugId: string}) => {
  const language = toBackendLanguage();

  const query = useQuery<Drug.API.GetOneResponse, AxiosError<ApiErrorResponse>>(
    {
      queryKey: ['drug', drugId, language],
      queryFn: async () => {
        const res = await api.req({
          method: 'GET',
          url: '/drugs/client/' + drugId,
          headers: {
            'Content-Language': language,
          },
        });

        return unwrapData<Drug.API.GetOneResponse>(res);
      },
    },
  );

  return query;
};

const drugApi = {
  useGetAll,
  useGetAllInfiniteList,
  useGet,
};

export default drugApi;
