import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { CustomerRealtimeProvider } from './realtime/CustomerRealtimeContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CustomerRealtimeProvider>
          <App />
        </CustomerRealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
