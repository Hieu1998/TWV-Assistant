import React, { useMemo } from 'react';
import { useLocalStorage } from '@/src/lib/useLocalStorage';
import { Customer } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { FileDown, DollarSign, Users, Calendar, Copy, Check, BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/src/lib/utils';

export default function Reports() {
  const [customers] = useLocalStorage<Customer[]>('crm_customers', []);
  const [copiedMonth, setCopiedMonth] = React.useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);

  const monthlyReports = useMemo(() => {
    const reports: { [key: string]: { customers: Customer[], total: number } } = {};
    
    customers.forEach(customer => {
      if (customer.status === 'Hậu phẫu') {
        const date = customer.startDate ? parseISO(customer.startDate) : new Date(customer.createdAt);
        const monthKey = format(date, 'MM/yyyy');
        
        if (!reports[monthKey]) {
          reports[monthKey] = { customers: [], total: 0 };
        }
        
        reports[monthKey].customers.push(customer);
        const cost = parseInt(customer.totalCost?.replace(/\D/g, '') || '0', 10);
        reports[monthKey].total += cost;
      }
    });

    // Sort by month descending
    return Object.entries(reports).sort((a, b) => {
      const [mA, yA] = a[0].split('/').map(Number);
      const [mB, yB] = b[0].split('/').map(Number);
      return yB !== yA ? yB - yA : mB - mA;
    });
  }, [customers]);

  const overallStats = useMemo(() => {
    let totalRevenue = 0;
    let totalCustomers = 0;
    monthlyReports.forEach(([_, data]) => {
      totalRevenue += data.total;
      totalCustomers += data.customers.length;
    });
    return {
      totalRevenue,
      totalCustomers,
      avgRevenue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    };
  }, [monthlyReports]);

  const exportToCSV = (month: string, data: Customer[], total: number) => {
    const headers = ['Tên khách hàng', 'Số điện thoại', 'Dịch vụ', 'Nguồn', 'Chi phí'];
    const rows = data.map(c => [
      c.name,
      c.phone,
      (c.services || []).join(', '),
      c.source || '',
      c.totalCost || '0'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
      '',
      `"Tổng cộng",,,,"${new Intl.NumberFormat('vi-VN').format(total)} đ"`
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_hau_phau_${month.replace('/', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (month: string, data: Customer[], total: number) => {
    const headers = ['Tên khách hàng', 'Số điện thoại', 'Dịch vụ', 'Nguồn', 'Chi phí'];
    const rows = data.map(c => [
      c.name,
      c.phone,
      (c.services || []).join(', '),
      c.source || '',
      c.totalCost || '0'
    ]);
    
    const textContent = [
      headers.join('\t'),
      ...rows.map(r => r.join('\t')),
      '',
      `Tổng cộng\t\t\t${new Intl.NumberFormat('vi-VN').format(total)} đ`
    ].join('\n');

    navigator.clipboard.writeText(textContent);
    setCopiedMonth(month);
    setTimeout(() => setCopiedMonth(null), 2000);
  };

  const selectedMonthData = selectedMonth ? monthlyReports.find(([m]) => m === selectedMonth) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Báo cáo Doanh thu & Hậu phẫu 📊</h1>
          <p className="text-gray-500 dark:text-rose-200 mt-2">Tổng hợp danh sách khách đã phẫu thuật và doanh thu theo từng tháng.</p>
        </div>
      </div>

      {/* Overall Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="bg-rose-600 text-white border-none shadow-lg">
          <CardContent className="p-4 lg:p-6 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <div>
              <p className="text-rose-100 text-xs lg:text-sm font-medium">Tổng doanh thu</p>
              <h3 className="text-lg lg:text-2xl font-bold">{new Intl.NumberFormat('vi-VN').format(overallStats.totalRevenue)} đ</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#181a1b] border-rose-100 dark:border-[#4a2b2d] shadow-sm">
          <CardContent className="p-4 lg:p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
              <Users className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-rose-300 text-xs lg:text-sm font-medium">Tổng khách hậu phẫu</p>
              <h3 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">{overallStats.totalCustomers} khách</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#181a1b] border-rose-100 dark:border-[#4a2b2d] shadow-sm sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 lg:p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
              <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-rose-300 text-xs lg:text-sm font-medium">Doanh thu TB / Khách</p>
              <h3 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('vi-VN').format(Math.round(overallStats.avgRevenue))} đ</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {monthlyReports.length === 0 ? (
        <Card className="p-12 text-center text-gray-500 dark:text-rose-300/50">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Chưa có dữ liệu khách hàng hậu phẫu để tổng hợp.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Monthly Summary Table */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-rose-100 dark:border-[#4a2b2d] overflow-hidden">
              <CardHeader className="bg-rose-50/50 dark:bg-[#181a1b] border-b border-rose-100 dark:border-[#4a2b2d]">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-600" />
                  Danh sách các tháng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-rose-100 dark:border-[#4a2b2d]">
                      <TableHead className="text-rose-900 dark:text-rose-200 font-bold">Tháng</TableHead>
                      <TableHead className="text-rose-900 dark:text-rose-200 font-bold text-right">Khách</TableHead>
                      <TableHead className="text-rose-900 dark:text-rose-200 font-bold text-right">Doanh thu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReports.map(([month, data]) => (
                      <TableRow 
                        key={month} 
                        className={cn(
                          "cursor-pointer transition-colors border-rose-50 dark:border-[#281718]",
                          selectedMonth === month 
                            ? "bg-rose-100/50 dark:bg-rose-500/20 hover:bg-rose-100/70 dark:hover:bg-rose-500/30" 
                            : "hover:bg-rose-50/30 dark:hover:bg-[#3a2224]"
                        )}
                        onClick={() => setSelectedMonth(month)}
                      >
                        <TableCell className="font-medium dark:text-white">{month}</TableCell>
                        <TableCell className="text-right text-gray-600 dark:text-rose-300/70">{data.customers.length}</TableCell>
                        <TableCell className="text-right font-semibold text-rose-600 dark:text-rose-400">
                          {new Intl.NumberFormat('vi-VN').format(data.total)} đ
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Details Section */}
          <div className="lg:col-span-7">
            {selectedMonthData ? (
              <Card className="border-rose-100 dark:border-[#4a2b2d] overflow-hidden lg:sticky lg:top-8">
                <CardHeader className="bg-rose-50/50 dark:bg-[#181a1b] border-b border-rose-100 dark:border-[#4a2b2d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg lg:text-xl text-rose-900 dark:text-rose-100">Chi tiết Tháng {selectedMonth}</CardTitle>
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-rose-300/70">{selectedMonthData[1].customers.length} khách hàng đã phẫu thuật</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 sm:flex-none border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                      onClick={() => copyToClipboard(selectedMonth!, selectedMonthData[1].customers, selectedMonthData[1].total)}
                    >
                      {copiedMonth === selectedMonth ? <Check className="w-4 h-4 mr-1 lg:mr-2" /> : <Copy className="w-4 h-4 mr-1 lg:mr-2" />}
                      {copiedMonth === selectedMonth ? 'Đã copy' : 'Copy'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 sm:flex-none border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                      onClick={() => exportToCSV(selectedMonth!, selectedMonthData[1].customers, selectedMonthData[1].total)}
                    >
                      <FileDown className="w-4 h-4 mr-1 lg:mr-2" /> CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] lg:max-h-[60vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white dark:bg-[#181a1b] z-10">
                        <TableRow className="hover:bg-transparent border-rose-100 dark:border-[#4a2b2d]">
                          <TableHead className="text-rose-900 dark:text-rose-200 font-bold text-xs lg:text-sm">Khách hàng</TableHead>
                          <TableHead className="text-rose-900 dark:text-rose-200 font-bold text-xs lg:text-sm">Dịch vụ</TableHead>
                          <TableHead className="text-rose-900 dark:text-rose-200 font-bold text-xs lg:text-sm">Nguồn</TableHead>
                          <TableHead className="text-rose-900 dark:text-rose-200 font-bold text-right text-xs lg:text-sm">Chi phí</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedMonthData[1].customers.map((c) => (
                          <TableRow key={c.id} className="border-rose-50 dark:border-[#281718] hover:bg-rose-50/30 dark:hover:bg-[#3a2224]">
                            <TableCell className="py-2 lg:py-4">
                              <div className="font-medium dark:text-white text-xs lg:text-sm">{c.name}</div>
                              <div className="text-[10px] lg:text-xs text-gray-500 dark:text-rose-300/70">{c.phone}</div>
                            </TableCell>
                            <TableCell className="py-2 lg:py-4">
                              <div className="flex flex-wrap gap-1">
                                {c.services && c.services.length > 0 ? (
                                  c.services.map((s, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] lg:text-xs">
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] lg:text-xs text-gray-400">N/A</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 lg:py-4">
                              <span className="text-xs text-gray-600 dark:text-rose-200">{c.source || 'N/A'}</span>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-rose-600 dark:text-rose-400 py-2 lg:py-4 text-xs lg:text-sm">
                              {c.totalCost || '0 đ'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-4 bg-rose-50/30 dark:bg-[#181a1b] border-t border-rose-100 dark:border-[#4a2b2d] flex justify-between items-center font-bold">
                    <span className="text-rose-900 dark:text-rose-100 text-sm lg:text-base">Tổng doanh thu:</span>
                    <span className="text-lg lg:text-xl text-rose-700 dark:text-rose-400">
                      {new Intl.NumberFormat('vi-VN').format(selectedMonthData[1].total)} đ
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 lg:p-12 border-2 border-dashed border-rose-100 dark:border-[#4a2b2d] rounded-xl text-gray-400 dark:text-rose-300/50">
                <Calendar className="w-10 h-10 lg:w-12 lg:h-12 mb-4 opacity-20" />
                <p className="text-center text-sm lg:text-base">Chọn một tháng từ danh sách bên trái để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
