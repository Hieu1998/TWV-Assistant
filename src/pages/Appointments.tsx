import React, { useState, useMemo, useRef } from 'react';
import { useSupabase } from '@/src/contexts/SupabaseContext';
import { Appointment, Customer, Service } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Calendar as CalendarIcon, Clock, User, Plus, CheckCircle, XCircle, ChevronLeft, ChevronRight, Phone, Trash2, Users } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays, startOfDay } from 'date-fns';
import { generateUUID, cn } from '@/src/lib/utils';

export default function Appointments() {
  const { appointments, customers, services, upsertAppointment, deleteAppointment } = useSupabase();
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newAppt, setNewAppt] = useState({ customerId: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', type: 'Tái khám' as const, notes: '', serviceName: '' });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [apptToDelete, setApptToDelete] = useState<Appointment | null>(null);

  const groupedServices = useMemo(() => {
    const groups: Record<string, { id: string, name: string, original: string }[]> = {};
    services.forEach(s => {
      const match = s.name.match(/^\[(.*?)\]\s*(.*)$/);
      const category = match ? match[1] : 'Khác';
      const name = match ? match[2] : s.name;
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({ id: s.id, name, original: s.name });
    });
    return groups;
  }, [services]);

  const listRef = useRef<HTMLDivElement>(null);

  const filteredAppts = useMemo(() => {
    return appointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  const apptsByDate = useMemo(() => {
    const map: { [key: string]: Appointment[] } = {};
    appointments.forEach(appt => {
      if (!map[appt.date]) map[appt.date] = [];
      map[appt.date].push(appt);
    });
    // Sort each day's appointments by time
    Object.keys(map).forEach(date => {
      map[date].sort((a, b) => a.time.localeCompare(b.time));
    });
    return map;
  }, [appointments]);

  const scrollToList = () => {
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    const dayAppts = appointments.filter(a => a.date === dateStr);
    if (dayAppts.length > 0) {
      setTimeout(scrollToList, 100);
    }
  };

  const handleAddAppt = async () => {
    if (!newAppt.customerId || !newAppt.date || isSaving) return;
    
    setIsSaving(true);
    try {
      const customer = customers.find(c => c.id === newAppt.customerId);
      if (!customer) return;

      const appt: Appointment = {
        id: generateUUID(),
        customerId: customer.id,
        customerName: customer.name,
        status: 'Chờ khám',
        ...newAppt
      };
      await upsertAppointment(appt);
      setShowAddModal(false);
      setNewAppt({ customerId: '', date: selectedDate, time: '09:00', type: 'Tái khám', notes: '', serviceName: '' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReschedule = (appt: Appointment) => {
    setNewAppt({
      customerId: appt.customerId,
      date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      time: appt.time,
      type: appt.type,
      notes: appt.notes ? `Đặt lại từ lịch hủy ngày ${format(parseISO(appt.date), 'dd/MM')}. ${appt.notes}` : `Đặt lại từ lịch hủy ngày ${format(parseISO(appt.date), 'dd/MM')}`,
      serviceName: appt.serviceName || ''
    });
    setShowAddModal(true);
  };

  const handleStatusChange = async (id: string, status: Appointment['status']) => {
    const appt = appointments.find(a => a.id === id);
    if (appt) {
      await upsertAppointment({ ...appt, status });
    }
  };

  const handleDeleteAppt = (appt: Appointment) => {
    setApptToDelete(appt);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAppt = async () => {
    if (!apptToDelete || isSaving) return;
    setIsSaving(true);
    try {
      await deleteAppointment(apptToDelete.id);
      setIsDeleteModalOpen(false);
      setApptToDelete(null);
    } finally {
      setIsSaving(false);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const getCustomerDetails = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Lịch hẹn & Tái khám <span className="text-2xl">🗓️</span>
          </h1>
          <p className="text-gray-500 dark:text-rose-200/70 mt-2 font-medium">Quản lý lịch khách đến làm dịch vụ và tái khám mỗi ngày.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedDate(todayStr);
              setCurrentMonth(startOfMonth(new Date()));
            }}
            className="flex-1 sm:flex-none border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/20 font-bold"
          >
            Hôm nay
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="flex-[2] sm:flex-none bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/20">
            <Plus className="w-4 h-4 mr-2" /> Thêm lịch hẹn
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 dark:bg-[#181a1b] p-2 sm:p-4 rounded-xl">
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Chọn ngày</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentMonth(startOfMonth(parseISO(e.target.value)));
                }}
                className="w-full h-11"
              />
              
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 dark:text-rose-300/30 uppercase tracking-[0.2em] text-center">Thống kê ngày {format(parseISO(selectedDate), 'dd/MM')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-4 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 rounded-2xl border border-blue-100 dark:border-blue-900/20 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">Tổng cộng</span>
                    </div>
                    <span className="font-black text-2xl">{filteredAppts.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-300 rounded-2xl border border-green-100 dark:border-green-900/20 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">Đã xong</span>
                    </div>
                    <span className="font-black text-2xl">{filteredAppts.filter(a => a.status === 'Đã xong').length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-orange-50/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300 rounded-2xl border border-orange-100 dark:border-orange-900/20 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">Chờ khám</span>
                    </div>
                    <span className="font-black text-2xl">{filteredAppts.filter(a => a.status === 'Chờ khám').length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8" ref={listRef}>
          <Card className="h-full shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Danh sách khách hàng
                <span className="text-sm font-normal text-gray-500">{format(parseISO(selectedDate), 'dd/MM/yyyy')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {filteredAppts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-rose-300/50">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Không có lịch hẹn nào trong ngày này.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppts.map(appt => {
                    const customer = getCustomerDetails(appt.customerId);
                    return (
                      <div 
                        key={appt.id} 
                        className={cn(
                          "p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer",
                          appt.status === 'Đã xong' ? 'bg-gray-50 dark:bg-[#181a1b] border-gray-200 dark:border-[#4a2b2d] opacity-70' : 
                          appt.status === 'Hủy' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 opacity-70' : 
                          'bg-white dark:bg-[#181a1b] border-rose-100 dark:border-[#4a2b2d] shadow-sm hover:border-rose-300'
                        )}
                        onClick={() => customer && setViewingCustomer(customer)}
                      >
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className={`p-2.5 sm:p-3 rounded-full shrink-0 ${appt.status === 'Đã xong' ? 'bg-gray-200 dark:bg-[#181a1b] text-gray-500 dark:text-rose-300/50' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300'}`}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{appt.time}</h4>
                                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                                  appt.type === 'Tái khám' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 
                                  appt.type === 'Cắt chỉ' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 
                                  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                }`}>{appt.type}</span>
                                {appt.status === 'Đã xong' && <span className="text-[10px] sm:text-xs bg-gray-200 dark:bg-[#181a1b] text-gray-700 dark:text-rose-200 px-2 py-0.5 rounded-full whitespace-nowrap">Đã xong</span>}
                                {appt.status === 'Hủy' && <span className="text-[10px] sm:text-xs bg-red-200 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full whitespace-nowrap">Đã hủy</span>}
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 dark:text-rose-300/50 dark:hover:text-red-400 shrink-0" onClick={(e) => { e.stopPropagation(); handleDeleteAppt(appt); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-col text-gray-600 dark:text-rose-200 mt-1 min-w-0">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1 shrink-0" /> 
                                <span className="font-bold truncate text-base">{appt.customerName}</span>
                              </div>
                              {customer && <span className="text-xs sm:text-sm text-gray-400 dark:text-rose-300/70 truncate">{customer.phone}</span>}
                            </div>
                            {customer && customer.services && customer.services.length > 0 && (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 italic bg-rose-50/50 dark:bg-rose-900/10 p-2 rounded-lg border border-rose-100/50 dark:border-rose-900/20">
                                <span className="font-bold block mb-1 uppercase tracking-tighter opacity-70">Dịch vụ khách hàng:</span>
                                <ul className="space-y-1">
                                  {customer.services.map((srv, idx) => (
                                    <li key={idx} className="break-words leading-tight">• {srv.replace(/^\[.*?\]\s*/, '')}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {appt.serviceName && (
                              <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-2 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Dịch vụ hẹn: {appt.serviceName}
                              </div>
                            )}
                            {appt.notes && (
                              <div className="text-sm text-gray-500 dark:text-rose-300/70 mt-2 p-2 bg-gray-50 dark:bg-zinc-800/50 rounded border border-gray-100 dark:border-zinc-800 italic">
                                "{appt.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex sm:flex-col gap-2 shrink-0 sm:min-w-[100px]">
                          {appt.status === 'Chờ khám' && (
                            <>
                              <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-900/20" onClick={() => handleStatusChange(appt.id, 'Đã xong')}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Xong
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20" onClick={() => handleStatusChange(appt.id, 'Hủy')}>
                                <XCircle className="w-4 h-4 mr-1" /> Hủy
                              </Button>
                            </>
                          )}
                          {appt.status === 'Hủy' && (
                            <Button size="sm" variant="outline" className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/20" onClick={() => handleReschedule(appt)}>
                              <Plus className="w-4 h-4 mr-1" /> Đặt lại
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Calendar View */}
      <Card className="shadow-lg border-rose-100 dark:border-[#4a2b2d] overflow-hidden bg-white dark:bg-[#181a1b]">
        <CardHeader className="flex flex-row items-center justify-between pb-4 bg-rose-50/30 dark:bg-rose-900/10 border-b dark:border-[#4a2b2d]">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-rose-900 dark:text-rose-100 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-rose-600" />
              Lịch tháng {format(currentMonth, 'MM/yyyy')}
            </CardTitle>
            <p className="text-xs font-medium text-gray-500 dark:text-rose-300/50">Bấm vào ngày để xem chi tiết lịch hẹn</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/20">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/20">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="scrollbar-hide">
            <div className="grid grid-cols-7 gap-px bg-rose-100 dark:bg-[#4a2b2d]">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                <div key={day} className="bg-rose-50/50 dark:bg-[#181a1b] py-2 md:py-4 text-center text-[9px] md:text-[10px] font-black text-rose-900/40 dark:text-rose-300/30 uppercase tracking-tighter md:tracking-[0.2em]">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, dayIdx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayAppts = apptsByDate[dateStr] || [];
                const isSelected = dateStr === selectedDate;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={dayIdx}
                    onClick={() => handleDateSelect(dateStr)}
                    className={cn(
                      "min-h-[50px] md:min-h-[140px] p-1 md:p-2 transition-all cursor-pointer relative group",
                      isCurrentMonth ? "bg-white dark:bg-[#181a1b]" : "bg-gray-50/50 dark:bg-zinc-900/30",
                      isSelected ? "ring-2 ring-inset ring-rose-500 bg-rose-50/30 dark:bg-rose-900/10 z-10" : "md:hover:bg-rose-50/20 md:hover:bg-rose-900/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                      <span className={cn(
                        "text-[10px] md:text-xs font-black w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-colors",
                        isToday ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : 
                        isSelected ? "text-rose-600" :
                        isCurrentMonth ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-rose-300/20"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {dayAppts.length > 0 && (
                        <span className="text-[8px] md:text-[10px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 px-1 md:px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/30">
                          {dayAppts.length}
                        </span>
                      )}
                    </div>
                    <div className="hidden md:block space-y-1 overflow-hidden">
                      {dayAppts.slice(0, 3).map(appt => (
                        <div key={appt.id} className={cn(
                          "text-[9px] font-bold truncate px-1.5 py-0.5 rounded border leading-tight",
                          appt.status === 'Đã xong' ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 border-gray-200 dark:border-zinc-700" :
                          appt.status === 'Hủy' ? "bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-900/30" :
                          "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 border-rose-100 dark:border-rose-900/30"
                        )}>
                          {appt.time} {appt.customerName}
                        </div>
                      ))}
                      {dayAppts.length > 3 && (
                        <div className="text-[9px] font-black text-rose-400 dark:text-rose-300/30 pl-1">
                          + {dayAppts.length - 3} lịch khác
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md my-8 max-h-[90vh] flex flex-col">
            <CardHeader className="shrink-0">
              <CardTitle>Thêm lịch hẹn mới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label>Khách hàng <span className="text-rose-600">*</span></Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                  value={newAppt.customerId}
                  onChange={e => setNewAppt({...newAppt, customerId: e.target.value})}
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {newAppt.customerId && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/30">
                  <Label className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase">Dịch vụ của khách hàng:</Label>
                  <ul className="mt-2 space-y-1">
                    {customers.find(c => c.id === newAppt.customerId)?.services?.map((s, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-rose-200 flex items-start gap-2 break-words">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        {s.replace(/^\[.*?\]\s*/, '')}
                      </li>
                    )) || <li className="text-sm text-gray-400 italic">Chưa có dịch vụ</li>}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày <span className="text-rose-600">*</span></Label>
                  <Input type="date" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Giờ <span className="text-rose-600">*</span></Label>
                  <Input type="time" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Loại lịch hẹn</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                  value={newAppt.type}
                  onChange={e => setNewAppt({...newAppt, type: e.target.value as any})}
                >
                  <option value="Tư vấn">Tư vấn</option>
                  <option value="Phẫu thuật/Làm dịch vụ">Phẫu thuật/Làm dịch vụ</option>
                  <option value="Tái khám">Tái khám</option>
                  <option value="Cắt chỉ">Cắt chỉ</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input value={newAppt.notes} onChange={e => setNewAppt({...newAppt, notes: e.target.value})} placeholder="VD: Nhắc khách nhịn ăn sáng..." />
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={isSaving} className="w-full sm:w-auto">Hủy</Button>
              <Button 
                onClick={handleAddAppt} 
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white" 
                disabled={!newAppt.customerId || !newAppt.date || !newAppt.time}
                loading={isSaving}
              >
                Lưu lịch hẹn
              </Button>
            </div>
          </Card>
        </div>
      )}

      {isDeleteModalOpen && apptToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Xác nhận xóa lịch hẹn</CardTitle>
              <div className="text-sm text-gray-500 dark:text-rose-300/70 mt-2">
                Bạn có chắc chắn muốn xóa lịch hẹn của khách hàng <strong className="text-rose-600">{apptToDelete.customerName}</strong> vào lúc {apptToDelete.time} ngày {format(parseISO(apptToDelete.date), 'dd/MM/yyyy')}?
                Hành động này không thể hoàn tác.
              </div>
            </CardHeader>
            <div className="p-6 pt-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving} className="w-full sm:w-auto">Hủy</Button>
              <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeleteAppt} loading={isSaving}>Xác nhận xóa</Button>
            </div>
          </Card>
        </div>
      )}

      {viewingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-rose-600" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Họ tên</Label>
                  <p className="font-bold text-gray-900 dark:text-white">{viewingCustomer.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Số điện thoại</Label>
                  <p className="font-bold text-gray-900 dark:text-white">{viewingCustomer.phone}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Trạng thái</Label>
                <p className="font-bold text-rose-600">{viewingCustomer.status}</p>
              </div>
              {viewingCustomer.services && viewingCustomer.services.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Dịch vụ đã đăng ký</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingCustomer.services.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 text-xs rounded-full border border-rose-100 dark:border-rose-900/30">
                        {s.replace(/^\[.*?\]\s*/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {viewingCustomer.notes && (
                <div>
                  <Label className="text-xs text-gray-500">Ghi chú</Label>
                  <p className="text-sm text-gray-700 dark:text-rose-100 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg border border-gray-100 dark:border-zinc-700 italic">
                    "{viewingCustomer.notes}"
                  </p>
                </div>
              )}
            </CardContent>
            <div className="p-6 pt-0 flex justify-end">
              <Button onClick={() => setViewingCustomer(null)} className="bg-rose-600 hover:bg-rose-700 text-white">Đóng</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
