const User     = require('../models/User');
const Event    = require('../models/Event');
const Booking  = require('../models/Booking');
const Payment  = require('../models/Payment');
const ApiResponse = require('../utils/ApiResponse');

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
const getAdminStats = async (req, res) => {
  const [totalUsers, totalEvents, totalBookings, revenueResult] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments(),
    Booking.countDocuments(),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalRevenue = revenueResult[0]?.total ?? 0;

  res.json(new ApiResponse(200, {
    totalUsers,
    totalEvents,
    totalBookings,
    totalRevenue,
  }, 'Admin stats fetched'));
};

module.exports = { getAdminStats };
