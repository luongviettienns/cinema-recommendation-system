import { describe, it, expect } from 'vitest';
import { cinemaService } from '../../../services/cinemaService';
import { INITIAL_CINEMAS } from '../../../data/mockCinemas';
import { TAG_DEFINITIONS, getTagByCode } from '../../../data/tagDefinitions';

describe('Cinema Service & Data Tests', () => {
  it('loads all mock cinemas with proper structures', async () => {
    const cinemas = await cinemaService.getAllCinemas();
    expect(cinemas.length).toBe(3);
    expect(cinemas.map((c) => c.name)).toContain('CineLight Landmark 81');
    expect(cinemas.map((c) => c.name)).toContain('CineLight Thủ Đức');
    expect(cinemas.map((c) => c.name)).toContain('CineLight Quận 1');
  });

  it('retrieves cinema by ID and slug', async () => {
    const cinema = await cinemaService.getCinemaById('cinema-landmark-81');
    expect(cinema).toBeDefined();
    expect(cinema?.totalRooms).toBe(7);
    expect(cinema?.formats).toContain('IMAX');
    expect(cinema?.transportationGuide.motorbike).toContain('hầm B2');
    expect(cinema?.transportationGuide.car).toContain('hầm B3');
  });

  it('contains comprehensive pricing table with weekday and weekend prices', async () => {
    const cinema = await cinemaService.getCinemaById('cinema-landmark-81');
    expect(cinema?.pricingTable.length).toBeGreaterThanOrEqual(4);
    const standard = cinema?.pricingTable.find((p) => p.ticketType.includes('Standard'));
    expect(standard).toBeDefined();
    expect(standard!.weekendPrice).toBeGreaterThan(standard!.weekdayPrice);
  });

  it('filters cinemas by region correctly', async () => {
    const tphcmCinemas = await cinemaService.getCinemasByRegion('TP. Hồ Chí Minh');
    expect(tphcmCinemas.length).toBe(3);
    const all = await cinemaService.getCinemasByRegion('Tất cả');
    expect(all.length).toBe(3);
  });
});

describe('Cinema Tag Definitions & Glossary Tests', () => {
  it('contains all 5 Vietnamese film age classifications', () => {
    const ageTags = TAG_DEFINITIONS.filter((t) => t.category === 'age');
    const codes = ageTags.map((t) => t.code);
    expect(codes).toContain('P');
    expect(codes).toContain('K');
    expect(codes).toContain('T13');
    expect(codes).toContain('T16');
    expect(codes).toContain('T18');
  });

  it('looks up tag by code case-insensitively', () => {
    const t18 = getTagByCode('t18');
    expect(t18).toBeDefined();
    expect(t18?.badgeBg).toContain('bg-rose-600');
    expect(t18?.description).toContain('18 tuổi');

    const imax = getTagByCode('imax');
    expect(imax).toBeDefined();
    expect(imax?.label).toContain('IMAX');
  });

  it('contains seat and language definitions', () => {
    const sub = getTagByCode('sub');
    expect(sub?.label).toContain('Phụ đề');

    const vip = getTagByCode('vip');
    expect(vip?.summary).toContain('Khu vực trung tâm');
  });
});
