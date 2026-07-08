import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress specific MediaPipe / TensorFlow Lite log messages that are not actual errors
const methods: ('log' | 'info' | 'warn' | 'error')[] = ['log', 'info', 'warn', 'error'];
methods.forEach(method => {
  const original = console[method];
  console[method] = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('TensorFlow Lite XNNPACK delegate')) {
      return;
    }
    original.apply(console, args);
  };
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
