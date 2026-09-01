import { useState, useEffect } from "react";
import { Search, MapPin, Star, Calendar, Clock, Heart, X, Plus } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const timeSlots = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];
const categories = ["All", "Cleaning", "Plumbing", "AC Repair", "Painting", "Electrical"];
const maxPossiblePrice = 5000;

export default function SearchAndBook() {
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState(["All"]);
  const [savedProviderIds, setSavedProviderIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("All");
  const [maxPrice, setMaxPrice] = useState(maxPossiblePrice);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [confirmedFor, setConfirmedFor] = useState(null);

  const [formError, setFormError] = useState("");

  // Manual "Book a Service" modal — customer types provider + service name freely
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [providerText, setProviderText] = useState("");
  const [serviceText, setServiceText] = useState("");
  const [providerFocus, setProviderFocus] = useState(false);
  const [serviceFocus, setServiceFocus] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualBooking, setManualBooking] = useState(false);
  const [manualConfirmed, setManualConfirmed] = useState(null);
  const [manualError, setManualError] = useState("");

  const loadServices = () => {
    setLoading(true);
    api
      .get("/services", { params: { keyword, category, location, maxPrice } })
      .then((res) => setServices(res.data.services))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadLocations = () => {
    api
      .get("/services/locations")
      .then((res) => setLocations(["All", ...(res.data.locations || [])]))
      .catch(() => {});
  };

  const loadSaved = () => {
    api
      .get("/services/saved-providers")
      .then((res) => setSavedProviderIds(res.data.savedProviders.map((p) => p._id)))
      .catch(() => {});
  };

  useEffect(() => {
    loadServices();
    loadSaved();
    loadLocations();
    setAddress(user?.address || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(loadServices, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, category, location, maxPrice]);

  const toggleSaved = async (providerId) => {
    try {
      await api.put(`/services/saved-providers/${providerId}`);
      loadSaved();
    } catch {
      // ignore
    }
  };

  const displayedServices = showSavedOnly
    ? services.filter((s) => savedProviderIds.includes(s.provider?._id))
    : services;

  const openBookingFor = (service) => {
    setExpandedServiceId(service._id);
    setConfirmedFor(null);
    setDate("");
    setTime("");
    setNotes("");
    setAddress(user?.address || "");
  };

  const handleConfirmBooking = async (service) => {
    if (!date || !time) {
      setFormError("Please choose a date and time slot.");
      return;
    }
    setFormError("");
    setBooking(true);
    try {
      await api.post("/bookings", {
        serviceId: service._id,
        date,
        time,
        address,
        notes,
      });
      setConfirmedFor(service);
      setExpandedServiceId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Could not create booking.");
    } finally {
      setBooking(false);
    }
  };

  // ---- Manual booking modal helpers ----
  const openManualModal = () => {
    setManualModalOpen(true);
    setProviderText("");
    setServiceText("");
    setManualDate("");
    setManualTime("");
    setManualNotes("");
    setManualAddress(user?.address || "");
    setManualConfirmed(null);
    setManualError("");
  };
  const closeManualModal = () => setManualModalOpen(false);

  const knownProviderNames = [...new Set(services.map((s) => s.provider?.name).filter(Boolean))];
  const providerLocked = providerText.trim() && knownProviderNames.includes(providerText.trim());

  const providerSuggestions = providerText.trim()
    ? knownProviderNames
        .filter((name) => name.toLowerCase().startsWith(providerText.trim().toLowerCase()))
        .slice(0, 8)
    : [];

  const serviceSuggestions = serviceText.trim()
    ? services
        .filter((s) => {
          const q = serviceText.trim().toLowerCase();
          return s.title?.toLowerCase().startsWith(q) || s.category?.toLowerCase().startsWith(q);
        })
        .filter((s) => !providerLocked || s.provider?.name === providerText.trim())
        .slice(0, 8)
    : [];

  const matchedService = services.find(
    (s) =>
      s.provider?.name?.toLowerCase() === providerText.trim().toLowerCase() &&
      s.title?.toLowerCase() === serviceText.trim().toLowerCase()
  );

  const handleManualConfirm = async () => {
    if (!manualDate || !manualTime) {
      setManualError("Please choose a date and time slot.");
      return;
    }
    setManualError("");
    setManualBooking(true);
    try {
      await api.post("/bookings", {
        serviceId: matchedService._id,
        date: manualDate,
        time: manualTime,
        address: manualAddress,
        notes: manualNotes,
      });
      setManualConfirmed(matchedService);
      loadServices();
    } catch (err) {
      setManualError(err.response?.data?.message || "Could not create booking.");
    } finally {
      setManualBooking(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Search & Book a Service</h2>
          <p className="text-slate-500">Find a provider, then book them right from the results.</p>
        </div>
        <button
          onClick={openManualModal}
          className="bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1 whitespace-nowrap"
        >
          <Plus size={16} /> Book a Service
        </button>
      </div>

      {confirmedFor && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
          ✅ Booking confirmed for <strong>{confirmedFor.title}</strong>. Check your Dashboard for details.
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center border rounded-lg px-3 py-2 flex-1 bg-white">
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by service, category, or location..."
            className="outline-none text-sm w-full"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
          <MapPin size={14} className="text-slate-400" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="outline-none text-sm bg-white"
          >
            {locations.map((l) => (
              <option key={l} value={l}>{l === "All" ? "All locations" : l}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white flex-1">
          <span className="text-xs text-slate-500 whitespace-nowrap">Max price: ৳{maxPrice}</span>
          <input
            type="range"
            min={0}
            max={maxPossiblePrice}
            step={100}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setShowSavedOnly(false)}
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            !showSavedOnly ? "bg-orange-500 text-white" : "bg-white text-slate-500 border"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setShowSavedOnly(true)}
          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
            showSavedOnly ? "bg-orange-500 text-white" : "bg-white text-slate-500 border"
          }`}
        >
          <Heart size={12} /> Saved ({savedProviderIds.length})
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading services...</p>}
      {!loading && displayedServices.length === 0 && (
        <p className="text-sm text-slate-400">No services match your search.</p>
      )}

      <div className="space-y-4">
        {displayedServices.map((s) => {
          const isSaved = savedProviderIds.includes(s.provider?._id);
          const isExpanded = expandedServiceId === s._id;
          return (
            <div key={s._id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {s.provider?.providerProfile?.photoUrl ? (
                      <img
                        src={s.provider.providerProfile.photoUrl}
                        alt={s.provider?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-400 text-[10px]">No photo</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{s.provider?.name}</h4>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          s.provider?.providerProfile?.availability === "busy" ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        title={s.provider?.providerProfile?.availability === "busy" ? "Busy" : "Online"}
                      />
                      <span className="text-xs text-slate-400">
                        {s.provider?.providerProfile?.availability === "busy" ? "Busy" : "Online"}
                      </span>
                      {s.provider?.providerProfile?.reviewCount > 0 && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          <Star size={11} className="fill-amber-500 text-amber-500" />
                          {s.provider.providerProfile.avgRating?.toFixed(1)}
                          <span className="text-amber-500 font-normal">({s.provider.providerProfile.reviewCount})</span>
                        </span>
                      )}
                      {s.provider?.providerProfile?.experienceYears > 0 && (
                        <span className="text-xs text-slate-400">
                          · {s.provider.providerProfile.experienceYears} yrs exp.
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {s.title} · {s.category}
                      {s.provider?.providerProfile?.serviceArea && (
                        <> · <MapPin size={12} className="inline" /> {s.provider.providerProfile.serviceArea}</>
                      )}
                    </p>
                    {s.provider?.providerProfile?.bio && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {s.provider.providerProfile.bio}
                      </p>
                    )}
                    {s.provider?.providerProfile?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.provider.providerProfile.skills.slice(0, 4).map((sk) => (
                          <span
                            key={sk}
                            className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full"
                          >
                            {sk}
                          </span>
                        ))}
                        {s.provider.providerProfile.skills.length > 4 && (
                          <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full">
                            +{s.provider.providerProfile.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => toggleSaved(s.provider?._id)} title="Save provider">
                  <Heart
                    size={20}
                    className={isSaved ? "text-red-500 fill-red-500" : "text-slate-300"}
                  />
                </button>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-orange-500">৳ {s.price}</span>
                {!isExpanded && (
                  s.provider?.providerProfile?.availability === "busy" ? (
                    <button
                      disabled
                      title="This provider is currently busy"
                      className="bg-slate-200 text-slate-400 text-sm font-semibold px-4 py-1.5 rounded-lg cursor-not-allowed"
                    >
                      Busy — can't book now
                    </button>
                  ) : (
                    <button
                      onClick={() => openBookingFor(s)}
                      className="bg-orange-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg"
                    >
                      Book
                    </button>
                  )
                )}
              </div>

              {isExpanded && (
                <div className="border-t mt-4 pt-4">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    {formError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                      {formError}
                    </p>
                    )}
                    <Calendar size={14} className="text-orange-500" /> Select date
                  </p>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                  />

                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Clock size={14} className="text-orange-500" /> Select time slot
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setTime(slot)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          time === slot
                            ? "bg-orange-500 text-white border-orange-500"
                            : "text-slate-600 border-slate-300"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <MapPin size={12} /> {address || "No address on file — please add one below"}
                  </p>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special instructions (different address, gate code, etc.)"
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                    rows={2}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedServiceId(null)}
                      className="flex-1 border border-slate-300 text-slate-600 font-semibold py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmBooking(s)}
                      disabled={booking}
                      className="flex-1 bg-orange-500 text-white font-semibold py-2 rounded-lg disabled:opacity-60"
                    >
                      {booking ? "Booking..." : "Confirm Booking"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {manualModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeManualModal}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
            <h3 className="font-bold text-lg mb-1">Book a Service</h3>
            <p className="text-sm text-slate-500 mb-4">Type a provider and a service, then pick a suggestion.</p>

            {manualConfirmed ? (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                ✅ Booking confirmed for <strong>{manualConfirmed.title}</strong> with{" "}
                <strong>{manualConfirmed.provider?.name}</strong>.
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Provider name</label>
                  <input
                    value={providerText}
                    onChange={(e) => {
                      setProviderText(e.target.value);
                      setProviderFocus(true);
                    }}
                    onFocus={() => setProviderFocus(true)}
                    onBlur={() => setTimeout(() => setProviderFocus(false), 150)}
                    placeholder="e.g. Karim Electrician"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  {providerFocus && providerSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border rounded-lg mt-1 w-full shadow-lg max-h-40 overflow-y-auto">
                      {providerSuggestions.map((name) => (
                        <li key={name}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              setProviderText(name);
                              setProviderFocus(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50"
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="relative mb-4">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Service name</label>
                  <input
                    value={serviceText}
                    onChange={(e) => {
                      setServiceText(e.target.value);
                      setServiceFocus(true);
                    }}
                    onFocus={() => setServiceFocus(true)}
                    onBlur={() => setTimeout(() => setServiceFocus(false), 150)}
                    placeholder="e.g. AC Repair"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  {serviceFocus && serviceSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border rounded-lg mt-1 w-full shadow-lg max-h-40 overflow-y-auto">
                      {serviceSuggestions.map((s) => (
                        <li key={s._id}>
                          <button
                            type="button"
                            onMouseDown={() => {
                              setServiceText(s.title);
                              if (!providerLocked) setProviderText(s.provider?.name || "");
                              setServiceFocus(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex justify-between gap-2"
                          >
                            <span>
                              {s.title}
                              <span className="text-slate-400"> · {s.category}</span>
                            </span>
                            <span className="text-slate-400 text-xs">{s.provider?.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {manualError && <p className="text-xs text-red-500 mb-3">{manualError}</p>}

                {matchedService ? (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {matchedService.provider?.providerProfile?.photoUrl ? (
                          <img
                            src={matchedService.provider.providerProfile.photoUrl}
                            alt={matchedService.provider?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-slate-400 text-[9px]">No photo</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">
                            {matchedService.category} · {matchedService.provider?.name}
                          </span>
                          <span className="font-bold text-orange-500">৳ {matchedService.price}</span>
                        </div>
                        {matchedService.provider?.providerProfile?.skills?.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {matchedService.provider.providerProfile.skills.slice(0, 3).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {matchedService.provider?.providerProfile?.availability === "busy" ? (
                      <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                        This provider is currently busy and can't accept new bookings.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Calendar size={14} className="text-orange-500" /> Select date
                        </p>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                        />

                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Clock size={14} className="text-orange-500" /> Select time slot
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setManualTime(slot)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                manualTime === slot
                                  ? "bg-orange-500 text-white border-orange-500"
                                  : "text-slate-600 border-slate-300"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>

                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                          <MapPin size={12} /> {manualAddress || "No address on file — please add one below"}
                        </p>

                        <textarea
                          value={manualNotes}
                          onChange={(e) => setManualNotes(e.target.value)}
                          placeholder="Special instructions (different address, gate code, etc.)"
                          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                          rows={2}
                        />

                        <button
                          onClick={handleManualConfirm}
                          disabled={manualBooking}
                          className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg disabled:opacity-60"
                        >
                          {manualBooking ? "Booking..." : "Confirm Booking"}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  providerText.trim() &&
                  serviceText.trim() && (
                    <p className="text-xs text-slate-400">
                      No exact match yet — pick a suggestion from both dropdowns.
                    </p>
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}