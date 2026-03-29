import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { PenTool, MessageCircleHeart, CalendarDays, Users, CalendarClock, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/src/contexts/SupabaseContext';
import { Customer, Appointment } from '@/src/types';
import { format, subDays, subMonths, subYears, parseISO, eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval, addDays, differenceInDays, startOfDay } from 'date-fns';
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

  const upcomingAppts = useMemo(() => {
    const next7Days = addDays(new Date(), 7);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointments
      .filter(a => {
        const apptDate = parseISO(a.date);
        return apptDate > today && apptDate <= next7Days && a.status === 'Chờ khám';
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [appointments]);

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
        if ((c.status !== 'Hậu phẫu' && c.status !== 'Bảo hành') || !c.totalCost) return acc;
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
      <div className="bg-white dark:bg-[#181a1b] p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-[#4a2b2d] shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          Chào buổi sáng, Trợ lý! <span className="text-xl sm:text-2xl animate-bounce">🌸</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-rose-200/70 mt-2 max-w-2xl">
          Hôm nay bạn có <strong className="text-rose-600 dark:text-rose-400 font-black">{pendingAppts.length} lịch hẹn</strong> cần xử lý và <strong className="text-rose-600 dark:text-rose-400 font-black">{newLeads.length} khách hàng tiềm năng</strong> cần tư vấn. Chúc bạn một ngày làm việc hiệu quả!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-rose-100 dark:border-[#4a2b2d] cursor-pointer bg-white dark:bg-[#281718] group overflow-hidden" onClick={() => navigate('/appointments')}>
          <CardHeader className="pb-2 relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CalendarClock className="w-12 h-12 text-rose-600" />
            </div>
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-300 text-sm font-bold uppercase tracking-widest">
              <CalendarClock className="w-4 h-4 mr-2" />
              Lịch hẹn hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900 dark:text-white">{todaysAppts.length}</div>
            <CardDescription className="mt-2 flex items-center gap-2 font-medium">
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full text-[10px]">
                {pendingAppts.length} chờ khám
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 dark:text-rose-300/50 text-[10px]">
                {todaysAppts.length - pendingAppts.length} đã xong/hủy
              </span>
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-rose-100 dark:border-[#4a2b2d] cursor-pointer bg-white dark:bg-[#281718] group overflow-hidden" onClick={() => navigate('/customers')}>
          <CardHeader className="pb-2 relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-12 h-12 text-rose-600" />
            </div>
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-300 text-sm font-bold uppercase tracking-widest">
              <Users className="w-4 h-4 mr-2" />
              Khách hàng mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-gray-900 dark:text-white">{newLeads.length}</div>
            <CardDescription className="mt-2 font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full text-[10px] inline-block">
              Đang ở trạng thái Tiềm năng
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-rose-100 dark:border-[#4a2b2d] cursor-pointer bg-white dark:bg-[#281718] group overflow-hidden" onClick={() => navigate('/post-generator')}>
          <CardHeader className="pb-2 relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <PenTool className="w-12 h-12 text-rose-600" />
            </div>
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-300 text-sm font-bold uppercase tracking-widest">
              <PenTool className="w-4 h-4 mr-2" />
              Viết bài Marketing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs leading-relaxed font-medium text-gray-600 dark:text-rose-200/70">
              Tạo bài đăng Facebook hấp dẫn về dịch vụ, khuyến mãi chỉ trong vài giây với AI.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-rose-100 dark:border-[#4a2b2d] cursor-pointer bg-white dark:bg-[#281718] group overflow-hidden" onClick={() => navigate('/consultation')}>
          <CardHeader className="pb-2 relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MessageCircleHeart className="w-12 h-12 text-rose-600" />
            </div>
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-300 text-sm font-bold uppercase tracking-widest">
              <MessageCircleHeart className="w-4 h-4 mr-2" />
              Tư vấn Khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs leading-relaxed font-medium text-gray-600 dark:text-rose-200/70">
              Tạo kịch bản trả lời tin nhắn, xử lý từ chối về giá, sợ đau... chuyên nghiệp.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="border-rose-100 dark:border-[#4a2b2d] shadow-sm overflow-hidden bg-white dark:bg-[#281718]">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-zinc-900/50 border-b dark:border-[#4a2b2d] pb-4">
          <div>
            <CardTitle className="flex items-center text-rose-700 dark:text-rose-300 text-lg font-bold">
              <TrendingUp className="w-5 h-5 mr-2" />
              Biểu đồ doanh thu
            </CardTitle>
            <CardDescription className="text-xs font-medium">Doanh thu từ khách hàng đã thực hiện dịch vụ (Hậu phẫu, Bảo hành)</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5 bg-white dark:bg-[#181a1b] p-1 rounded-xl border border-gray-200 dark:border-[#4a2b2d]">
            {[
              { id: '1w', label: '1 tuần' },
              { id: '1m', label: '1 tháng' },
              { id: '1y', label: '1 năm' },
              { id: 'all', label: 'Tất cả' }
            ].map(range => (
              <Button 
                key={range.id}
                variant={timeRange === range.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range.id)}
                className={`text-[10px] font-bold px-3 h-8 rounded-lg transition-all ${timeRange === range.id ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm' : 'text-gray-500 dark:text-rose-300/50 hover:bg-rose-50 dark:hover:bg-rose-900/20'}`}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-8 px-2 sm:px-6 min-h-[350px]">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                  tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(0)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(225, 29, 72, 0.1)', 
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#e11d48" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  strokeWidth={3}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card className="border-rose-100 dark:border-[#4a2b2d] shadow-sm bg-white dark:bg-[#281718] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gray-50/50 dark:bg-zinc-900/50 border-b dark:border-[#4a2b2d]">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-600" />
                Lịch hẹn hôm nay
              </CardTitle>
              <CardDescription className="text-xs font-medium">{format(new Date(), 'dd/MM/yyyy')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/appointments')} className="h-8 text-xs font-bold rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-900/20">Xem tất cả</Button>
          </CardHeader>
          <CardContent className="p-4">
            {todaysAppts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-rose-300/30 font-medium italic">Không có lịch hẹn nào hôm nay.</div>
            ) : (
              <div className="space-y-3">
                {todaysAppts.slice(0, 5).map(appt => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#181a1b] rounded-xl border border-gray-100 dark:border-[#4a2b2d] shadow-sm group hover:border-rose-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-full ${appt.status === 'Đã xong' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{appt.time} - {appt.customerName}</div>
                        <div className="text-[10px] font-bold text-gray-400 dark:text-rose-300/50 uppercase tracking-widest">{appt.type}</div>
                      </div>
                    </div>
                    {appt.status === 'Chờ khám' ? (
                      <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/30 uppercase tracking-tighter">Chờ khám</span>
                    ) : appt.status === 'Đã xong' ? (
                      <span className="text-[10px] font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-900/30 flex items-center uppercase tracking-tighter"><CheckCircle className="w-3 h-3 mr-1"/> Đã xong</span>
                    ) : (
                      <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full border border-red-100 dark:border-red-900/30 uppercase tracking-tighter">Đã hủy</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-rose-100 dark:border-[#4a2b2d] shadow-sm bg-white dark:bg-[#281718] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gray-50/50 dark:bg-zinc-900/50 border-b dark:border-[#4a2b2d]">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Lịch hẹn sắp tới
              </CardTitle>
              <CardDescription className="text-xs font-medium">Nhắc lịch hẹn trong 7 ngày tới</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {upcomingAppts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-rose-300/30 font-medium italic">Không có lịch hẹn nào trong 7 ngày tới.</div>
            ) : (
              <div className="space-y-3">
                {upcomingAppts.slice(0, 5).map(appt => {
                  const daysLeft = differenceInDays(startOfDay(parseISO(appt.date)), startOfDay(new Date()));
                  return (
                    <div key={appt.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#181a1b] rounded-xl border border-gray-100 dark:border-[#4a2b2d] shadow-sm group hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-sm">{appt.customerName}</div>
                          <div className="text-[10px] font-bold text-gray-400 dark:text-rose-300/50 uppercase tracking-widest">{format(parseISO(appt.date), 'dd/MM')} - {appt.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/30 uppercase tracking-tighter">
                          Còn {daysLeft} ngày
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

