/**
 * Utility to safely parse JSON responses and provide detailed error information
 * Fixes: "Unexpected token '<'" error when backend returns HTML instead of JSON
 */

export const safeFetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
  });

  // Read response text once
  const text = await response.text();
  let data = {};

  // Try to parse as JSON
  try {
    if (text) {
      data = JSON.parse(text);
    }
  } catch (jsonError) {
    const preview = text.substring(0, 300);
    console.error(`[API ERROR] Response is not valid JSON from ${url}`);
    console.error(`[Response Preview]: ${preview.substring(0, 100)}...`);
    console.error(`[Status Code]: ${response.status}`);
    console.error(`[Content-Type]: ${response.headers.get('content-type')}`);

    if (!response.ok || response.status >= 400) {
      throw new Error(
        `Backend Error (${response.status}): ${response.statusText}\n` +
        `The backend returned invalid JSON. It may be returning an error page.\n` +
        `URL: ${url}\n` +
        `Response: ${preview}`
      );
    }
    // If status is OK but not JSON, return empty object
    data = {};
  }

  if (!response.ok) {
    const errorMsg =
      data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
    console.error(`[API ERROR] ${url}:`, errorMsg);
    throw new Error(errorMsg);
  }

  return data;
};

/**
 * Create a fetch helper with auth headers
 */
export const createApiFetch = (getAuthHeaders) => {
  return async (url, options = {}) => {
    return safeFetchJson(url, {
      ...options,
      headers: {
        ...getAuthHeaders?.(),
        ...(options.headers || {}),
      },
    });
  };
};
