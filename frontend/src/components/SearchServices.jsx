import { useState } from "react";
import { Search, MapPin, Star } from "lucide-react";

const allServices = [
  { id: 1, name: "Home Cleaning", provider: "SparkleClean Co.", category: "Cleaning", location: "Dhanmondi", price: 1200, rating: 4.8 },
  { id: 2, name: "Plumbing Repair", provider: "Karim Hossain", category: "Plumbing", location: "Gulshan", price: 1800, rating: 4.6 },
  { id: 3, name: "AC Repair Service", provider: "Mizanur Khan", category: "AC Repair", location: "Dhanmondi", price: 2500, rating: 4.9 },
  { id: 4, name: "Painting Service", provider: "Color House", category: "Painting", location: "Uttara", price: 4000, rating: 4.3 },
  { id: 5, name: "Electrical Wiring", provider: "PowerFix BD", category: "Electrical", location: "Mirpur", price: 1500, rating: 4.7 },
  { id: 6, name: "Deep Cleaning", provider: "CleanPro", category: "Cleaning", location: "Banani", price: 2200, rating: 4.5 },
];

const categories = ["All", "Cleaning", "Plumbing", "AC Repair", "Painting", "Electrical"];
const locations = ["All", "Dhanmondi", "Gulshan", "Uttara", "Mirpur", "Banani"];

export default function SearchServices({ onBook }) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState("newest");

  let filtered = allServices.filter((s) => {
    const matchKeyword = s.name.toLowerCase().includes(keyword.toLowerCase()) ||
                          s.provider.toLowerCase().includes(keyword.toLowerCase());
    const matchCategory = category === "All" || s.category === category;
    const matchLocation = location === "All" || s.location === location;
    const matchPrice = s.price <= maxPrice;
    return matchKeyword && matchCategory && matchLocation && matchPrice;
  });

  if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <h2 className="text-2xl font-bold mb-1">Search & Filter Services</h2>
      <p className="text-slate-500 mb-6">Find the right service provider for your needs</p>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm h-fit">
          <h3 className="font-semibold mb-3">Filters</h3>

          <label className="text-xs font-semibold text-slate-500">Keyword</label>
          <div className="flex items-center border rounded-lg px-3 py-2 mb-4 mt-1">
            <Search size={16} className="text-slate-400 mr-2" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search service or provider..."
              className="outline-none text-sm w-full"
            />
          </div>

          <label className="text-xs font-semibold text-slate-500">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-4 mt-1"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label className="text-xs font-semibold text-slate-500">Location</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-4 mt-1"
          >
            {locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <label className="text-xs font-semibold text-slate-500">
            Max Price: ৳{maxPrice}
          </label>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full mt-1 mb-4"
          />

          <label className="text-xs font-semibold text-slate-500">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        <div className="col-span-3">
          <p className="text-sm text-slate-500 mb-3">{filtered.length} services found</p>
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold">{s.name}</h4>
                    <p className="text-sm text-slate-500">{s.provider}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-yellow-500">
                    <Star size={14} fill="currentColor" /> {s.rating}
                  </span>
                </div>
                <p className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                  <MapPin size={14} /> {s.location}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-orange-500">৳ {s.price}</span>
                  <button
                    onClick={() => onBook && onBook(s)}
                    className="bg-orange-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-2 text-center text-slate-400 py-10">
                No services match your filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}