import React, { useState } from 'react';
import { useLocalStorage } from '@/src/lib/useLocalStorage';
import { Customer, Appointment, Service, CustomerSource } from '@/src/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Plus, Search, Phone, CheckCircle, CalendarClock, Edit, Calendar as CalendarIcon, DollarSign, Trash2 } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { formatCurrency } from '@/src/lib/utils';

export default function Customers() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('crm_customers', []);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('crm_appointments', []);
  const [services] = useLocalStorage<Service[]>('crm_services', []);
  const [sources] = useLocalStorage<CustomerSource[]>('crm_sources', [
    { id: '1', name: 'Facebook' },
    { id: '2', name: 'TikTok' },
    { id: '3', name: 'KH giới thiệu' },
    { id: '4', name: 'Zalo' },
    { id: '5', name: 'CTV' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', services: [] as string[], status: 'Tiềm năng' as const, notes: '', source: '' });
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [confirmScheduleModal, setConfirmScheduleModal] = useState<{isOpen: boolean, customer: Customer | null}>({isOpen: false, customer: null});
  const [autoScheduleDates, setAutoScheduleDates] = useState({ day1: format(addDays(new Date(), 1), 'yyyy-MM-dd'), day7: format(addDays(new Date(), 7), 'yyyy-MM-dd'), month1: format(addDays(new Date(), 30), 'yyyy-MM-dd') });

  const getMonthlyRevenue = () => {
    const revenueByMonth: { [key: string]: number } = {};
    customers.forEach(c => {
      if (c.status === 'Hậu phẫu' && c.totalCost) {
        const date = c.startDate ? new Date(c.startDate) : new Date(c.createdAt);
        const monthYear = format(date, 'MM/yyyy');
        const amount = parseInt(c.totalCost.replace(/\D/g, ''), 10) || 0;
        revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + amount;
      }
    });
    return Object.entries(revenueByMonth).sort((a, b) => {
      const [mA, yA] = a[0].split('/').map(Number);
      const [mB, yB] = b[0].split('/').map(Number);
      return yB !== yA ? yB - yA : mB - mA;
    });
  };

  const monthlyRevenue = getMonthlyRevenue();

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    const customer: Customer = {
      id: Date.now().toString(),
      ...newCustomer,
      createdAt: new Date().toISOString(),
      appointments: []
    };
    setCustomers([customer, ...customers]);
    setShowAddModal(false);
    setNewCustomer({ name: '', phone: '', services: [], status: 'Tiềm năng', notes: '', source: '' });
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer) return;
    
    // Check if status changed to 'Hậu phẫu'
    const oldCustomer = customers.find(c => c.id === editingCustomer.id);
    const statusChangedToHauPhau = oldCustomer?.status !== 'Hậu phẫu' && editingCustomer.status === 'Hậu phẫu';

    setCustomers(customers.map(c => c.id === editingCustomer.id ? editingCustomer : c));
    setEditingCustomer(null);

    if (statusChangedToHauPhau) {
      setConfirmScheduleModal({ isOpen: true, customer: editingCustomer });
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      // Also clean up appointments for this customer
      setAppointments(appointments.filter(a => a.customerId !== customerToDelete.id));
      setCustomerToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: Customer['status']) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    // Only allow moving to 'Hậu phẫu' if current status is 'Đã chốt'
    if (newStatus === 'Hậu phẫu' && customer.status !== 'Đã chốt') {
      return;
    }

    const updated = customers.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setCustomers(updated);

    if (newStatus === 'Hậu phẫu' && customer.status !== 'Hậu phẫu') {
      const today = new Date();
      setAutoScheduleDates({
        day1: format(addDays(today, 1), 'yyyy-MM-dd'),
        day7: format(addDays(today, 7), 'yyyy-MM-dd'),
        month1: format(addDays(today, 30), 'yyyy-MM-dd')
      });
      setConfirmScheduleModal({ isOpen: true, customer });
    }
  };

  const confirmAutoSchedule = () => {
    if (!confirmScheduleModal.customer) return;
    const customer = confirmScheduleModal.customer;
    const newAppts: Appointment[] = [
      { id: Date.now() + '1', customerId: customer.id, customerName: customer.name, date: autoScheduleDates.day1, time: '09:00', type: 'Tái khám', status: 'Chờ khám', notes: 'Tái khám ngày 1 (Hút dịch/Kiểm tra)' },
      { id: Date.now() + '7', customerId: customer.id, customerName: customer.name, date: autoScheduleDates.day7, time: '09:00', type: 'Cắt chỉ', status: 'Chờ khám', notes: 'Cắt chỉ ngày 7' },
      { id: Date.now() + '30', customerId: customer.id, customerName: customer.name, date: autoScheduleDates.month1, time: '09:00', type: 'Tái khám', status: 'Chờ khám', notes: 'Tái khám 1 tháng' },
    ];
    setAppointments([...appointments, ...newAppts]);
    setConfirmScheduleModal({ isOpen: false, customer: null });
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingCustomer) return;
    
    const oldDigits = (editingCustomer.totalCost || '').replace(/\D/g, '');
    let newDigits = e.target.value.replace(/\D/g, '');
    
    if (e.target.value.length < (editingCustomer.totalCost || '').length && oldDigits === newDigits) {
       newDigits = newDigits.slice(0, -1);
    }

    if (!newDigits) {
      setEditingCustomer({...editingCustomer, totalCost: ''});
      return;
    }
    const formatted = formatCurrency(newDigits);
    setEditingCustomer({...editingCustomer, totalCost: formatted});
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

  const statuses: Customer['status'][] = ['Tiềm năng', 'Đang tư vấn', 'Đã chốt', 'Hậu phẫu'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý Khách hàng 👥</h1>
          <p className="text-gray-500 dark:text-rose-200 mt-2">Theo dõi và chăm sóc khách hàng theo từng giai đoạn.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm khách hàng
        </Button>
      </div>

      {monthlyRevenue.length > 0 && (
        <Card className="bg-rose-50/50 dark:bg-[#181a1b] border-rose-100 dark:border-[#4a2b2d]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-rose-800 dark:text-rose-300">
              <DollarSign className="w-5 h-5 mr-2" /> Doanh thu theo tháng (Hậu phẫu)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {monthlyRevenue.map(([month, amount]) => (
                <div key={month} className="p-3 rounded-lg bg-white dark:bg-[#281718] border border-rose-100 dark:border-[#4a2b2d]">
                  <div className="text-xs text-gray-500 dark:text-rose-300/70">{month}</div>
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center space-x-2 bg-white dark:bg-[#181a1b] p-2 rounded-lg border border-gray-200 dark:border-[#4a2b2d] w-full max-w-md">
        <Search className="w-5 h-5 text-gray-400 dark:text-rose-300/50 ml-2" />
        <input 
          type="text" 
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..." 
          className="flex-1 outline-none text-sm p-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-rose-300/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 xl:grid-cols-4">
        {statuses.map(status => (
          <div key={status} className="bg-gray-50/50 dark:bg-[#181a1b] rounded-xl p-4 border border-gray-100 dark:border-[#4a2b2d] min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0">
            <h3 className="font-semibold text-gray-700 dark:text-rose-200 mb-4 flex items-center justify-between">
              {status}
              <span className="bg-white dark:bg-[#181a1b] text-xs py-1 px-2 rounded-full border border-gray-200 dark:border-[#4a2b2d] text-gray-700 dark:text-rose-300">
                {filteredCustomers.filter(c => c.status === status).length}
              </span>
            </h3>
            <div className="space-y-3 dark:bg-[#181a1b] rounded-lg">
              {filteredCustomers.filter(c => c.status === status).map(customer => (
                <Card key={customer.id} className="shadow-sm border-rose-100/50 dark:border-[#4a2b2d] hover:border-rose-300 dark:hover:border-rose-500/50 transition-colors cursor-pointer bg-white dark:bg-[#281718]" onClick={() => setEditingCustomer(customer)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 dark:text-rose-300/50 hover:text-rose-600 dark:hover:text-rose-400" onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 dark:text-rose-300/50 hover:text-red-600 dark:hover:text-red-400" onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-rose-300/70 flex items-center mt-1">
                      <Phone className="w-3 h-3 mr-1" /> {customer.phone}
                    </div>
                    {customer.source && (
                      <div className="text-xs text-gray-400 dark:text-rose-300/50 mt-1 italic">
                        Nguồn: {customer.source}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {customer.services && customer.services.length > 0 ? (
                        customer.services.map((s, i) => (
                          <span key={i} className="text-[10px] text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-500/20 px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Chưa chọn dịch vụ</span>
                      )}
                    </div>
                    
                    {(customer.startDate || customer.totalCost) && (
                      <div className="mt-2 space-y-1">
                        {customer.startDate && (
                          <div className="text-xs text-gray-600 dark:text-rose-300/70 flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1" /> Bắt đầu: {format(new Date(customer.startDate), 'dd/MM/yyyy')}
                          </div>
                        )}
                        {customer.totalCost && (
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center font-medium">
                            <DollarSign className="w-3 h-3 mr-1" /> {customer.totalCost}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#4a2b2d] flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                      {status !== 'Hậu phẫu' && (
                        <select 
                          className="text-xs border border-gray-200 dark:border-[#4a2b2d] rounded p-1 bg-white dark:bg-[#181a1b] outline-none text-gray-700 dark:text-white"
                          value={customer.status}
                          onChange={(e) => handleStatusChange(customer.id, e.target.value as any)}
                        >
                          {statuses.map(s => (
                            <option 
                              key={s} 
                              value={s} 
                              disabled={s === 'Hậu phẫu' && customer.status !== 'Đã chốt'}
                            >
                              Chuyển: {s}
                            </option>
                          ))}
                        </select>
                      )}
                      {status === 'Hậu phẫu' && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center font-medium">
                          <CheckCircle className="w-3 h-3 mr-1" /> Đang chăm sóc
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md my-8 max-h-[90vh] flex flex-col">
            <CardHeader className="shrink-0">
              <CardTitle>Thêm khách hàng mới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label>Tên khách hàng <span className="text-rose-600">*</span></Label>
                <Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Nhập tên khách hàng" />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại <span className="text-rose-600">*</span></Label>
                <Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="Nhập số điện thoại" />
              </div>
              <div className="space-y-2">
                <Label>Dịch vụ quan tâm</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md dark:bg-[#181a1b] dark:border-[#4a2b2d]">
                  {services.map(s => {
                    const isSelected = newCustomer.services.includes(s.name);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const next = isSelected 
                            ? newCustomer.services.filter(name => name !== s.name)
                            : [...newCustomer.services, s.name];
                          setNewCustomer({...newCustomer, services: next});
                        }}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          isSelected 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white dark:bg-[#281718] text-gray-600 dark:text-rose-200 border-gray-200 dark:border-[#4a2b2d] hover:border-rose-300'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                  {services.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có danh mục dịch vụ</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nguồn khách hàng</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md dark:bg-[#181a1b] dark:border-[#4a2b2d]">
                  {sources.map(s => {
                    const isSelected = newCustomer.source === s.name;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setNewCustomer({...newCustomer, source: isSelected ? '' : s.name})}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          isSelected 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white dark:bg-[#281718] text-gray-600 dark:text-rose-200 border-gray-200 dark:border-[#4a2b2d] hover:border-rose-300'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                  {sources.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có danh mục nguồn</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                  value={newCustomer.status}
                  onChange={e => setNewCustomer({...newCustomer, status: e.target.value as any})}
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end space-x-2 shrink-0">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Hủy</Button>
              <Button 
                onClick={handleAddCustomer} 
                className="bg-rose-600 hover:bg-rose-700 text-white"
                disabled={!newCustomer.name.trim() || !newCustomer.phone.trim()}
              >
                Lưu khách hàng
              </Button>
            </div>
          </Card>
        </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md my-8 max-h-[90vh] flex flex-col">
            <CardHeader className="shrink-0">
              <CardTitle>Chi tiết khách hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label>Tên khách hàng</Label>
                <Input value={editingCustomer.name} onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input value={editingCustomer.phone} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Dịch vụ</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md dark:bg-[#181a1b] dark:border-[#4a2b2d]">
                  {services.map(s => {
                    const isSelected = editingCustomer.services?.includes(s.name);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const currentServices = editingCustomer.services || [];
                          const next = isSelected 
                            ? currentServices.filter(name => name !== s.name)
                            : [...currentServices, s.name];
                          setEditingCustomer({...editingCustomer, services: next});
                        }}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          isSelected 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white dark:bg-[#281718] text-gray-600 dark:text-rose-200 border-gray-200 dark:border-[#4a2b2d] hover:border-rose-300'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                  {services.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có danh mục dịch vụ</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nguồn khách hàng</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md dark:bg-[#181a1b] dark:border-[#4a2b2d]">
                  {sources.map(s => {
                    const isSelected = editingCustomer.source === s.name;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setEditingCustomer({...editingCustomer, source: isSelected ? '' : s.name})}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          isSelected 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white dark:bg-[#281718] text-gray-600 dark:text-rose-200 border-gray-200 dark:border-[#4a2b2d] hover:border-rose-300'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                  {sources.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có danh mục nguồn</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                  value={editingCustomer.status}
                  onChange={e => setEditingCustomer({...editingCustomer, status: e.target.value as any})}
                >
                  {statuses.map(s => (
                    <option 
                      key={s} 
                      value={s} 
                      disabled={s === 'Hậu phẫu' && editingCustomer.status !== 'Đã chốt'}
                    >
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-[#4a2b2d]">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-3">Thông tin dịch vụ</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ngày bắt đầu làm</Label>
                    <Input type="date" value={editingCustomer.startDate || ''} onChange={e => setEditingCustomer({...editingCustomer, startDate: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex justify-between items-center">
                      Các ngày hẹn
                      <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-rose-600" onClick={() => {
                        const newAppts = [...(editingCustomer.appointments || []), ''];
                        setEditingCustomer({...editingCustomer, appointments: newAppts});
                      }}>
                        <Plus className="w-3 h-3 mr-1" /> Thêm
                      </Button>
                    </Label>
                    {(editingCustomer.appointments || []).map((apptDate, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input 
                          type="date" 
                          value={apptDate} 
                          onChange={e => {
                            const newAppts = [...(editingCustomer.appointments || [])];
                            newAppts[idx] = e.target.value;
                            setEditingCustomer({...editingCustomer, appointments: newAppts});
                          }} 
                        />
                        <Button type="button" variant="outline" className="px-2 text-red-500" onClick={() => {
                          const newAppts = [...(editingCustomer.appointments || [])];
                          newAppts.splice(idx, 1);
                          setEditingCustomer({...editingCustomer, appointments: newAppts});
                        }}>Xóa</Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Ngày ra viện</Label>
                    <Input type="date" value={editingCustomer.dischargeDate || ''} onChange={e => setEditingCustomer({...editingCustomer, dischargeDate: e.target.value})} />
                  </div>

                  {(editingCustomer.status === 'Đã chốt' || editingCustomer.status === 'Hậu phẫu') && (
                    <div className="space-y-2">
                      <Label>Chi phí chốt dịch vụ</Label>
                      <Input placeholder="VD: 15.000.000 VNĐ" value={editingCustomer.totalCost || ''} onChange={handleCostChange} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end space-x-2 shrink-0">
              <Button variant="outline" onClick={() => setEditingCustomer(null)}>Hủy</Button>
              <Button 
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  const customer = editingCustomer;
                  setEditingCustomer(null);
                  handleDeleteCustomer(customer);
                }}
              >
                Xóa khách hàng
              </Button>
              <Button 
                onClick={handleUpdateCustomer} 
                className="bg-rose-600 hover:bg-rose-700 text-white"
                disabled={!editingCustomer.name.trim() || !editingCustomer.phone.trim()}
              >
                Lưu thay đổi
              </Button>
            </div>
          </Card>
        </div>
      )}

      {confirmScheduleModal.isOpen && confirmScheduleModal.customer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md my-8 max-h-[90vh] flex flex-col">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center text-rose-700">
                <CalendarClock className="w-5 h-5 mr-2 shrink-0" />
                Tạo lịch tái khám tự động
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto space-y-4">
              <p className="text-gray-600 dark:text-rose-200 text-sm">
                Khách hàng <strong className="text-gray-900 dark:text-white">{confirmScheduleModal.customer.name}</strong> vừa chuyển sang giai đoạn Hậu phẫu. 
                Vui lòng xác nhận hoặc điều chỉnh các ngày tái khám:
              </p>
              <div className="space-y-3 bg-gray-50 dark:bg-[#181a1b] p-4 rounded-lg border border-gray-100 dark:border-[#4a2b2d]">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-rose-600">Ngày 1: Hút dịch / Kiểm tra</Label>
                  <Input type="date" value={autoScheduleDates.day1} onChange={e => setAutoScheduleDates({...autoScheduleDates, day1: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-rose-600">Ngày 7: Cắt chỉ</Label>
                  <Input type="date" value={autoScheduleDates.day7} onChange={e => setAutoScheduleDates({...autoScheduleDates, day7: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-rose-600">1 Tháng: Tái khám định kỳ</Label>
                  <Input type="date" value={autoScheduleDates.month1} onChange={e => setAutoScheduleDates({...autoScheduleDates, month1: e.target.value})} />
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end space-x-2 shrink-0">
              <Button variant="outline" onClick={() => setConfirmScheduleModal({ isOpen: false, customer: null })}>Bỏ qua</Button>
              <Button onClick={confirmAutoSchedule} className="bg-rose-600 hover:bg-rose-700 text-white">Tạo lịch ngay</Button>
            </div>
          </Card>
        </div>
      )}

      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Xác nhận xóa khách hàng</CardTitle>
              <CardDescription>
                Bạn có chắc chắn muốn xóa khách hàng <strong className="text-rose-600">{customerToDelete.name}</strong>? 
                Mọi lịch hẹn liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác.
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Hủy</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeleteCustomer}>Xác nhận xóa</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
