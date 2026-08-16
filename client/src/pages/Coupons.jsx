import { useAuth } from "../context/AuthContext";
import CouponManager from "../components/coupons/CouponManager";
import CouponRedeem from "../components/coupons/CouponRedeem";

export default function Coupons() {
  const { user } = useAuth();
  const isProvider = user?.role === "provider";

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-10">
      <h2 className="mb-1 text-2xl font-bold">
        {isProvider ? "Promotions" : "Offers and discounts"}
      </h2>
      <p className="mb-7 mt-0 text-[0.95rem] text-ink-soft">
        {isProvider
          ? "Create discount codes for the customers who book your services."
          : "Apply a discount code to your next booking."}
      </p>
      {isProvider ? <CouponManager /> : <CouponRedeem />}
    </div>
  );
}
