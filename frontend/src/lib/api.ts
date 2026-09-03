/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

// Set auth token in localStorage
const setAuthToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

// Remove auth token from localStorage
const removeAuthToken = (): void => {
  localStorage.removeItem("authToken");
};

// Create headers with auth token
const createHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Update your apiRequest function in api.ts:
const parseJsonSafely = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: "Received an invalid response from the server." };
  }
};

const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  includeAuth: boolean = true,
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = createHeaders(includeAuth);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      const status = response.status;
      const message =
        data?.message || data?.error || "The request could not be completed.";

      if (status === 401 || status === 403) {
        return {
          success: false,
          message,
          status,
        };
      }

      if (status === 404) {
        return {
          success: false,
          message: message || "Resource not found.",
          status,
        };
      }

      if (status === 409 || status === 422) {
        return {
          success: false,
          message,
          status,
        };
      }

      return {
        success: false,
        message: message || "API request failed.",
        status,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error && error.message
          ? error.message
          : "Network error. Please try again.",
    };
  }
};

// Authentication API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    const data = await apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false,
    );

    if (data.success && data.data.token) {
      setAuthToken(data.data.token);
    }

    return data;
  },

  register: async (
    username: string,
    name: string,
    email: string,
    password: string,
    role: string = "guest",
  ) => {
    const data = await apiRequest(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ username, name, email, password, role }),
      },
      false,
    );

    if (data.success && data.data.token) {
      setAuthToken(data.data.token);
    }

    return data;
  },

  logout: () => {
    removeAuthToken();
  },

  getProfile: async () => {
    const token = getAuthToken();
    if (!token) {
      // Return empty response if no token
      return { success: false, message: "No authentication token" };
    }

    const response = await apiRequest("/auth/profile");

    if (response.status === 401 || response.status === 403) {
      removeAuthToken();
    }

    return response;
  },

  // NEW: Forgot Password
  forgotPassword: async (email: string) => {
    return await apiRequest(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      false,
    );
  },

  // NEW: Reset Password
  resetPassword: async (email: string, otp: string, newPassword: string) => {
    return await apiRequest(
      "/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
      },
      false,
    );
  },

  updateProfile: async (profileData: any) => {
    return await apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return await apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Listings API calls
export const listingsAPI = {
  getListings: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/listings${queryString ? `?${queryString}` : ""}`,
      {},
      false,
    );
  },

  getFeaturedListings: async () => {
    return await apiRequest("/listings/featured", {}, false);
  },

  getListing: async (id: string) => {
    return await apiRequest(`/listings/${id}`, {}, false);
  },

  checkAvailability: async (id: string, startDate: string, endDate: string) => {
    return await apiRequest(
      `/listings/${id}/availability?startDate=${startDate}&endDate=${endDate}`,
      {},
      false,
    );
  },

  createListing: async (listingData: any) => {
    return await apiRequest("/listings", {
      method: "POST",
      body: JSON.stringify(listingData),
    });
  },

  updateListing: async (id: string, listingData: any) => {
    return await apiRequest(`/listings/${id}`, {
      method: "PUT",
      body: JSON.stringify(listingData),
    });
  },

  getWishlist: async () => {
    return await apiRequest("/wishlist");
  },

  toggleWishlist: async (listingId: string) => {
    return await apiRequest("/wishlist", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
  },

  deleteListing: async (id: string) => {
    return await apiRequest(`/listings/${id}`, {
      method: "DELETE",
    });
  },

  getHostListings: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/listings/host/my-listings${queryString ? `?${queryString}` : ""}`,
    );
  },
};

export const conversationsAPI = {
  getConversations: async () => {
    return await apiRequest("/conversations");
  },

  createConversation: async (payload: any) => {
    return await apiRequest("/conversations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMessages: async (conversationId: string) => {
    return await apiRequest(`/conversations/${conversationId}/messages`);
  },

  sendMessage: async (conversationId: string, payload: any) => {
    return await apiRequest(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export const notificationsAPI = {
  list: async () => {
    return await apiRequest("/notifications");
  },

  getUnreadCount: async () => {
    return await apiRequest("/notifications/unread-count");
  },

  markRead: async (notificationId: string) => {
    return await apiRequest(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },

  markAllRead: async () => {
    return await apiRequest("/notifications/read-all", {
      method: "PATCH",
    });
  },
};

// Bookings API calls
export const bookingsAPI = {
  createBooking: async (bookingData: any) => {
    return await apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
  },

  createPayment: async (paymentData: any) => {
    return await apiRequest("/payments/create", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },

  verifyPayment: async (paymentId: string, providerPaymentId?: string) => {
    return await apiRequest(`/payments/${paymentId}/verify`, {
      method: "POST",
      body: JSON.stringify({ providerPaymentId }),
    });
  },

  getUserBookings: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/bookings/my-bookings${queryString ? `?${queryString}` : ""}`,
    );
  },

  getHostBookings: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/bookings/host/bookings${queryString ? `?${queryString}` : ""}`,
    );
  },

  getBooking: async (id: string) => {
    return await apiRequest(`/bookings/${id}`);
  },

  updateBookingStatus: async (
    id: string,
    status: string,
    hostNotes?: string,
  ) => {
    return await apiRequest(`/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, hostNotes }),
    });
  },

  cancelBooking: async (id: string, cancellationReason?: string) => {
    return await apiRequest(`/bookings/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ cancellationReason }),
    });
  },
};

// Reviews API calls
export const reviewsAPI = {
  getListingReviews: async (listingId: string, params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/reviews/listing/${listingId}${queryString ? `?${queryString}` : ""}`,
      {},
      false,
    );
  },

  createReview: async (reviewData: any) => {
    return await apiRequest("/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  },

  getUserReviews: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/reviews/my-reviews${queryString ? `?${queryString}` : ""}`,
    );
  },

  updateReview: async (id: string, reviewData: any) => {
    return await apiRequest(`/reviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(reviewData),
    });
  },

  deleteReview: async (id: string) => {
    return await apiRequest(`/reviews/${id}`, {
      method: "DELETE",
    });
  },

  respondToReview: async (id: string, comment: string) => {
    return await apiRequest(`/reviews/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },

  flagReview: async (id: string, reason: string) => {
    return await apiRequest(`/reviews/${id}/flag`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
};

// Admin API calls
export const adminAPI = {
  getDashboardStats: async () => {
    return await apiRequest("/admin/dashboard");
  },

  getAnalytics: async (period: string = "30d") => {
    return await apiRequest(`/admin/analytics?period=${period}`);
  },

  getAllUsers: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/admin/users${queryString ? `?${queryString}` : ""}`,
    );
  },

  getAllBookings: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/admin/bookings${queryString ? `?${queryString}` : ""}`,
    );
  },

  updateUser: async (id: string, userData: any) => {
    return await apiRequest(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  deactivateUser: async (id: string, reason?: string) => {
    return await apiRequest(`/admin/users/${id}/deactivate`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  },

  reactivateUser: async (id: string) => {
    return await apiRequest(`/admin/users/${id}/reactivate`, {
      method: "PATCH",
    });
  },

  getAllListings: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/admin/listings${queryString ? `?${queryString}` : ""}`,
    );
  },

  verifyListing: async (id: string, isVerified: boolean, notes?: string) => {
    return await apiRequest(`/admin/listings/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ isVerified, notes }),
    });
  },

  deleteListing: async (id: string) => {
    return await apiRequest(`/admin/listings/${id}`, {
      method: "DELETE",
    });
  },

  getFlaggedReviews: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/admin/reviews/flagged${queryString ? `?${queryString}` : ""}`,
    );
  },

  moderateReview: async (
    id: string,
    action: "approve" | "remove",
    reason?: string,
  ) => {
    return await apiRequest(`/admin/reviews/${id}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason }),
    });
  },
};

// Users API calls
export const usersAPI = {
  getUser: async (id: string) => {
    return await apiRequest(`/users/${id}`, {}, false);
  },

  updateUser: async (id: string, userData: any) => {
    return await apiRequest(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },
};

// Health check
export const healthCheck = async () => {
  return await apiRequest("/health", {}, false);
};

export { API_BASE_URL, getAuthToken, setAuthToken, removeAuthToken };
