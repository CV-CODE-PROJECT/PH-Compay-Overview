import axios from 'axios';

const sheetsClient = axios.create({
  baseURL: 'https://sheets.googleapis.com/v4/spreadsheets',
});

const userClient = axios.create({
  baseURL: 'https://www.googleapis.com/oauth2/v3',
});

const configClient = axios.create({
  baseURL: '/api',
});

export { sheetsClient, userClient, configClient };
