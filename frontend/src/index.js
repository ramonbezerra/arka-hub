import React, { createRoot } from 'react-dom/client';
import './api/client';
import App from './components/App';
import './i18n';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);