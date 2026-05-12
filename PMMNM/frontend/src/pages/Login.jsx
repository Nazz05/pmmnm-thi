import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { message } from "antd";
import logger from "../utils/logger";
import { useAuth } from "../context/AuthContext";
import { validateLoginForm } from "../utils/validation";
import "./Login/login.css";

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
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const FACEBOOK_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const redirectUri = useMemo(() => `${window.location.origin}/auth/callback`, []);

  // Log API URL for debugging
  useEffect(() => {
    console.log(`[Login] API Base URL: ${API_BASE_URL}`);
    console.log(`[Login] Hostname: ${window.location.hostname}`);
    console.log(`[Login] Protocol: ${window.location.protocol}`);
  }, []);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const facebookClientId = import.meta.env.VITE_FACEBOOK_CLIENT_ID || "";

  const createOAuthState = (provider) => {
    const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const state = `${provider}:${nonce}`;
    sessionStorage.setItem("oauth_state", state);
    return state;
  };

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      message.error("Thiếu VITE_GOOGLE_CLIENT_ID trong frontend/.env");
      return;
    }

    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state: createOAuthState("google"),
    });

    window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  };

  const handleFacebookLogin = () => {
    if (!facebookClientId) {
      message.error("Thiếu VITE_FACEBOOK_CLIENT_ID trong frontend/.env");
      return;
    }

    const params = new URLSearchParams({
      client_id: facebookClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "email,public_profile",
      state: createOAuthState("facebook"),
    });

    window.location.href = `${FACEBOOK_AUTH_URL}?${params.toString()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});
    
    // Validate login form
    const validation = validateLoginForm({ username, password });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);

    try {
      // Call backend API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,
          password: password,
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
        console.error("Failed to parse login response:", text.substring(0, 200));
        throw new Error("Invalid response format from server. Please check your connection and try again.");
      }

      if (!response.ok) {
        setError(data.message || "Đăng nhập thất bại");
        message.error(data.message || "Đăng nhập thất bại");
        return;
      }

      // Save token and user to localStorage
      login(data);
      
      message.success("Đăng nhập thành công!");
      
      // Redirect after delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      logger.error('Login error:', err);
      const errorMsg = err.message || "Có lỗi xảy ra";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <Link to="/">Sixedi</Link>
          <p>Thời trang đẳng cấp cho mọi người</p>
        </div>

        {/* Body */}
        <div className="login-body">
          <h2>Đăng Nhập Tài Khoản</h2>

          {error && <p className="error-text">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tài khoản</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Nhập tên đăng nhập hoặc email"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                  }}
                  className={errors.username ? 'input-error' : ''}
                  required
                />
              </div>
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className={errors.password ? 'input-error' : ''}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#666',
                    padding: '5px'
                  }}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label>
                <input type="checkbox" /> Ghi nhớ đăng nhập
              </label>
            </div>

            <button className="login-btn" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className="social-divider">
              <span>hoặc tiếp tục với</span>
            </div>

            <div className="social-login">
              <button type="button" className="social-btn google-btn" onClick={handleGoogleLogin}>
                Google
              </button>
              <button type="button" className="social-btn facebook-btn" onClick={handleFacebookLogin}>
                Facebook
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="login-footer">
          Chưa có tài khoản?
          <Link to="/register"> Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
