const Service = require("../models/Service");
const User = require("../models/User");

// @desc  Search / browse approved services (with optional filters)
// @route GET /api/services?keyword=&category=&location=&maxPrice=&sortBy=
// @access Private (customer)
exports.listServices = async (req, res) => {
  try {
    const { keyword, category, location, maxPrice, sortBy } = req.query;

    const filter = { approvalStatus: "approved", isActive: true };
    if (category && category !== "All") filter.category = category;
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };

    let services = await Service.find(filter)
      .populate("provider", "name providerProfile")
      .sort({ createdAt: -1 });

    // Only non-offline, non-suspended providers should appear in customer
    // search results. Suspension is applied after the fact (e.g. a
    // fake-looking NID) — see Feature 1 — rather than as a pre-approval gate.
    services = services.filter(
      (s) =>
        s.provider?.providerProfile?.availability !== "offline" &&
        !s.provider?.providerProfile?.suspended
    );

    // Free-text search: match the keyword against service name, category, OR
    // the provider's location — whichever the customer typed.
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      services = services.filter((s) => {
        const title = s.title?.toLowerCase() || "";
        const cat = s.category?.toLowerCase() || "";
        const area = s.provider?.providerProfile?.serviceArea?.toLowerCase() || "";
        const providerName = s.provider?.name?.toLowerCase() || "";
        return (
          title.includes(kw) ||
          cat.includes(kw) ||
          area.includes(kw) ||
          providerName.includes(kw)
        );
      });
    }

    if (location && location !== "All") {
      services = services.filter(
        (s) => s.provider?.providerProfile?.serviceArea === location
      );
    }

    // Sort the filtered results. "newest" (the default) keeps the
    // createdAt-desc order already applied by the DB query above;
    // price and rating are re-sorted here since they depend on
    // fields (price, provider.providerProfile.avgRating) that aren't
    // practical to sort at the query level once the availability/
    // suspension/keyword filters above have already run in JS.
    const sortOption = sortBy || "newest";
    if (sortOption === "price-low") {
      services.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-high") {
      services.sort((a, b) => b.price - a.price);
    } else if (sortOption === "rating") {
      services.sort(
        (a, b) =>
          (b.provider?.providerProfile?.avgRating || 0) -
          (a.provider?.providerProfile?.avgRating || 0)
      );
    }
    // "newest" needs no extra sort — already newest-first from the query.

    return res.status(200).json({ services });
  } catch (err) {
    console.error("listServices error:", err);
    return res.status(500).json({ message: "Server error while searching services." });
  }
};

// @desc  Distinct list of provider locations, drawn from approved services of
//        non-suspended, online/busy providers — used to populate the location
//        filter dropdown so it stays in sync as new providers get approved.
// @route GET /api/services/locations
// @access Private (customer)
exports.listLocations = async (req, res) => {
  try {
    const services = await Service.find({ approvalStatus: "approved", isActive: true }).populate(
      "provider",
      "providerProfile"
    );

    const areas = new Set();
    services.forEach((s) => {
      const profile = s.provider?.providerProfile;
      if (
        !profile?.suspended &&
        profile?.availability !== "offline" &&
        profile?.serviceArea
      ) {
        areas.add(profile.serviceArea);
      }
    });

    return res.status(200).json({ locations: Array.from(areas).sort() });
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
