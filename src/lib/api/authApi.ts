import {useMutation} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import api, {unwrapData} from '.';
import {User} from '../store/authStore';

type SendCodeVars = {phone: string};
type VerifyVars = {phone: string; code: number};

type SendCodeResponse = {success: boolean};
type VerifyCodeResponse = {success: boolean};
type VerifyLoginResponse = {user: User; accessToken: string};

// Step 1 — request an OTP to be sent to the phone via SMS.
const useSendCode = () =>
  useMutation<SendCodeResponse, AxiosError<ApiErrorResponse>, SendCodeVars>({
    mutationFn: async ({phone}) => {
      const res = await api.req({
        method: 'POST',
        url: '/users/send-code',
        data: {phone},
      });

      return unwrapData<SendCodeResponse>(res);
    },
  });

// Step 2 — validate the entered code (does not log in yet).
const useVerifyCode = () =>
  useMutation<VerifyCodeResponse, AxiosError<ApiErrorResponse>, VerifyVars>({
    mutationFn: async ({phone, code}) => {
      const res = await api.req({
        method: 'POST',
        url: '/users/verify-code',
        data: {phone, code},
      });

      return unwrapData<VerifyCodeResponse>(res);
    },
  });

// Step 3 — log in (creates the user if it does not exist) and return a token.
const useVerifyLogin = () =>
  useMutation<VerifyLoginResponse, AxiosError<ApiErrorResponse>, VerifyVars>({
    mutationFn: async ({phone, code}) => {
      const res = await api.req({
        method: 'POST',
        url: '/users/verify-login',
        data: {phone, code},
      });

      return unwrapData<VerifyLoginResponse>(res);
    },
  });

const authApi = {
  useSendCode,
  useVerifyCode,
  useVerifyLogin,
};

export default authApi;
