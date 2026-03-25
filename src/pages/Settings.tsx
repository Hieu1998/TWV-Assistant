import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '@/src/lib/useLocalStorage';
import { Customer, Appointment } from '@/src/types';

export default function Settings() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('crm_customers', []);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('crm_appointments', []);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'none', message: string }>({ type: 'none', message: '' });

  const handleExport = () => {
    const data = {
      customers,
      appointments,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.customers && Array.isArray(data.customers)) {
          setCustomers(data.customers);
        }
        if (data.appointments && Array.isArray(data.appointments)) {
          setAppointments(data.appointments);
        }

        setImportStatus({ type: 'success', message: 'Dữ liệu đã được nhập thành công!' });
        setTimeout(() => setImportStatus({ type: 'none', message: '' }), 3000);
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Lỗi khi nhập dữ liệu. Vui lòng kiểm tra lại file.' });
        setTimeout(() => setImportStatus({ type: 'none', message: '' }), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('BẠN CÓ CHẮC CHẮN MUỐN XOÁ TẤT CẢ DỮ LIỆU? Hành động này không thể hoàn tác.')) {
      setCustomers([]);
      setAppointments([]);
      setImportStatus({ type: 'success', message: 'Tất cả dữ liệu đã được xoá.' });
      setTimeout(() => setImportStatus({ type: 'none', message: '' }), 3000);
    }
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
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="w-full border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300">
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
          <Button onClick={handleClearData} variant="destructive" className="shrink-0">
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
    </div>
  );
}
