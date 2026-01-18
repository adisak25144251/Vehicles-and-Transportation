
import { FuelLog, MaintenanceTicket, VehicleProfile, SparePart } from '../types';
import { MOCK_VEHICLES } from '../constants';

// --- MOCK STORAGE ---
let fuelLogs: FuelLog[] = [
  { 
    id: 'fl-1', 
    vehicleId: 'v1', 
    timestamp: '2024-03-15T10:00:00Z', 
    odometer: 144500, 
    liters: 45, 
    pricePerLiter: 38.5, 
    totalPrice: 1732.5, 
    stationName: 'PTT Station วิภาวดี',
    efficiency: 12.2 
  },
  { 
    id: 'fl-2', 
    vehicleId: 'v1', 
    timestamp: '2024-03-01T09:30:00Z', 
    odometer: 144000, 
    liters: 40, 
    pricePerLiter: 38.0, 
    totalPrice: 1520, 
    stationName: 'Bangchak รัชดา' 
  }
];

let maintenanceTickets: MaintenanceTicket[] = [
  {
    id: 'mt-1',
    vehicleId: 'v2',
    type: 'PM',
    title: 'เช็คระยะ 280,000 กม.',
    description: 'ถ่ายน้ำมันเครื่อง, กรองอากาศ, เช็คเบรก',
    reportedBy: 'ระบบอัตโนมัติ',
    openedDate: '2024-03-20T08:00:00Z',
    status: 'IN_PROGRESS',
    partsCost: 3500,
    laborCost: 1000,
    totalCost: 4500,
    triggerOdometer: 280000
  },
  {
    id: 'mt-2',
    vehicleId: 'v1',
    type: 'CM',
    title: 'แอร์ไม่เย็น',
    description: 'พัดลมแอร์มีเสียงดัง และความเย็นลดลง',
    reportedBy: 'นายสมชาย (พลขับ)',
    openedDate: '2024-02-15T14:00:00Z',
    completedDate: '2024-02-16T16:00:00Z',
    status: 'COMPLETED',
    partsCost: 2000,
    laborCost: 500,
    totalCost: 2500,
    parts: [{ name: 'Blower Motor', quantity: 1, unitPrice: 2000 }]
  }
];

export const lifecycleService = {
  
  // --- FUEL MANAGEMENT ---
  
  getFuelLogs(vehicleId: string) {
    return fuelLogs.filter(f => f.vehicleId === vehicleId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addFuelLog(log: Omit<FuelLog, 'id' | 'efficiency'>) {
    // 1. Calculate Efficiency if previous log exists
    const prevLog = this.getFuelLogs(log.vehicleId)[0]; // Get latest
    let efficiency = 0;
    
    if (prevLog && log.odometer > prevLog.odometer) {
      const dist = log.odometer - prevLog.odometer;
      efficiency = dist / log.liters; // km/L
    }

    const newLog: FuelLog = {
      id: `FL-${Date.now()}`,
      ...log,
      efficiency: parseFloat(efficiency.toFixed(2))
    };

    fuelLogs.unshift(newLog);

    // 2. Integration: Update Vehicle Odometer & Cost
    // In a real app, this would call vehicleService.update()
    // Here we simulate updating the mock object reference directly for demo
    const vehicle = MOCK_VEHICLES.find(v => v.id === log.vehicleId);
    if (vehicle) {
      if (log.odometer > vehicle.currentOdometer) {
        vehicle.currentOdometer = log.odometer;
        this.checkMaintenanceTriggers(vehicle); // Trigger check
      }
      vehicle.totalFuelCost += log.totalPrice;
    }

    return newLog;
  },

  // --- MAINTENANCE MANAGEMENT ---

  getTickets(vehicleId: string) {
    return maintenanceTickets.filter(t => t.vehicleId === vehicleId).sort((a,b) => new Date(b.openedDate).getTime() - new Date(a.openedDate).getTime());
  },

  createTicket(ticket: Omit<MaintenanceTicket, 'id' | 'status' | 'openedDate' | 'totalCost'>) {
    const newTicket: MaintenanceTicket = {
      id: `MT-${Date.now()}`,
      status: 'OPEN',
      openedDate: new Date().toISOString(),
      totalCost: ticket.partsCost + ticket.laborCost,
      ...ticket
    };
    maintenanceTickets.unshift(newTicket);
    
    // Update Vehicle Status
    const vehicle = MOCK_VEHICLES.find(v => v.id === ticket.vehicleId);
    if (vehicle && (ticket.type === 'CM' || ticket.type === 'ACCIDENT')) {
      vehicle.status = 'MAINTENANCE';
    }

    return newTicket;
  },

  updateTicketStatus(id: string, status: MaintenanceTicket['status']) {
    const ticket = maintenanceTickets.find(t => t.id === id);
    if (ticket) {
      ticket.status = status;
      if (status === 'COMPLETED') {
        ticket.completedDate = new Date().toISOString();
        
        // Update Vehicle Maintenance Stats
        const vehicle = MOCK_VEHICLES.find(v => v.id === ticket.vehicleId);
        if (vehicle) {
          vehicle.lastMaintenanceDate = ticket.completedDate;
          vehicle.lastMaintenanceOdometer = vehicle.currentOdometer;
          vehicle.nextMaintenanceOdometer = vehicle.currentOdometer + 10000; // Next PM in 10k
          vehicle.totalMaintenanceCost += ticket.totalCost;
          vehicle.status = 'USABLE'; // Return to fleet
        }
      }
    }
  },

  // --- AUTOMATION TRIGGERS ---

  checkMaintenanceTriggers(vehicle: VehicleProfile) {
    if (vehicle.nextMaintenanceOdometer && vehicle.currentOdometer >= vehicle.nextMaintenanceOdometer) {
      // Check if ticket already exists for this trigger
      const exists = maintenanceTickets.find(t => 
        t.vehicleId === vehicle.id && 
        t.type === 'PM' && 
        t.status !== 'COMPLETED' &&
        t.triggerOdometer === vehicle.nextMaintenanceOdometer
      );

      if (!exists) {
        this.createTicket({
          vehicleId: vehicle.id,
          type: 'PM',
          title: `แจ้งเตือนเช็คระยะ ${vehicle.nextMaintenanceOdometer.toLocaleString()} กม.`,
          description: 'ระบบตรวจพบเลขไมล์ถึงกำหนดการบำรุงรักษาตามระยะ (Auto-Generated)',
          reportedBy: 'System AI',
          partsCost: 0, // Estimate
          laborCost: 0,
          triggerOdometer: vehicle.nextMaintenanceOdometer
        });
        console.log(`[Lifecycle] Auto-created PM ticket for ${vehicle.plateNumber}`);
      }
    }
  }
};
