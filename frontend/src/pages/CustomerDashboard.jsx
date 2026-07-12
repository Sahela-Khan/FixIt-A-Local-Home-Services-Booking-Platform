import { Link } from "react-router-dom";

// ===== Mock Data =====
const user = { name: "Rahim Ahmed" };

const stats = {
  active: 2,
  completed: 17,
  cancelled: 3,
  reviews: 12,
};

const currentBooking = {
  service: "AC Repair Service",
  provider: "Mizanur Khan",
  date: "12 July 2026",
  time: "4:00 PM - 6:00 PM",
  address: "House 12, Road 5, Dhanmondi, Dhaka",
  status: "En Route",
  statusMessage: "Provider is on the way",
};

const upcomingBookings = [
  {
    service: "Home Cleaning",
    date: "15 July 2026, 10:00 AM",
    status: "Confirmed",
    icon: "🧹",
  },
  {
    service: "Plumbing Repair",
    date: "18 July 2026, 2:00 PM",
    status: "Pending",
    icon: "🔧",
  },
  {
    service: "Electrical Service",
    date: "20 July 2026, 11:00 AM",
    status: "Pending",
    icon: "⚡",
  },
];

const bookingHistory = [
  {
    service: "Home Cleaning",
    provider: "SparkleClean Co.",
    date: "05 July 2026",
    amount: "₱ 1,200",
    status: "Completed",
    icon: "🧹",
  },
  {
    service: "Plumbing Repair",
    provider: "Karim Hossain",
    date: "02 July 2026",
    amount: "₱ 1,800",
    status: "Completed",
    icon: "🔧",
  },
  {
    service: "AC Repair Service",
    provider: "Mizanur Khan",
    date: "28 June 2026",
    amount: "₱ 2,500",
    status: "Completed",
    icon: "❄️",
  },
  {
    service: "Painting Service",
    provider: "Color House",
    date: "20 June 2026",
    amount: "₱ 4,000",
    status: "Cancelled",
    icon: "🎨",
  },
];

export default function CustomerDashboard() {
  return (
    <div className="dashboard-layout">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          Fix<span>It</span>
          <span className="sidebar-sub">Home Services</span>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link active">
            📊 Dashboard
          </Link>
          <Link to="/bookings" className="sidebar-link">
            📋 My Bookings
          </Link>
          <Link to="/reviews" className="sidebar-link">
            ⭐ My Reviews
          </Link>
          <Link to="/saved" className="sidebar-link">
            ❤️ Saved Providers
          </Link>
          <Link to="/payments" className="sidebar-link">
            💳 Payments
          </Link>
          <Link to="/profile" className="sidebar-link">
            ⚙️ Profile Settings
          </Link>
          <Link to="/support" className="sidebar-link">
            🆘 Support Center
          </Link>
        </nav>

        {/* Promo Card */}
        <div className="sidebar-promo">
          <div className="promo-badge">🔥 Get 10% Off</div>
          <p className="promo-code">
            Use code: <strong>FIXIT10</strong>
          </p>
          <p className="promo-text">on your next booking</p>
          <button className="promo-btn">Apply Now →</button>
        </div>

        <button className="sidebar-logout">🚪 Logout</button>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1>Good afternoon, {user.name} 👋</h1>
            <p className="subtitle">What service do you need today?</p>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search for services, providers..."
              />
            </div>
            <Link to="/book" className="btn btn-primary">
              + Book a Service
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-active">
            <div className="stat-icon-wrapper blue">
              <span className="stat-icon">📋</span>
            </div>
            <div className="stat-number">{stats.active}</div>
            <div className="stat-label">Active Bookings</div>
            <Link to="/bookings" className="stat-link">
              View details →
            </Link>
          </div>

          <div className="stat-card stat-completed">
            <div className="stat-icon-wrapper green">
              <span className="stat-icon">✅</span>
            </div>
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed Services</div>
            <Link to="/history" className="stat-link">
              View history →
            </Link>
          </div>

          <div className="stat-card stat-cancelled">
            <div className="stat-icon-wrapper red">
              <span className="stat-icon">❌</span>
            </div>
            <div className="stat-number">{stats.cancelled}</div>
            <div className="stat-label">Cancelled Services</div>
            <Link to="/cancelled" className="stat-link">
              View details →
            </Link>
          </div>

          <div className="stat-card stat-reviews">
            <div className="stat-icon-wrapper amber">
              <span className="stat-icon">⭐</span>
            </div>
            <div className="stat-number">{stats.reviews}</div>
            <div className="stat-label">Reviews Given</div>
            <Link to="/reviews" className="stat-link">
              View reviews →
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="left-column">
            {/* Current Booking */}
            <div className="card current-booking-card">
              <h3>📍 Current Booking</h3>

              <div className="booking-info">
                <h4>{currentBooking.service}</h4>
                <p className="provider">{currentBooking.provider}</p>
                <p className="meta">📅 {currentBooking.date}</p>
                <p className="meta">⏱️ {currentBooking.time}</p>
                <p className="address">📍 {currentBooking.address}</p>
              </div>

              <div className="view-details-wrapper">
                <Link to="/details" className="btn btn-ghost view-details-btn">
                  View Details →
                </Link>
              </div>

              <hr className="booking-divider" />

              <div className="booking-progress-wrapper">
                <h4>Booking Progress</h4>
                <div className="progress-steps">
                  <span className="step active">Booked</span>
                  <span className="step-arrow">→</span>
                  <span className="step active">Confirmed</span>
                  <span className="step-arrow">→</span>
                  <span className="step active">En Route</span>
                  <span className="step-arrow">→</span>
                  <span className="step">In Progress</span>
                  <span className="step-arrow">→</span>
                  <span className="step">Completed</span>
                </div>
              </div>

              <div className="booking-footer">
                <span className="status-message">{currentBooking.statusMessage}</span>
                <Link to="/track" className="btn btn-outline track-btn">
                  Track Booking
                </Link>
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="card">
              <div className="upcoming-header">
                <h3>📅 Upcoming Bookings</h3>
                <Link to="/upcoming" className="view-all-link">
                  View All →
                </Link>
              </div>
              {upcomingBookings.map((b, i) => (
                <div key={i} className="upcoming-item">
                  <div className="upcoming-left">
                    <span className="upcoming-icon">{b.icon}</span>
                    <div>
                      <span className="service">{b.service}</span>
                      <span className="date">{b.date}</span>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      b.status === "Confirmed" ? "confirmed" : "pending"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Booking History */}
            <div className="card">
              <h3>📜 My Booking History</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Provider</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingHistory.map((b, i) => (
                      <tr key={i}>
                        <td>
                          <span className="service-with-icon">
                            <span className="history-icon">{b.icon}</span>
                            {b.service}
                          </span>
                        </td>
                        <td>{b.provider}</td>
                        <td>{b.date}</td>
                        <td>{b.amount}</td>
                        <td>
                          <span
                            className={`badge ${
                              b.status === "Completed"
                                ? "completed"
                                : "cancelled"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td>
                          {b.status === "Completed" ? (
                            <button className="btn btn-sm">Leave Review</button>
                          ) : (
                            <button className="btn btn-sm btn-ghost">
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3>⚡ Quick Actions</h3>
              <div className="quick-grid">
                <Link to="/search" className="quick-card">
                  <span className="icon">🔍</span>
                  <div>
                    <strong>Book a New Service</strong>
                    <p>Find and book any service</p>
                  </div>
                </Link>
                <Link to="/services" className="quick-card">
                  <span className="icon">📋</span>
                  <div>
                    <strong>Browse Services</strong>
                    <p>Explore all available services</p>
                  </div>
                </Link>
                <Link to="/track" className="quick-card">
                  <span className="icon">📍</span>
                  <div>
                    <strong>Track Current Booking</strong>
                    <p>Track your booking in real-time</p>
                  </div>
                </Link>
                <Link to="/support" className="quick-card">
                  <span className="icon">🆘</span>
                  <div>
                    <strong>Help & Support</strong>
                    <p>Get help with your bookings</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}