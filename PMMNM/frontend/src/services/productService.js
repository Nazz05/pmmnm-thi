import api from './api';

export const productService = {
  async getProductDetail(productId) {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  async listProducts(page = 1, limit = 20) {
    try {
      const response = await api.get(`/products?page=${page}&limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }
};
