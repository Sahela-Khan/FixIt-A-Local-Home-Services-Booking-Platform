const Service = require("../models/Service");
const User = require("../models/User");

// @desc  Search / browse approved services (with optional filters)
// @route GET /api/services?keyword=&category=&location=&maxPrice=
// @access Private (customer)
exports.listServices = async (req, res) => {
  try {
    // --- SEARCH & FILTER FEATURE DISABLED ---
    // Returns all approved services regardless of filters

    const services = await Service.find({
      approvalStatus: "approved",
      isActive: true,
    })
      .populate("provider", "name providerProfile")
      .sort({ createdAt: -1 });

    // Providers can be suspended after the fact (e.g. a fake-looking NID) —
    // suspension isn't a pre-approval gate, but it does hide their services
    // from customer search immediately.
    const visibleServices = services.filter(
      (s) => !s.provider?.providerProfile?.suspended
    );

    return res.status(200).json({ services: visibleServices });
  } catch (err) {
    console.error("listServices error:", err);
    return res.status(500).json({ message: "Server error while searching services." });
  }
};

// @desc  Distinct list of provider locations
// @route GET /api/services/locations
// @access Private (customer)
exports.listLocations = async (req, res) => {
  try {
    // --- DYNAMIC LOCATIONS FEATURE DISABLED ---
    // Returns static locations list
    
    const locations = [
      "Dhaka", 
      "Chittagong", 
      "Sylhet", 
      "Khulna", 
      "Rajshahi", 
      "Barishal", 
      "Rangpur", 
      "Mymensingh"
    ];
    
    return res.status(200).json({ locations });
  } catch (err) {
    console.error("listLocations error:", err);
    return res.status(500).json({ message: "Server error while loading locations." });
  }
};

// @desc  Toggle saving a provider for quick re-booking
// @route PUT /api/services/saved-providers/:providerId
// @access Private (customer)
exports.toggleSavedProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const customer = await User.findById(req.user.id);

    const alreadySaved = customer.savedProviders.some(
      (id) => id.toString() === providerId
    );

    if (alreadySaved) {
      customer.savedProviders = customer.savedProviders.filter(
        (id) => id.toString() !== providerId
      );
    } else {
      customer.savedProviders.push(providerId);
    }

    await customer.save();
    return res.status(200).json({ saved: !alreadySaved, savedProviders: customer.savedProviders });
  } catch (err) {
    console.error("toggleSavedProvider error:", err);
    return res.status(500).json({ message: "Server error while saving provider." });
  }
};

// @desc  Get the logged-in customer's saved providers
// @route GET /api/services/saved-providers
// @access Private (customer)
exports.getSavedProviders = async (req, res) => {
  try {
    const customer = await User.findById(req.user.id).populate(
      "savedProviders",
      "name providerProfile"
    );
    return res.status(200).json({ savedProviders: customer.savedProviders });
  } catch (err) {
    console.error("getSavedProviders error:", err);
    return res.status(500).json({ message: "Server error while fetching saved providers." });
  }
};