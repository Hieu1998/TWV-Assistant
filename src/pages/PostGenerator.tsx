import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Label } from '@/src/components/ui/label';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Copy, Check, Sparkles, PenTool } from 'lucide-react';

export default function PostGenerator() {
  const location = useLocation();
  const [topic, setTopic] = useState('');
  
  useEffect(() => {
    if (location.state?.topic) {
      setTopic(location.state.topic);
    }
  }, [location.state]);

  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('Chuyên nghiệp, đáng tin cậy');
  const [promotion, setPromotion] = useState('');
  
  const [generatedPost, setGeneratedPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    
    if (!process.env.GEMINI_API_KEY) {
      setGeneratedPost('Lỗi: Chưa cấu hình GEMINI_API_KEY. Vui lòng thêm API Key vào phần Settings/Secrets của AI Studio.');
      return;
    }

    setIsLoading(true);
    setGeneratedPost('');
    
    try {
      const storedKey = localStorage.getItem('gemini_api_key');
      if (!storedKey) {
        setGeneratedPost('Vui lòng cấu hình API Key trong phần cài đặt (biểu tượng chìa khóa) để sử dụng tính năng này.');
        return;
      }
      const ai = new GoogleGenAI({ apiKey: storedKey });
      const prompt = `
        Bạn là một chuyên gia marketing và sales xuất sắc cho một Thẩm Mỹ Viện uy tín.
        Hãy viết một bài đăng Facebook thật hấp dẫn, thu hút khách hàng dựa trên các thông tin sau:
        
        - Chủ đề dịch vụ/kiến thức: ${topic}
        - Đối tượng khách hàng mục tiêu: ${targetAudience || 'Khách hàng nữ quan tâm làm đẹp'}
        - Giọng văn: ${tone}
        - Chương trình khuyến mãi/Ưu đãi (nếu có): ${promotion || 'Không có'}
        
        Yêu cầu bài viết:
        1. Tiêu đề in hoa, giật tít, thu hút sự chú ý ngay lập tức (dùng emoji phù hợp).
        2. Nêu bật nỗi đau (pain point) của khách hàng và cách dịch vụ giải quyết triệt để.
        3. Nhấn mạnh sự an toàn, chuyên nghiệp của bác sĩ và đội ngũ điều dưỡng.
        4. Nếu có khuyến mãi, hãy tạo cảm giác khan hiếm (FOMO).
        5. Lời kêu gọi hành động (Call to Action) rõ ràng: Inbox, gọi Hotline, hoặc để lại SĐT.
        6. Sử dụng hashtag phù hợp (#thammyvien #lamdep #phauthuatthammy...).
        7. Bố cục rõ ràng, dễ đọc trên điện thoại.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      setGeneratedPost(response.text || 'Không thể tạo nội dung. Vui lòng thử lại.');
    } catch (error) {
      console.error('Error generating post:', error);
      setGeneratedPost('Đã xảy ra lỗi khi kết nối với AI. Vui lòng kiểm tra lại API key hoặc thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Viết bài Marketing Tự động ✍️</h1>
        <p className="text-gray-500 dark:text-rose-200 mt-2">Tạo nội dung Facebook thu hút khách hàng chỉ trong vài giây.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 dark:bg-[#181a1b] p-4 rounded-xl">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin bài viết</CardTitle>
              <CardDescription>Nhập các thông tin cơ bản để AI viết bài cho bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Chủ đề / Dịch vụ *</Label>
                <Input 
                  id="topic" 
                  placeholder="VD: Nâng mũi cấu trúc, Cắt mí, Chăm sóc da..." 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audience">Đối tượng khách hàng</Label>
                <Input 
                  id="audience" 
                  placeholder="VD: Phụ nữ sau sinh, Sinh viên, Dân văn phòng..." 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Giọng văn</Label>
                <select 
                  id="tone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="Chuyên nghiệp, đáng tin cậy">Chuyên nghiệp, đáng tin cậy (Bác sĩ tư vấn)</option>
                  <option value="Đồng cảm, thấu hiểu">Đồng cảm, thấu hiểu (Tâm sự làm đẹp)</option>
                  <option value="Sôi động, thúc giục mua hàng">Sôi động, thúc giục mua hàng (Chốt sale/Khuyến mãi)</option>
                  <option value="Sang trọng, đẳng cấp">Sang trọng, đẳng cấp (Dịch vụ VIP)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion">Chương trình khuyến mãi (Tùy chọn)</Label>
                <Textarea 
                  id="promotion" 
                  placeholder="VD: Giảm 50% cho 10 khách hàng đăng ký sớm nhất, Tặng kèm gói chăm sóc da..." 
                  value={promotion}
                  onChange={(e) => setPromotion(e.target.value)}
                  className="h-20"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-rose-600 hover:bg-rose-700 text-white" 
                onClick={handleGenerate}
                disabled={!topic || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang viết bài...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Tạo bài viết ngay
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-7 dark:bg-[#181a1b] rounded-xl">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Kết quả bài viết</span>
                {generatedPost && (
                  <Button variant="outline" size="sm" onClick={handleCopy} className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Đã copy' : 'Copy bài viết'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {generatedPost ? (
                <div className="bg-gray-50 dark:bg-[#181a1b] p-6 rounded-lg border border-gray-100 dark:border-[#4a2b2d] h-full whitespace-pre-wrap text-gray-800 dark:text-white font-sans leading-relaxed">
                  {generatedPost}
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 dark:text-rose-300/70 border-2 border-dashed border-gray-200 dark:border-[#4a2b2d] rounded-lg p-8 text-center bg-gray-50/50 dark:bg-[#181a1b]">
                  <PenTool className="h-12 w-12 mb-4 text-gray-300 dark:text-rose-300/50" />
                  <p>Điền thông tin bên trái và nhấn "Tạo bài viết ngay" để AI viết bài cho bạn.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
