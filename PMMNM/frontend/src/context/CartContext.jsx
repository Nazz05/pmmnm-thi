import { createContext, useContext, useState, useEffect } from "react";
import { message } from "antd";
import { useAuth } from "./AuthContext";
import api from "../services/api";

const CartContext = createContext(null);

// Helper: Convert server cart response to client shape
const mapServerCartToItems = (serverCart) => {
  if (!serverCart?.items) return [];
  return serverCart.items.map((ci) => {
    // Support different backend shapes (productId | product_id) and product relation
    const productId = ci.productId ?? ci.product_id ?? ci.product?.id ?? null;
    return {
      id: productId != null ? String(productId) : String(ci.id ?? ''),
      name: ci.product?.name || ci.name || '',
      imageUrl: ci.product?.image || ci.imageUrl || '',
      price: ci.product?.price ?? ci.price ?? 0,
      size: null,
      color: null,
      quantity: ci.quantity ?? ci.qty ?? 1,
      availableQuantity: ci.product?.stock ?? ci.availableQuantity ?? 0,
    };
  });
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const refreshServerCart = async () => {
    const resp = await api.get('/cart');
    const serverCart = resp?.data || null;
    const serverItems = mapServerCartToItems(serverCart);
    setCartItems(serverItems);
    return serverItems;
  };

  const [cartItems, setCartItems] = useState([]);

  // Listen for logout event to clear cart UI
  useEffect(() => {
    const handler = () => {
      setCartItems([]);
    };

    window.addEventListener('app:logout', handler);
    return () => window.removeEventListener('app:logout', handler);
  }, []);

  // Fetch cart from server on login; clear local state on logout
  useEffect(() => {
    const curId = user?.id ?? null;

    if (curId) {
      (async () => {
        try {
          setIsLoading(true);
          await refreshServerCart();
        } catch (err) {
          console.warn('Error loading server cart', err);
          message.error('Không thể tải giỏ hàng');
        } finally {
          setIsLoading(false);
        }
      })();
    }

    if (!curId) {
      setCartItems([]);
    }
  }, [user?.id]);

  // Add product to cart - call API immediately for logged-in users
  const addToCart = async (product) => {
    try {
      if (!user?.id) {
        message.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
        return;
      }

      // For logged-in users, call API immediately
      setIsLoading(true);
      const productId = Number(product.productId ?? product.id);
      
      if (!Number.isInteger(productId) || productId <= 0) {
        message.error('ID sản phẩm không hợp lệ');
        return;
      }

      const resp = await api.post('/cart/add', {
        productId,
        quantity: Number(product.quantity || 1),
      });

      // Update state from server response
      if (resp?.data) {
        const updated = mapServerCartToItems(resp.data);
        setCartItems(updated);
        message.success(resp.message || 'Sản phẩm đã được thêm vào giỏ');
      } else {
        await refreshServerCart();
      }

      return resp;
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMsg = error?.message || 'Lỗi khi thêm vào giỏ hàng';
      message.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove product from cart - call API for logged-in users
  const removeFromCart = async (id) => {
    try {
      if (!user?.id) {
        message.error('Vui lòng đăng nhập để thao tác giỏ hàng');
        return;
      }

      // For logged-in users, need to find cartItemId from current state
      const item = cartItems.find((i) => i.id === id);
      
      if (!item) {
        message.error('Không tìm thấy sản phẩm trong giỏ');
        return;
      }

      // Find the cartItemId from server (we need to re-fetch or store it)
      // Fetch current cart to get cartItemId
      setIsLoading(true);
      const cartResp = await api.get('/cart');
      const currentCart = cartResp?.data;
      
      if (!currentCart?.items) {
        message.error('Không thể lấy thông tin giỏ hàng');
        return;
      }

      const cartItem = currentCart.items.find((ci) =>
        Number(ci.productId ?? ci.product_id ?? ci.product?.id) === Number(id)
      );

      if (!cartItem) {
        message.error('Không tìm thấy sản phẩm trong giỏ');
        return;
      }

      // Delete from server
      const deleteResp = await api.delete(`/cart/${cartItem.id}`);
      
      if (deleteResp?.data) {
        const updated = mapServerCartToItems(deleteResp.data);
        setCartItems(updated);
        message.success(deleteResp.message || 'Sản phẩm đã được xóa khỏi giỏ');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      message.error(error?.message || 'Lỗi khi xóa sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // Update quantity - call API for logged-in users
  const updateQuantity = async (id, quantity) => {
    try {
      if (quantity < 1) return;

      if (!user?.id) {
        message.error('Vui lòng đăng nhập để thao tác giỏ hàng');
        return;
      }

      // For logged-in users, call API
      setIsLoading(true);
      
      // Fetch current cart to get cartItemId
      const cartResp = await api.get('/cart');
      const currentCart = cartResp?.data;
      
      if (!currentCart?.items) {
        message.error('Không thể lấy thông tin giỏ hàng');
        return;
      }

      const cartItem = currentCart.items.find((ci) =>
        Number(ci.productId ?? ci.product_id ?? ci.product?.id) === Number(id)
      );

      if (!cartItem) {
        message.error('Không tìm thấy sản phẩm trong giỏ');
        return;
      }

      // Update on server
      const updateResp = await api.put(`/cart/${cartItem.id}`, { quantity });
      
      if (updateResp?.data) {
        const updated = mapServerCartToItems(updateResp.data);
        setCartItems(updated);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      message.error(error?.message || 'Lỗi khi cập nhật số lượng');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      if (!user?.id) {
        message.error('Vui lòng đăng nhập để thao tác giỏ hàng');
        return;
      }

      // For logged-in users, delete on server
      setIsLoading(true);
      const resp = await api.delete('/cart');

      if (resp?.message || resp?.data) {
        setCartItems([]);
        message.success(resp.message || 'Giỏ hàng đã được xóa');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      message.error(error?.message || 'Lỗi khi xóa giỏ hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal: () => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0),
      getCartCount: () => cartItems.reduce((count, item) => count + item.quantity, 0),
      isLoading,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);