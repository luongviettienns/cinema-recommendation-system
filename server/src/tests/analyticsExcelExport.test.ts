import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import ExcelJS from 'exceljs';

const binaryParser = (res: any, callback: (err: Error | null, body: Buffer) => void) => {
  const data: Buffer[] = [];
  res.on('data', (chunk: Buffer) => {
    data.push(chunk);
  });
  res.on('end', () => {
    callback(null, Buffer.concat(data));
  });
};

describe('Excel Revenue Export API (/api/v1/admin/analytics/export-excel)', () => {
  let adminToken = '';
  let customerToken = '';

  beforeAll(async () => {
    // 1. Login Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cinema.vn', password: '123456' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.accessToken;

    // 2. Login Customer
    const custRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo@cinema.vn', password: '123456' });
    expect(custRes.status).toBe(200);
    customerToken = custRes.body.data.accessToken;
  });

  it('rejects unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/admin/analytics/export-excel');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin users (CUSTOMER) with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/export-excel')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('allows ADMIN to export default 7days Excel report with correct headers and workbook structure', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/export-excel')
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.headers['content-disposition']).toMatch(
      /attachment;\s*filename="CineLight_BaoCaoDoanhThu_\d+_\d+\.xlsx"/,
    );
    expect(Buffer.isBuffer(res.body)).toBe(true);

    // Verify workbook content using ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);

    // Verify 3 sheets exist
    const sheet1 = workbook.getWorksheet('TongQuan_DoanhThu');
    const sheet2 = workbook.getWorksheet('TopPhim_CumRap');
    const sheet3 = workbook.getWorksheet('NhatKy_GiaoDich');

    expect(sheet1).toBeDefined();
    expect(sheet2).toBeDefined();
    expect(sheet3).toBeDefined();

    // Check Sheet 1 title and headers
    expect(sheet1?.getCell('A1').value).toContain('CINELIGHT');
    expect(sheet1?.getCell('A4').value).toBe('STT');
    expect(sheet1?.getCell('B4').value).toBe('Ngày Giao Dịch');

    // Check Sheet 2 table titles
    expect(sheet2?.getCell('A1').value).toContain('PHÂN TÍCH HIỆU SUẤT');
    expect(sheet2?.getCell('A3').value).toContain('I. THỐNG KÊ DOANH THU & SỐ LƯỢNG VÉ THEO PHIM');

    // Check Sheet 3 headers
    expect(sheet3?.getCell('B3').value).toBe('Mã Đặt Vé');
    expect(sheet3?.getCell('D3').value).toBe('Khách Hàng');
  });

  it('supports exporting today range (?range=today)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/export-excel?range=today')
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(Buffer.isBuffer(res.body)).toBe(true);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);
    const sheet1 = workbook.getWorksheet('TongQuan_DoanhThu');
    expect(sheet1?.getCell('A2').value).toContain('Hôm Nay');
  });

  it('supports exporting 30days range (?range=30days)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/export-excel?range=30days')
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(Buffer.isBuffer(res.body)).toBe(true);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);
    const sheet1 = workbook.getWorksheet('TongQuan_DoanhThu');
    expect(sheet1?.getCell('A2').value).toContain('30 Ngày');
  });

  it('supports exporting all range (?range=all)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/export-excel?range=all')
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(Buffer.isBuffer(res.body)).toBe(true);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);
    const sheet1 = workbook.getWorksheet('TongQuan_DoanhThu');
    expect(sheet1?.getCell('A2').value).toContain('Toàn Bộ Dữ Liệu Lịch Sử');
  });
});
