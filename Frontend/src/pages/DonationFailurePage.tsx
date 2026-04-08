import { Link } from 'react-router-dom';
import { XCircleIcon, RefreshCwIcon, HomeIcon, HeartIcon } from 'lucide-react';


export function DonationFailurePage() {
  const reasons = [
    'You cancelled the payment on eSewa',
    'Insufficient eSewa wallet balance',
    'Session timeout or network issue',
    'Payment was declined by eSewa',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950/40 to-slate-900 flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-red-500/30">
          <XCircleIcon className="w-12 h-12 text-white" strokeWidth={2} />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Payment Unsuccessful
        </h1>
        <p className="text-slate-300 text-lg mb-8">
          Don't worry — no amount was deducted from your account. You can try again anytime.
        </p>

        {/* Possible reasons */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left">
          <p className="text-slate-400 text-sm font-medium mb-3">This may have happened because:</p>
          <ul className="space-y-2">
            {reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-slate-400 text-sm">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Hope message */}
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-8">
          <HeartIcon className="w-4 h-4 text-red-400 fill-current" />
          <span>Lives are still waiting. Please try again!</span>
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
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/30">
              <RefreshCwIcon className="w-4 h-4" />
              Try Again
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
