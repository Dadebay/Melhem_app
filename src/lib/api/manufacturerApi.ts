import {useQuery} from '@tanstack/react-query';
import api from '.';
import {AxiosError} from 'axios';

const useGetAll = (params: Manufacturer.API.GetAllVars) => {
  const query = useQuery<
    Manufacturer.API.GetAllResponse,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ['manufacturers', params],
    queryFn: async () => {
      const req = await api.req({
        method: 'GET',
        url: '/manufacturers',
        params: params,
      });

      return req.data;
    },
  });

  return query;
};

const manufacturerApi = {
  useGetAll,
};

export default manufacturerApi;
