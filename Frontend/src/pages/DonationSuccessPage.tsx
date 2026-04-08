import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, HeartIcon, HomeIcon, ArrowRightIcon } from 'lucide-react';

export function DonationSuccessPage() {
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get('uuid') || '';
  const amount = searchParams.get('amount') || '';
  const ref = searchParams.get('ref') || '';

  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([]);

  useEffect(() => {
    // Generate confetti particles
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
    const ps = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      size: Math.random() * 8 + 6,
    }));
    setParticles(ps);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Confetti */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm animate-bounce"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${1.5 + p.delay}s`,
            opacity: 0.8,
          }}
        />
      ))}

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
          <CheckCircleIcon className="w-12 h-12 text-white" strokeWidth={2.5} />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Thank You! 🎉
        </h1>
        <p className="text-slate-300 text-lg mb-8">
          Your donation has been successfully received. You're making Nepal healthier, one drop at a time.
        </p>

        {/* Details Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-3">
          {amount && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Amount Donated</span>
              <span className="text-white font-bold text-lg">Rs. {Number(amount).toLocaleString()}</span>
            </div>
          )}
          {uuid && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Transaction ID</span>
              <span className="text-emerald-300 font-mono text-xs">{uuid}</span>
            </div>
          )}
          {ref && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">eSewa Ref ID</span>
              <span className="text-emerald-300 font-mono text-xs">{ref}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Status</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              COMPLETE
            </span>
          </div>
        </div>

        {/* Heart message */}
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-8">
          <HeartIcon className="w-4 h-4 text-red-400 fill-current" />
          <span>Your generosity helps save up to 3 lives per donation</span>
          <HeartIcon className="w-4 h-4 text-red-400 fill-current" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/15 transition-all">
              <HomeIcon className="w-4 h-4" />
              Go Home
            </button>
          </Link>
          <Link to="/donate" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/30">
              Donate Again
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
