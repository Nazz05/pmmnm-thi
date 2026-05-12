import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message } from "antd";
import { useAuth } from "../context/AuthContext";
import logger from "../utils/logger";

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  if (typeof window === 'undefined') {
    return 'http://localhost:8080/api';
  }

  const hostname = window.location.hostname;
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(hostname);

  if (isLocalhost) {
    return 'http://localhost:8080/api';
  }

  // Production: convert domain to api subdomain
  const protocol = window.location.protocol;
  return `${protocol}//api.${hostname}/api`;
};

const API_BASE_URL = getApiBaseUrl();
const handledOAuthCodes = new Set();

const resolveProvider = (state) => {
  if (!state) {
    return "";
  }

  const [provider] = state.split(":");
  return provider;
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const redirectUri = useMemo(() => `${window.location.origin}/auth/callback`, []);

  useEffect(() => {
    const executeOAuthLogin = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state") || "";
      const oauthError = searchParams.get("error");
      const savedState = sessionStorage.getItem("oauth_state") || "";

      if (oauthError) {
        message.error("Bạn đã hủy hoặc OAuth bị lỗi. Vui lòng thử lại.");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
        return;
      }

      if (!code) {
        message.error("Không nhận được authorization code. Vui lòng thử lại.");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
        return;
      }

      // React StrictMode (dev) có thể gọi effect 2 lần; bỏ qua code đã xử lý.
      if (handledOAuthCodes.has(code)) {
        return;
      }

      if (!state || !savedState || state !== savedState) {
        message.error("Trạng thái OAuth không hợp lệ. Vui lòng thử lại.");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
        return;
      }

      const provider = resolveProvider(state);
      if (provider !== "google" && provider !== "facebook") {
        message.error("Không xác định được nhà cung cấp OAuth. Vui lòng thử lại.");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
        return;
      }

      handledOAuthCodes.add(code);

      try {
        const response = await fetch(`${API_BASE_URL}/auth/oauth/${provider}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            redirectUri,
          }),
        });

        const text = await response.text();
        if (!text) {
          throw new Error("Empty response from server");
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse OAuth response:", text.substring(0, 200));
          throw new Error("Invalid response format from server. Please try logging in again.");
        }

        if (!response.ok) {
          throw new Error(data.message || "Đăng nhập OAuth thất bại");
        }

        login(data);
        sessionStorage.removeItem("oauth_state");
        message.success("Đăng nhập thành công! Đang chuyển hướng...");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 800);
      } catch (error) {
        handledOAuthCodes.delete(code);
        logger.error("OAuth callback error:", error);
        message.error(error.message || "Có lỗi khi xử lý OAuth. Vui lòng thử lại.");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
      }
    };

    executeOAuthLogin();
  }, [login, navigate, redirectUri, searchParams]);

  // Return empty fragment - only show notifications
  return null;
};

export default AuthCallback;
