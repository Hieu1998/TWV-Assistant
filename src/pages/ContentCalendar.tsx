import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { CalendarDays, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const weekPlan = [
  {
    day: 'Thứ 2',
    type: 'Kiến thức / Chuyên gia',
    topic: 'Phân biệt các loại sụn nâng mũi (Silicone, Surgiform, Sụn sườn)',
    description: 'Giúp khách hàng hiểu rõ ưu nhược điểm từng loại, thể hiện sự am hiểu chuyên môn của bác sĩ.',
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700'
  },
  {
    day: 'Thứ 3',
    type: 'Feedback / Before-After',
    topic: 'Khách hàng cắt mí sau 7 ngày cắt chỉ',
    description: 'Đăng hình ảnh/video khách hàng tái khám, nhấn mạnh mí đều, không sưng bầm nhiều nhờ kỹ thuật mổ ít xâm lấn.',
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-700'
  },
  {
    day: 'Thứ 4',
    type: 'Hậu trường / Chăm sóc',
    topic: 'Quy trình vô khuẩn phòng mổ & Chăm sóc hậu phẫu',
    description: 'Quay clip ngắn điều dưỡng chuẩn bị dụng cụ hoặc chăm sóc khách sau mổ. Tăng độ tin cậy và an toàn.',
    color: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700'
  },
  {
    day: 'Thứ 5',
    type: 'Tương tác / Mini-game',
    topic: 'Đố vui: Dáng mũi nào đang hot nhất năm nay?',
    description: 'Tạo poll bình chọn hoặc câu hỏi đơn giản để tăng tương tác (comment/share) cho Fanpage.',
    color: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-700'
  },
  {
    day: 'Thứ 6',
    type: 'Khuyến mãi / Chốt sale',
    topic: 'Flash Sale cuối tuần: Giảm 30% dịch vụ Phun xăm/Chăm sóc da',
    description: 'Tạo sự khan hiếm (chỉ 10 suất), kêu gọi khách hàng inbox đặt lịch ngay cho cuối tuần.',
    color: 'bg-rose-50 border-rose-200',
    textColor: 'text-rose-700'
  },
  {
    day: 'Thứ 7',
    type: 'Livestream / Q&A',
    topic: 'Bác sĩ giải đáp trực tiếp: Những lầm tưởng về hút mỡ',
    description: 'Thông báo lịch livestream hoặc đăng lại video Q&A ngắn giải đáp thắc mắc phổ biến.',
    color: 'bg-indigo-50 border-indigo-200',
    textColor: 'text-indigo-700'
  },
  {
    day: 'Chủ Nhật',
    type: 'Lifestyle / Cảm hứng',
    topic: 'Câu chuyện thay đổi nhan sắc - Thay đổi cuộc đời',
    description: 'Kể một câu chuyện truyền cảm hứng về một khách hàng đã tự tin hơn, thành công hơn sau khi làm đẹp.',
    color: 'bg-pink-50 border-pink-200',
    textColor: 'text-pink-700'
  }
];

export default function ContentCalendar() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kế hoạch Nội dung Tuần 📅</h1>
        <p className="text-gray-500 mt-2">Gợi ý chủ đề đăng bài mỗi ngày để duy trì tương tác và thu hút khách hàng mới.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {weekPlan.map((day, index) => (
          <Card key={index} className={`border ${day.color} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg text-gray-900">{day.day}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-white ${day.textColor} border ${day.color}`}>
                  {day.type}
                </span>
              </div>
              <CardTitle className="text-base leading-tight">{day.topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-600">
                {day.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white hover:bg-gray-50"
                onClick={() => navigate('/post-generator', { state: { topic: day.topic } })}
              >
                <PenTool className="w-4 h-4 mr-2" />
                Viết bài này
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
