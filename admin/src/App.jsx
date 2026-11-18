import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, GuestRoute } from './auth/RouteGuards.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import { AdminRealtimeProvider } from './realtime/AdminRealtimeContext.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import AdminCategoriesPage from './pages/AdminCategoriesPage.jsx';
import AdminProductsPage from './pages/AdminProductsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AdminLoginPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminRealtimeProvider><AppLayout /></AdminRealtimeProvider>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/orders" element={<AdminOrdersPage />} />
          <Route path="/categories" element={<AdminCategoriesPage />} />
          <Route path="/products" element={<AdminProductsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
