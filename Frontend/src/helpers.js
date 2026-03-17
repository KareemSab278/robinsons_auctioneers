const DEBUG = import.meta.env.DEV; // checks if environment is dev of prod
const BASE_URL = DEBUG ? 'http://192.168.0.190:3000' : import.meta.env.VITE_API_URL;

export {
  getActiveAuctions,
  getEndedAuctions,
  getAuctionById,
  getUserAuctions,
  createAuction,
  updateAuction,
  deleteAuction,
  endAuction,
  getBidsForAuction,
  getMaxBid,
  placeBid,
  deleteBid,
  getUserByUsername,
  getUserById,
  updateUser,
  deleteUser,
  getUserWonAuctions,
  login,
  register,
  adminLogin,
  createAdmin,
  bootstrapAdmin,
  handleInvalidSession,
  getAuctionImages,
  uploadAuctionImage,
};

const getSessionExpiry = () => {
  return (
    JSON.parse(localStorage.getItem("signed_in_user"))?.session_expiry || null
  );
};

const getAuthToken = () => {
  return JSON.parse(localStorage.getItem("signed_in_user"))?.token || null;
};

const request = async (path, options = {}) => {
  const expiry = getSessionExpiry();
  const token = getAuthToken();

  const bodyObj = options.body ? JSON.parse(options.body) : {};
  if (expiry) bodyObj.session_expiry = expiry;

  const method = (options.method || "GET").toUpperCase();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (DEBUG) {
    console.log("[api] request", {
      path,
      method,
      token: token ? "[redacted]" : null,
      expiry,
      body: bodyObj,
    });
  }

  const fetchOptions = {
    headers,
    ...options,
  };

  if (method !== "GET" && method !== "HEAD") {
    fetchOptions.body = JSON.stringify(bodyObj);
  }

  const res = await fetch(`${BASE_URL}${path}`, fetchOptions);
  const body = await res.json();

  if (DEBUG) {
    console.log("[api] response", {
      path,
      status: res.status,
      ok: res.ok,
      body,
    });
  }

  if (body.session_status === false) {
    localStorage.removeItem("signed_in_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    throw new Error(body.message || body.error || "Request failed");
  }

  if (!body.success) {
    throw new Error(body.error || "Request failed");
  }

  return body.data ?? body.session_status;
};

const getActiveAuctions = async () => {
  return await request("/api/auctions/active");
};

const getEndedAuctions = async () => {
  return await request("/api/auctions/ended");
};

const getAuctionById = async (id) => {
  return await request(`/api/auctions/${id}`);
};

const getUserAuctions = async (userId) => {
  return await request(`/api/auctions/user/${userId}`);
};

const createAuction = async (data) => {
  return await request("/api/auctions", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

const updateAuction = async (id, data) => {
  return await request(`/api/auctions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

const deleteAuction = async (id) => {
  return await request(`/api/auctions/${id}`, { method: "DELETE" });
};

const endAuction = async (id) => {
  return await request(`/api/auctions/${id}/end`, { method: "POST" });
};

const getBidsForAuction = async (auctionId) => {
  return await request(`/api/auctions/${auctionId}/bids`);
};

const getMaxBid = async (auctionId) => {
  return await request(`/api/auctions/${auctionId}/bids/max`);
};

const placeBid = async (data) => {
  return await request("/api/bids", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

const deleteBid = async (bidId) => {
  return await request(`/api/bids/${bidId}`, { method: "DELETE" });
};

const getUserByUsername = async (username) => {
  return await request(`/api/users/${username}`);
};

const getUserById = async (id) => {
  return await request(`/api/users/id/${id}`);
};

const updateUser = async (id, data) => {
  return await request(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

const deleteUser = async (id) => {
  return await request(`/api/users/${id}`, { method: "DELETE" });
};

const getUserWonAuctions = async (id) => {
  return await request(`/api/users/${id}/won`);
};

const login = async (data) => {
  return await request("/api/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

const register = async (data) => {
  return await request("/api/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

const adminLogin = async (data) => {
  return await request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

const createAdmin = async (data) => {
  return await request("/api/admin/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

const bootstrapAdmin = async (data) => {
  const res = await fetch(`${BASE_URL}/api/admin/bootstrap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

const getAuctionImages = async (id) => {
  // returns array of base64 strings
  return await request(`/api/auctions/${id}/images`);
};

// imageData should be an array of base64-encoded strings
const uploadAuctionImage = async (id, imageData) => {
  return await request(`/api/auctions/${id}/images`, {
    method: "POST",
    body: JSON.stringify({ image_data: Array.isArray(imageData) ? imageData : [imageData] }),
  });
};

const handleInvalidSession = async () => {
  const signedInUser = JSON.parse(
    localStorage.getItem("signed_in_user") || "null",
  );
  const expiry = signedInUser?.session_expiry;
  if (!expiry) return false;

  if (new Date(expiry) <= new Date()) {
    localStorage.removeItem("signed_in_user");
    return true;
  }

  try {
    const sessionValid = await request("/api/session/validate", {
      method: "POST",
      body: JSON.stringify({ session_expiry: expiry }),
    });
    return sessionValid; // true if valid, false if expired
  } catch {
    return false;
  }
};
