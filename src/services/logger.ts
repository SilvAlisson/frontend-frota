import { api } from './api';

export const setupGlobalErrorLogging = () => {
  window.addEventListener('error', (event) => {
    api.post('/logs', {
      level: 'CRITICAL',
      source: 'FRONTEND',
      message: event.message || 'Window Global Error',
      stackTrace: event.error?.stack || null,
      context: {
        _type: 'WINDOW_ERROR',
        _url: window.location.href,
        _navigator: { userAgent: navigator.userAgent }
      }
    }).catch(() => null);
  });

  window.addEventListener('unhandledrejection', (event) => {
    api.post('/logs', {
      level: 'ERROR',
      source: 'FRONTEND',
      message: 'Unhandled Promise Rejection: ' + (event.reason?.message || String(event.reason)),
      stackTrace: event.reason?.stack || null,
      context: {
        _type: 'UNHANDLED_REJECTION',
        _url: window.location.href,
        _navigator: { userAgent: navigator.userAgent }
      }
    }).catch(() => null);
  });
};
