import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';

describe('Admin Staff Management API (/api/v1/admin/staff)', () => {
  const identifier = crypto.randomUUID();
  const staffEmail = `staff-management-${identifier}@cinema.vn`;
  const staffPassword = 'StaffManagement123!';
  const listSearchTerm = `list-${identifier}`;
  const cinemaIds: string[] = [];
  const testStaffIds: string[] = [];
  let adminToken = '';
  let customerToken = '';
  let existingStaffToken = '';
  let cinemaId = '';
  let alternateCinemaId = '';
  let createdStaffId = '';
  let createdStaffToken = '';
  let adminId = '';
  let orphanStaffId = '';

  beforeAll(async () => {
    const [adminLogin, customerLogin, staffLogin, admin] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({ email: 'admin@cinema.vn', password: '123456' }),
      request(app).post('/api/v1/auth/login').send({ email: 'demo@cinema.vn', password: '123456' }),
      request(app).post('/api/v1/auth/login').send({ email: 'staff@cinema.vn', password: '123456' }),
      prisma.user.findUnique({ where: { email: 'admin@cinema.vn' }, select: { id: true } }),
    ]);

    adminToken = adminLogin.body.data.accessToken;
    customerToken = customerLogin.body.data.accessToken;
    existingStaffToken = staffLogin.body.data.accessToken;
    adminId = admin!.id;

    const cinemas = await prisma.$transaction([
      prisma.cinema.create({
        data: { name: `Staff management cinema ${identifier}`, address: '1 Test Street' },
      }),
      prisma.cinema.create({
        data: { name: `Alternate staff cinema ${identifier}`, address: '2 Test Street' },
      }),
    ]);
    cinemaId = cinemas[0].id;
    alternateCinemaId = cinemas[1].id;
    cinemaIds.push(cinemaId, alternateCinemaId);

    const fixtureStaff = await prisma.$transaction([
      prisma.user.create({
        data: {
          name: 'Orphan Staff Fixture',
          email: `orphan-${identifier}@cinema.vn`,
          password: 'fixture-hash',
          role: 'STAFF',
        },
      }),
      prisma.user.create({
        data: {
          name: `${listSearchTerm} active one`,
          email: `${listSearchTerm}-active-1@cinema.vn`,
          password: 'fixture-hash',
          role: 'STAFF',
          isActive: true,
          assignedCinemaId: cinemaId,
        },
      }),
      prisma.user.create({
        data: {
          name: `${listSearchTerm} active two`,
          email: `${listSearchTerm}-active-2@cinema.vn`,
          password: 'fixture-hash',
          role: 'STAFF',
          isActive: true,
          assignedCinemaId: cinemaId,
        },
      }),
      prisma.user.create({
        data: {
          name: `${listSearchTerm} inactive`,
          email: `${listSearchTerm}-inactive@cinema.vn`,
          password: 'fixture-hash',
          role: 'STAFF',
          isActive: false,
          assignedCinemaId: alternateCinemaId,
        },
      }),
    ]);
    orphanStaffId = fixtureStaff[0].id;
    testStaffIds.push(...fixtureStaff.map((member) => member.id));
  });

  afterAll(async () => {
    if (createdStaffId) testStaffIds.push(createdStaffId);
    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: { in: testStaffIds } },
          { email: { contains: identifier } },
        ],
      },
    });
    await prisma.cinema.deleteMany({ where: { id: { in: cinemaIds } } });
  });

  it('rejects Customer and Staff access to the staff management list', async () => {
    const [customerResponse, staffResponse] = await Promise.all([
      request(app).get('/api/v1/admin/staff').set('Authorization', `Bearer ${customerToken}`),
      request(app).get('/api/v1/admin/staff').set('Authorization', `Bearer ${existingStaffToken}`),
    ]);

    expect(customerResponse.status).toBe(403);
    expect(customerResponse.body.error.code).toBe('FORBIDDEN');
    expect(staffResponse.status).toBe(403);
    expect(staffResponse.body.error.code).toBe('FORBIDDEN');
  });

  it('forwards an authentication database lookup failure to the global error handler', async () => {
    const userDelegate = prisma.user;
    const originalFindUnique = userDelegate.findUnique.bind(userDelegate);
    vi.spyOn(userDelegate, 'findUnique')
      .mockRejectedValueOnce(new Error('Database unavailable'))
      .mockImplementation(originalFindUnique);

    const response = await request(app)
      .get('/api/v1/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('allows Admin to create an active Staff assigned to a real cinema without returning a password', async () => {
    const response = await request(app)
      .post('/api/v1/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Staff Management Test',
        email: staffEmail,
        password: staffPassword,
        phone: '0901234567',
        assignedCinemaId: cinemaId,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      name: 'Staff Management Test',
      email: staffEmail,
      phone: '0901234567',
      isActive: true,
      assignedCinema: { id: cinemaId },
    });
    expect(response.body.data).not.toHaveProperty('password');
    expect(JSON.stringify(response.body.data)).not.toContain(staffPassword);
    createdStaffId = response.body.data.id;
  });

  it('lists Staff summaries without password hashes', async () => {
    const response = await request(app)
      .get('/api/v1/admin/staff')
      .query({ search: staffEmail })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const createdStaff = response.body.data.items.find((staff: { id: string }) => staff.id === createdStaffId);
    expect(createdStaff).toMatchObject({
      id: createdStaffId,
      email: staffEmail,
      assignedCinema: { id: cinemaId },
    });
    expect(createdStaff).not.toHaveProperty('password');
    expect(response.body.data.pagination).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('lists an historical orphan Staff safely so an Admin can repair it', async () => {
    const response = await request(app)
      .get('/api/v1/admin/staff')
      .query({ search: `orphan-${identifier}@cinema.vn` })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toEqual([
      expect.objectContaining({
        id: orphanStaffId,
        assignedCinema: null,
      }),
    ]);
  });

  it('filters and paginates Staff in Prisma with stable metadata', async () => {
    const firstPage = await request(app)
      .get('/api/v1/admin/staff')
      .query({
        search: listSearchTerm,
        cinemaId,
        status: 'ACTIVE',
        page: 1,
        limit: 1,
      })
      .set('Authorization', `Bearer ${adminToken}`);
    const secondPage = await request(app)
      .get('/api/v1/admin/staff')
      .query({
        search: listSearchTerm,
        cinemaId,
        status: 'ACTIVE',
        page: 2,
        limit: 1,
      })
      .set('Authorization', `Bearer ${adminToken}`);
    const inactive = await request(app)
      .get('/api/v1/admin/staff')
      .query({ search: listSearchTerm, cinemaId: alternateCinemaId, status: 'INACTIVE' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.items).toHaveLength(1);
    expect(firstPage.body.data.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.data.items).toHaveLength(1);
    expect(secondPage.body.data.items[0].id).not.toBe(firstPage.body.data.items[0].id);
    expect(secondPage.body.data.pagination).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
    expect(inactive.status).toBe(200);
    expect(inactive.body.data.items).toEqual([
      expect.objectContaining({
        isActive: false,
        assignedCinema: expect.objectContaining({ id: alternateCinemaId }),
      }),
    ]);
  });

  it('rejects creation without a cinema and with an unknown cinema', async () => {
    const [missingCinemaResponse, unknownCinemaResponse] = await Promise.all([
      request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Missing Cinema', email: `missing-${identifier}@cinema.vn`, password: staffPassword }),
      request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Unknown Cinema',
          email: `unknown-${identifier}@cinema.vn`,
          password: staffPassword,
          assignedCinemaId: crypto.randomUUID(),
        }),
    ]);

    expect(missingCinemaResponse.status).toBe(400);
    expect(missingCinemaResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(unknownCinemaResponse.status).toBe(404);
    expect(unknownCinemaResponse.body.error.code).toBe('CINEMA_NOT_FOUND');
  });

  it('rejects blank, malformed, short, and oversized Staff creation fields', async () => {
    const responses = await Promise.all([
      request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '   ',
          email: `blank-${identifier}@cinema.vn`,
          password: staffPassword,
          assignedCinemaId: cinemaId,
        }),
      request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Email',
          email: `invalid-email-${identifier}`,
          password: staffPassword,
          assignedCinemaId: cinemaId,
        }),
      request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Short Password',
          email: `short-${identifier}@cinema.vn`,
          password: 'short',
          assignedCinemaId: cinemaId,
        }),
      request(app)
        .post('/api/v1/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'N'.repeat(101),
          email: `long-${identifier}@cinema.vn`,
          password: staffPassword,
          assignedCinemaId: cinemaId,
        }),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('preserves a valid cinema on profile update and rejects absent or invalid replacement cinemas', async () => {
    const renamedResponse = await request(app)
      .patch(`/api/v1/admin/staff/${createdStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Renamed Staff', assignedCinemaId: alternateCinemaId });

    expect(renamedResponse.status).toBe(200);
    expect(renamedResponse.body.data).toMatchObject({
      name: 'Renamed Staff',
      assignedCinema: { id: alternateCinemaId },
    });

    const retainedCinemaResponse = await request(app)
      .patch(`/api/v1/admin/staff/${createdStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ phone: '0907654321' });
    expect(retainedCinemaResponse.status).toBe(200);
    expect(retainedCinemaResponse.body.data.assignedCinema.id).toBe(alternateCinemaId);

    const [missingCinemaResponse, unknownCinemaResponse] = await Promise.all([
      request(app)
        .patch(`/api/v1/admin/staff/${createdStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedCinemaId: '' }),
      request(app)
        .patch(`/api/v1/admin/staff/${createdStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedCinemaId: crypto.randomUUID() }),
    ]);
    expect(missingCinemaResponse.status).toBe(400);
    expect(missingCinemaResponse.body.error.code).toBe('VALIDATION_ERROR');
    expect(unknownCinemaResponse.status).toBe(404);
    expect(unknownCinemaResponse.body.error.code).toBe('CINEMA_NOT_FOUND');
  });

  it('rejects non-string Staff update fields with a validation error', async () => {
    const responses = await Promise.all([
      request(app)
        .patch(`/api/v1/admin/staff/${createdStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 123 }),
      request(app)
        .patch(`/api/v1/admin/staff/${createdStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: null }),
      request(app)
        .patch(`/api/v1/admin/staff/${createdStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedCinemaId: 123 }),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects blank and oversized Staff update fields', async () => {
    const blankName = await request(app)
      .patch(`/api/v1/admin/staff/${createdStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '   ' });
    const oversizedName = await request(app)
      .patch(`/api/v1/admin/staff/${createdStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'N'.repeat(101) });

    for (const response of [blankName, oversizedName]) {
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects malformed Staff list queries with a validation error', async () => {
    const responses = await Promise.all([
      request(app)
        .get('/api/v1/admin/staff')
        .query({ status: 'DISABLED' })
        .set('Authorization', `Bearer ${adminToken}`),
      request(app)
        .get('/api/v1/admin/staff')
        .query({ page: 0 })
        .set('Authorization', `Bearer ${adminToken}`),
      request(app)
        .get('/api/v1/admin/staff')
        .query({ limit: 101 })
        .set('Authorization', `Bearer ${adminToken}`),
      request(app)
        .get('/api/v1/admin/staff')
        .query({ search: 'S'.repeat(101) })
        .set('Authorization', `Bearer ${adminToken}`),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects mutations of ADMIN accounts', async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/staff/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_ACCOUNT_PROTECTED');
  });

  it('blocks disabled Staff logins and requests made with a token issued before deactivation', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: staffEmail, password: staffPassword });
    expect(loginResponse.status).toBe(200);
    createdStaffToken = loginResponse.body.data.accessToken;

    const deactivateResponse = await request(app)
      .patch(`/api/v1/admin/staff/${createdStaffId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(deactivateResponse.status).toBe(200);
    expect(deactivateResponse.body.data.isActive).toBe(false);

    const [disabledLoginResponse, staleTokenResponse] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({ email: staffEmail, password: staffPassword }),
      request(app)
        .get('/api/v1/staff/showtimes/today')
        .set('Authorization', `Bearer ${createdStaffToken}`),
    ]);
    expect(disabledLoginResponse.status).toBe(403);
    expect(disabledLoginResponse.body.error.code).toBe('STAFF_ACCOUNT_DISABLED');
    expect(staleTokenResponse.status).toBe(403);
    expect(staleTokenResponse.body.error.code).toBe('STAFF_ACCOUNT_DISABLED');
  });
});
