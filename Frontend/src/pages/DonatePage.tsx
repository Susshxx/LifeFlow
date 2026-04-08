import React, { useState } from 'react';
import { HeartIcon, ShieldCheckIcon, ZapIcon, UsersIcon, ArrowRightIcon, CheckCircleIcon, Loader2Icon } from 'lucide-react';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

const IMPACT_ITEMS = [
  { amount: 500, label: 'Supplies testing kits for 5 donors' },
  { amount: 1000, label: 'Funds one full blood donation camp' },
  { amount: 2500, label: 'Equips a mobile blood drive unit' },
  { amount: 5000, label: 'Sponsors a hospital blood bank setup' },
];

const TRUST_BADGES = [
  { icon: ShieldCheckIcon, text: 'Secured by eSewa' },
  { icon: ZapIcon, text: 'Instant Processing' },
  { icon: UsersIcon, text: '10,000+ Donors Trust Us' },
];

export function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveAmount = customAmount ? Number(customAmount) : selectedAmount;

  const handlePreset = (amt: number) => {
    setSelectedAmount(amt);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  const handleDonate = async () => {
    if (!effectiveAmount || effectiveAmount < 10) {
      setError('Please enter a valid amount (minimum Rs. 10).');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/donation/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: effectiveAmount,
          donorName: donorName.trim() || 'Anonymous',
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to initiate payment.');
      }

      const data = await res.json();

      // Build and auto-submit a hidden form to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.esewa_url;
      form.style.display = 'none';

      const fields: Record<string, string> = {
        amount: String(data.amount),
        tax_amount: String(data.tax_amount),
        total_amount: String(data.total_amount),
        transaction_uuid: data.transaction_uuid,
        product_code: data.product_code,
        product_service_charge: String(data.product_service_charge),
        product_delivery_charge: String(data.product_delivery_charge),
        success_url: data.success_url,
        failure_url: data.failure_url,
        signed_field_names: data.signed_field_names,
        signature: data.signature,
      };

      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const impactLabel = IMPACT_ITEMS.find((i) => i.amount === selectedAmount)?.label;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-sm mb-6">
            <HeartIcon className="w-4 h-4 fill-current" />
            Make a Difference Today
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Support the Mission of
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300">
              Saving Lives
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Your contribution funds blood donation camps, emergency logistics, and life-saving infrastructure
            across Nepal. Every rupee counts.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* Donation Card */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-6">Choose Your Donation Amount</h2>

              {/* Preset Amounts */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handlePreset(amt)}
                    className={`py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 scale-[1.02]'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-red-500/40'
                    }`}
                  >
                    Rs. {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative mb-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">Rs.</span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="Enter custom amount"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60 focus:bg-white/8 transition-all"
                />
              </div>

              {/* Impact label */}
              {impactLabel && (
                <p className="text-sm text-red-300 flex items-center gap-1.5 mb-6 ml-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  {impactLabel}
                </p>
              )}

              <hr className="border-white/10 my-6" />

              {/* Donor Info */}
              <h2 className="text-xl font-semibold text-white mb-4">Your Details (Optional)</h2>
              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Your name (leave blank to stay anonymous)"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60 transition-all"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Leave a message of hope (optional)"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500/60 transition-all resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Donate Button */}
              <button
                onClick={handleDonate}
                disabled={loading || !effectiveAmount}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="w-5 h-5 animate-spin" />
                    Redirecting to eSewa…
                  </>
                ) : (
                  <>
                    <img
                      src="https://esewa.com.np/common/images/esewa_logo.png"
                      alt="eSewa"
                      className="h-6 rounded px-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    Donate Rs. {effectiveAmount ? effectiveAmount.toLocaleString() : '—'} via eSewa
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div className="mt-5 flex items-center justify-center gap-4 flex-wrap">
                {TRUST_BADGES.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Icon className="w-3.5 h-3.5" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Impact */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <h3 className="text-white font-semibold mb-4 text-base">Your Impact</h3>
              <div className="space-y-3">
                {IMPACT_ITEMS.map((item) => (
                  <div key={item.amount} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <HeartIcon className="w-3 h-3 text-red-400 fill-current" />
                    </div>
                    <div>
                      <span className="text-red-400 font-semibold text-sm">Rs. {item.amount.toLocaleString()}</span>
                      <p className="text-slate-400 text-sm">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600/20 to-rose-700/20 border border-red-500/20 rounded-3xl p-6">
              <div className="text-4xl font-bold text-white mb-1">50,000+</div>
              <div className="text-red-300 text-sm font-medium mb-3">Lives Saved</div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Thanks to generous donors like you, LifeFlow has connected thousands of lives across 77 districts of Nepal.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <p className="text-slate-400 text-xs leading-relaxed">
                🔒 Your payment is processed securely through <span className="text-white">eSewa</span> — Nepal's leading digital wallet. 
                We never store your financial details.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
