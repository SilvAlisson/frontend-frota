export const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  hotjarId: import.meta.env.VITE_HOTJAR_ID,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
};
