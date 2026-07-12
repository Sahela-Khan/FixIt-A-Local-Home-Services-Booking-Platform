import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};


export const STATUS_FLOW = ["booked", "accepted", "en_route", "in_progress", "completed"];

export const STATUS_LABEL = {
  booked: "Booked",
  accepted: "Provider Accepted",
  en_route: "En Route",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function nextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

const MOCK_PROFILE = {
  availability: "online", 
  avgRating: 4.7,
  reviewCount: 21,
  completedJobs: 37,
};

const MOCK_BOOKINGS = [
  {
    id: "BK-1042",
    listingTitle: "AC Repair & Gas Refill",
    category: "AC Repair",
    customerName: "Rafiq Hasan",
    customerPhone: "01711-223344",
    address: "House 12, Road 5, Mirpur 10, Dhaka",
    date: "2026-07-13",
    timeSlot: "10:30 AM – 12:00 PM",
    price: 1200,
    status: "booked",
    paymentStatus: "pending",
  },
  {
    id: "BK-1039",
    listingTitle: "Ceiling Fan Installation",
    category: "Electrician",
    customerName: "Nusrat Jahan",
    customerPhone: "01822-556677",
    address: "Flat 4B, Road 27, Dhanmondi, Dhaka",
    date: "2026-07-13",
    timeSlot: "2:00 PM – 3:00 PM",
    price: 600,
    status: "accepted",
    paymentStatus: "pending",
  },
  {
    id: "BK-1035",
    listingTitle: "Full House Wiring Check",
    category: "Electrician",
    customerName: "Kamal Uddin",
    customerPhone: "01933-889900",
    address: "House 8, Block C, Bashundhara R/A, Dhaka",
    date: "2026-07-12",
    timeSlot: "4:00 PM – 5:30 PM",
    price: 900,
    status: "en_route",
    paymentStatus: "pending",
  },
  {
    id: "BK-1030",
    listingTitle: "Geyser Repair",
    category: "Plumbing",
    customerName: "Farhana Akter",
    customerPhone: "01644-112233",
    address: "House 21, Sector 7, Uttara, Dhaka",
    date: "2026-07-11",
    timeSlot: "11:00 AM – 12:00 PM",
    price: 1500,
    status: "completed",
    paymentStatus: "paid",
  },
  {
    id: "BK-1028",
    listingTitle: "Deep Cleaning — 2 Bedroom Apartment",
    category: "Cleaning",
    customerName: "Tanvir Ahmed",
    customerPhone: "01555-990011",
    address: "House 3, Road 11, Banani, Dhaka",
    date: "2026-07-05",
    timeSlot: "9:00 AM – 1:00 PM",
    price: 2400,
    status: "completed",
    paymentStatus: "paid",
  },
];

const MOCK_EARNINGS = {
  today: 1200,
  thisWeek: 5300,
  thisMonth: 18700,
  trend: [
    { month: "Feb", amount: 5200 },
    { month: "Mar", amount: 6100 },
    { month: "Apr", amount: 7400 },
    { month: "May", amount: 6800 },
    { month: "Jun", amount: 8300 },
    { month: "Jul", amount: 8700 },
  ],
};

const MOCK_REVIEWS = [
  { id: "RV-1", bookingId: "BK-1030", customerName: "Farhana Akter", rating: 5, comment: "Fixed the geyser fast and explained the issue clearly.", providerReply: "", date: "2026-07-11" },
  { id: "RV-2", bookingId: "BK-1035", customerName: "Kamal Uddin", rating: 4, comment: "Good work, arrived a bit late but quality was fine.", providerReply: "", date: "2026-07-12" },
  { id: "RV-3", bookingId: "BK-1028", customerName: "Tanvir Ahmed", rating: 5, comment: "Very professional, will book again for sure.", providerReply: "Thank you, always happy to help!", date: "2026-07-05" },
];

export async function getProviderProfile() {
  try {
    const res = await axios.get(`${API_BASE}/provider/profile`, { headers: authHeader() });
    return res.data;
  } catch (err) {
    console.warn("[providerService] /provider/profile not available — using mock data");
    return MOCK_PROFILE;
  }
}

export async function getProviderBookings() {
  try {
    const res = await axios.get(`${API_BASE}/provider/bookings`, { headers: authHeader() });
    return res.data;
  } catch (err) {
    console.warn("[providerService] /provider/bookings not available — using mock data");
    return MOCK_BOOKINGS;
  }
}

export async function getProviderEarnings() {
  try {
    const res = await axios.get(`${API_BASE}/provider/earnings`, { headers: authHeader() });
    return res.data;
  } catch (err) {
    console.warn("[providerService] /provider/earnings not available — using mock data");
    return MOCK_EARNINGS;
  }
}

export async function getProviderReviews() {
  try {
    const res = await axios.get(`${API_BASE}/provider/reviews`, { headers: authHeader() });
    return res.data;
  } catch (err) {
    console.warn("[providerService] /provider/reviews not available — using mock data");
    return MOCK_REVIEWS;
  }
}

// FR-8.1 — Accept/Reject an incoming booking request
export async function respondToBooking(bookingId, action) {
  // action: "accepted" | "rejected"
  try {
    const res = await axios.patch(
      `${API_BASE}/provider/bookings/${bookingId}/respond`,
      { action },
      { headers: authHeader() }
    );
    return res.data;
  } catch (err) {
    console.warn("[providerService] respond-to-booking route missing — mock mode");
    return { id: bookingId, status: action };
  }
}

// FR-6.2 / FR-8.4 — provider advances job status along the pipeline
export async function updateJobStatus(bookingId, status) {
  try {
    const res = await axios.patch(
      `${API_BASE}/provider/bookings/${bookingId}/status`,
      { status },
      { headers: authHeader() }
    );
    return res.data;
  } catch (err) {
    console.warn("[providerService] job status route missing — mock mode (no live Socket.io push)");
    return { id: bookingId, status };
  }
}

// FR-16.1 — availability toggle (Online / Busy / Offline)
export async function updateAvailability(status) {
  try {
    const res = await axios.patch(
      `${API_BASE}/provider/availability`,
      { status },
      { headers: authHeader() }
    );
    return res.data;
  } catch (err) {
    console.warn("[providerService] availability route missing — mock mode");
    return { availability: status };
  }
}

// FR-11.2 — provider responds to a review
export async function replyToReview(reviewId, reply) {
  try {
    const res = await axios.patch(
      `${API_BASE}/provider/reviews/${reviewId}/reply`,
      { reply },
      { headers: authHeader() }
    );
    return res.data;
  } catch (err) {
    console.warn("[providerService] review reply route missing — mock mode");
    return { id: reviewId, providerReply: reply };
  }
}