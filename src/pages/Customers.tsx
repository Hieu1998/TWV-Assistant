import React, { useState, useMemo } from 'react';
import { useSupabase } from '@/src/contexts/SupabaseContext';
import { Customer, Appointment, Service, CustomerSource } from '@/src/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Plus, Search, Phone, CheckCircle, CalendarClock, Edit, Calendar as CalendarIcon, DollarSign, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { formatCurrency, generateUUID, cn } from '@/src/lib/utils';

export default function Customers() {
  const { 
    customers, 
    appointments, 
    services, 
    sources, 
    upsertCustomer, 
    deleteCustomer, 
    upsertAppointment 
  } = useSupabase();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', services: [] as string[], status: 'Tiềm năng' as const, notes: '', source: '', deposit: '', commissionRate: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [confirmScheduleModal, setConfirmScheduleModal] = useState<{isOpen: boolean, customer: Customer | null}>({isOpen: false, customer: null});
  const [autoScheduleDates, setAutoScheduleDates] = useState({ day1: format(addDays(new Date(), 1), 'yyyy-MM-dd') });

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

  const monthlyRevenue = useMemo(() => {
    const revenueByMonth: { [key: string]: number } = {};
    customers.forEach(c => {
      if ((c.status === 'Hậu phẫu' || c.status === 'Bảo hành') && c.totalCost) {
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
  }, [customers]);

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone || isSaving) return;
    setIsSaving(true);
    try {
      const customer: Customer = {
        id: generateUUID(),
        ...newCustomer,
        createdAt: new Date().toISOString(),
        appointments: []
      };
      await upsertCustomer(customer);
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', services: [], status: 'Tiềm năng', notes: '', source: '', deposit: '', commissionRate: '' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer || isSaving) return;
    setIsSaving(true);
    try {
      const oldCustomer = customers.find(c => c.id === editingCustomer.id);
      const statusChangedToHauPhauOrBaoHanh = 
        (oldCustomer?.status !== 'Hậu phẫu' && editingCustomer.status === 'Hậu phẫu') ||
        (oldCustomer?.status !== 'Bảo hành' && editingCustomer.status === 'Bảo hành');

      await upsertCustomer(editingCustomer);
      setEditingCustomer(null);

      if (statusChangedToHauPhauOrBaoHanh) {
        const today = new Date();
        setAutoScheduleDates({
          day1: format(addDays(today, 1), 'yyyy-MM-dd')
        });
        setConfirmScheduleModal({ isOpen: true, customer: editingCustomer });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (customerToDelete && !isSaving) {
      setIsSaving(true);
      try {
        await deleteCustomer(customerToDelete.id);
        setCustomerToDelete(null);
        setIsDeleteModalOpen(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: Customer['status']) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    if (newStatus === 'Hậu phẫu' && customer.status !== 'Đã chốt') {
      return;
    }
    if (newStatus === 'Bảo hành' && customer.status !== 'Hậu phẫu') {
      return;
    }

    const updatedCustomer = { ...customer, status: newStatus };
    await upsertCustomer(updatedCustomer);

    if ((newStatus === 'Hậu phẫu' && customer.status !== 'Hậu phẫu') || (newStatus === 'Bảo hành' && customer.status !== 'Bảo hành')) {
      const today = new Date();
      setAutoScheduleDates({
        day1: format(addDays(today, 1), 'yyyy-MM-dd')
      });
      setConfirmScheduleModal({ isOpen: true, customer });
    }
  };

  const confirmAutoSchedule = async () => {
    if (!confirmScheduleModal.customer || isSaving) return;
    const customer = confirmScheduleModal.customer;
    setIsSaving(true);
    try {
      const appt1: Appointment = { id: generateUUID(), customerId: customer.id, customerName: customer.name, date: autoScheduleDates.day1, time: '09:00', type: 'Tái khám', status: 'Chờ khám', notes: 'Tái khám ngày 1 (Hút dịch/Kiểm tra)' };
      
      await upsertAppointment(appt1);
      
      setConfirmScheduleModal({ isOpen: false, customer: null });
    } finally {
      setIsSaving(false);
    }
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

  const handleNewDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const oldDigits = (newCustomer.deposit || '').replace(/\D/g, '');
    let newDigits = e.target.value.replace(/\D/g, '');
    
    if (e.target.value.length < (newCustomer.deposit || '').length && oldDigits === newDigits) {
       newDigits = newDigits.slice(0, -1);
    }

    const formatted = newDigits ? formatCurrency(newDigits) : '';
    setNewCustomer({...newCustomer, deposit: formatted});
  };

  const handleEditDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingCustomer) return;
    const oldDigits = (editingCustomer.deposit || '').replace(/\D/g, '');
    let newDigits = e.target.value.replace(/\D/g, '');
    
    if (e.target.value.length < (editingCustomer.deposit || '').length && oldDigits === newDigits) {
       newDigits = newDigits.slice(0, -1);
    }

    const formatted = newDigits ? formatCurrency(newDigits) : '';
    setEditingCustomer({...editingCustomer, deposit: formatted});
  };

  const calculateCommission = (costStr?: string, rateStr?: string) => {
    if (!costStr || !rateStr) return '0 VNĐ';
    const cost = parseInt(costStr.replace(/\D/g, ''), 10) || 0;
    const rate = parseFloat(rateStr) || 0;
    const commission = (cost * rate) / 100;
    return formatCurrency(commission.toString()) + ' VNĐ';
  };

  const filteredCustomers = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(lowerSearch) || 
      c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const customersByStatus = useMemo(() => {
    const grouped: { [key in Customer['status']]: Customer[] } = {
      'Tiềm năng': [],
      'Đang tư vấn': [],
      'Đã chốt': [],
      'Hậu phẫu': [],
      'Bảo hành': []
    };
    filteredCustomers.forEach(c => {
      grouped[c.status].push(c);
    });
    return grouped;
  }, [filteredCustomers]);

  const allStatuses: Customer['status'][] = ['Tiềm năng', 'Đang tư vấn', 'Đã chốt', 'Hậu phẫu', 'Bảo hành'];
  const creationStatuses: Customer['status'][] = ['Tiềm năng', 'Đang tư vấn', 'Đã chốt', 'Bảo hành'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#181a1b] p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-[#4a2b2d] shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Quản lý Khách hàng <span className="text-xl sm:text-2xl">👥</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-rose-200/70 mt-1">Theo dõi và chăm sóc khách hàng theo từng giai đoạn.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white h-11 px-6 rounded-xl shadow-md shadow-rose-200 dark:shadow-none transition-all active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Thêm khách hàng
        </Button>
      </div>

      {monthlyRevenue.length > 0 && (
        <Card className="bg-rose-50/30 dark:bg-[#181a1b] border-rose-100 dark:border-[#4a2b2d] shadow-sm overflow-hidden">
          <CardHeader className="pb-3 bg-rose-50/50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/20">
            <CardTitle className="text-sm font-bold flex items-center text-rose-800 dark:text-rose-300 uppercase tracking-widest">
              <DollarSign className="w-4 h-4 mr-2" /> Doanh thu theo tháng (Hậu phẫu, Bảo hành)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {monthlyRevenue.map(([month, amount]) => (
                <div key={month} className="p-3 rounded-xl bg-white dark:bg-[#281718] border border-rose-100 dark:border-[#4a2b2d] shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-[10px] font-bold text-gray-400 dark:text-rose-300/50 uppercase tracking-tighter">{month}</div>
                  <div className="text-sm font-black text-rose-600 dark:text-rose-400 mt-1">
                    {formatCurrency(amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center space-x-2 bg-white dark:bg-[#181a1b] p-1.5 rounded-xl border border-gray-200 dark:border-[#4a2b2d] w-full max-w-md shadow-sm focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
          <Search className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <input 
          type="text" 
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..." 
          className="flex-1 outline-none text-sm p-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-rose-300/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 xl:grid-cols-5 scrollbar-hide scroll-smooth overscroll-x-contain">
        {allStatuses.map(status => (
          <div key={status} className="bg-gray-50/50 dark:bg-[#181a1b] rounded-2xl p-4 border border-gray-100 dark:border-[#4a2b2d] min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center shrink-0 flex flex-col h-full scroll-mt-4">
            <h3 className="font-bold text-gray-800 dark:text-rose-100 mb-4 flex items-center justify-between px-1">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  status === 'Tiềm năng' ? 'bg-blue-500' : 
                  status === 'Đang tư vấn' ? 'bg-orange-500' : 
                  status === 'Đã chốt' ? 'bg-green-500' : 
                  status === 'Hậu phẫu' ? 'bg-purple-500' : 'bg-rose-500'
                }`} />
                {status}
              </span>
              <span className="bg-white dark:bg-[#281718] text-[10px] font-black py-1 px-2.5 rounded-full border border-gray-200 dark:border-[#4a2b2d] text-gray-500 dark:text-rose-300/70 shadow-sm">
                {customersByStatus[status].length}
              </span>
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-hide">
              {customersByStatus[status].map(customer => (
                <Card key={customer.id} className="shadow-sm border-rose-100/50 dark:border-[#4a2b2d] hover:border-rose-400 dark:hover:border-rose-500 transition-all cursor-pointer bg-white dark:bg-[#281718] group overflow-hidden" onClick={() => setEditingCustomer(customer)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-bold text-gray-900 dark:text-white text-base group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{customer.name}</div>
                      <div className="flex gap-1 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 dark:text-rose-300/50 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 dark:text-rose-300/50 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-rose-300/70 flex items-center mt-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-rose-400" /> {customer.phone}
                    </div>
                    {customer.deposit && (
                      <div className="text-[11px] text-gray-600 dark:text-rose-300/70 mt-1.5 flex items-center gap-1 font-medium">
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-rose-300/30" />
                        Đã cọc: <span className="font-bold text-green-600 dark:text-green-400">{customer.deposit}</span>
                      </div>
                    )}
                    {customer.notes && (
                      <div className="text-[11px] text-gray-600 dark:text-rose-300/70 mt-1.5 flex items-start gap-1 font-medium">
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-rose-300/30 mt-1.5" />
                        <span className="flex-1 line-clamp-2">Ghi chú: {customer.notes}</span>
                      </div>
                    )}
                    {customer.source && (
                      <div className="text-[10px] text-gray-400 dark:text-rose-300/40 mt-1.5 flex items-center gap-1 uppercase tracking-wider font-bold">
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-rose-300/30" />
                        Nguồn: {customer.source}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1.5 mt-3">
                      {customer.services && customer.services.length > 0 ? (
                        customer.services.map((s, i) => (
                          <span key={i} className="text-[10px] text-rose-600 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-100/50 dark:border-rose-500/20 break-words w-full block">
                            {s.replace(/^\[.*?\]\s*/, '')}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-300 dark:text-rose-300/20 italic">Chưa chọn dịch vụ</span>
                      )}
                    </div>
                    
                    {(customer.startDate || customer.totalCost) && (
                      <div className="mt-4 pt-3 border-t border-gray-50 dark:border-[#4a2b2d] grid grid-cols-1 gap-2">
                        {customer.startDate && (
                          <div className="text-[11px] text-gray-600 dark:text-rose-300/70 flex items-center font-medium">
                            <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-rose-400" /> Bắt đầu: {format(new Date(customer.startDate), 'dd/MM/yyyy')}
                          </div>
                        )}
                        {customer.totalCost && (
                          <>
                            <div className="text-[11px] text-green-600 dark:text-green-400 flex items-center font-black bg-green-50 dark:bg-green-900/20 p-1.5 rounded-lg border border-green-100 dark:border-green-900/30">
                              <DollarSign className="w-3.5 h-3.5 mr-1" /> {customer.totalCost}
                            </div>
                            {customer.commissionRate && (
                              <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center font-black bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                <DollarSign className="w-3.5 h-3.5 mr-1" /> HH: {calculateCommission(customer.totalCost, customer.commissionRate)} ({customer.commissionRate}%)
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-gray-50 dark:border-[#4a2b2d] flex items-center justify-between" onClick={e => e.stopPropagation()}>
                      {status !== 'Bảo hành' ? (
                        <div className="relative w-full">
                          <select 
                            className="w-full text-[11px] font-bold border border-gray-200 dark:border-[#4a2b2d] rounded-xl p-2 bg-gray-50 dark:bg-[#181a1b] outline-none text-gray-700 dark:text-rose-200 appearance-none cursor-pointer hover:bg-white dark:hover:bg-[#281718] transition-colors"
                            value={customer.status}
                            onChange={(e) => handleStatusChange(customer.id, e.target.value as any)}
                          >
                            {allStatuses.map(s => (
                              <option 
                                key={s} 
                                value={s} 
                                disabled={s === 'Hậu phẫu' && customer.status !== 'Đã chốt'}
                              >
                                Chuyển: {s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      ) : (
                        <span className="text-[11px] text-green-600 dark:text-green-400 flex items-center font-black bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-900/30 w-full justify-center">
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> ĐANG CHĂM SÓC
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {customersByStatus[status].length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-[#4a2b2d] rounded-2xl">
                  <p className="text-xs text-gray-400 dark:text-rose-300/30 font-medium">Trống</p>
                </div>
              )}
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
                <Label>Đã cọc</Label>
                <Input value={newCustomer.deposit || ''} onChange={handleNewDepositChange} placeholder="VD: 5.000.000 VNĐ" />
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                  value={newCustomer.notes || ''} 
                  onChange={e => setNewCustomer({...newCustomer, notes: e.target.value})} 
                  placeholder="Nhập ghi chú khách hàng..."
                />
              </div>
              <div className="space-y-2">
                <Label>Dịch vụ quan tâm</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto p-3 border rounded-md dark:bg-[#181a1b] dark:border-[#4a2b2d]">
                  {Object.entries(groupedServices).map(([category, items]: [string, any[]]) => {
                    const isExpanded = expandedCategories.includes(category);
                    const selectedCount = items.filter(item => newCustomer.services.includes(item.original)).length;
                    return (
                      <div key={category} className="border border-gray-100 dark:border-[#4a2b2d] rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-[#281718] hover:bg-gray-100 dark:hover:bg-[#3a2224] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                            <h5 className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">{category}</h5>
                          </div>
                          {selectedCount > 0 && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">
                              {selectedCount} đã chọn
                            </span>
                          )}
                        </button>
                        {isExpanded && (
                                  <div className="p-2 bg-white dark:bg-[#181a1b] flex flex-wrap gap-2">
                            {items.map(item => {
                              const isSelected = newCustomer.services.includes(item.original);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    const next = isSelected 
                                      ? newCustomer.services.filter(name => name !== item.original)
                                      : [...newCustomer.services, item.original];
                                    setNewCustomer({...newCustomer, services: next});
                                  }}
                                  className={`text-xs px-2 py-1 rounded-full border transition-colors break-words text-left max-w-full ${
                                    isSelected 
                                      ? 'bg-rose-600 text-white border-rose-600' 
                                      : 'bg-white dark:bg-[#281718] text-gray-600 dark:text-rose-200 border-gray-200 dark:border-[#4a2b2d] hover:border-rose-300'
                                  }`}
                                >
                                  {item.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
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
                  {creationStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={isSaving} className="w-full sm:w-auto">Hủy</Button>
              <Button 
                onClick={handleAddCustomer} 
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white"
                disabled={!newCustomer.name.trim() || !newCustomer.phone.trim()}
                loading={isSaving}
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
                <Label>Đã cọc</Label>
                <Input value={editingCustomer.deposit || ''} onChange={handleEditDepositChange} placeholder="VD: 5.000.000 VNĐ" />
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                  value={editingCustomer.notes || ''} 
                  onChange={e => setEditingCustomer({...editingCustomer, notes: e.target.value})} 
                  placeholder="Nhập ghi chú khách hàng..."
                />
              </div>
              <div className="space-y-2">
                <Label>Dịch vụ</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto p-3 border rounded-md dark:bg-[#181a1b] dark:border-[#4a2b2d]">
                  {Object.entries(groupedServices).map(([category, items]: [string, any[]]) => {
                    const isExpanded = expandedCategories.includes(category);
                    const selectedCount = items.filter(item => editingCustomer.services?.includes(item.original)).length;
                    return (
                      <div key={category} className="border border-gray-100 dark:border-[#4a2b2d] rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-[#281718] hover:bg-gray-100 dark:hover:bg-[#3a2224] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                            <h5 className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">{category}</h5>
                          </div>
                          {selectedCount > 0 && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">
                              {selectedCount} đã chọn
                            </span>
                          )}
                        </button>
                        {isExpanded && (
                          <div className="p-2 bg-white dark:bg-[#181a1b] flex flex-wrap gap-2">
                            {items.map(item => {
                              const isSelected = editingCustomer.services?.includes(item.original);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    const currentServices = editingCustomer.services || [];
                                    const next = isSelected 
                                      ? currentServices.filter(name => name !== item.original)
                                      : [...currentServices, item.original];
                                    setEditingCustomer({...editingCustomer, services: next});
                                  }}
                                  className={`text-xs px-2 py-1 rounded-full border transition-colors break-words text-left max-w-full ${
                                    isSelected 
                                      ? 'bg-rose-600 text-white border-rose-600' 
                                      : 'bg-white dark:bg-[#281718] text-gray-600 dark:text-rose-200 border-gray-200 dark:border-[#4a2b2d] hover:border-rose-300'
                                  }`}
                                >
                                  {item.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
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
                  {allStatuses.map(s => (
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

                  {(editingCustomer.status === 'Đang tư vấn' || editingCustomer.status === 'Đã chốt' || editingCustomer.status === 'Hậu phẫu' || editingCustomer.status === 'Bảo hành') && (
                    <>
                      <div className="space-y-2">
                        <Label>Chi phí chốt dịch vụ</Label>
                        <Input placeholder="VD: 15.000.000 VNĐ" value={editingCustomer.totalCost || ''} onChange={handleCostChange} />
                      </div>
                      <div className="space-y-2">
                        <Label>Hoa hồng ước tính (%)</Label>
                        <div className="flex items-center gap-3">
                          <Input 
                            type="number" 
                            placeholder="VD: 2" 
                            value={editingCustomer.commissionRate || ''} 
                            onChange={e => setEditingCustomer({...editingCustomer, commissionRate: e.target.value})} 
                            className="w-24"
                          />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md border border-green-100 dark:border-green-900/30">
                            = {calculateCommission(editingCustomer.totalCost, editingCustomer.commissionRate)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={() => setEditingCustomer(null)} disabled={isSaving} className="w-full sm:w-auto">Hủy</Button>
              <Button 
                variant="outline"
                className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                disabled={isSaving}
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
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white"
                disabled={!editingCustomer.name.trim() || !editingCustomer.phone.trim()}
                loading={isSaving}
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
                Khách hàng <strong className="text-gray-900 dark:text-white">{confirmScheduleModal.customer.name}</strong> vừa chuyển sang giai đoạn {confirmScheduleModal.customer.status}. 
                Vui lòng xác nhận hoặc điều chỉnh các ngày hẹn:
              </p>
              <div className="space-y-3 bg-gray-50 dark:bg-[#181a1b] p-4 rounded-lg border border-gray-100 dark:border-[#4a2b2d]">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-rose-600">Ngày 1: Hút dịch / Kiểm tra</Label>
                  <Input type="date" value={autoScheduleDates.day1} onChange={e => setAutoScheduleDates({...autoScheduleDates, day1: e.target.value})} />
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={() => setConfirmScheduleModal({ isOpen: false, customer: null })} disabled={isSaving} className="w-full sm:w-auto">Bỏ qua</Button>
              <Button onClick={confirmAutoSchedule} className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white" loading={isSaving}>Tạo lịch ngay</Button>
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
            <div className="p-6 pt-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving} className="w-full sm:w-auto">Hủy</Button>
              <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white" onClick={confirmDeleteCustomer} loading={isSaving}>Xác nhận xóa</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
