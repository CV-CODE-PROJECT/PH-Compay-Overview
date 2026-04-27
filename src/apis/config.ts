import { configClient } from './client.ts';

export const getAppConfig = async () => {
  const response = await configClient.get('/config');
  return response.data;
};
