// Utility functions for formatting
export const formatCurrency = (amount) => {
  if (!amount) return '0đ';

  // Convert to string and add dots for thousands separator
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
};