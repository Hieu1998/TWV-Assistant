import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { Label } from '@/src/components/ui/label';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Copy, Check, MessageSquareReply } from 'lucide-react';

export default function Consultation() {
  const [customerMessage, setCustomerMessage] = useState('');
  const [serviceContext, setServiceContext] = useState('');
  const [objectionType, setObjectionType] = useState('Chung chung');
  
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!customerMessage || isLoading) return;
    
    setIsLoading(true);
    setGeneratedResponse('');
    
    try {
      const storedKey = localStorage.getItem('gemini_api_key');
      const storedModel = localStorage.getItem('gemini_api_model') || 'gemini-3-flash-preview';
      const apiKey = storedKey || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        setGeneratedResponse('Vui lòng cấu hình API Key trong phần cài đặt (biểu tượng chìa khóa 🔑) để sử dụng tính năng này.');
        setIsLoading(false);
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Bạn là một chuyên viên tư vấn (sales) xuất sắc và tận tâm tại một Thẩm Mỹ Viện uy tín.
        Hãy viết một câu trả lời thuyết phục, khéo léo để phản hồi lại tin nhắn của khách hàng.
        
        - Tin nhắn của khách hàng: "${customerMessage}"
        - Dịch vụ khách đang quan tâm: ${serviceContext || 'Chưa rõ'}
        - Loại từ chối/băn khoăn chính: ${objectionType}
        
        Yêu cầu câu trả lời:
        1. Bắt đầu bằng sự đồng cảm, thấu hiểu lo lắng của khách hàng (VD: "Dạ em hiểu băn khoăn của chị...", "Đúng là nhiều chị em cũng lo lắng như vậy ạ...").
        2. Đưa ra giải pháp hoặc lời giải thích chuyên môn nhưng dễ hiểu, nhấn mạnh sự an toàn, tay nghề bác sĩ, hoặc công nghệ hiện đại.
        3. Nếu khách chê đắt: Phân tích giá trị nhận lại (tiền nào của nấy, bảo hành, không phát sinh chi phí).
        4. Nếu khách sợ đau/sợ biến chứng: Nhấn mạnh quy trình chuẩn y khoa, thuốc tê/tiền mê, chăm sóc hậu phẫu tận tình của điều dưỡng.
        5. Kết thúc bằng một câu hỏi mở hoặc lời mời gọi hành động nhẹ nhàng để duy trì cuộc trò chuyện (VD: "Chị cho em xin số điện thoại để bác sĩ gọi tư vấn kỹ hơn nhé?", "Chị rảnh hôm nào ghé em thăm khám miễn phí ạ?").
        6. Giọng điệu: Lịch sự, ân cần, chuyên nghiệp (xưng "em" gọi "chị/anh").
      `;

      const response = await ai.models.generateContent({
        model: storedModel,
        contents: prompt,
      });

      setGeneratedResponse(response.text || 'Không thể tạo nội dung. Vui lòng thử lại.');
    } catch (error: any) {
      console.error('Error generating response:', error);
      if (error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
        setGeneratedResponse('Lỗi: Bạn đã vượt quá giới hạn yêu cầu của API (Quota Exceeded). Vui lòng đợi khoảng 1 phút rồi thử lại.');
      } else {
        setGeneratedResponse('Đã xảy ra lỗi khi kết nối với AI. Vui lòng kiểm tra lại API key hoặc thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tư vấn Khách hàng & Xử lý Từ chối 💬</h1>
        <p className="text-gray-500 dark:text-rose-200 mt-2">Tạo kịch bản trả lời tin nhắn khéo léo, tăng tỷ lệ chốt sale.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 dark:bg-[#181a1b] p-4 rounded-xl">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tình huống khách hàng</CardTitle>
              <CardDescription>Nhập tin nhắn của khách để AI gợi ý cách trả lời.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Tin nhắn của khách hàng *</Label>
                <Textarea 
                  id="message" 
                  placeholder='VD: "Giá bên em cao quá, chỗ khác làm rẻ hơn", "Chị sợ đau lắm", "Làm xong bao lâu thì đi làm lại được em?"...' 
                  value={customerMessage}
                  onChange={(e) => setCustomerMessage(e.target.value)}
                  className="h-24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service">Dịch vụ đang tư vấn</Label>
                <input 
                  id="service" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                  placeholder="VD: Nâng mũi, Cắt mí, Phun xăm..." 
                  value={serviceContext}
                  onChange={(e) => setServiceContext(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objection">Loại băn khoăn chính</Label>
                <select 
                  id="objection"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:bg-[#181a1b] dark:border-[#4a2b2d] dark:text-white"
                  value={objectionType}
                  onChange={(e) => setObjectionType(e.target.value)}
                >
                  <option value="Chung chung">Chung chung / Hỏi thông tin</option>
                  <option value="Về giá cả (Chê đắt)">Về giá cả (Chê đắt, so sánh giá)</option>
                  <option value="Sợ đau, sợ biến chứng">Sợ đau, sợ biến chứng, an toàn</option>
                  <option value="Thời gian nghỉ dưỡng">Thời gian nghỉ dưỡng, ảnh hưởng công việc</option>
                  <option value="Chưa tin tưởng tay nghề bác sĩ">Chưa tin tưởng tay nghề bác sĩ</option>
                  <option value="Cần hỏi ý kiến người thân">Cần hỏi ý kiến người thân (chồng/mẹ)</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-rose-600 hover:bg-rose-700 text-white" 
                onClick={handleGenerate}
                disabled={!customerMessage || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang suy nghĩ...
                  </>
                ) : (
                  <>
                    <MessageSquareReply className="mr-2 h-4 w-4" />
                    Tạo câu trả lời
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
                <span>Gợi ý trả lời</span>
                {generatedResponse && (
                  <Button variant="outline" size="sm" onClick={handleCopy} className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Đã copy' : 'Copy câu trả lời'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {generatedResponse ? (
                <div className="bg-rose-50 dark:bg-rose-500/5 p-6 rounded-lg border border-rose-100 dark:border-rose-500/10 h-full whitespace-pre-wrap text-gray-800 dark:text-white font-sans leading-relaxed">
                  {generatedResponse}
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 dark:text-rose-300/70 border-2 border-dashed border-gray-200 dark:border-[#4a2b2d] rounded-lg p-8 text-center bg-gray-50/50 dark:bg-[#181a1b]">
                  <MessageSquareReply className="h-12 w-12 mb-4 text-gray-300 dark:text-rose-300/50" />
                  <p>Nhập tin nhắn của khách và nhấn "Tạo câu trả lời" để nhận gợi ý chốt sale khéo léo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
