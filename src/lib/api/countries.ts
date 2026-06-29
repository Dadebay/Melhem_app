import {useQuery} from '@tanstack/react-query';
import api from '.';
import {AxiosError} from 'axios';

const useGetAll = (params: Country.API.GetAllVars) => {
  const query = useQuery<
    Country.API.GetAllResponse,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ['countries', params],
    queryFn: async () => {
      const req = await api.req({
        method: 'GET',
        url: '/countries',
        params: params,
      });
      return req.data;
    },
  });

  return query;
};

const countryApi = {
  useGetAll,
};

export default countryApi;
