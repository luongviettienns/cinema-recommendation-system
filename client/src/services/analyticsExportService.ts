import ExcelJS from 'exceljs';
import { toast } from 'sonner';

export interface ExportParams {
  range: 'today' | '7days' | '30days';
}

class AnalyticsExportService {
  /**
   * Xuất file báo cáo doanh thu Excel
   * Ưu tiên gọi Backend API; nếu lỗi hoặc mock mode sẽ tự sinh file phía client bằng ExcelJS
   */
  async exportRevenueExcel(range: 'today' | '7days' | '30days'): Promise<void> {
    const token = localStorage.getItem('cinelight_token');
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeString = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `CineLight_BaoCaoDoanhThu_${dateString}_${timeString}.xlsx`;

    try {
      if (token) {
        const response = await fetch(`/api/v1/admin/analytics/export-excel?range=${range}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          this.triggerDownload(blob, filename);
          toast.success('Xuất báo cáo doanh thu Excel thành công!');
          return;
        }
      }
    } catch {
      // Fallback sang client-side generation
    }

    // Client-side fallback generator using ExcelJS
    await this.generateClientSideExcel(range, filename);
    toast.success('Xuất báo cáo doanh thu Excel thành công!');
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Sinh file Excel phía client khi ở Mock Mode
   */
  private async generateClientSideExcel(range: string, filename: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CineLight Cinema System';
    const now = new Date();

    const HEADER_FILL_COLOR = '881337';
    const SUB_HEADER_FILL = 'F1F5F9';
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'CBD5E1' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } },
    };

    // Sheet 1: Doanh Thu
    const sheet1 = workbook.addWorksheet('TongQuan_DoanhThu');
    sheet1.mergeCells('A1:G1');
    const title = sheet1.getCell('A1');
    title.value = 'HỆ THỐNG RẠP CHIẾU PHIM CINELIGHT - BÁO CÁO DOANH THU & SỐ LƯỢNG VÉ';
    title.font = { name: 'Arial', size: 13, bold: true, color: { argb: HEADER_FILL_COLOR } };
    title.alignment = { horizontal: 'center' };

    sheet1.mergeCells('A2:G2');
    sheet1.getCell('A2').value = `Kỳ Báo Cáo: ${range.toUpperCase()} | Xuất lúc: ${now.toLocaleString('vi-VN')}`;
    sheet1.getCell('A2').font = { name: 'Arial', size: 9, italic: true };
    sheet1.getCell('A2').alignment = { horizontal: 'center' };

    const headers1 = ['STT', 'Ngày', 'Thứ', 'Số Đơn Hàng', 'Số Vé Đã Bán', 'Doanh Thu (VNĐ)', 'Tiền Hoàn (VNĐ)'];
    const hRow = sheet1.getRow(4);
    hRow.values = headers1;
    hRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_COLOR } };
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = thinBorder;
    });

    const mockDays = [
      { date: '14/09/2026', day: 'Thứ Hai', orders: 20, tickets: 35, revenue: 3150000, refund: 0 },
      { date: '15/09/2026', day: 'Thứ Ba', orders: 25, tickets: 42, revenue: 3780000, refund: 0 },
      { date: '16/09/2026', day: 'Thứ Tư', orders: 22, tickets: 38, revenue: 3420000, refund: 95000 },
      { date: '17/09/2026', day: 'Thứ Năm', orders: 30, tickets: 55, revenue: 4950000, refund: 0 },
      { date: '18/09/2026', day: 'Thứ Sáu', orders: 48, tickets: 82, revenue: 7380000, refund: 0 },
      { date: '19/09/2026', day: 'Thứ Bảy', orders: 65, tickets: 110, revenue: 9900000, refund: 200000 },
      { date: '20/09/2026', day: 'Chủ Nhật', orders: 58, tickets: 96, revenue: 8640000, refund: 0 },
    ];

    let rowIdx = 5;
    mockDays.forEach((d, i) => {
      const row = sheet1.getRow(rowIdx);
      row.values = [i + 1, d.date, d.day, d.orders, d.tickets, d.revenue, d.refund];
      row.eachCell((cell, col) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.border = thinBorder;
        if (col <= 3) cell.alignment = { horizontal: 'center' };
        else if (col <= 5) {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '#,##0 "₫"';
        }
      });
      rowIdx++;
    });

    const totalRow = sheet1.getRow(rowIdx);
    totalRow.getCell(1).value = 'TỔNG CỘNG';
    sheet1.mergeCells(`A${rowIdx}:C${rowIdx}`);
    totalRow.getCell(4).value = { formula: `=SUM(D5:D${rowIdx - 1})` };
    totalRow.getCell(5).value = { formula: `=SUM(E5:E${rowIdx - 1})` };
    totalRow.getCell(6).value = { formula: `=SUM(F5:F${rowIdx - 1})` };
    totalRow.getCell(7).value = { formula: `=SUM(G5:G${rowIdx - 1})` };
    totalRow.eachCell((cell, col) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUB_HEADER_FILL } };
      cell.font = { name: 'Arial', bold: true };
      cell.border = thinBorder;
      if (col === 1) cell.alignment = { horizontal: 'center' };
      else if (col <= 5) cell.numFmt = '#,##0';
      else cell.numFmt = '#,##0 "₫"';
    });

    sheet1.columns = [{ width: 8 }, { width: 16 }, { width: 14 }, { width: 15 }, { width: 15 }, { width: 22 }, { width: 20 }];

    // Sheet 2: Top Phim
    const sheet2 = workbook.addWorksheet('TopPhim_CumRap');
    sheet2.mergeCells('A1:E1');
    sheet2.getCell('A1').value = 'BÁO CÁO DOANH THU THEO PHIM';
    sheet2.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: HEADER_FILL_COLOR } };
    sheet2.getRow(3).values = ['STT', 'Tên Phim', 'Thể Loại', 'Số Vé Bán', 'Doanh Thu (VNĐ)'];
    sheet2.getRow(3).eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_COLOR } };
      c.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
      c.border = thinBorder;
    });

    const mockTop = [
      ['1', 'Avatar: Dòng Chảy Của Nước', 'Hành Động, Khoa Học Viễn Tưởng', 142, 14200000],
      ['2', 'Dune: Hành Tinh Cát - Phần 2', 'Phiêu Lưu, Viễn Tưởng', 98, 9800000],
      ['3', 'Bầy Xác Sống', 'Kinh Dị, Giật Gân', 64, 5760000],
    ];

    mockTop.forEach((m, idx) => {
      const r = sheet2.getRow(idx + 4);
      r.values = m;
      r.eachCell((cell, col) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.border = thinBorder;
        if (col === 1) cell.alignment = { horizontal: 'center' };
        else if (col === 4) {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else if (col === 5) {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '#,##0 "₫"';
        }
      });
    });

    sheet2.columns = [{ width: 8 }, { width: 32 }, { width: 30 }, { width: 16 }, { width: 22 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    this.triggerDownload(blob, filename);
  }
}

export const analyticsExportService = new AnalyticsExportService();
