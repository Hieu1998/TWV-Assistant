import React, { useState, useMemo, useRef } from 'react';
import { useLocalStorage } from '@/src/lib/useLocalStorage';
import { Appointment, Customer, Service } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Calendar as CalendarIcon, Clock, User, Plus, CheckCircle, XCircle, ChevronLeft, ChevronRight, Phone, ArrowUp } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export default function Appointments() {
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('crm_appointments', []);
  const [customers] = useLocalStorage<Customer[]>('crm_customers', []);
  const [services] = useLocalStorage<Service[]>('crm_services', []);
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppt, setNewAppt] = useState({ customerId: '', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', type: 'Tái khám' as const, notes: '', serviceName: '' });

  const listRef = useRef<HTMLDivElement>(null);

  const filteredAppts = appointments.filter(a => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

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

  const handleAddAppt = () => {
    if (!newAppt.customerId || !newAppt.date) return;
    
    const customer = customers.find(c => c.id === newAppt.customerId);
    if (!customer) return;

    const appt: Appointment = {
      id: Date.now().toString(),
      customerId: customer.id,
      customerName: customer.name,
      status: 'Chờ khám',
      ...newAppt
    };
    setAppointments([...appointments, appt]);
    setShowAddModal(false);
    setNewAppt({ customerId: '', date: selectedDate, time: '09:00', type: 'Tái khám', notes: '', serviceName: '' });
  };

  const handleStatusChange = (id: string, status: Appointment['status']) => {
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lịch hẹn & Tái khám 🗓️</h1>
          <p className="text-gray-500 dark:text-rose-200 mt-2">Quản lý lịch khách đến làm dịch vụ và tái khám mỗi ngày.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm lịch hẹn
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 dark:bg-[#181a1b] p-4 rounded-xl">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Chọn ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentMonth(startOfMonth(parseISO(e.target.value)));
                }}
                className="w-full"
              />
              
              <div className="mt-6 space-y-2">
                <h4 className="text-sm font-medium text-gray-500 dark:text-rose-300/70 uppercase tracking-wider">Thống kê ngày {format(parseISO(selectedDate), 'dd/MM/yyyy')}</h4>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
                  <span>Tổng lịch hẹn:</span>
                  <span className="font-bold text-lg">{filteredAppts.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                  <span>Đã hoàn thành:</span>
                  <span className="font-bold text-lg">{filteredAppts.filter(a => a.status === 'Đã xong').length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg">
                  <span>Chờ khám:</span>
                  <span className="font-bold text-lg">{filteredAppts.filter(a => a.status === 'Chờ khám').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8" ref={listRef}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Danh sách khách hàng ({format(parseISO(selectedDate), 'dd/MM/yyyy')})</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <div key={appt.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${appt.status === 'Đã xong' ? 'bg-gray-50 dark:bg-[#181a1b] border-gray-200 dark:border-[#4a2b2d] opacity-70' : appt.status === 'Hủy' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 opacity-70' : 'bg-white dark:bg-[#181a1b] border-rose-100 dark:border-[#4a2b2d] shadow-sm'}`}>
                        <div className="flex items-start sm:items-center gap-4">
                          <div className={`p-3 rounded-full ${appt.status === 'Đã xong' ? 'bg-gray-200 dark:bg-[#181a1b] text-gray-500 dark:text-rose-300/50' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300'}`}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg">{appt.time}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                appt.type === 'Tái khám' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 
                                appt.type === 'Cắt chỉ' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 
                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              }`}>{appt.type}</span>
                              {appt.status === 'Đã xong' && <span className="text-xs bg-gray-200 dark:bg-[#181a1b] text-gray-700 dark:text-rose-200 px-2 py-0.5 rounded-full">Đã xong</span>}
                              {appt.status === 'Hủy' && <span className="text-xs bg-red-200 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">Đã hủy</span>}
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-rose-200 mt-1">
                              <User className="w-4 h-4 mr-1" /> <span className="font-medium">{appt.customerName}</span>
                              {customer && <span className="ml-2 text-sm text-gray-400 dark:text-rose-300/70">({customer.phone})</span>}
                            </div>
                            {customer && customer.services && customer.services.length > 0 && (
                              <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 italic">Dịch vụ KH: {customer.services.join(', ')}</div>
                            )}
                            {appt.serviceName && (
                              <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-bold">Dịch vụ hẹn: {appt.serviceName}</div>
                            )}
                            {appt.notes && <p className="text-sm text-gray-500 dark:text-rose-300/70 mt-1">{appt.notes}</p>}
                          </div>
                        </div>
                        
                        {appt.status === 'Chờ khám' && (
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusChange(appt.id, 'Đã xong')}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Xong
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(appt.id, 'Hủy')}>
                              <XCircle className="w-4 h-4 mr-1" /> Hủy
                            </Button>
                          </div>
                        )}
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Lịch tháng {format(currentMonth, 'MM/yyyy')}</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-[#4a2b2d] rounded-lg overflow-hidden border border-gray-200 dark:border-[#4a2b2d]">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
              <div key={day} className="bg-gray-50 dark:bg-[#181a1b] py-2 text-center text-sm font-semibold text-gray-700 dark:text-rose-200">
                {day}
              </div>
            ))}
            
            {calendarDays.map((day, dayIdx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppts = appointments.filter(a => a.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
              const isSelected = dateStr === selectedDate;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <div 
                  key={day.toString()} 
                  className={`min-h-[60px] md:min-h-[120px] bg-white dark:bg-[#281718] p-1 md:p-2 cursor-pointer hover:bg-rose-50 dark:hover:bg-[#3a2224] transition-colors ${!isCurrentMonth ? 'text-gray-400 dark:text-rose-300/50 bg-gray-50/50 dark:bg-[#181a1b]' : ''} ${isSelected ? 'ring-2 ring-inset ring-rose-500 bg-rose-50/30 dark:bg-rose-900/20' : ''}`}
                  onClick={() => handleDateSelect(dateStr)}
                >
                  <div className={`text-center md:text-right text-sm font-medium mb-1 ${isSameDay(day, new Date()) ? 'text-rose-600 dark:text-rose-400' : 'dark:text-rose-100'}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Mobile indicators */}
                  <div className="md:hidden flex flex-wrap gap-1 justify-center mt-1">
                    {dayAppts.map(appt => (
                      <div key={appt.id} className={`w-1.5 h-1.5 rounded-full ${appt.status === 'Đã xong' ? 'bg-gray-400 dark:bg-rose-300/50' : 'bg-rose-500 dark:bg-rose-400'}`} />
                    ))}
                  </div>

                  {/* Desktop detailed view */}
                  <div className="hidden md:block space-y-1 overflow-y-auto max-h-[100px] scrollbar-hide">
                    {dayAppts.map(appt => {
                      const customer = getCustomerDetails(appt.customerId);
                      return (
                        <div key={appt.id} className={`text-xs p-1.5 rounded border ${appt.status === 'Đã xong' ? 'bg-gray-100 dark:bg-[#181a1b] border-gray-200 dark:border-[#4a2b2d] text-gray-500 dark:text-rose-300/70' : 'bg-rose-50 dark:bg-rose-500/20 border-rose-100 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'}`}>
                          <div className="font-semibold">{appt.time} - {appt.type}</div>
                          <div className="truncate font-medium">{appt.customerName}</div>
                          {customer && (
                            <div className="text-[10px] mt-0.5 space-y-0.5 opacity-80">
                              <div className="flex items-center"><Phone className="w-2 h-2 mr-1"/>{customer.phone}</div>
                              {customer.services && customer.services.length > 0 && <div className="truncate">DV KH: {customer.services.join(', ')}</div>}
                              {appt.serviceName && <div className="truncate font-bold">DV Hẹn: {appt.serviceName}</div>}
                              {customer.startDate && <div>BĐ: {format(new Date(customer.startDate), 'dd/MM')}</div>}
                              {customer.appointments && customer.appointments[0] && <div>Hẹn 1: {format(new Date(customer.appointments[0]), 'dd/MM')}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
              {services.length > 0 && (
                <div className="space-y-2">
                  <Label>Dịch vụ cụ thể cho buổi hẹn</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                    value={newAppt.serviceName}
                    onChange={e => setNewAppt({...newAppt, serviceName: e.target.value})}
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input value={newAppt.notes} onChange={e => setNewAppt({...newAppt, notes: e.target.value})} placeholder="VD: Nhắc khách nhịn ăn sáng..." />
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end space-x-2 shrink-0">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Hủy</Button>
              <Button 
                onClick={handleAddAppt} 
                className="bg-rose-600 hover:bg-rose-700 text-white" 
                disabled={!newAppt.customerId || !newAppt.date || !newAppt.time}
              >
                Lưu lịch hẹn
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
