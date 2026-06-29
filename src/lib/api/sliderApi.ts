import {useQuery} from '@tanstack/react-query';
import api, {unwrapData} from '.';
import {AxiosError} from 'axios';

const useGetAll = (params: Slider.Api.GetAllVars) => {
  const query = useQuery<
    Slider.Api.GetAllResponse,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ['sliders', params],
    queryFn: async () => {
      const res = await api.req({
        method: 'GET',
        url: '/sliders/client',
        params: params,
      });

      return unwrapData<Slider.Api.GetAllResponse>(res);
    },
  });

  return query;
};

const sliderApi = {
  useGetAll,
};

export default sliderApi;
