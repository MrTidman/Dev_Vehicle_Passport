import { Link } from 'react-router-dom';
import { Car, Wrench, Calendar, FileText, Shield } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-2xl mb-8">
              <Car className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              Virtual Service Passport
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              Keep your vehicle's complete service history in one place. 
              Track repairs, expenses, MOT dates, and more — all linked to your car, not your account.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <Wrench className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Service History</h3>
            <p className="text-slate-400 text-sm">
              Track every repair, oil change, and maintenance record in chronological order.
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <Calendar className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Smart Reminders</h3>
            <p className="text-slate-400 text-sm">
              Never miss an MOT, tax, or service date with automated reminders.
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <FileText className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Document Storage</h3>
            <p className="text-slate-400 text-sm">
              Upload receipts, invoices, and photos to keep everything documented.
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <Shield className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Ownership Transfer</h3>
            <p className="text-slate-400 text-sm">
              Sell your car with its complete history. It stays with the vehicle, not your account.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>Coming soon — Build your vehicle's complete service portfolio</p>
        </div>
      </div>
    </div>
  );
}
