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
    color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400'
  },
  {
    day: 'Thứ 3',
    type: 'Feedback / Before-After',
    topic: 'Khách hàng cắt mí sau 7 ngày cắt chỉ',
    description: 'Đăng hình ảnh/video khách hàng tái khám, nhấn mạnh mí đều, không sưng bầm nhiều nhờ kỹ thuật mổ ít xâm lấn.',
    color: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30',
    textColor: 'text-green-700 dark:text-green-400'
  },
  {
    day: 'Thứ 4',
    type: 'Hậu trường / Chăm sóc',
    topic: 'Quy trình vô khuẩn phòng mổ & Chăm sóc hậu phẫu',
    description: 'Quay clip ngắn điều dưỡng chuẩn bị dụng cụ hoặc chăm sóc khách sau mổ. Tăng độ tin cậy và an toàn.',
    color: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-400'
  },
  {
    day: 'Thứ 5',
    type: 'Tương tác / Mini-game',
    topic: 'Đố vui: Dáng mũi nào đang hot nhất năm nay?',
    description: 'Tạo poll bình chọn hoặc câu hỏi đơn giản để tăng tương tác (comment/share) cho Fanpage.',
    color: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-400'
  },
  {
    day: 'Thứ 6',
    type: 'Khuyến mãi / Chốt sale',
    topic: 'Flash Sale cuối tuần: Giảm 30% dịch vụ Phun xăm/Chăm sóc da',
    description: 'Tạo sự khan hiếm (chỉ 10 suất), kêu gọi khách hàng inbox đặt lịch ngay cho cuối tuần.',
    color: 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/30',
    textColor: 'text-rose-700 dark:text-rose-400'
  },
  {
    day: 'Thứ 7',
    type: 'Livestream / Q&A',
    topic: 'Bác sĩ giải đáp trực tiếp: Những lầm tưởng về hút mỡ',
    description: 'Thông báo lịch livestream hoặc đăng lại video Q&A ngắn giải đáp thắc mắc phổ biến.',
    color: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900/30',
    textColor: 'text-indigo-700 dark:text-indigo-400'
  },
  {
    day: 'Chủ Nhật',
    type: 'Lifestyle / Cảm hứng',
    topic: 'Câu chuyện thay đổi nhan sắc - Thay đổi cuộc đời',
    description: 'Kể một câu chuyện truyền cảm hứng về một khách hàng đã tự tin hơn, thành công hơn sau khi làm đẹp.',
    color: 'bg-pink-50 dark:bg-pink-900/10 border-pink-200 dark:border-pink-900/30',
    textColor: 'text-pink-700 dark:text-pink-400'
  }
];

export default function ContentCalendar() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">Kế hoạch Nội dung Tuần 📅</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2">Gợi ý chủ đề đăng bài mỗi ngày để duy trì tương tác và thu hút khách hàng mới.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {weekPlan.map((day, index) => (
          <Card key={index} className={`border ${day.color} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg text-gray-900 dark:text-zinc-100">{day.day}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-white dark:bg-zinc-900 ${day.textColor} border ${day.color}`}>
                  {day.type}
                </span>
              </div>
              <CardTitle className="text-base leading-tight dark:text-zinc-200">{day.topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-600 dark:text-zinc-400">
                {day.description}
              </CardDescription>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-900 dark:text-zinc-100 border-gray-200 dark:border-zinc-700"
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
