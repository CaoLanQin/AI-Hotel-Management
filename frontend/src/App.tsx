import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import RoomsPage from '@/pages/RoomsPage';
import BookingsPage from '@/pages/BookingsPage';
import CheckInPage from '@/pages/CheckInPage';
import DevicesPage from '@/pages/DevicesPage';
import ProcurementProductsPage from '@/pages/ProcurementProductsPage';
import ProcurementCartPage from '@/pages/ProcurementCartPage';
import ProcurementOrdersPage from '@/pages/ProcurementOrdersPage';
import ProcurementStockInPage from '@/pages/ProcurementStockInPage';
import ProcurementStockOutPage from '@/pages/ProcurementStockOutPage';
import ProcurementInventoryPage from '@/pages/ProcurementInventoryPage';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="checkin" element={<CheckInPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="procurement" element={<Navigate to="/procurement/products" replace />} />
        <Route path="procurement/products" element={<ProcurementProductsPage />} />
        <Route path="procurement/cart" element={<ProcurementCartPage />} />
        <Route path="procurement/orders" element={<ProcurementOrdersPage />} />
        <Route path="procurement/stock-in" element={<ProcurementStockInPage />} />
        <Route path="procurement/stock-out" element={<ProcurementStockOutPage />} />
        <Route path="procurement/inventory" element={<ProcurementInventoryPage />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
