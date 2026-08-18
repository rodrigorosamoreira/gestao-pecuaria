import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { APP_LOGO_DATA_URI } from './src/assets/logoData';

// Garantir que o favicon seja atualizado imediatamente na aba do navegador e barra de tarefas
try {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.type = 'image/jpeg';
  link.href = APP_LOGO_DATA_URI;
} catch (e) {
  console.warn('Erro ao atualizar favicon dinâmico:', e);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);