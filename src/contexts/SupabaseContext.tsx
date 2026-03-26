import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, getSupabaseConfig } from '@/src/lib/supabase';
import { Customer, Appointment, Service, CustomerSource } from '@/src/types';

interface SupabaseContextType {
  customers: Customer[];
  appointments: Appointment[];
  services: Service[];
  sources: CustomerSource[];
  loading: boolean;
  refreshData: () => Promise<void>;
  isConfigured: boolean;
  setConfigured: (val: boolean) => void;
  // CRUD operations
  upsertCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  upsertAppointment: (appointment: Appointment) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  upsertService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  upsertSource: (source: CustomerSource) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  bulkImport: (data: {
    customers?: Customer[];
    appointments?: Appointment[];
    services?: Service[];
    sources?: CustomerSource[];
  }) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [sources, setSources] = useState<CustomerSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setConfigured] = useState(!!getSupabaseConfig().url && !!getSupabaseConfig().key);

  const refreshData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [
        { data: customersData, error: cErr },
        { data: appointmentsData, error: aErr },
        { data: servicesData, error: sErr },
        { data: sourcesData, error: srcErr }
      ] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').order('date', { ascending: false }),
        supabase.from('services').select('*').order('name', { ascending: true }),
        supabase.from('customer_sources').select('*').order('name', { ascending: true })
      ]);

      if (cErr) console.error('Error fetching customers:', cErr);
      if (aErr) console.error('Error fetching appointments:', aErr);
      if (sErr) console.error('Error fetching services:', sErr);
      if (srcErr) console.error('Error fetching sources:', srcErr);

      if (customersData) {
        setCustomers(customersData.map(c => ({
          ...c,
          totalCost: c.total_cost,
          startDate: c.start_date,
          dischargeDate: c.discharge_date,
          appointments: c.appointments_dates,
          createdAt: c.created_at
        })));
      }
      if (appointmentsData) {
        setAppointments(appointmentsData.map(a => ({
          ...a,
          customerId: a.customer_id,
          customerName: a.customer_name,
          serviceName: a.service_name,
          createdAt: a.created_at
        })));
      }
      if (servicesData) setServices(servicesData);
      if (sourcesData) setSources(sourcesData);
    } catch (error) {
      console.error('Unexpected error fetching data from Supabase:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConfigured) {
      refreshData();
    } else {
      setLoading(false);
    }
  }, [isConfigured, refreshData]);

  const upsertCustomer = async (customer: Customer) => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    console.log('Upserting customer:', customer);
    const data: any = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      services: customer.services,
      status: customer.status,
      notes: customer.notes,
      source: customer.source,
      total_cost: customer.totalCost,
      start_date: customer.startDate,
      discharge_date: customer.dischargeDate,
      appointments_dates: customer.appointments
    };
    if (customer.createdAt) {
      data.created_at = customer.createdAt;
    }
    const { error } = await supabase.from('customers').upsert(data);
    if (error) {
      console.error('Error upserting customer:', error);
      throw error;
    }
    await refreshData();
  };

  const deleteCustomer = async (id: string) => {
    if (!supabase) return;
    console.log('Deleting customer:', id);
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
    await refreshData();
  };

  const upsertAppointment = async (appointment: Appointment) => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    console.log('Upserting appointment:', appointment);
    const data: any = {
      id: appointment.id,
      customer_id: appointment.customerId,
      customer_name: appointment.customerName,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes,
      service_name: appointment.serviceName
    };
    if ((appointment as any).createdAt) {
      data.created_at = (appointment as any).createdAt;
    }
    const { error } = await supabase.from('appointments').upsert(data);
    if (error) {
      console.error('Error upserting appointment:', error);
      throw error;
    }
    await refreshData();
  };

  const deleteAppointment = async (id: string) => {
    if (!supabase) return;
    console.log('Deleting appointment:', id);
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
    await refreshData();
  };

  const upsertService = async (service: Service) => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    console.log('Upserting service:', service);
    const { error } = await supabase.from('services').upsert({
      id: service.id,
      name: service.name
    });
    if (error) {
      console.error('Error upserting service:', error);
      throw error;
    }
    await refreshData();
  };

  const deleteService = async (id: string) => {
    if (!supabase) return;
    console.log('Deleting service:', id);
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
    await refreshData();
  };

  const upsertSource = async (source: CustomerSource) => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    console.log('Upserting source:', source);
    const { error } = await supabase.from('customer_sources').upsert({
      id: source.id,
      name: source.name
    });
    if (error) {
      console.error('Error upserting source:', error);
      throw error;
    }
    await refreshData();
  };

  const deleteSource = async (id: string) => {
    if (!supabase) return;
    console.log('Deleting source:', id);
    const { error } = await supabase.from('customer_sources').delete().eq('id', id);
    if (error) {
      console.error('Error deleting source:', error);
      throw error;
    }
    await refreshData();
  };

  const bulkImport = async (data: {
    customers?: Customer[];
    appointments?: Appointment[];
    services?: Service[];
    sources?: CustomerSource[];
  }) => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (data.services && data.services.length > 0) {
        const { error } = await supabase.from('services').upsert(data.services.map(s => ({ id: s.id, name: s.name })));
        if (error) throw error;
      }

      if (data.sources && data.sources.length > 0) {
        const { error } = await supabase.from('customer_sources').upsert(data.sources.map(s => ({ id: s.id, name: s.name })));
        if (error) throw error;
      }

      if (data.customers && data.customers.length > 0) {
        const { error } = await supabase.from('customers').upsert(data.customers.map(c => {
          const payload: any = {
            id: c.id,
            name: c.name,
            phone: c.phone,
            services: c.services,
            status: c.status,
            notes: c.notes,
            source: c.source,
            total_cost: c.totalCost,
            start_date: c.startDate,
            discharge_date: c.dischargeDate,
            appointments_dates: c.appointments
          };
          if (c.createdAt) payload.created_at = c.createdAt;
          return payload;
        }));
        if (error) throw error;
      }

      if (data.appointments && data.appointments.length > 0) {
        const { error } = await supabase.from('appointments').upsert(data.appointments.map(a => {
          const payload: any = {
            id: a.id,
            customer_id: a.customerId,
            customer_name: a.customerName,
            date: a.date,
            time: a.time,
            type: a.type,
            status: a.status,
            notes: a.notes,
            service_name: a.serviceName
          };
          if ((a as any).createdAt) payload.created_at = (a as any).createdAt;
          return payload;
        }));
        if (error) throw error;
      }

      await refreshData();
    } catch (error) {
      console.error('Unexpected error in bulk import:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const res1 = await supabase.from('appointments').delete().neq('id', '0');
      if (res1.error) throw res1.error;
      const res2 = await supabase.from('customers').delete().neq('id', '0');
      if (res2.error) throw res2.error;
      const res3 = await supabase.from('services').delete().neq('id', '0');
      if (res3.error) throw res3.error;
      const res4 = await supabase.from('customer_sources').delete().neq('id', '0');
      if (res4.error) throw res4.error;
      
      await refreshData();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupabaseContext.Provider value={{
      customers,
      appointments,
      services,
      sources,
      loading,
      refreshData,
      isConfigured,
      setConfigured,
      upsertCustomer,
      deleteCustomer,
      upsertAppointment,
      deleteAppointment,
      upsertService,
      deleteService,
      upsertSource,
      deleteSource,
      bulkImport,
      clearAllData
    }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
