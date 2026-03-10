import { Link } from 'react-router-dom';

export function AddCar() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Add New Car</h1>
      
      <div className="bg-white border rounded-lg p-6">
        <p className="text-gray-500">Coming soon</p>
      </div>
    </div>
  );
}
