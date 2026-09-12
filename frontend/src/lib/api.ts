/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/// Authentication token helpers (retained as no-ops for API compatibility)
const getAuthToken = (): string | null => null;
const setAuthToken = (_token: string): void => {};
const removeAuthToken = (): void => {};

// Create standard API headers (credentials: 'include' handles cookie authentication)
const createHeaders = (_includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
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
      credentials: "include",
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

      return {
        success: false,
        message,
        errors: data?.errors,
        details: data?.details,
        field: data?.field,
        status,
        ...data,
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
    return await apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false,
    );
  },

  register: async (
    username: string,
    name: string,
    email: string,
    password: string,
    role: string = "guest",
  ) => {
    return await apiRequest(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ username, name, email, password, role }),
      },
      false,
    );
  },

  logout: async () => {
    return await apiRequest("/auth/logout", { method: "POST" });
  },

  verifyEmail: async (token: string) => {
    return await apiRequest(`/auth/verify-email/${encodeURIComponent(token)}`, { method: "GET" }, false);
  },

  resendVerification: async () => {
    return await apiRequest("/auth/resend-verification", { method: "POST" });
  },

  deleteAccount: async () => {
    return await apiRequest("/auth/account", { method: "DELETE" });
  },

  applyForHost: async (data?: { bio?: string; languages?: string[] }) => {
    return await apiRequest("/auth/apply-host", {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  },

  getProfile: async () => {
    return await apiRequest("/auth/profile");
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

/// Helper to build safe query strings without undefined, null, or empty string params
const buildCleanQueryString = (params: Record<string, any> = {}): string => {
  const cleanParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "undefined" || value === "null") {
      return;
    }
    if (Array.isArray(value)) {
      if (value.length > 0) {
        cleanParams.set(key, value.join(","));
      }
    } else {
      cleanParams.set(key, String(value).trim());
    }
  });
  return cleanParams.toString();
};

// Listings API calls
export const listingsAPI = {
  getListings: async (params: any = {}) => {
    const queryString = buildCleanQueryString(params);
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
    if (!id || id === "undefined" || id === "null" || !id.trim()) {
      return {
        success: false,
        message: "Invalid listing ID provided",
        status: 400
      };
    }
    return await apiRequest(`/listings/${encodeURIComponent(id.trim())}`, {}, false);
  },

  checkAvailability: async (id: string, startDate: string, endDate: string) => {
    if (!id || id === "undefined" || id === "null" || !id.trim()) {
      return {
        success: false,
        message: "Invalid listing ID provided",
        status: 400
      };
    }
    return await apiRequest(
      `/listings/${encodeURIComponent(id.trim())}/availability?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
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
    if (!id || id === "undefined" || id === "null" || !id.trim()) {
      return {
        success: false,
        message: "Invalid listing ID provided",
        status: 400
      };
    }
    return await apiRequest(`/listings/${encodeURIComponent(id.trim())}`, {
      method: "PUT",
      body: JSON.stringify(listingData),
    });
  },

  getWishlist: async () => {
    return await apiRequest("/wishlist");
  },

  toggleWishlist: async (listingId: string) => {
    if (!listingId || listingId === "undefined" || listingId === "null" || !listingId.trim()) {
      return {
        success: false,
        message: "Invalid listing ID provided",
        status: 400
      };
    }
    return await apiRequest("/wishlist", {
      method: "POST",
      body: JSON.stringify({ listingId: listingId.trim() }),
    });
  },

  removeWishlistItem: async (listingId: string) => {
    if (!listingId || listingId === "undefined" || listingId === "null" || !listingId.trim()) {
      return {
        success: false,
        message: "Invalid listing ID provided",
        status: 400
      };
    }
    return await apiRequest(`/wishlist/${encodeURIComponent(listingId.trim())}`, {
      method: "DELETE",
    });
  },

  checkWishlistStatus: async (listingIds: string[]) => {
    const validIds = (listingIds || []).filter(
      (id) => Boolean(id) && id !== "undefined" && id !== "null"
    );
    if (validIds.length === 0) {
      return { success: true, data: { wishlistStatus: {} } };
    }
    return await apiRequest("/wishlist/check", {
      method: "POST",
      body: JSON.stringify({ listingIds: validIds }),
    });
  },

  deleteListing: async (id: string) => {
    if (!id || id === "undefined" || id === "null" || !id.trim()) {
      return {
        success: false,
        message: "Invalid listing ID provided",
        status: 400
      };
    }
    return await apiRequest(`/listings/${encodeURIComponent(id.trim())}`, {
      method: "DELETE",
    });
  },

  publishListing: async (id: string) => {
    if (!id || id === "undefined" || id === "null" || !id.trim()) {
      return {
        success: false,
        message: "Invalid listing ID provided",
        status: 400
      };
    }
    return await apiRequest(`/listings/${encodeURIComponent(id.trim())}/publish`, {
      method: "POST",
    });
  },

  unpublishListing: async (id: string) => {
    if (!id || id === "undefined" || id === "null" || !id.trim()) {
      return {
        success: false,
        message: "Invalid listing ID provided",
        status: 400
      };
    }
    return await apiRequest(`/listings/${encodeURIComponent(id.trim())}/unpublish`, {
      method: "POST",
    });
  },

  getHostListings: async (params: any = {}) => {
    const queryString = buildCleanQueryString(params);
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

  verifyPayment: async (paymentId: string, verificationData?: any) => {
    const body = typeof verificationData === 'string'
      ? { providerPaymentId: verificationData }
      : (verificationData || {});
    return await apiRequest(`/payments/${paymentId}/verify`, {
      method: "POST",
      body: JSON.stringify(body),
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

  getPendingHosts: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/admin/hosts/pending${queryString ? `?${queryString}` : ""}`,
    );
  },

  approveHost: async (id: string) => {
    return await apiRequest(`/admin/hosts/${id}/approve`, {
      method: "PATCH",
    });
  },

  rejectHost: async (id: string, reason?: string) => {
    return await apiRequest(`/admin/hosts/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
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

// AI API calls
export const aiAPI = {
  getHealth: async () => {
    return await apiRequest("/ai/health", {}, false);
  },

  getConfig: async () => {
    return await apiRequest("/ai/config");
  },

  testProvider: async () => {
    return await apiRequest("/ai/test", { method: "POST" });
  },

  generateListingDescription: async (data: any) => {
    return await apiRequest("/ai/listing-description", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  helpAssistant: async (question: string) => {
    return await apiRequest("/ai/help-assistant", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
  },

  pricingRecommendation: async (listingId: string) => {
    return await apiRequest("/ai/pricing-recommendation", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
  },

  suggestMessageReplies: async (conversationId: string) => {
    return await apiRequest("/ai/message-replies", {
      method: "POST",
      body: JSON.stringify({ conversationId }),
    });
  },

  moderateContent: async (contentType: string, content: string) => {
    return await apiRequest("/ai/moderate", {
      method: "POST",
      body: JSON.stringify({ contentType, content }),
    });
  },

  reviewSummary: async (listingId: string) => {
    return await apiRequest("/ai/review-summary", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });
  },

  semanticSearch: async (query: string) => {
    return await apiRequest("/ai/semantic-search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },

  translate: async (text: string, from: string, to: string) => {
    return await apiRequest("/ai/translate", {
      method: "POST",
      body: JSON.stringify({ text, from, to }),
    });
  },
};

// Saved Searches API calls
export const savedSearchesAPI = {
  getSavedSearches: async () => {
    return await apiRequest("/saved-searches");
  },

  createSavedSearch: async (data: any) => {
    return await apiRequest("/saved-searches", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteSavedSearch: async (id: string) => {
    return await apiRequest(`/saved-searches/${id}`, {
      method: "DELETE",
    });
  },
};

// Payments API calls
export const paymentsAPI = {
  getPaymentHistory: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(
      `/payments/history${queryString ? `?${queryString}` : ""}`,
    );
  },
};

// Villages & Destinations API calls
export const villageAPI = {
  getVillages: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/villages${queryString ? `?${queryString}` : ""}`, {}, false);
  },

  getFeaturedVillages: async () => {
    return await apiRequest("/villages/featured", {}, false);
  },

  getVillageBySlug: async (slug: string) => {
    return await apiRequest(`/villages/${encodeURIComponent(slug)}`, {}, false);
  },
};

// Articles & Content API calls
export const articlesAPI = {
  getArticles: async (params: any = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/articles${queryString ? `?${queryString}` : ""}`, {}, false);
  },

  getArticleBySlug: async (slug: string) => {
    return await apiRequest(`/articles/${encodeURIComponent(slug)}`, {}, false);
  },

  createArticle: async (data: any) => {
    return await apiRequest("/articles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateArticle: async (id: string, data: any) => {
    return await apiRequest(`/articles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteArticle: async (id: string) => {
    return await apiRequest(`/articles/${id}`, {
      method: "DELETE",
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

  getNotificationPreferences: async () => {
    return await apiRequest("/users/notification-preferences");
  },

  updateNotificationPreferences: async (preferences: any) => {
    return await apiRequest("/users/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify(preferences),
    });
  },
};

// Health check
export const healthCheck = async () => {
  return await apiRequest("/health", {}, false);
};

export { API_BASE_URL, getAuthToken, setAuthToken, removeAuthToken };
