import { useEffect, useState } from "react";

const LAUNCH_DATE = new Date("2026-03-27T00:00:00"); // ← updated

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const timer = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-gray-800 border border-gray-700 rounded-xl px-6 py-4 min-w-[80px]">
      <span className="text-4xl font-extrabold text-indigo-400">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
}

export default function App() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">

      {/* Badge */}
      <span className="mb-6 px-4 py-1 text-xs font-semibold tracking-widest uppercase bg-indigo-600/20 text-indigo-400 rounded-full border border-indigo-500/30">
        Under Construction
      </span>

      {/* Heading */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-center bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        Coming Soon
      </h1>

      {/* Subtext */}
      <p className="mt-4 text-gray-400 text-center max-w-md text-base md:text-lg">
        We're launching in just a few days. Be the first to know when we go live!
      </p>

      {/* Countdown Timer */}
      <div className="mt-10 flex gap-4 flex-wrap justify-center">
        <CountdownBox value={days} label="Days" />
        <CountdownBox value={hours} label="Hours" />
        <CountdownBox value={minutes} label="Minutes" />
        <CountdownBox value={seconds} label="Seconds" />
      </div>

      {/* Email Form */}
      <form
        onSubmit={handleSubmit}
        className="mt-10 flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        {!submitted ? (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition"
            >
              Notify Me
            </button>
          </>
        ) : (
          <p className="text-green-400 font-medium text-center w-full">
            ✅ You're on the list! We'll notify you soon.
          </p>
        )}
      </form>

      {/* Footer */}
      <p className="mt-16 text-gray-600 text-sm">
        © {new Date().getFullYear()} Your Company. All rights reserved.
      </p>

    </div>
  );
}
