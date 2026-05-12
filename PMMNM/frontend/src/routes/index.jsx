import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home/Home";
import RegisterPage from "../pages/Register/Register";
import CategoryPage from "../pages/CategoryPage/CategoryPage";
import ProductDetailPage from "../pages/ProductDetail/ProductDetail";
import SearchPage from "../pages/Search/Search";
import CartPage from "../pages/Cart/Cart";
import OrderManagement from "../pages/OrderManagement/OrderManagement";
import ProfilePage from "../pages/Profile/Profile";
import AdminProductsPage from "../pages/AdminDashboard/AdminProductsPage";
import OrderManagementPage from "../pages/AdminDashboard/OrderManagementPage";
import UserManagementPage from "../pages/AdminDashboard/UserManagementPage";
import AuditLogsPage from "../pages/AdminDashboard/AuditLogsPage";
import ModuleManagementPage from "../pages/AdminDashboard/ModuleManagementPage";
import AddressPage from "../pages/Address/AddressPage";
import PaymentPage from "../pages/Payment/PaymentPage";
import PaymentCallback from "../pages/Payment/PaymentCallback";
import PaymentSuccess from "../pages/Payment/PaymentSuccess";
import AuthCallback from "../pages/AuthCallback";
import ModuleGuard from "../components/common/ModuleGuard";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/san-pham" element={<ModuleGuard moduleName="product"><CategoryPage /></ModuleGuard>} />
        <Route path="/nam" element={<ModuleGuard moduleName="product"><CategoryPage /></ModuleGuard>} />
        <Route path="/nu" element={<ModuleGuard moduleName="product"><CategoryPage /></ModuleGuard>} />
        <Route path="/giay" element={<ModuleGuard moduleName="product"><CategoryPage /></ModuleGuard>} />
        <Route path="/phu-kien" element={<ModuleGuard moduleName="product"><CategoryPage /></ModuleGuard>} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ModuleGuard moduleName="product"><ProductDetailPage /></ModuleGuard>} />
        <Route path="/cart" element={<ModuleGuard moduleName="cart"><CartPage /></ModuleGuard>} />
        <Route path="/checkout" element={<ModuleGuard moduleName="order"><OrderManagement /></ModuleGuard>} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/orders" element={<OrderManagementPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
        <Route path="/admin/modules" element={<ModuleManagementPage />} />
        <Route path="/profile" element={<ModuleGuard moduleName="user"><ProfilePage /></ModuleGuard>} />
        <Route path="/address" element={<ModuleGuard moduleName="address"><AddressPage /></ModuleGuard>} />
        <Route path="/payment" element={<ModuleGuard moduleName="payment"><PaymentPage /></ModuleGuard>} />
        <Route path="/payment/callback" element={<ModuleGuard moduleName="payment"><PaymentCallback /></ModuleGuard>} />
        <Route path="/payment/success" element={<ModuleGuard moduleName="payment"><PaymentSuccess /></ModuleGuard>} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
