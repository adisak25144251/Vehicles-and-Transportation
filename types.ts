export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OFFICER = 'OFFICER',
  AUDITOR = 'AUDITOR'
}

export type VehicleStatus = 'USABLE' | 'DAMAGED' | 'DISPOSAL';

export interface VehicleProfile {
  id: string;
  name: string;
  plateNumber: string;
  type: string;
  fuelType: string;
  consumptionRate: number; // km/L
  wearAndTearRate: number; // Baht/km
  acquisitionDate: string; // ISO date string
  status: VehicleStatus;
  insuranceExpiry?: string;
  taxExpiry?: string;
  lastMaintenance?: string;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  isSensitive?: boolean;
}

export interface Trip {
  id: string;
  missionName: string;
  purpose: string;
  department: string;
  startTime: string;
  endTime: string;
  startLocation: Location;
  endLocation: Location;
  stops: Location[];
  routePath?: [number, number][]; // Array of [lat, lng]
  distanceKm: number;
  durationMin: number;
  participants: string[];
  driverName?: string;
  vehicleId: string;
  fuelCost: number;
  allowance: number;
  accommodation: number;
  otherCosts: number;
  efficiencyScore?: number;
  status: 'DRAFT' | 'COMPLETED' | 'FLAGGED';
}

export interface CostConfig {
  fuelPricePerLiter: number;
  depreciationPerDay: number;
  driverRatePerHour: number;
  enableCO2: boolean;
  piiGuardActive: boolean;
}

export interface AIInsight {
  summary: string;
  anomalies: string[];
  recommendations: string[];
  clusters?: string[];
  scores: {
    efficiency: number;
    cost: number;
    dataQuality: number;
  };
}

export interface DataQualityIssue {
  id: string;
  field: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DataQualityReport {
  overallScore: number;
  completeness: number;
  consistency: number;
  anomaliesFound: number;
  issues: DataQualityIssue[];
}

export interface TripTemplate {
  id: string;
  name: string;
  purpose: string;
  route: string;
  duration: string;
  freq: string;
  defaultVehicleId?: string;
}