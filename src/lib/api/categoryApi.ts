import {useQuery} from '@tanstack/react-query';
import api, {unwrapData} from './index';
import {AxiosError} from 'axios';
import i18n from '../i18n';

const toBackendLanguage = (): 'tk' | 'ru' =>
  i18n.language === 'ru' ? 'ru' : 'tk';

const useGetAll = () => {
  const language = toBackendLanguage();

  const query = useQuery<
    Category.API.GetAllResponse,
    AxiosError<ApiErrorResponse>
  >({
    queryKey: ['categories', language],
    queryFn: async () => {
      const res = await api.req({
        method: 'GET',
        url: '/categories/client',
        headers: {
          'Content-Language': language,
        },
      });

      return unwrapData<Category.API.GetAllResponse>(res);
    },
  });

  return query;
};

const categoryApi = {
  useGetAll,
};

export default categoryApi;
