export function formatDateLabel(dateStr: string): { dayOfWeek: string; formattedDate: string; isToday: boolean } {
  const date = new Date(dateStr);
  const today = new Date();
  
  const isToday = 
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  let dayOfWeek = dayNames[date.getDay()];

  if (isToday) dayOfWeek = 'Hôm nay';
  else if (isTomorrow) dayOfWeek = 'Ngày mai';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const formattedDate = `${day}/${month}`;

  return { dayOfWeek, formattedDate, isToday };
}

export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
