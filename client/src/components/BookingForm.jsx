import { useState } from "react";
import axios from "axios";
import { Calendar, Clock, MapPin, CheckCircle2, Star } from "lucide-react";

const timeSlots = ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];

const defaultService = {
  name: "AC Repair Service",
  provider: "Mizanur Khan",
  price: 2500,
  rating: 4.9,
};

export default function BookingForm({ selectedService }) {
  const service = selectedService || defaultService;

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!date || !time || !address) {
      alert("Please fill in date, time, and address before booking.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post("http://localhost:5000/api/bookings", {
        service: service.name,
        provider: service.provider,
        date,
        time,
        address,
        notes,
        amount: service.price,
      });
      setConfirmed(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="flex-1 bg-slate-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-md">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 mb-1">{service.name}</p>
          <p className="text-slate-500 mb-1">📅 {date} &nbsp; ⏰ {time}</p>
          <p className="text-slate-500 mb-4">📍 {address}</p>
          <button
            onClick={() => {
              setConfirmed(false);
              setDate("");
              setTime("");
              setAddress("");
              setNotes("");
            }}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Book Another Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <h2 className="text-2xl font-bold mb-1">Book a Service</h2>
      <p className="text-slate-500 mb-6">Select your preferred date, time, and location</p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-lg mb-1">{service.name}</h3>
          <p className="text-slate-500 mb-6">{service.provider} · ৳{service.price}</p>

          <label className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-orange-500" /> Select Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-5"
          />

          <label className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Clock size={16} className="text-orange-500" /> Select Time Slot
          </label>
          <div className="flex flex-wrap gap-2 mb-5">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setTime(slot)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                  time === slot
                    ? "bg-orange-500 text-white border-orange-500"
                    : "text-slate-600 border-slate-300 hover:border-orange-500"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>

          <label className="text-sm font-semibold flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-orange-500" /> Service Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House 12, Road 5, Dhanmondi, Dhaka"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-5"
          />

          <label className="text-sm font-semibold mb-2 block">
            Special Instructions (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Gate code, pet in the house, etc."
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            rows={4}
          />
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
            <h3 className="font-semibold mb-4">Booking Summary</h3>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-xl">
                🛠️
              </div>
              <div>
                <p className="font-semibold text-sm">{service.name}</p>
                <p className="text-xs text-slate-500">{service.provider}</p>
                <p className="flex items-center gap-1 text-xs text-yellow-500 font-semibold">
                  <Star size={12} fill="currentColor" /> {service.rating}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4 pb-4 border-b">
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium">{date || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time</span>
                <span className="font-medium">{time || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Address</span>
                <span className="font-medium text-right max-w-[60%]">{address || "—"}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Service Fee</span>
                <span>৳{service.price}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-orange-500">৳{service.price}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
            >
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}