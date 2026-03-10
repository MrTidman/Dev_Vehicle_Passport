import { useParams, Link } from 'react-router-dom';

export function CarDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Car Details</h1>
      <p className="text-gray-600 mb-6">Car ID: {id}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Vehicle Info</h2>
          <p className="text-gray-500">Coming soon</p>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Service History</h2>
          <p className="text-gray-500">Coming soon</p>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Expenses</h2>
          <p className="text-gray-500">Coming soon</p>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Reminders</h2>
          <p className="text-gray-500">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
