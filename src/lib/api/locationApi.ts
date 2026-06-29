import {useQuery} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import api, {unwrapData} from './index';
import i18n from '../i18n';

const toBackendLanguage = (): 'tk' | 'ru' =>
  i18n.language === 'ru' ? 'ru' : 'tk';

/** Top-level locations (parent_id IS NULL) for the onboarding / region picker. */
const useGetTopLevel = (options?: {enabled?: boolean}) => {
  const language = toBackendLanguage();

  const query = useQuery<
    Location.API.GetAllResponse,
    AxiosError<ApiErrorResponse>
  >({
    enabled: options?.enabled ?? true,
    queryKey: ['locations', language],
    queryFn: async () => {
      const res = await api.req({
        method: 'GET',
        url: '/locations/client',
        headers: {
          'Content-Language': language,
        },
      });

      return unwrapData<Location.API.GetAllResponse>(res);
    },
  });

  return query;
};

const locationApi = {
  useGetTopLevel,
};

export default locationApi;
