import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#111827',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#2D5D3F',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ED1C24',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}