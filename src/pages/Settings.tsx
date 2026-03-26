import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle2, RefreshCw, Database, LogOut, ListPlus } from 'lucide-react';
import { useSupabase } from '@/src/contexts/SupabaseContext';
import { Customer, Appointment } from '@/src/types';
import { getSupabaseConfig, setSupabaseConfig, refreshSupabaseClient } from '@/src/lib/supabase';
import { DEFAULT_SERVICES } from '@/src/lib/defaultData';
import { generateUUID } from '@/src/lib/utils';
import { ConfirmModal } from '@/src/components/ConfirmModal';

export default function Settings() {
  const { 
    customers, 
    appointments, 
    services, 
    sources, 
    bulkImport, 
    clearAllData, 
    setConfigured 
  } = useSupabase();
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'none', message: string }>({ type: 'none', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const config = getSupabaseConfig();
  const [url, setUrl] = useState(config.url || '');
  const [key, setKey] = useState(config.key || '');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const handleUpdateConfig = () => {
    if (!url || !key) return;
    setSupabaseConfig(url, key);
    refreshSupabaseClient();
    window.location.reload();
  };

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi Supabase? Cấu hình URL và Key sẽ bị xóa khỏi trình duyệt.',
      isDestructive: true,
      onConfirm: () => {
        localStorage.removeItem('supabase_url');
        localStorage.removeItem('supabase_key');
        setConfigured(false);
        closeConfirmModal();
      }
    });
  };

  const handleExport = () => {
    const data = {
      customers,
      appointments,
      services,
      sources,
      exportDate: new Date().toISOString(),
      version: '1.1'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm_supabase_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = event.target;
    const file = inputElement.files?.[0];
    if (!file || isProcessing) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        await bulkImport({
          services: data.services,
          sources: data.sources,
          customers: data.customers,
          appointments: data.appointments
        });

        setImportStatus({ type: 'success', message: 'Dữ liệu đã được nhập thành công vào Supabase!' });
        setTimeout(() => setImportStatus({ type: 'none', message: '' }), 3000);
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Lỗi khi nhập dữ liệu. Vui lòng kiểm tra lại file.' });
        setTimeout(() => setImportStatus({ type: 'none', message: '' }), 3000);
      } finally {
        setIsProcessing(false);
        // Reset input
        if (inputElement) inputElement.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDefaultServices = async () => {
    if (isProcessing) return;
    setConfirmModal({
      isOpen: true,
      title: 'Tải dịch vụ mẫu',
      message: 'Bạn có muốn tải danh mục dịch vụ mẫu vào hệ thống? Các dịch vụ hiện tại sẽ không bị ảnh hưởng.',
      onConfirm: async () => {
        closeConfirmModal();
        setIsProcessing(true);
        try {
          // Fetch latest services directly from DB to ensure we have the most up-to-date state
          // in case the user deleted data directly in the database without refreshing the page.
          const { supabase } = await import('@/src/lib/supabase');
          let currentServices = services;
          if (supabase) {
            const { data } = await supabase.from('services').select('name');
            if (data) {
              currentServices = data as any;
            }
          }
          
          const existingNames = new Set(currentServices.map(s => s.name));
          const servicesToImport = DEFAULT_SERVICES
            .filter(name => !existingNames.has(name))
            .map(name => ({
              id: generateUUID(),
              name
            }));
          
          if (servicesToImport.length > 0) {
            await bulkImport({ services: servicesToImport });
            setImportStatus({ type: 'success', message: `Đã tải ${servicesToImport.length} dịch vụ mẫu thành công!` });
          } else {
            setImportStatus({ type: 'success', message: 'Tất cả dịch vụ mẫu đã có sẵn trong hệ thống.' });
          }
        } catch (error) {
          console.error('Error loading default services:', error);
          setImportStatus({ type: 'error', message: 'Lỗi khi tải dịch vụ mẫu.' });
        } finally {
          setIsProcessing(false);
        }
        setTimeout(() => setImportStatus({ type: 'none', message: '' }), 3000);
      }
    });
  };

  const handleClearData = async () => {
    if (isProcessing) return;
    setConfirmModal({
      isOpen: true,
      title: 'Xóa toàn bộ dữ liệu',
      message: 'BẠN CÓ CHẮC CHẮN MUỐN XOÁ TẤT CẢ DỮ LIỆU TRÊN SUPABASE? Hành động này không thể hoàn tác.',
      isDestructive: true,
      onConfirm: async () => {
        closeConfirmModal();
        setIsProcessing(true);
        try {
          await clearAllData();
          setImportStatus({ type: 'success', message: 'Tất cả dữ liệu đã được xoá trên Supabase.' });
        } catch (error) {
          setImportStatus({ type: 'error', message: 'Lỗi khi xoá dữ liệu.' });
        } finally {
          setIsProcessing(false);
        }
        setTimeout(() => setImportStatus({ type: 'none', message: '' }), 3000);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cài đặt & Hệ thống ⚙️</h1>
        <p className="text-gray-500 dark:text-rose-200 mt-2">Quản lý dữ liệu, sao lưu và khôi phục hệ thống.</p>
      </div>

      {importStatus.type !== 'none' && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          importStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <p className="font-medium">{importStatus.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-rose-100 dark:border-[#4a2b2d] bg-white dark:bg-[#181a1b] md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Database className="w-5 h-5" />
              Cấu hình Supabase
            </CardTitle>
            <CardDescription>Quản lý kết nối tới cơ sở dữ liệu Supabase của bạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">Supabase URL</Label>
                <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Supabase Anon Key</Label>
                <Input id="key" type="password" value={key} onChange={(e) => setKey(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateConfig} className="bg-rose-600 hover:bg-rose-700 text-white">
                Cập nhật cấu hình
              </Button>
              <Button onClick={handleLogout} variant="outline" className="text-red-600 border-red-200">
                <LogOut className="w-4 h-4 mr-2" /> Đăng xuất Supabase
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-100 dark:border-[#4a2b2d] bg-white dark:bg-[#181a1b]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <ListPlus className="w-5 h-5" />
              Dữ liệu mẫu
            </CardTitle>
            <CardDescription>Tải danh mục dịch vụ mẫu đã được phân loại sẵn.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-rose-300 mb-6">
              Hệ thống sẽ thêm danh sách các dịch vụ phẫu thuật thẩm mỹ phổ biến (Ngực, Mũi, Mắt...) vào danh mục của bạn.
            </p>
            <Button onClick={handleLoadDefaultServices} className="w-full bg-rose-600 hover:bg-rose-700 text-white" loading={isProcessing}>
              <ListPlus className="w-4 h-4 mr-2" /> Tải dịch vụ mẫu
            </Button>
          </CardContent>
        </Card>

        <Card className="border-rose-100 dark:border-[#4a2b2d] bg-white dark:bg-[#181a1b]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Download className="w-5 h-5" />
              Sao lưu dữ liệu
            </CardTitle>
            <CardDescription>Xuất toàn bộ dữ liệu khách hàng và lịch hẹn ra file JSON để lưu trữ.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-rose-300 mb-6">
              Chúng tôi khuyên bạn nên sao lưu dữ liệu định kỳ (hàng tuần hoặc hàng tháng) để tránh mất mát dữ liệu khi trình duyệt bị xoá cache.
            </p>
            <Button onClick={handleExport} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
              <Download className="w-4 h-4 mr-2" /> Tải về bản sao lưu (.json)
            </Button>
          </CardContent>
        </Card>

        <Card className="border-rose-100 dark:border-[#4a2b2d] bg-white dark:bg-[#181a1b]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Upload className="w-5 h-5" />
              Khôi phục dữ liệu
            </CardTitle>
            <CardDescription>Nhập lại dữ liệu từ file sao lưu đã tải về trước đó.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-rose-300 mb-6">
              Chọn file backup (.json) để khôi phục lại toàn bộ dữ liệu. Lưu ý: Dữ liệu hiện tại sẽ bị ghi đè.
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={isProcessing}
              />
              <Button 
                variant="outline" 
                className="w-full border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300"
                loading={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" /> Chọn file để khôi phục
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Trash2 className="w-5 h-5" />
            Vùng nguy hiểm
          </CardTitle>
          <CardDescription className="text-red-600/70 dark:text-red-400/70">Xoá toàn bộ dữ liệu trên hệ thống này.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-sm text-red-800 dark:text-red-300 max-w-xl">
            Hành động này sẽ xoá sạch danh sách khách hàng và tất cả lịch hẹn đang lưu trên trình duyệt này. Hãy chắc chắn bạn đã có bản sao lưu trước khi thực hiện.
          </p>
          <Button onClick={handleClearData} variant="destructive" className="shrink-0" loading={isProcessing}>
            <Trash2 className="w-4 h-4 mr-2" /> Xoá sạch dữ liệu
          </Button>
        </CardContent>
      </Card>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
          <RefreshCw className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-100">Mẹo nhỏ: Đồng bộ thiết bị</h4>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
            Bạn có thể dùng tính năng Xuất/Nhập này để chuyển dữ liệu từ máy tính sang điện thoại hoặc ngược lại một cách dễ dàng mà không cần internet.
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        isDestructive={confirmModal.isDestructive}
      />
    </div>
  );
}
