import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import { initAnalytics, trackError } from './lib/analytics';
import { initializeSocket } from './lib/socket';
import './lib/i18n';
import './index.css';

// Initialize analytics
initAnalytics();

// Initialize WebSocket connection
initializeSocket();

// Global error handler for uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  trackError(error || new Error(message as string), 'global');
  return false;
};

// Global handler for unhandled promise rejections
window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  trackError(event.reason, 'promise');
  event.preventDefault();
};

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 text-center mb-4">We apologize for the inconvenience. Please try again.</p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-mono text-gray-600 break-words">{error.message}</p>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        queryClient.clear();
        window.location.href = '/';
      }}
      onError={(error, info) => {
        console.error('Error boundary caught error:', error, info);
        trackError(error, `boundary: ${info.componentStack}`);
      }}
    >
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 5000,
              className: 'shadow-lg',
              success: {
                className: 'bg-green-50 text-green-800 border border-green-200',
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                className: 'bg-red-50 text-red-800 border border-red-200',
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);