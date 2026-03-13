import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import { App } from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const theme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, sans-serif',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <AuthProvider>
        <Notifications position="top-right" />
        <App />
      </AuthProvider>
    </MantineProvider>
  </StrictMode>,
);
