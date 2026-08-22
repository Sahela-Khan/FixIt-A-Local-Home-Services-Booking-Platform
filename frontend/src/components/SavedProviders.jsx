import { useState } from "react";
import { Star, MapPin, Heart } from "lucide-react";

const initialProviders = [
  { id: 1, name: "Mizanur Khan", service: "AC Repair", location: "Dhanmondi", rating: 4.9 },
  { id: 2, name: "SparkleClean Co.", service: "Home Cleaning", location: "Dhanmondi", rating: 4.8 },
  { id: 3, name: "Karim Hossain", service: "Plumbing", location: "Gulshan", rating: 4.6 },
];

export default function SavedProviders({ setActiveTab }) {
  const [providers, setProviders] = useState(initialProviders);

  const removeProvider = (id) => {
    setProviders(providers.filter((p) => p.id !== id));
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <h2 className="text-2xl font-bold mb-1">Saved Providers</h2>
      <p className="text-slate-500 mb-6">Your favourite service providers for quick re-booking</p>

      {providers.length === 0 && (
        <p className="text-slate-400">No saved providers yet.</p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {providers.map((p) => (
          <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold">{p.name}</h4>
                <p className="text-sm text-slate-500">{p.service}</p>
              </div>
              <button onClick={() => removeProvider(p.id)}>
                <Heart size={20} className="text-red-500" fill="currentColor" />
              </button>
            </div>
            <p className="flex items-center gap-1 text-xs text-slate-500 mb-2">
              <MapPin size={14} /> {p.location}
            </p>
            <p className="flex items-center gap-1 text-sm font-semibold text-yellow-500 mb-3">
              <Star size={14} fill="currentColor" /> {p.rating}
            </p>
            <button
              onClick={() => setActiveTab && setActiveTab("booking")}
              className="w-full bg-orange-500 text-white text-sm font-semibold py-2 rounded-lg"
            >
              Book Again
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}