import {QueryClient} from '@tanstack/react-query';
import axios, {AxiosResponse} from 'axios';
import i18n from '../i18n';
import authStore from '../store/authStore';

const queryClient = new QueryClient();
const toBackendLanguage = (): 'tk' | 'ru' =>
  i18n.language === 'ru' ? 'ru' : 'tk';


const req = axios.create({
  baseURL: 'https://dev.melhem.app/api',
  // baseURL: 'http://192.168.1.122:4000',
  // baseURL: 'https://cms.melhem.app/api',
  headers: {
    'Content-Language': toBackendLanguage(),
  },
});

// Attach the bearer token (set after OTP login) to every request.
req.interceptors.request.use(config => {
  const token = authStore.getState().accessToken;
  const location = authStore.getState().location;
  if (location) {
    config.headers.Location = location.id;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type BackendEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
};

const unwrapData = <T>(response: AxiosResponse<BackendEnvelope<T> | T>): T => {
  const payload = response.data;

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as BackendEnvelope<T>).data;
  }

  return payload as T;
};

const api = {
  queryClient,
  req,
};

export default api;
export {unwrapData};
