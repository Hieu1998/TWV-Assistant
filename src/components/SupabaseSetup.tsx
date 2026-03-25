import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { getSupabaseConfig, setSupabaseConfig, refreshSupabaseClient } from '@/src/lib/supabase';
import { Database } from 'lucide-react';

interface SupabaseSetupProps {
  onConfigured: () => void;
}

export default function SupabaseSetup({ onConfigured }: SupabaseSetupProps) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.url) setUrl(config.url);
    if (config.key) setKey(config.key);
  }, []);

  const handleSave = () => {
    const trimmedUrl = url.trim();
    const trimmedKey = key.trim();
    if (!trimmedUrl || !trimmedKey) {
      setError('Vui lòng nhập đầy đủ URL và Anon Key');
      return;
    }
    setSupabaseConfig(trimmedUrl, trimmedKey);
    refreshSupabaseClient();
    onConfigured();
  };

  return (
    <div className="fixed inset-0 bg-rose-50/80 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-md shadow-2xl border-rose-200 dark:border-zinc-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
            <Database className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Cấu hình Supabase</CardTitle>
          <CardDescription>
            Vui lòng nhập thông tin kết nối Supabase của bạn. Thông tin này sẽ được lưu an toàn trong trình duyệt của bạn (LocalStorage).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Supabase URL</Label>
            <Input 
              id="url" 
              placeholder="https://your-project.supabase.co" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              className="border-rose-100 dark:border-zinc-800 focus:ring-rose-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key">Supabase Anon Key</Label>
            <Input 
              id="key" 
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
              value={key} 
              onChange={(e) => setKey(e.target.value)}
              className="border-rose-100 dark:border-zinc-800 focus:ring-rose-500"
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          <Button 
            onClick={handleSave} 
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-rose-200 dark:shadow-none"
          >
            Lưu cấu hình & Bắt đầu
          </Button>
          <p className="text-[10px] text-center text-gray-400 mt-4">
            Dữ liệu của bạn sẽ được lưu trữ trên Supabase thay vì LocalStorage sau khi cấu hình thành công.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
