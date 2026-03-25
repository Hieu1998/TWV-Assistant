import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { PenTool, MessageCircleHeart, CalendarDays, Users, CalendarClock, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/src/contexts/SupabaseContext';
import { Customer, Appointment } from '@/src/types';
import { format, subDays, subMonths, subYears, parseISO, eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/src/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { appointments, customers, loading } = useSupabase();
  const [timeRange, setTimeRange] = useState('1y');
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const todaysAppts = useMemo(() => {
    return appointments
      .filter(a => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, todayStr]);

  const pendingAppts = useMemo(() => {
    return todaysAppts.filter(a => a.status === 'Chờ khám');
  }, [todaysAppts]);

  const newLeads = useMemo(() => {
    return customers.filter(c => c.status === 'Tiềm năng');
  }, [customers]);

  const revenueData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let interval: 'day' | 'month' | 'year';

    switch (timeRange) {
      case '1w':
        startDate = subDays(now, 7);
        interval = 'day';
        break;
      case '1m':
        startDate = subMonths(now, 1);
        interval = 'day';
        break;
      case '1y':
        startDate = subYears(now, 1);
        interval = 'month';
        break;
      case '2y':
        startDate = subYears(now, 2);
        interval = 'month';
        break;
      case '5y':
        startDate = subYears(now, 5);
        interval = 'year';
        break;
      case '10y':
        startDate = subYears(now, 10);
        interval = 'year';
        break;
      case 'all':
        const oldest = customers.reduce((acc, c) => {
          const d = c.startDate ? parseISO(c.startDate) : new Date(c.createdAt);
          return d < acc ? d : acc;
        }, now);
        startDate = oldest;
        interval = 'year';
        break;
      default:
        startDate = subYears(now, 1);
        interval = 'month';
    }

    let points: Date[] = [];
    try {
      if (interval === 'day') {
        points = eachDayOfInterval({ start: startDate, end: now });
      } else if (interval === 'month') {
        points = eachMonthOfInterval({ start: startDate, end: now });
      } else {
        points = eachYearOfInterval({ start: startDate, end: now });
      }
    } catch (e) {
      points = [now];
    }

    return points.map(date => {
      const label = interval === 'day' ? format(date, 'dd/MM') : 
                    interval === 'month' ? format(date, 'MM/yy') : 
                    format(date, 'yyyy');
      
      const total = customers.reduce((acc, c) => {
        if (c.status !== 'Hậu phẫu' || !c.totalCost) return acc;
        const cDate = c.startDate ? parseISO(c.startDate) : new Date(c.createdAt);
        
        let match = false;
        if (interval === 'day') {
          match = format(cDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        } else if (interval === 'month') {
          match = format(cDate, 'yyyy-MM') === format(date, 'yyyy-MM');
        } else {
          match = format(cDate, 'yyyy') === format(date, 'yyyy');
        }

        if (match) {
          const cost = parseInt(c.totalCost.replace(/\D/g, '')) || 0;
          return acc + cost;
        }
        return acc;
      }, 0);

      return { name: label, value: total };
    });
  }, [customers, timeRange]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chào buổi sáng, Trợ lý! 🌸</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2">Hôm nay bạn có <strong className="text-rose-600 dark:text-rose-400">{pendingAppts.length} lịch hẹn</strong> cần xử lý và <strong className="text-rose-600 dark:text-rose-400">{newLeads.length} khách hàng tiềm năng</strong> cần tư vấn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow border-rose-100 dark:border-zinc-800 cursor-pointer" onClick={() => navigate('/appointments')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-400 text-lg">
              <CalendarClock className="w-5 h-5 mr-2" />
              Lịch hẹn hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{todaysAppts.length}</div>
            <CardDescription className="mt-1">
              {pendingAppts.length} chờ khám • {todaysAppts.length - pendingAppts.length} đã xong/hủy
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-rose-100 dark:border-zinc-800 cursor-pointer" onClick={() => navigate('/customers')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-400 text-lg">
              <Users className="w-5 h-5 mr-2" />
              Khách hàng mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{newLeads.length}</div>
            <CardDescription className="mt-1">
              Đang ở trạng thái Tiềm năng
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-rose-100 dark:border-zinc-800 cursor-pointer" onClick={() => navigate('/post-generator')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-400 text-lg">
              <PenTool className="w-5 h-5 mr-2" />
              Viết bài Marketing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Tạo bài đăng Facebook hấp dẫn về dịch vụ, khuyến mãi chỉ trong vài giây.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-rose-100 dark:border-zinc-800 cursor-pointer" onClick={() => navigate('/consultation')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-400 text-lg">
              <MessageCircleHeart className="w-5 h-5 mr-2" />
              Tư vấn Khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Tạo kịch bản trả lời tin nhắn, xử lý từ chối về giá, sợ đau...
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="border-rose-100 dark:border-zinc-800">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-400">
              <TrendingUp className="w-5 h-5 mr-2" />
              Biểu đồ doanh thu
            </CardTitle>
            <CardDescription>Doanh thu từ khách hàng đã thực hiện dịch vụ (Hậu phẫu)</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { id: '1w', label: '1 tuần' },
              { id: '1m', label: '1 tháng' },
              { id: '1y', label: '1 năm' },
              { id: '2y', label: '2 năm' },
              { id: '5y', label: '5 năm' },
              { id: '10y', label: '10 năm' },
              { id: 'all', label: 'Tất cả' }
            ].map(range => (
              <Button 
                key={range.id}
                variant={timeRange === range.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.id)}
                className={`text-[10px] sm:text-xs px-2 h-7 sm:h-8 ${timeRange === range.id ? 'bg-rose-600 hover:bg-rose-700 text-white border-transparent' : 'text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800'}`}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(0)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#e11d48" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  strokeWidth={2}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Lịch hẹn hôm nay ({format(new Date(), 'dd/MM')})</CardTitle>
              <CardDescription>Danh sách khách hàng sắp đến</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/appointments')}>Xem tất cả</Button>
          </CardHeader>
          <CardContent>
            {todaysAppts.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-zinc-400">Không có lịch hẹn nào hôm nay.</div>
            ) : (
              <div className="space-y-4 mt-4">
                {todaysAppts.slice(0, 5).map(appt => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/30 rounded-lg border border-gray-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${appt.status === 'Đã xong' ? 'bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{appt.time} - {appt.customerName}</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">{appt.type}</div>
                      </div>
                    </div>
                    {appt.status === 'Chờ khám' ? (
                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">Chờ khám</span>
                    ) : appt.status === 'Đã xong' ? (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Đã xong</span>
                    ) : (
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">Đã hủy</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mẹo chốt sale nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold mr-3 shrink-0">1</span>
                <span className="text-sm text-gray-700 dark:text-zinc-300"><strong>Đồng cảm trước, giải thích sau:</strong> Khi khách chê đắt, hãy đồng cảm "Dạ em hiểu băn khoăn của chị...", sau đó mới phân tích giá trị.</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold mr-3 shrink-0">2</span>
                <span className="text-sm text-gray-700 dark:text-zinc-300"><strong>Gửi hình ảnh feedback thực tế:</strong> Hình ảnh khách hàng có tình trạng tương tự trước và sau khi làm là vũ khí tốt nhất.</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold mr-3 shrink-0">3</span>
                <span className="text-sm text-gray-700 dark:text-zinc-300"><strong>Tạo sự khan hiếm:</strong> "Chương trình ưu đãi chỉ còn 2 suất cho khách đặt cọc hôm nay..."</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

