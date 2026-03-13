import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import RoomsPage from '@/pages/RoomsPage';
import BookingsPage from '@/pages/BookingsPage';
import CheckInPage from '@/pages/CheckInPage';
import UpgradePage from '@/pages/UpgradePage';
import DeviceTopologyPage from '@/pages/DeviceTopologyPage';
import ScenesPage from '@/pages/ScenesPage';
import RulesPage from '@/pages/RulesPage';
import SecurityMonitoringPage from '@/pages/SecurityMonitoringPage';
import MaintenancePage from '@/pages/MaintenancePage';
import DevicesPage from '@/pages/DevicesPage';
import RoomControlPage from '@/pages/RoomControlPage';
import EnergyDashboardPage from '@/pages/EnergyDashboardPage';
import EnergyAlertPage from '@/pages/EnergyAlertPage';
import ProcurementProductsPage from '@/pages/ProcurementProductsPage';
import ProcurementCartPage from '@/pages/ProcurementCartPage';
import ProcurementOrdersPage from '@/pages/ProcurementOrdersPage';
import ProcurementStockInPage from '@/pages/ProcurementStockInPage';
import ProcurementStockOutPage from '@/pages/ProcurementStockOutPage';
import ProcurementInventoryPage from '@/pages/ProcurementInventoryPage';
// 基建与系统管理页面
import InfrastructureOnboardingPage from '@/pages/InfrastructureOnboardingPage';
import InfrastructureDevicesPage from '@/pages/InfrastructureDevicesPage';
import InfrastructureGatewaysPage from '@/pages/InfrastructureGatewaysPage';
import InfrastructureServersPage from '@/pages/InfrastructureServersPage';
import InfrastructureNetworkPage from '@/pages/InfrastructureNetworkPage';
import InfrastructureApiGatewayPage from '@/pages/InfrastructureApiGatewayPage';
import InfrastructureStoreConfigPage from '@/pages/InfrastructureStoreConfigPage';
import InfrastructureUsersPage from '@/pages/InfrastructureUsersPage';
import InfrastructureLogsPage from '@/pages/InfrastructureLogsPage';
import InfrastructureBackupPage from '@/pages/InfrastructureBackupPage';
import RoomControlScenesPage from '@/pages/RoomControlScenesPage';
import RoomControlPreferencesPage from '@/pages/RoomControlPreferencesPage';
import RoomControlEnergyAutoPage from '@/pages/RoomControlEnergyAutoPage';
import RoomControlSecurityAutoPage from '@/pages/RoomControlSecurityAutoPage';
import EnergyAiStrategyPage from '@/pages/EnergyAiStrategyPage';
import EnergyReportPage from '@/pages/EnergyReportPage';

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
        <Route path="upgrade" element={<UpgradePage />} />
        <Route path="device-topology" element={<DeviceTopologyPage />} />
        <Route path="scenes" element={<ScenesPage />} />
        <Route path="security" element={<SecurityMonitoringPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="room-control" element={<RoomControlPage />} />
        <Route path="room-control/topology" element={<DeviceTopologyPage />} />
        <Route path="room-control/status" element={<DevicesPage />} />
        <Route path="room-control/scenes" element={<ScenesPage />} />
        <Route path="room-control/scene-config" element={<RoomControlScenesPage />} />
        <Route path="room-control/preferences" element={<RoomControlPreferencesPage />} />
        <Route path="room-control/energy-auto" element={<RoomControlEnergyAutoPage />} />
        <Route path="room-control/security-auto" element={<RoomControlSecurityAutoPage />} />
        <Route path="energy" element={<EnergyDashboardPage />} />
        <Route path="energy/alerts" element={<EnergyAlertPage />} />
        <Route path="energy/ai-strategy" element={<EnergyAiStrategyPage />} />
        <Route path="energy/report" element={<EnergyReportPage />} />
        <Route path="procurement" element={<Navigate to="/procurement/products" replace />} />
        <Route path="procurement/products" element={<ProcurementProductsPage />} />
        <Route path="procurement/cart" element={<ProcurementCartPage />} />
        <Route path="procurement/orders" element={<ProcurementOrdersPage />} />
        <Route path="procurement/stock-in" element={<ProcurementStockInPage />} />
        <Route path="procurement/stock-out" element={<ProcurementStockOutPage />} />
        <Route path="procurement/inventory" element={<ProcurementInventoryPage />} />
        {/* 基建与系统管理 */}
        <Route path="infrastructure" element={<Navigate to="/infrastructure/onboarding" replace />} />
        <Route path="infrastructure/onboarding" element={<InfrastructureOnboardingPage />} />
        <Route path="infrastructure/devices" element={<InfrastructureDevicesPage />} />
        <Route path="infrastructure/gateways" element={<InfrastructureGatewaysPage />} />
        <Route path="infrastructure/servers" element={<InfrastructureServersPage />} />
        <Route path="infrastructure/network" element={<InfrastructureNetworkPage />} />
        <Route path="infrastructure/api-gateway" element={<InfrastructureApiGatewayPage />} />
        <Route path="infrastructure/store-config" element={<InfrastructureStoreConfigPage />} />
        <Route path="infrastructure/users" element={<InfrastructureUsersPage />} />
        <Route path="infrastructure/logs" element={<InfrastructureLogsPage />} />
        <Route path="infrastructure/backup" element={<InfrastructureBackupPage />} />
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
