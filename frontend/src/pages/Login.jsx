import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth, roleHome } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token, res.data.user);
      navigate(roleHome(res.data.user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 min-[820px]:grid-cols-[5fr_7fr] bg-ink bg-[image:repeating-linear-gradient(-45deg,transparent_0_26px,rgba(232,147,12,0.07)_26px_30px)]">
      <aside className="sticky top-0 flex h-screen flex-col justify-center px-7 py-10 text-white min-[820px]:px-12 min-[820px]:py-16">
        <h1 className="m-0 mb-[0.4rem] text-[2.2rem] font-extrabold tracking-[-1.5px] min-[820px]:text-5xl">
          Fix<span style={{ color: "#FF6A00" }}>It</span>
        </h1>
        <p className="m-0 mb-8 text-[1.1rem] text-white/85">
          Local home services, booked in minutes.
        </p>
        <ul className="m-0 list-none p-0">
          <li className="relative mb-[0.8rem] pl-[1.6rem] text-white/80">
            <span className="absolute left-0 font-bold" style={{ color: "#FF6A00" }}>&#10003;</span>
            Verified electricians, plumbers &amp; cleaners
          </li>
          <li className="relative mb-[0.8rem] pl-[1.6rem] text-white/80">
            <span className="absolute left-0 font-bold" style={{ color: "#FF6A00" }}>&#10003;</span>
            Track every job in real time
          </li>
          <li className="relative mb-[0.8rem] pl-[1.6rem] text-white/80">
            <span className="absolute left-0 font-bold" style={{ color: "#FF6A00" }}>&#10003;</span>
            Pay online, get a proper invoice
          </li>
        </ul>
      </aside>

      <main className="flex items-center justify-center px-6 py-10">
        <form
          className="w-full max-w-[420px] rounded-lg border border-line bg-surface p-8 shadow-[0_6px_24px_rgba(31,42,51,0.06)]"
          onSubmit={handleSubmit}
          noValidate
        >
          <h2 className="m-0 mb-1 text-2xl">Welcome back</h2>
          <p className="mt-0 text-[0.95rem] text-ink-soft">
            Log in to manage your bookings.
          </p>

          {error && (
            <div className="mt-4 rounded-[7px] border border-danger-line bg-danger-bg px-[0.8rem] py-[0.6rem] text-[0.9rem] text-danger-text">
              {error}
            </div>
          )}

          <label
            className="mb-[0.3rem] mt-4 block text-[0.85rem] font-semibold"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="w-full rounded-[7px] border border-line bg-white px-[0.8rem] py-[0.65rem] text-ink focus:outline-none focus:ring-[3px]"
            style={{ "--tw-ring-color": "rgba(255,106,0,0.2)" }}
            onFocus={(e) => (e.target.style.borderColor = "#FF6A00")}
            onBlur={(e) => (e.target.style.borderColor = "")}
            id="email" name="email" type="email" value={form.email}
            onChange={handleChange} placeholder="you@example.com" required
          />

          <label
            className="mb-[0.3rem] mt-4 block text-[0.85rem] font-semibold"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="w-full rounded-[7px] border border-line bg-white px-[0.8rem] py-[0.65rem] text-ink focus:outline-none focus:ring-[3px]"
            style={{ "--tw-ring-color": "rgba(255,106,0,0.2)" }}
            onFocus={(e) => (e.target.style.borderColor = "#FF6A00")}
            onBlur={(e) => (e.target.style.borderColor = "")}
            id="password" name="password" type="password" value={form.password}
            onChange={handleChange} placeholder="Your password" required
          />

          <button
            className="mt-2 w-full cursor-pointer rounded-lg px-[1.1rem] py-[0.7rem] font-semibold transition-colors duration-150 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
            style={{ backgroundColor: "#FF6A00", color: "#1f2a33" }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in…" : "Log in"}
          </button>

          <p className="mt-5 text-center text-[0.9rem]">
            New to FixIt?{" "}
            <Link
              className="font-semibold no-underline hover:underline"
              style={{ color: "#FF6A00" }}
              to="/register"
            >
              Create an account
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}