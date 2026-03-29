-- Thêm cột deposit (Đã cọc)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deposit TEXT;

-- Thêm cột commission_rate (Hoa hồng ước tính)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS commission_rate TEXT;
