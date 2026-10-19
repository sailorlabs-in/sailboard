import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import { axiosClient } from '../services/axiosClient';

export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
}

export const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: '' }
  ): BaseQueryFn<AxiosBaseQueryArgs, unknown, { status?: number; data?: any; message: string }> =>
  async ({ url, method = 'GET', data, params, headers }) => {
    try {
      const result = await axiosClient({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError<{ message?: string }>;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data,
          message: err.response?.data?.message || err.message || 'Request failed',
        },
      };
    }
  };
