import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Plus, Search, Edit2, Trash2, Scissors } from 'lucide-react';
import { useSupabase } from '@/src/contexts/SupabaseContext';
import { Service } from '@/src/types';

export default function Services() {
  const { services, upsertService, deleteService } = useSupabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceName, setServiceName] = useState('');

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.name);
    } else {
      setEditingService(null);
      setServiceName('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    const serviceData: Service = {
      id: editingService ? editingService.id : crypto.randomUUID(),
      name: serviceName.trim(),
    };

    await upsertService(serviceData);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setServiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      await deleteService(serviceToDelete);
      setServiceToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const filteredServices = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return services.filter(s => 
      s.name.toLowerCase().includes(lowerSearch)
    );
  }, [services, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh mục Dịch vụ</h1>
          <p className="text-gray-500 dark:text-zinc-400">Quản lý danh sách các dịch vụ tại thẩm mỹ viện</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-rose-600 hover:bg-rose-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm dịch vụ
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Tìm kiếm dịch vụ..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800">
            <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Chưa có dịch vụ nào.</p>
          </div>
        ) : (
          filteredServices.map(service => (
            <Card key={service.id} className="hover:shadow-sm transition-shadow border-rose-100 dark:border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-rose-600" onClick={() => handleOpenModal(service)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle>{editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên dịch vụ *</Label>
                  <Input 
                    id="name" 
                    required 
                    autoFocus
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Ví dụ: Nâng mũi, Cắt mí..."
                  />
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Lưu</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Xác nhận xóa</CardTitle>
              <CardDescription>Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Hủy</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Xác nhận xóa</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
