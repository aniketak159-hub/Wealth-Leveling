import { createRoot } from 'react-dom/client';

import App from './App';
import TechBootLoader from './components/TechBootLoader';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <TechBootLoader />
  </>,
);
