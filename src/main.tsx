import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './theme';
import { ToastProvider } from './ui/toast';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light">
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
