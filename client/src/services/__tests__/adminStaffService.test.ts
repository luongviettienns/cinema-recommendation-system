import { describe, expect, it } from 'vitest';
import {
  createStaff,
  getCinemaOptions,
  listStaff,
  updateStaff,
} from '../adminStaffService';

describe('adminStaffService (mock mode fidelity)', () => {
  it('lists staff with pagination and filters in mock mode', async () => {
    const result = await listStaff({ page: 1, limit: 1 });
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    expect(result.items).toHaveLength(1);
    expect(result.pagination).toMatchObject({
      page: 1,
      limit: 1,
    });
    expect(result.pagination.total).toBeGreaterThanOrEqual(2);
  });

  it('preserves existing phone when updateStaff omits the phone field', async () => {
    const cinemas = await getCinemaOptions();
    const created = await createStaff({
      name: 'Nguyen Van Test Phone',
      email: 'test.phone@cinelight.vn',
      password: 'Password123!',
      phone: '0988776655',
      assignedCinemaId: cinemas[0].id,
    });
    expect(created.phone).toBe('0988776655');

    // Update only name
    const updatedName = await updateStaff(created.id, {
      name: 'Nguyen Van Test Phone Renamed',
    });
    expect(updatedName.name).toBe('Nguyen Van Test Phone Renamed');
    expect(updatedName.phone).toBe('0988776655');

    // Update cinema
    const updatedCinema = await updateStaff(created.id, {
      assignedCinemaId: cinemas[1].id,
    });
    expect(updatedCinema.assignedCinema?.id).toBe(cinemas[1].id);
    expect(updatedCinema.phone).toBe('0988776655');
  });

  it('supports toggling isActive in both directions (disable and reactivate)', async () => {
    const cinemas = await getCinemaOptions();
    const member = await createStaff({
      name: 'Staff Status Toggle',
      email: 'toggle.status@cinelight.vn',
      password: 'Password123!',
      assignedCinemaId: cinemas[0].id,
    });
    expect(member.isActive).toBe(true);

    const disabled = await updateStaff(member.id, { isActive: false });
    expect(disabled.isActive).toBe(false);

    const reactivated = await updateStaff(member.id, { isActive: true });
    expect(reactivated.isActive).toBe(true);
  });
});
