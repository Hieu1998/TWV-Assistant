import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Key, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose?: () => void;
  currentKey?: string;
}

export default function ApiKeyModal({ isOpen, onSave, onClose, currentKey = '' }: ApiKeyModalProps) {
  const [key, setKey] = useState(currentKey);

  useEffect(() => {
    setKey(currentKey);
  }, [currentKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-md shadow-2xl border-rose-200 dark:border-[#4a2b2d]">
        <CardHeader>
          <CardTitle className="flex items-center text-rose-700 dark:text-rose-400">
            <Key className="w-5 h-5 mr-2" />
            Cấu hình Gemini API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              API Key được lưu trữ an toàn trong trình duyệt của bạn (localStorage). 
              Bạn cần có API Key để sử dụng các tính năng AI như viết bài và tư vấn.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">Nhập Gemini API Key của bạn</Label>
            <Input 
              id="api-key"
              type="password" 
              placeholder="AIzaSy..." 
              value={key} 
              onChange={(e) => setKey(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {onClose && (
              <Button variant="outline" onClick={onClose}>Hủy</Button>
            )}
            <Button 
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => onSave(key)}
              disabled={!key.trim()}
            >
              Lưu cấu hình
            </Button>
          </div>
          
          <p className="text-[10px] text-center text-gray-400 dark:text-rose-300/50">
            Lấy key tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-rose-500">Google AI Studio</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
