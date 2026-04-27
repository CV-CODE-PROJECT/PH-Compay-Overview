import { sheetsClient, userClient } from './client';

export const getSheetValues = async (spreadsheetId: string, sheetName: string, accessToken: string) => {
  const response = await sheetsClient.get(`/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`, {
    params: {
      valueRenderOption: 'UNFORMATTED_VALUE',
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  return response.data;
};

export const getUserInfo = async (accessToken: string) => {
  const response = await userClient.get('/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};
