const BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.0.190:3000";

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
};

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  console.log(`response for ${path}: `, res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || "Request failed");
  }
  return body.data;
};

// --- Auctions ---
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

// --- Bids ---
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

// --- Users ---
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

// --- Auth ---
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
