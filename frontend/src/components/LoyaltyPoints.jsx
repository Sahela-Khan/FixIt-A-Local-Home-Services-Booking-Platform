import { Star, Gift, History } from "lucide-react";

const currentPoints = 850;
const pointsToNextReward = 1000;

const transactions = [
  { type: "earned", desc: "AC Repair Service completed", points: 250, date: "28 June 2026" },
  { type: "earned", desc: "Plumbing Repair completed", points: 180, date: "02 July 2026" },
  { type: "redeemed", desc: "Redeemed for ৳50 discount", points: -100, date: "05 July 2026" },
  { type: "earned", desc: "Home Cleaning completed", points: 120, date: "05 July 2026" },
];

const rewards = [
  { points: 100, discount: 50 },
  { points: 200, discount: 120 },
  { points: 500, discount: 350 },
];

export default function LoyaltyPoints() {
  const progress = Math.min((currentPoints / pointsToNextReward) * 100, 100);

  return (
    <div className="flex-1 bg-slate-50 p-8">
      <h2 className="text-2xl font-bold mb-1">Loyalty Points</h2>
      <p className="text-slate-500 mb-6">Earn points on every booking and redeem for discounts</p>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Points balance card */}
        <div className="col-span-1 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star size={20} fill="white" />
            <span className="font-semibold">Your Balance</span>
          </div>
          <p className="text-4xl font-bold mb-1">{currentPoints}</p>
          <p className="text-sm text-orange-100 mb-4">points available</p>

          <div className="w-full bg-orange-400/40 rounded-full h-2 mb-1">
            <div
              className="bg-white h-2 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-orange-100">
            {pointsToNextReward - currentPoints} points to next reward tier
          </p>
        </div>

        {/* Redeemable rewards */}
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Gift size={18} className="text-orange-500" /> Redeem Your Points
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {rewards.map((r) => (
              <div key={r.points} className="border rounded-lg p-4 text-center">
                <p className="text-xl font-bold text-orange-500">{r.points} pts</p>
                <p className="text-sm text-slate-500 mb-3">৳{r.discount} off</p>
                <button
                  disabled={currentPoints < r.points}
                  className={`w-full text-sm font-semibold py-2 rounded-lg ${
                    currentPoints >= r.points
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Redeem
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <History size={18} className="text-orange-500" /> Points Transaction History
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b">
              <th className="pb-2">Description</th>
              <th>Date</th>
              <th className="text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3">{t.desc}</td>
                <td>{t.date}</td>
                <td className={`text-right font-semibold ${
                  t.type === "earned" ? "text-green-600" : "text-red-500"
                }`}>
                  {t.points > 0 ? `+${t.points}` : t.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}