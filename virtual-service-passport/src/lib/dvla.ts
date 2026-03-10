/**
 * DVLA MOT History API
 * 
 * Note: The DVLA does not provide a free public API for MOT history.
 * The official check is available at https://www.check-mot.service.gov.uk/
 * but requires browser interaction with anti-bot protection.
 * 
 * This module provides a mock/demo implementation for development purposes.
 * In production, you would need to either:
 * 1. Use a paid third-party MOT data provider (like Logic4, HPI, etc.)
 * 2. Implement browser automation to scrape the gov.uk page
 * 3. Apply for DVLA API access (requires business registration)
 */

export interface MOTTest {
  testDate: string;
  testResult: 'PASSED' | 'FAILED' | 'ABANDONED';
  expiryDate: string | null;
  mileage: number;
  mileageUnit: 'km' | 'miles';
  testNumber: string;
  defects: MOTDefect[];
}

export interface MOTDefect {
  type: 'dangerous' | 'major' | 'minor';
  description: string;
  item: string;
  location: string;
}

export interface MOTHistory {
  registration: string;
  make: string | null;
  model: string | null;
  firstUsedDate: string | null;
  fuelType: string | null;
  primaryColour: string | null;
  vin: string | null;
  vehicleId: string | null;
  motTests: MOTTest[];
}

// Demo data for a realistic MOT history
const DEMO_MOT_HISTORY: MOTHistory = {
  registration: 'ABC123',
  make: 'Ford',
  model: 'Focus',
  firstUsedDate: '2019-03-15',
  fuelType: 'Petrol',
  primaryColour: 'Blue',
  vin: 'ABCD1234567890EF',
  vehicleId: '1234567890',
  motTests: [
    {
      testDate: '2025-03-01',
      testResult: 'PASSED',
      expiryDate: '2026-03-01',
      mileage: 45230,
      mileageUnit: 'miles',
      testNumber: 'MOT12345678901',
      defects: [],
    },
    {
      testDate: '2024-02-28',
      testResult: 'PASSED',
      expiryDate: '2025-03-01',
      mileage: 38100,
      mileageUnit: 'miles',
      testNumber: 'MOT12345678902',
      defects: [
        {
          type: 'minor',
          description: 'Nearside Front Tyre has a slight crack/damage but not enough to consider更换',
          item: '5.2.3 (a)',
          location: 'Nearside Front',
        },
      ],
    },
    {
      testDate: '2023-02-20',
      testResult: 'PASSED',
      expiryDate: '2024-02-28',
      mileage: 31000,
      mileageUnit: 'miles',
      testNumber: 'MOT12345678903',
      defects: [],
    },
    {
      testDate: '2022-02-15',
      testResult: 'PASSED',
      expiryDate: '2023-02-20',
      mileage: 24500,
      mileageUnit: 'miles',
      testNumber: 'MOT12345678904',
      defects: [],
    },
    {
      testDate: '2021-01-10',
      testResult: 'PASSED',
      expiryDate: '2022-02-15',
      mileage: 17800,
      mileageUnit: 'miles',
      testNumber: 'MOT12345678905',
      defects: [],
    },
  ],
};

/**
 * Fetch MOT history for a vehicle by registration number
 * 
 * @param registration - Vehicle registration number (e.g., 'ABC123')
 * @returns Promise resolving to MOT history data
 * 
 * @example
 * ```ts
 * const history = await fetchMOTHistory('ABC123');
 * console.log(history.motTests);
 * ```
 */
export async function fetchMOTHistory(registration: string): Promise<MOTHistory> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Normalize registration (uppercase, remove spaces)
  const normalizedReg = registration.toUpperCase().replace(/\s/g, '');

  // Validate registration format
  if (!normalizedReg || normalizedReg.length < 2) {
    throw new Error('Invalid registration number');
  }

  // For demo purposes, return realistic mock data
  // In production, this would call a real API or scrape the gov.uk page
  
  // Add some randomness to simulate real data
  const randomMileage = 40000 + Math.floor(Math.random() * 20000);
  // baseYear removed - was unused
  const currentYear = new Date().getFullYear();
  
  const mockHistory: MOTHistory = {
    ...DEMO_MOT_HISTORY,
    registration: normalizedReg,
    motTests: DEMO_MOT_HISTORY.motTests.map((test, index) => ({
      ...test,
      mileage: randomMileage - (index * 7000) + Math.floor(Math.random() * 1000),
      testDate: new Date(currentYear - index, 2, 1 + Math.floor(Math.random() * 28)).toISOString().split('T')[0],
      expiryDate: new Date(currentYear - index + 1, 2, 1).toISOString().split('T')[0],
    })),
  };

  return mockHistory;
}

/**
 * Check if a vehicle has a valid MOT
 * 
 * @param history - MOT history from fetchMOTHistory
 * @returns Object with validity status and expiry info
 */
export function getMOTStatus(history: MOTHistory): {
  isValid: boolean;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  lastTestDate: string | null;
  lastTestResult: string | null;
} {
  const latestTest = history.motTests[0];
  
  if (!latestTest) {
    return {
      isValid: false,
      expiryDate: null,
      daysUntilExpiry: null,
      lastTestDate: null,
      lastTestResult: null,
    };
  }

  const now = new Date();
  const expiryDate = latestTest.expiryDate ? new Date(latestTest.expiryDate) : null;
  const daysUntilExpiry = expiryDate 
    ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    isValid: latestTest.testResult === 'PASSED' && (daysUntilExpiry === null || daysUntilExpiry > 0),
    expiryDate: latestTest.expiryDate,
    daysUntilExpiry,
    lastTestDate: latestTest.testDate,
    lastTestResult: latestTest.testResult,
  };
}
