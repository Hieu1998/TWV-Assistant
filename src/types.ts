export type CustomerStatus = 'Tiềm năng' | 'Đang tư vấn' | 'Đã chốt' | 'Hậu phẫu' | 'Bảo hành';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  services: string[]; // Array of service names
  status: CustomerStatus;
  notes: string;
  createdAt: string;
  startDate?: string;
  appointments?: string[]; // Array of dates
  dischargeDate?: string;
  totalCost?: string;
  deposit?: string;
  commissionRate?: string;
  source?: string;
}

export type AppointmentType = 'Tư vấn' | 'Phẫu thuật/Làm dịch vụ' | 'Tái khám' | 'Cắt chỉ';

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // ISO string YYYY-MM-DD
  time: string; // HH:mm
  type: AppointmentType;
  status: 'Chờ khám' | 'Đã xong' | 'Hủy';
  notes: string;
  serviceName?: string; // Specific service for this appointment
}

export interface Service {
  id: string;
  name: string;
}

export interface CustomerSource {
  id: string;
  name: string;
}
