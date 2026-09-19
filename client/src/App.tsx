import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { AppRoutes } from './routes/AppRoutes';
import { ScrollToTop } from './components/common/ScrollToTop';

import { Toaster } from 'sonner';

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <BookingProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton duration={3500} />
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
