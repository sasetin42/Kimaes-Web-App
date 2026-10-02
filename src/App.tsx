import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MenuPage from "./pages/MenuPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import LoginPage from "./pages/LoginPage";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import HowToOrderPage from "./pages/HowToOrderPage";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import KitchenDisplay from "./pages/admin/KitchenDisplay";
import AdminRiders from "./pages/admin/AdminRiders";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminSuppliers from "./pages/admin/AdminSuppliers";
import AdminPurchasing from "./pages/admin/AdminPurchasing";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminReports from "./pages/admin/AdminReports";

// POS
import POSRegister from "./pages/pos/POSRegister";

// Rider
import RiderDashboard from "./pages/RiderDashboard";
import ScrollToTop from "./components/common/ScrollToTop";

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-muted-foreground">Loading...</p></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/track/:id" element={<TrackOrderPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/how-to-order" element={<HowToOrderPage />} />

          {/* Customer */}
          <Route path="/account" element={
            <ProtectedRoute roles={['customer', 'admin', 'kitchen', 'rider']}>
              <AccountPage />
            </ProtectedRoute>
          } />
          <Route path="/account/orders" element={
            <ProtectedRoute roles={['customer', 'admin']}>
              <AccountPage />
            </ProtectedRoute>
          } />

          {/* POS Terminal */}
          <Route path="/pos" element={
            <ProtectedRoute roles={['admin', 'manager', 'cashier', 'super_admin']}>
              <POSRegister />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin', 'manager', 'super_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute roles={['admin', 'manager', 'super_admin']}>
              <AdminOrders />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute roles={['admin', 'manager', 'inventory_staff', 'super_admin']}>
              <AdminProducts />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventory" element={
            <ProtectedRoute roles={['admin', 'manager', 'inventory_staff', 'super_admin']}>
              <AdminInventory />
            </ProtectedRoute>
          } />
          <Route path="/admin/purchasing" element={
            <ProtectedRoute roles={['admin', 'manager', 'inventory_staff', 'super_admin']}>
              <AdminPurchasing />
            </ProtectedRoute>
          } />
          <Route path="/admin/suppliers" element={
            <ProtectedRoute roles={['admin', 'manager', 'inventory_staff', 'super_admin']}>
              <AdminSuppliers />
            </ProtectedRoute>
          } />
          <Route path="/admin/customers" element={
            <ProtectedRoute roles={['admin', 'manager', 'super_admin']}>
              <AdminCustomers />
            </ProtectedRoute>
          } />
          <Route path="/admin/staff" element={
            <ProtectedRoute roles={['admin', 'manager', 'super_admin']}>
              <AdminStaff />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute roles={['admin', 'manager', 'super_admin']}>
              <AdminReports />
            </ProtectedRoute>
          } />
          <Route path="/admin/kitchen" element={
            <ProtectedRoute roles={['admin', 'kitchen']}>
              <KitchenDisplay />
            </ProtectedRoute>
          } />
          <Route path="/admin/riders" element={
            <ProtectedRoute roles={['admin']}>
              <AdminRiders />
            </ProtectedRoute>
          } />

          {/* Kitchen direct */}
          <Route path="/kitchen" element={
            <ProtectedRoute roles={['kitchen', 'admin']}>
              <KitchenDisplay />
            </ProtectedRoute>
          } />

          {/* Rider */}
          <Route path="/rider" element={
            <ProtectedRoute roles={['rider', 'admin']}>
              <RiderDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
