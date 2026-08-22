import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Phone, MapPin, Save } from "lucide-react";

export default function ProfileSettings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <h2 className="text-2xl font-bold mb-1">Profile Settings</h2>
      <p className="text-slate-500 mb-6">
        Update your default address and phone number so you don't have to re-enter them for every booking
      </p>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
        {saved && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg mb-4">
            Profile updated successfully!
          </div>
        )}

        <label className="text-sm font-semibold flex items-center gap-2 mb-2">
          <User size={16} className="text-orange-500" /> Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-5"
        />

        <label className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Phone size={16} className="text-orange-500" /> Phone Number
        </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-5"
        />

        <label className="text-sm font-semibold flex items-center gap-2 mb-2">
          <MapPin size={16} className="text-orange-500" /> Default Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House 12, Road 5, Dhanmondi, Dhaka"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-6"
        />

        <button
          onClick={handleSave}
          className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
}