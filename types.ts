
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER', // Approver
  DISPATCHER = 'DISPATCHER', // Token Issuer
  OFFICER = 'OFFICER', // Requester
  DRIVER = 'DRIVER',
  AUDITOR = 'AUDITOR'
}

export interface User {
  fullName: string;
  username: string;
  position: string;
  role: UserRole;
}

export type VehicleStatus = 'USABLE' | 'DAMAGED' | 'DISPOSAL' | 'MAINTENANCE';

export interface VehicleProfile {
  id: string;
  name: string;
  plateNumber: string;
  type: string;
  fuelType: string;
  consumptionRate: number; // Standard km/L
  wearAndTearRate: number; // Baht/km
  acquisitionDate: string; // ISO date string
  status: VehicleStatus;
  insuranceExpiry?: string;
  taxExpiry?: string;
  
  // --- LIFECYCLE EXTENSIONS ---
  currentOdometer: number;
  engineHours?: number;
  lastMaintenanceDate?: string;
  lastMaintenanceOdometer?: number;
  nextMaintenanceOdometer?: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  purchasePrice?: number;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  isSensitive?: boolean;
}

// --- FUEL MODULE ---
export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string; // Link to specific mission
  driverId?: string;
  timestamp: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  stationName: string;
  receiptUrl?: string;
  efficiency?: number; // Calculated Km/L since last fill
}

// --- MAINTENANCE MODULE ---
export type MaintenanceType = 'PM' | 'CM' | 'ACCIDENT' | 'UPGRADE'; // Preventive, Corrective, etc.
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED';

export interface SparePart {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface MaintenanceTicket {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  title: string;
  description: string;
  reportedBy: string;
  openedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  status: MaintenanceStatus;
  
  // Costing
  partsCost: number;
  laborCost: number;
  totalCost: number;
  parts?: SparePart[];
  
  // Trigger
  triggerOdometer?: number; // At what km this became necessary
}

// --- PRIVACY TYPES ---
export type PrivacyLevel = 'STANDARD' | 'SENSITIVE' | 'SECRET';

export interface DataRetentionPolicy {
  rawTelemetryDays: number; // e.g. 30 days
  aggregatedStatsDays: number; // e.g. 365 days
  incidentLogsDays: number; // e.g. 180 days
  autoDelete: boolean;
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
  // New: Route Deviation Settings
  allowedDeviationMeters?: number; // Threshold e.g., 200m
  // New: Safety Score
  safetyScore?: number;
  // New: Integrity
  integrityHash?: string; // SHA-256 Signature of the trip data
  // New: Privacy
  privacyLevel: PrivacyLevel;
}

// --- NEW AUDIT TYPES ---

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'TRIP_START' 
  | 'TRIP_END' 
  | 'TRIP_UPDATE' 
  | 'REQ_CREATE' 
  | 'REQ_APPROVE' 
  | 'REQ_REJECT' 
  | 'REQ_DISPATCH' 
  | 'EXPORT_DATA' 
  | 'INCIDENT_REPORT'
  | 'SYSTEM_CONFIG'
  | 'PRIVACY_UPDATE'
  | 'FUEL_LOG'
  | 'MAINT_UPDATE';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO
  actor: {
    id: string;
    name: string;
    role: string;
    ip?: string;
    device?: string;
  };
  action: AuditAction;
  targetId: string;
  targetType: 'TRIP' | 'REQUEST' | 'VEHICLE' | 'SYSTEM' | 'USER' | 'POLICY' | 'FUEL' | 'MAINTENANCE';
  details: string; // Readable summary
  diff?: {
    before: any;
    after: any;
  };
  prevHash?: string; // For Hash Chaining (Blockchain-lite)
  hash?: string; // Hash of this entry
}

// --- NEW DATA QUALITY TYPES ---

export interface QualityMetric {
  score: number; // 0-100
  accuracyAvg: number; // meters
  dropoutCount: number; // times signal lost > threshold
  maxDropoutDuration: number; // seconds
  jitter: number; // ms variance
  batteryTrend: 'STABLE' | 'DRAINING' | 'CHARGING';
  lastNetworkType: string;
  flags: ('GPS_DRIFT' | 'SIGNAL_BLACKOUT' | 'LOW_ACCURACY' | 'DEVICE_LAG')[];
  accuracyDistribution: {
    excellent: number; // < 10m
    good: number; // 10-20m
    fair: number; // 20-50m
    poor: number; // > 50m
  };
}

// --- OFFLINE SYNC TYPES ---
export interface LocalQueueItem {
  id: string; // key: sessionId_timestamp
  sessionId: string;
  packet: TelemetryPacket;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  retryCount: number;
  createdAt: number;
}

export interface TrackingSession {
  sessionId: string;
  tripId: string;
  vehicleId: string;
  driverName: string;
  department: string; // หน่วยงานผู้ขอใช้
  mission: string; // ภารกิจ
  origin: string;
  destination: string;
  status: 'SETUP' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'OFFLINE';
  startTime: number;
  lastUpdate: string; // ISO Date
  currentLocation: {
    lat: number;
    lng: number;
    speed: number; // km/h
    heading: number; // 0-360 degrees
    accuracy: number; // meters
    altitude?: number;
  };
  batteryLevel?: number;
  signalStrength?: 'WEAK' | 'GOOD' | 'EXCELLENT';
  networkType?: 'wifi' | 'cellular' | 'none';
  pathHistory: [number, number][]; // Local buffer for path
  totalDistance: number; // Meters
  // Live Score
  currentScore?: number;
  eventCounts?: Record<string, number>;
  // Data Quality
  qualityProfile?: QualityMetric;
  // Sync Stats
  pendingQueueSize?: number;
  lastSyncTime?: number;
  // Privacy Context
  privacyLevel?: PrivacyLevel;
}

export interface LiveCoordinate {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface TelemetryPacket {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
  heading: number;
  altitude?: number;
  timestamp: number;
  isOffline: boolean;
  batteryLevel?: number;
  networkType?: string;
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

// --- APPROVAL WORKFLOW TYPES ---

export enum RequestStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ISSUED = 'ISSUED', // QR Generated
  STARTED = 'STARTED',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED'
}

export interface VehicleRequest {
  id: string;
  requesterName: string;
  department: string;
  mission: string;
  destination: string;
  startTime: string; // ISO
  endTime: string; // ISO
  passengers: number;
  status: RequestStatus;
  requestDate: string;
  approverId?: string;
  approverName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  assignedVehicleId?: string;
  assignedDriverName?: string;
  tripToken?: string;
  tokenExpiresAt?: number;
}

// --- GEOFENCE & ALERTS ---

export type GeofenceType = 'CIRCLE' | 'POLYGON';
export type GeofenceAction = 'ENTER' | 'EXIT' | 'DWELL';

export interface Geofence {
  id: string;
  name: string;
  type: GeofenceType;
  coordinates: [number, number][] | [number, number]; // Polygon points OR Center [lat, lng]
  radius?: number; // Only for CIRCLE (meters)
  triggers: GeofenceAction[];
  dwellTimeMinutes?: number; // Only for DWELL
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  active: boolean;
  description?: string;
}

export interface SecurityAlert {
  id: string;
  vehicleId: string;
  tripId?: string;
  type: 'GEOFENCE_BREACH' | 'ROUTE_DEVIATION' | 'DWELL_LIMIT' | 'SOS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  timestamp: string; // ISO
  location: { lat: number, lng: number };
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  meta?: any; // Extra data (e.g. deviation distance)
}

// --- SAFETY & INCIDENT ---

export type IncidentType = 'SOS' | 'CRASH' | 'PANIC' | 'MECHANICAL_FAILURE';
export type IncidentStatus = 'REPORTED' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: 'HIGH' | 'CRITICAL';
  status: IncidentStatus;
  timestamp: string;
  vehicleId: string;
  driverName: string;
  location: { lat: number, lng: number; accuracy: number };
  description?: string;
  sensorData?: {
    gForce: number;
    speed: number;
  };
  resolverName?: string;
  resolutionTime?: string;
  resolutionNote?: string;
}

// --- DRIVER SCORING ---

export type BehaviorType = 'SPEEDING' | 'HARSH_BRAKE' | 'HARSH_ACCEL' | 'HARSH_TURN';

export interface BehaviorEvent {
  id: string;
  sessionId: string;
  type: BehaviorType;
  timestamp: number;
  value: number; // e.g., Speed in km/h or G-force
  threshold: number;
  location: { lat: number, lng: number };
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DriverScoreProfile {
  driverId: string;
  driverName: string;
  totalDistanceKm: number;
  totalDurationHrs: number;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  events: {
    speeding: number;
    harshBrake: number;
    harshAccel: number;
    harshTurn: number;
  };
  trend: number[]; // Last 7 days scores
}

// --- OPS MONITORING TYPES ---

export type OpsMetricType = 'API_LATENCY' | 'INGESTION_RATE' | 'ERROR_RATE' | 'WS_DISCONNECTS' | 'BATTERY_DRAIN';

export interface OpsAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  timestamp: number;
  metric: OpsMetricType;
  value: number;
}

export interface OpsStats {
  apiLatency: { p50: number, p95: number, max: number };
  errorRate: number; // %
  ingestionThroughput: number; // points/sec
  activeConnections: number;
  batteryDrainAvg: number; // % per hour
  dbQuotaUsage: number; // %
}
