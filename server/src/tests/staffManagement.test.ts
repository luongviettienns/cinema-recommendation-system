import { afterEach, describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';

const createdUserIds: string[] = [];
const createdCinemaIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }

  if (createdCinemaIds.length > 0) {
    await prisma.cinema.deleteMany({ where: { id: { in: createdCinemaIds } } });
    createdCinemaIds.length = 0;
  }
});

describe('staff management persistence', () => {
  it('persists an active STAFF user assigned to an existing cinema', async () => {
    const identifier = crypto.randomUUID();
    const cinema = await prisma.cinema.create({
      data: {
        name: `Staff persistence cinema ${identifier}`,
        address: '1 Test Street',
      },
    });
    createdCinemaIds.push(cinema.id);

    const staff = await prisma.user.create({
      data: {
        email: `staff-persistence-${identifier}@cinema.vn`,
        password: 'test-password-hash',
        name: 'Staff Persistence Test',
        role: Role.STAFF,
        isActive: true,
        assignedCinemaId: cinema.id,
      },
      include: { assignedCinema: true },
    });
    createdUserIds.push(staff.id);

    expect(staff.isActive).toBe(true);
    expect(staff.assignedCinemaId).toBe(cinema.id);
    expect(staff.assignedCinema?.id).toBe(cinema.id);
  });
});
