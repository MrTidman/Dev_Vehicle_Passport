import { Link } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Cars</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder for car cards */}
          <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center min-h-[120px]">
            <p className="text-gray-500">Coming soon</p>
          </div>
          <Link
            to="/cars/new"
            className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span>Add Car</span>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Reminders</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="w-5 h-5" />
            <span>Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
