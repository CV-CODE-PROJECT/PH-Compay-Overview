import { configClient } from './client';
import type { AppConfig } from '../config/app';

export const getAppConfig = async (): Promise<AppConfig> => {
  const response = await configClient.get<AppConfig>('/config');
  return response.data;
};
