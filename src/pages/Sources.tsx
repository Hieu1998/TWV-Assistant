import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Plus, Search, Edit2, Trash2, Share2 } from 'lucide-react';
import { useSupabase } from '@/src/contexts/SupabaseContext';
import { CustomerSource } from '@/src/types';

export default function Sources() {
  const { sources, upsertSource, deleteSource } = useSupabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<CustomerSource | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceName, setSourceName] = useState('');

  const handleOpenModal = (source?: CustomerSource) => {
    if (source) {
      setEditingSource(source);
      setSourceName(source.name);
    } else {
      setEditingSource(null);
      setSourceName('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) return;

    const sourceData: CustomerSource = {
      id: editingSource ? editingSource.id : crypto.randomUUID(),
      name: sourceName.trim(),
    };

    await upsertSource(sourceData);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setSourceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (sourceToDelete) {
      await deleteSource(sourceToDelete);
      setSourceToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const filteredSources = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return sources.filter(s => 
      s.name.toLowerCase().includes(lowerSearch)
    );
  }, [sources, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nguồn Khách hàng</h1>
          <p className="text-gray-500 dark:text-zinc-400">Quản lý các kênh mang lại khách hàng cho bạn</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-rose-600 hover:bg-rose-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm nguồn mới
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Tìm kiếm nguồn..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSources.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Chưa có nguồn khách hàng nào.</p>
          </div>
        ) : (
          filteredSources.map(source => (
            <Card key={source.id} className="hover:shadow-sm transition-shadow border-rose-100 dark:border-zinc-800">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{source.name}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-rose-600" onClick={() => handleOpenModal(source)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDelete(source.id)}>
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
              <CardTitle>{editingSource ? 'Chỉnh sửa nguồn' : 'Thêm nguồn mới'}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên nguồn *</Label>
                  <Input 
                    id="name" 
                    required 
                    autoFocus
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="Ví dụ: Facebook, TikTok, Người quen..."
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
              <CardDescription>Bạn có chắc chắn muốn xóa nguồn khách hàng này? Hành động này không thể hoàn tác.</CardDescription>
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
