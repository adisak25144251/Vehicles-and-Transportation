
import { VehicleProfile } from './types';

export const COLORS = {
  NAVY: '#002D62',
  GOLD: '#B8860B',
  WHITE: '#FFFFFF',
  SLATE_BG: '#F8FAFC',
};

export const MOCK_VEHICLES: VehicleProfile[] = [
  {
    id: 'v1',
    name: 'Toyota Camry (ส่วนกลาง)',
    plateNumber: '1กข 1234',
    type: 'SEDAN',
    fuelType: 'Gasoline 95',
    consumptionRate: 12.5,
    wearAndTearRate: 2.5,
    acquisitionDate: '2020-01-15',
    status: 'USABLE'
  },
  {
    id: 'v2',
    name: 'Commuter Van (สป.)',
    plateNumber: 'นข 5678',
    type: 'VAN',
    fuelType: 'Diesel',
    consumptionRate: 10.0,
    wearAndTearRate: 3.5,
    acquisitionDate: '2018-05-20',
    status: 'DAMAGED'
  }
];

export const MOCK_TRIPS = [
  {
    id: 't1',
    missionName: 'ตรวจเยี่ยมราชการเขต 5',
    purpose: 'ติดตามผลการดำเนินงานโครงการประจำปี',
    department: 'กองยุทธศาสตร์',
    startTime: '2024-03-20T08:30:00Z',
    endTime: '2024-03-20T17:00:00Z',
    startLocation: { lat: 13.7563, lng: 100.5018, address: 'กทม.' },
    endLocation: { lat: 13.9130, lng: 100.4988, address: 'นนทบุรี' },
    stops: [],
    distanceKm: 45.2,
    durationMin: 120,
    participants: ['นายสมชาย', 'นางสาวสมศรี'],
    vehicleId: 'v1',
    fuelCost: 150,
    allowance: 240,
    accommodation: 0,
    otherCosts: 60,
    efficiencyScore: 85,
    status: 'COMPLETED'
  }
];

export const MOCK_AUDITS = [
  { id: 'a1', timestamp: '2024-03-21T10:00:00Z', userId: 'U-001', action: 'EXPORT_PDF', target: 'TRIP_t1', status: 'SUCCESS' },
  { id: 'a2', timestamp: '2024-03-21T11:15:00Z', userId: 'U-001', action: 'DELETE_TRIP', target: 'TRIP_old_99', status: 'SUCCESS' }
];
