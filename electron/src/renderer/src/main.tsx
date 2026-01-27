import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'jotai';
import './assets/index.css';
import { App } from './components/0-all-layout/0-app';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Provider>
            <App />
        </Provider>
    </React.StrictMode>
);
