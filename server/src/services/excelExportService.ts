import ExcelJS from 'exceljs';
import { prisma } from '../prisma';
import { BookingStatus, PaymentStatus, RefundStatus } from '@prisma/client';

export interface ExportRevenueOptions {
  range?: 'today' | '7days' | '30days' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
}

export class ExcelExportService {
  /**
   * Sinh file Excel báo cáo doanh thu đa sheet theo chuẩn chuyên nghiệp
   */
  async generateRevenueWorkbook(options: ExportRevenueOptions = {}): Promise<Buffer> {
    const { range = '7days', startDate, endDate } = options;
    const now = new Date();

    // 1. Xác định khoảng thời gian lọc
    let rangeFilter: { gte?: Date; lte?: Date } | undefined;
    let rangeLabel = '7 Ngày Gần Nhất';

    if (range === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      rangeFilter = { gte: start, lte: end };
      rangeLabel = `Hôm Nay (${start.toLocaleDateString('vi-VN')})`;
    } else if (range === '7days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      rangeFilter = { gte: start, lte: now };
      rangeLabel = `7 Ngày (${start.toLocaleDateString('vi-VN')} - ${now.toLocaleDateString('vi-VN')})`;
    } else if (range === '30days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      rangeFilter = { gte: start, lte: now };
      rangeLabel = `30 Ngày (${start.toLocaleDateString('vi-VN')} - ${now.toLocaleDateString('vi-VN')})`;
    } else if (range === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      rangeFilter = { gte: start, lte: end };
      rangeLabel = `Tùy Chọn (${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')})`;
    } else if (range === 'all') {
      rangeLabel = 'Toàn Bộ Dữ Liệu Lịch Sử';
    }

    // 2. Query dữ liệu từ Database
    const whereClause = rangeFilter ? { createdAt: rangeFilter } : {};

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        showtime: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                duration: true,
                movieGenres: {
                  include: { genre: true },
                },
              },
            },
            room: {
              include: {
                cinema: { select: { id: true, name: true, address: true, city: true } },
              },
            },
          },
        },
        bookingSeats: {
          include: {
            seat: { select: { seatNumber: true, row: true, col: true, seatType: true } },
          },
        },
        payment: true,
        refundRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Khởi tạo ExcelJS Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CineLight Cinema System';
    workbook.lastModifiedBy = 'CineLight Administrator';
    workbook.created = now;
    workbook.modified = now;

    // Palette màu Vibe Sáng & Điện ảnh
    const HEADER_FILL_COLOR = '881337'; // Rose-900 / Crimson
    const SUB_HEADER_FILL = 'F1F5F9'; // Slate-100
    const ZEBRA_ROW_FILL = 'F8FAFC'; // Slate-50
    const BORDER_COLOR = 'CBD5E1'; // Slate-300

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: BORDER_COLOR } },
      left: { style: 'thin', color: { argb: BORDER_COLOR } },
      bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
      right: { style: 'thin', color: { argb: BORDER_COLOR } },
    };

    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFF' },
    };

    const dataFont: Partial<ExcelJS.Font> = {
      name: 'Arial',
      size: 10,
      color: { argb: '0F172A' },
    };

    const totalFont: Partial<ExcelJS.Font> = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: '0F172A' },
    };

    // ==========================================
    // SHEET 1: TỔNG QUAN & DOANH THU THEO NGÀY
    // ==========================================
    const sheet1 = workbook.addWorksheet('TongQuan_DoanhThu', {
      views: [{ showGridLines: true }],
    });

    // Header Banner
    sheet1.mergeCells('A1:H1');
    const titleCell = sheet1.getCell('A1');
    titleCell.value = 'HỆ THỐNG RẠP CHIẾU PHIM CINELIGHT - BÁO CÁO DOANH THU & SỐ LƯỢNG VÉ';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: HEADER_FILL_COLOR } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(1).height = 30;

    sheet1.mergeCells('A2:H2');
    const subtitleCell = sheet1.getCell('A2');
    subtitleCell.value = `Kỳ Báo Cáo: ${rangeLabel} | Thời Điểm Xuất: ${now.toLocaleString('vi-VN')} | Người Lập: Quản Trị Viên (Admin)`;
    subtitleCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet1.getRow(2).height = 20;

    // Blank row
    sheet1.getRow(3).height = 10;

    // Aggregate Data By Day
    const dayAggregation = new Map<
      string,
      {
        dateStr: string;
        dayOfWeek: string;
        orderCount: number;
        ticketCount: number;
        revenue: number;
        refundAmount: number;
      }
    >();

    // Sắp xếp ngày từ cũ đến mới cho biểu mẫu
    const sortedBookings = [...bookings].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    for (const b of sortedBookings) {
      const d = new Date(b.createdAt);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = DAY_NAMES[d.getDay()];

      if (!dayAggregation.has(dateStr)) {
        dayAggregation.set(dateStr, {
          dateStr,
          dayOfWeek,
          orderCount: 0,
          ticketCount: 0,
          revenue: 0,
          refundAmount: 0,
        });
      }

      const item = dayAggregation.get(dateStr)!;
      if (b.status === BookingStatus.PAID || b.status === BookingStatus.REFUND_PENDING) {
        item.orderCount += 1;
        item.ticketCount += b.bookingSeats.length;
        item.revenue += b.totalAmount;
      } else if (b.status === BookingStatus.CANCELLED) {
        // Vé đã hủy hoàn tiền
        if (b.refundRequest?.status === RefundStatus.APPROVED) {
          item.refundAmount += b.refundRequest.refundAmount;
        }
      }
    }

    // Table Headers
    const headersSheet1 = [
      'STT',
      'Ngày Giao Dịch',
      'Thứ',
      'Số Đơn Hàng',
      'Số Vé Bán Ra',
      'Doanh Thu Thu Vào (VNĐ)',
      'Tiền Hoàn Lại (VNĐ)',
      'Doanh Thu Thuần (VNĐ)',
    ];

    const headerRow1 = sheet1.getRow(4);
    headerRow1.values = headersSheet1;
    headerRow1.height = 25;
    headerRow1.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_COLOR } };
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    let currentSheet1Row = 5;
    let stt = 1;

    for (const [, item] of dayAggregation) {
      const row = sheet1.getRow(currentSheet1Row);
      // Cột H (Doanh thu thuần) = Doanh thu - Tiền hoàn (Công thức =F - G)
      row.values = [
        stt++,
        item.dateStr,
        item.dayOfWeek,
        item.orderCount,
        item.ticketCount,
        item.revenue,
        item.refundAmount,
        { formula: `F${currentSheet1Row}-G${currentSheet1Row}` },
      ];

      row.height = 20;
      const isZebra = currentSheet1Row % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = dataFont;
        cell.border = thinBorder;
        if (isZebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_ROW_FILL } };
        }
        if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 4 || colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0 "₫"';
        }
      });

      currentSheet1Row++;
    }

    // Nếu không có dữ liệu, hiển thị 1 dòng trống
    if (dayAggregation.size === 0) {
      const emptyRow = sheet1.getRow(currentSheet1Row);
      emptyRow.values = [1, now.toISOString().split('T')[0], DAY_NAMES[now.getDay()], 0, 0, 0, 0, 0];
      emptyRow.eachCell((cell, colNumber) => {
        cell.font = dataFont;
        cell.border = thinBorder;
        cell.alignment = colNumber <= 3 ? { vertical: 'middle', horizontal: 'center' } : { vertical: 'middle', horizontal: 'right' };
      });
      currentSheet1Row++;
    }

    // Dòng TỔNG CỘNG với CÔNG THỨC =SUM(...)
    const lastDataRow1 = currentSheet1Row - 1;
    const totalRow1 = sheet1.getRow(currentSheet1Row);
    totalRow1.height = 24;

    totalRow1.getCell(1).value = 'TỔNG CỘNG';
    sheet1.mergeCells(`A${currentSheet1Row}:C${currentSheet1Row}`);

    totalRow1.getCell(4).value = { formula: `=SUM(D5:D${lastDataRow1})` };
    totalRow1.getCell(5).value = { formula: `=SUM(E5:E${lastDataRow1})` };
    totalRow1.getCell(6).value = { formula: `=SUM(F5:F${lastDataRow1})` };
    totalRow1.getCell(7).value = { formula: `=SUM(G5:G${lastDataRow1})` };
    totalRow1.getCell(8).value = { formula: `=SUM(H5:H${lastDataRow1})` };

    totalRow1.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUB_HEADER_FILL } };
      cell.font = totalFont;
      cell.border = thinBorder;
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 4 || colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0';
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0 "₫"';
      }
    });

    // Auto-fit Column Widths cho Sheet 1
    sheet1.columns = [
      { width: 8 },
      { width: 16 },
      { width: 14 },
      { width: 15 },
      { width: 15 },
      { width: 25 },
      { width: 22 },
      { width: 25 },
    ];

    // ==========================================
    // SHEET 2: TOP PHIM & HIỆU SUẤT CỤM RẠP
    // ==========================================
    const sheet2 = workbook.addWorksheet('TopPhim_CumRap', {
      views: [{ showGridLines: true }],
    });

    sheet2.mergeCells('A1:F1');
    const titleCell2 = sheet2.getCell('A1');
    titleCell2.value = 'BÁO CÁO PHÂN TÍCH HIỆU SUẤT THEO PHIM & CỤM RẠP';
    titleCell2.font = { name: 'Arial', size: 14, bold: true, color: { argb: HEADER_FILL_COLOR } };
    titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet2.getRow(1).height = 30;

    // --- BẢNG 1: TOP PHIM BÁN CHẠY NHẤT ---
    sheet2.mergeCells('A3:F3');
    const table1Title = sheet2.getCell('A3');
    table1Title.value = 'I. THỐNG KÊ DOANH THU & SỐ LƯỢNG VÉ THEO PHIM';
    table1Title.font = { name: 'Arial', size: 11, bold: true, color: { argb: '1E293B' } };
    sheet2.getRow(3).height = 22;

    const headersMovie = ['STT', 'Tên Phim', 'Thể Loại', 'Thời Lượng (Phút)', 'Số Vé Bán Ra', 'Doanh Thu (VNĐ)'];
    const headerRowMovie = sheet2.getRow(4);
    headerRowMovie.values = headersMovie;
    headerRowMovie.height = 24;
    headerRowMovie.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_COLOR } };
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    // Aggregate by Movie
    const movieAgg = new Map<string, { title: string; genres: string; duration: number; tickets: number; revenue: number }>();
    for (const b of bookings) {
      if (b.status === BookingStatus.PAID || b.status === BookingStatus.REFUND_PENDING) {
        const m = b.showtime.movie;
        if (!movieAgg.has(m.id)) {
          movieAgg.set(m.id, {
            title: m.title,
            genres: m.movieGenres?.map((mg) => mg.genre.name).join(', ') || 'Chưa phân loại',
            duration: m.duration,
            tickets: 0,
            revenue: 0,
          });
        }
        const entry = movieAgg.get(m.id)!;
        entry.tickets += b.bookingSeats.length;
        entry.revenue += b.totalAmount;
      }
    }

    let movieRowIdx = 5;
    let movieStt = 1;
    const sortedMovies = Array.from(movieAgg.values()).sort((a, b) => b.revenue - a.revenue);

    for (const item of sortedMovies) {
      const row = sheet2.getRow(movieRowIdx);
      row.values = [movieStt++, item.title, item.genres, item.duration, item.tickets, item.revenue];
      row.height = 20;
      const isZebra = movieRowIdx % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = dataFont;
        cell.border = thinBorder;
        if (isZebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_ROW_FILL } };
        if (colNumber === 1 || colNumber === 4) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else if (colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0 "₫"';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
      movieRowIdx++;
    }

    if (sortedMovies.length === 0) {
      const emptyRow = sheet2.getRow(movieRowIdx);
      emptyRow.values = [1, 'Chưa có dữ liệu phim trong kỳ', '-', 0, 0, 0];
      emptyRow.eachCell((cell) => {
        cell.font = dataFont;
        cell.border = thinBorder;
      });
      movieRowIdx++;
    }

    // Dòng tổng cộng cho bảng phim
    const lastMovieRow = movieRowIdx - 1;
    const totalMovieRow = sheet2.getRow(movieRowIdx);
    totalMovieRow.height = 22;
    totalMovieRow.getCell(1).value = 'TỔNG CỘNG DOANH THU PHIM';
    sheet2.mergeCells(`A${movieRowIdx}:D${movieRowIdx}`);
    totalMovieRow.getCell(5).value = { formula: `=SUM(E5:E${lastMovieRow})` };
    totalMovieRow.getCell(6).value = { formula: `=SUM(F5:F${lastMovieRow})` };
    totalMovieRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUB_HEADER_FILL } };
      cell.font = totalFont;
      cell.border = thinBorder;
      if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      else if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0';
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0 "₫"';
      }
    });

    // --- BẢNG 2: HIỆU SUẤT THEO CỤM RẠP ---
    const cinemaStartRow = movieRowIdx + 3;
    sheet2.mergeCells(`A${cinemaStartRow}:F${cinemaStartRow}`);
    const table2Title = sheet2.getCell(`A${cinemaStartRow}`);
    table2Title.value = 'II. THỐNG KÊ DOANH THU & SỐ LƯỢNG VÉ THEO CỤM RẠP';
    table2Title.font = { name: 'Arial', size: 11, bold: true, color: { argb: '1E293B' } };
    sheet2.getRow(cinemaStartRow).height = 22;

    const cinemaHeaderRowIdx = cinemaStartRow + 1;
    const headersCinema = ['STT', 'Tên Cụm Rạp', 'Khu Vực / Tỉnh Thành', 'Địa Chỉ Chi Tiết', 'Số Vé Bán Ra', 'Doanh Thu (VNĐ)'];
    const headerRowCinema = sheet2.getRow(cinemaHeaderRowIdx);
    headerRowCinema.values = headersCinema;
    headerRowCinema.height = 24;
    headerRowCinema.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_COLOR } };
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    // Aggregate by Cinema
    const cinemaAgg = new Map<string, { name: string; city: string; address: string; tickets: number; revenue: number }>();
    for (const b of bookings) {
      if (b.status === BookingStatus.PAID || b.status === BookingStatus.REFUND_PENDING) {
        const c = b.showtime.room.cinema;
        if (!cinemaAgg.has(c.id)) {
          cinemaAgg.set(c.id, {
            name: c.name,
            city: c.city,
            address: c.address,
            tickets: 0,
            revenue: 0,
          });
        }
        const entry = cinemaAgg.get(c.id)!;
        entry.tickets += b.bookingSeats.length;
        entry.revenue += b.totalAmount;
      }
    }

    let cinemaRowIdx = cinemaHeaderRowIdx + 1;
    let cinemaStt = 1;
    const sortedCinemas = Array.from(cinemaAgg.values()).sort((a, b) => b.revenue - a.revenue);

    for (const item of sortedCinemas) {
      const row = sheet2.getRow(cinemaRowIdx);
      row.values = [cinemaStt++, item.name, item.city, item.address, item.tickets, item.revenue];
      row.height = 20;
      const isZebra = cinemaRowIdx % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = dataFont;
        cell.border = thinBorder;
        if (isZebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_ROW_FILL } };
        if (colNumber === 1 || colNumber === 3) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else if (colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0 "₫"';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
      cinemaRowIdx++;
    }

    if (sortedCinemas.length === 0) {
      const emptyRow = sheet2.getRow(cinemaRowIdx);
      emptyRow.values = [1, 'Chưa có cụm rạp phát sinh doanh thu', '-', '-', 0, 0];
      emptyRow.eachCell((cell) => {
        cell.font = dataFont;
        cell.border = thinBorder;
      });
      cinemaRowIdx++;
    }

    // Dòng tổng cộng cho bảng cụm rạp
    const lastCinemaRow = cinemaRowIdx - 1;
    const totalCinemaRow = sheet2.getRow(cinemaRowIdx);
    totalCinemaRow.height = 22;
    totalCinemaRow.getCell(1).value = 'TỔNG CỘNG DOANH THU CỤM RẠP';
    sheet2.mergeCells(`A${cinemaRowIdx}:D${cinemaRowIdx}`);
    totalCinemaRow.getCell(5).value = { formula: `=SUM(E${cinemaHeaderRowIdx + 1}:E${lastCinemaRow})` };
    totalCinemaRow.getCell(6).value = { formula: `=SUM(F${cinemaHeaderRowIdx + 1}:F${lastCinemaRow})` };
    totalCinemaRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUB_HEADER_FILL } };
      cell.font = totalFont;
      cell.border = thinBorder;
      if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      else if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0';
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0 "₫"';
      }
    });

    sheet2.columns = [
      { width: 8 },
      { width: 32 },
      { width: 25 },
      { width: 35 },
      { width: 16 },
      { width: 22 },
    ];

    // ==========================================
    // SHEET 3: NHẬT KÝ CHI TIẾT TỪNG GIAO DỊCH
    // ==========================================
    const sheet3 = workbook.addWorksheet('NhatKy_GiaoDich', {
      views: [{ showGridLines: true }],
    });

    sheet3.mergeCells('A1:L1');
    const titleCell3 = sheet3.getCell('A1');
    titleCell3.value = 'DANH SÁCH CHI TIẾT CÁC ĐƠN ĐẶT VÉ TRONG KỲ';
    titleCell3.font = { name: 'Arial', size: 14, bold: true, color: { argb: HEADER_FILL_COLOR } };
    titleCell3.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet3.getRow(1).height = 30;

    const headersSheet3 = [
      'STT',
      'Mã Đặt Vé',
      'Thời Gian Đặt',
      'Khách Hàng',
      'Email / SĐT',
      'Tên Phim',
      'Cụm Rạp & Phòng',
      'Suất Chiếu',
      'Ghế Đã Đặt',
      'Phương Thức TT',
      'Trạng Thái',
      'Số Tiền (VNĐ)',
    ];

    const headerRow3 = sheet3.getRow(3);
    headerRow3.values = headersSheet3;
    headerRow3.height = 25;
    headerRow3.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_COLOR } };
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    });

    let currentSheet3Row = 4;
    let transStt = 1;

    for (const b of bookings) {
      const row = sheet3.getRow(currentSheet3Row);
      const seats = b.bookingSeats.map((bs) => bs.seat.seatNumber).join(', ');
      const statusText =
        b.status === BookingStatus.PAID
          ? 'Thành Công'
          : b.status === BookingStatus.REFUND_PENDING
          ? 'Chờ Duyệt Hoàn'
          : b.status === BookingStatus.CANCELLED
          ? 'Đã Hủy / Hoàn'
          : b.status;

      row.values = [
        transStt++,
        b.bookingCode,
        new Date(b.createdAt).toLocaleString('vi-VN'),
        b.user?.name || 'Khách Vãng Lai',
        `${b.user?.email || ''} / ${b.user?.phone || ''}`,
        b.showtime.movie.title,
        `${b.showtime.room.cinema.name} - ${b.showtime.room.name}`,
        new Date(b.showtime.startTime).toLocaleString('vi-VN'),
        seats || 'Chưa chọn',
        b.payment?.paymentMethod || 'VietQR',
        statusText,
        b.totalAmount,
      ];

      row.height = 20;
      const isZebra = currentSheet3Row % 2 === 0;

      row.eachCell((cell, colNumber) => {
        cell.font = dataFont;
        cell.border = thinBorder;
        if (isZebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_ROW_FILL } };
        if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 10 || colNumber === 11) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 12) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0 "₫"';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });

      currentSheet3Row++;
    }

    if (bookings.length === 0) {
      const emptyRow = sheet3.getRow(currentSheet3Row);
      emptyRow.values = [1, 'Chưa có giao dịch nào', '-', '-', '-', '-', '-', '-', '-', '-', '-', 0];
      emptyRow.eachCell((cell) => {
        cell.font = dataFont;
        cell.border = thinBorder;
      });
      currentSheet3Row++;
    }

    // Dòng tổng cộng cho Sheet 3
    const lastSheet3Row = currentSheet3Row - 1;
    const totalRow3 = sheet3.getRow(currentSheet3Row);
    totalRow3.height = 22;
    totalRow3.getCell(1).value = 'TỔNG CỘNG TOÀN BỘ GIAO DỊCH';
    sheet3.mergeCells(`A${currentSheet3Row}:K${currentSheet3Row}`);
    totalRow3.getCell(12).value = { formula: `=SUM(L4:L${lastSheet3Row})` };

    totalRow3.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUB_HEADER_FILL } };
      cell.font = totalFont;
      cell.border = thinBorder;
      if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0 "₫"';
      }
    });

    sheet3.columns = [
      { width: 8 },
      { width: 15 },
      { width: 20 },
      { width: 22 },
      { width: 28 },
      { width: 28 },
      { width: 30 },
      { width: 20 },
      { width: 16 },
      { width: 16 },
      { width: 18 },
      { width: 20 },
    ];

    // 4. Xuất Buffer nhị phân
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const excelExportService = new ExcelExportService();
