import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { PenTool, MessageCircleHeart, CalendarDays, Users, CalendarClock, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/src/lib/useLocalStorage';
import { Customer, Appointment } from '@/src/types';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [appointments] = useLocalStorage<Appointment[]>('crm_appointments', []);
  const [customers] = useLocalStorage<Customer[]>('crm_customers', []);
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysAppts = appointments.filter(a => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
  const pendingAppts = todaysAppts.filter(a => a.status === 'Chờ khám');
  const newLeads = customers.filter(c => c.status === 'Tiềm năng');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chào buổi sáng, Trợ lý! 🌸</h1>
        <p className="text-gray-500 mt-2">Hôm nay bạn có <strong className="text-rose-600">{pendingAppts.length} lịch hẹn</strong> cần xử lý và <strong className="text-rose-600">{newLeads.length} khách hàng tiềm năng</strong> cần tư vấn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow border-rose-100 cursor-pointer" onClick={() => navigate('/appointments')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-rose-700 text-lg">
              <CalendarClock className="w-5 h-5 mr-2" />
              Lịch hẹn hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{todaysAppts.length}</div>
            <CardDescription className="mt-1">
              {pendingAppts.length} chờ khám • {todaysAppts.length - pendingAppts.length} đã xong/hủy
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-rose-100 cursor-pointer" onClick={() => navigate('/customers')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-rose-700 text-lg">
              <Users className="w-5 h-5 mr-2" />
              Khách hàng mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{newLeads.length}</div>
            <CardDescription className="mt-1">
              Đang ở trạng thái Tiềm năng
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-rose-100 cursor-pointer" onClick={() => navigate('/post-generator')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-rose-700 text-lg">
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

        <Card className="hover:shadow-md transition-shadow border-rose-100 cursor-pointer" onClick={() => navigate('/consultation')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-rose-700 text-lg">
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
              <div className="text-center py-6 text-gray-500">Không có lịch hẹn nào hôm nay.</div>
            ) : (
              <div className="space-y-4 mt-4">
                {todaysAppts.slice(0, 5).map(appt => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${appt.status === 'Đã xong' ? 'bg-gray-200 text-gray-500' : 'bg-rose-100 text-rose-600'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{appt.time} - {appt.customerName}</div>
                        <div className="text-xs text-gray-500">{appt.type}</div>
                      </div>
                    </div>
                    {appt.status === 'Chờ khám' ? (
                      <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Chờ khám</span>
                    ) : appt.status === 'Đã xong' ? (
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Đã xong</span>
                    ) : (
                      <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">Đã hủy</span>
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
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold mr-3 shrink-0">1</span>
                <span className="text-sm text-gray-700"><strong>Đồng cảm trước, giải thích sau:</strong> Khi khách chê đắt, hãy đồng cảm "Dạ em hiểu băn khoăn của chị...", sau đó mới phân tích giá trị.</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold mr-3 shrink-0">2</span>
                <span className="text-sm text-gray-700"><strong>Gửi hình ảnh feedback thực tế:</strong> Hình ảnh khách hàng có tình trạng tương tự trước và sau khi làm là vũ khí tốt nhất.</span>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold mr-3 shrink-0">3</span>
                <span className="text-sm text-gray-700"><strong>Tạo sự khan hiếm:</strong> "Chương trình ưu đãi chỉ còn 2 suất cho khách đặt cọc hôm nay..."</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

