import React, { useState } from 'react';
import { useLocalStorage } from '@/src/lib/useLocalStorage';
import { Customer, Appointment } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Plus, Search, Phone, CheckCircle, CalendarClock, Edit, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { addDays, format } from 'date-fns';

export default function Customers() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('crm_customers', []);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('crm_appointments', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', service: '', status: 'Tiềm năng' as const, notes: '' });
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [confirmScheduleModal, setConfirmScheduleModal] = useState<{isOpen: boolean, customer: Customer | null}>({isOpen: false, customer: null});

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
    setNewCustomer({ name: '', phone: '', service: '', status: 'Tiềm năng', notes: '' });
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

  const handleStatusChange = (id: string, newStatus: Customer['status']) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    const updated = customers.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setCustomers(updated);

    if (newStatus === 'Hậu phẫu' && customer.status !== 'Hậu phẫu') {
      setConfirmScheduleModal({ isOpen: true, customer });
    }
  };

  const confirmAutoSchedule = () => {
    if (!confirmScheduleModal.customer) return;
    const customer = confirmScheduleModal.customer;
    const today = new Date();
    const newAppts: Appointment[] = [
      { id: Date.now() + '1', customerId: customer.id, customerName: customer.name, date: format(addDays(today, 1), 'yyyy-MM-dd'), time: '09:00', type: 'Tái khám', status: 'Chờ khám', notes: 'Tái khám ngày 1 (Hút dịch/Kiểm tra)' },
      { id: Date.now() + '7', customerId: customer.id, customerName: customer.name, date: format(addDays(today, 7), 'yyyy-MM-dd'), time: '09:00', type: 'Cắt chỉ', status: 'Chờ khám', notes: 'Cắt chỉ ngày 7' },
      { id: Date.now() + '30', customerId: customer.id, customerName: customer.name, date: format(addDays(today, 30), 'yyyy-MM-dd'), time: '09:00', type: 'Tái khám', status: 'Chờ khám', notes: 'Tái khám 1 tháng' },
    ];
    setAppointments([...appointments, ...newAppts]);
    setConfirmScheduleModal({ isOpen: false, customer: null });
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

  const statuses: Customer['status'][] = ['Tiềm năng', 'Đang tư vấn', 'Đã chốt', 'Hậu phẫu'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Quản lý Khách hàng 👥</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">Theo dõi và chăm sóc khách hàng theo từng giai đoạn.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm khách hàng
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-gray-200 dark:border-zinc-800 w-full max-w-md">
        <Search className="w-5 h-5 text-gray-400 dark:text-zinc-500 ml-2" />
        <input 
          type="text" 
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..." 
          className="flex-1 outline-none text-sm p-1 bg-transparent text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 xl:grid-cols-4">
        {statuses.map(status => (
          <div key={status} className="bg-gray-50/50 dark:bg-zinc-900/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0">
            <h3 className="font-semibold text-gray-700 dark:text-zinc-300 mb-4 flex items-center justify-between">
              {status}
              <span className="bg-white dark:bg-zinc-800 text-xs py-1 px-2 rounded-full border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300">
                {filteredCustomers.filter(c => c.status === status).length}
              </span>
            </h3>
            <div className="space-y-3">
              {filteredCustomers.filter(c => c.status === status).map(customer => (
                <Card key={customer.id} className="shadow-sm border-rose-100/50 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-500/50 transition-colors cursor-pointer bg-white dark:bg-zinc-950" onClick={() => setEditingCustomer(customer)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-900 dark:text-zinc-100">{customer.name}</div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400" onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-zinc-400 flex items-center mt-1">
                      <Phone className="w-3 h-3 mr-1" /> {customer.phone}
                    </div>
                    <div className="text-sm text-rose-600 dark:text-rose-400 mt-2 font-medium bg-rose-50 dark:bg-rose-500/10 inline-block px-2 py-0.5 rounded">
                      {customer.service || 'Chưa rõ dịch vụ'}
                    </div>
                    
                    {(customer.startDate || customer.totalCost) && (
                      <div className="mt-2 space-y-1">
                        {customer.startDate && (
                          <div className="text-xs text-gray-600 dark:text-zinc-400 flex items-center">
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
                    
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                      {status !== 'Hậu phẫu' && (
                        <select 
                          className="text-xs border border-gray-200 dark:border-zinc-700 rounded p-1 bg-white dark:bg-zinc-900 outline-none text-gray-700 dark:text-zinc-300"
                          value={customer.status}
                          onChange={(e) => handleStatusChange(customer.id, e.target.value as any)}
                        >
                          {statuses.map(s => <option key={s} value={s}>Chuyển: {s}</option>)}
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
                <Label>Tên khách hàng *</Label>
                <Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại *</Label>
                <Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Dịch vụ quan tâm</Label>
                <Input value={newCustomer.service} placeholder="VD: Nâng mũi, Cắt mí..." onChange={e => setNewCustomer({...newCustomer, service: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newCustomer.status}
                  onChange={e => setNewCustomer({...newCustomer, status: e.target.value as any})}
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end space-x-2 shrink-0">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Hủy</Button>
              <Button onClick={handleAddCustomer} className="bg-rose-600 hover:bg-rose-700 text-white">Lưu khách hàng</Button>
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
                <Input value={editingCustomer.service} onChange={e => setEditingCustomer({...editingCustomer, service: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editingCustomer.status}
                  onChange={e => setEditingCustomer({...editingCustomer, status: e.target.value as any})}
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <h4 className="font-medium text-sm text-gray-900 dark:text-zinc-100 mb-3">Thông tin dịch vụ</h4>
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
                      <Input placeholder="VD: 15.000.000 VNĐ" value={editingCustomer.totalCost || ''} onChange={e => setEditingCustomer({...editingCustomer, totalCost: e.target.value})} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end space-x-2 shrink-0">
              <Button variant="outline" onClick={() => setEditingCustomer(null)}>Hủy</Button>
              <Button onClick={handleUpdateCustomer} className="bg-rose-600 hover:bg-rose-700 text-white">Lưu thay đổi</Button>
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
            <CardContent className="overflow-y-auto">
              <p className="text-gray-600 dark:text-zinc-400 text-sm">
                Khách hàng <strong className="text-gray-900 dark:text-zinc-100">{confirmScheduleModal.customer.name}</strong> vừa chuyển sang giai đoạn Hậu phẫu. 
                Hệ thống sẽ tự động tạo lịch tái khám:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg border border-gray-100 dark:border-zinc-800">
                <li>• <strong>Ngày 1:</strong> Hút dịch / Kiểm tra</li>
                <li>• <strong>Ngày 7:</strong> Cắt chỉ</li>
                <li>• <strong>1 Tháng:</strong> Tái khám định kỳ</li>
              </ul>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end space-x-2 shrink-0">
              <Button variant="outline" onClick={() => setConfirmScheduleModal({ isOpen: false, customer: null })}>Bỏ qua</Button>
              <Button onClick={confirmAutoSchedule} className="bg-rose-600 hover:bg-rose-700 text-white">Tạo lịch ngay</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
