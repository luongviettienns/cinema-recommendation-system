import { describe, it, expect } from 'vitest';

describe('Staff Console Subsystem - Logic & Flow Verification', () => {
  describe('Role-Based Access Control (RBAC) Logic', () => {
    const checkStaffAccess = (role?: 'customer' | 'admin' | 'staff') => {
      return role === 'staff' || role === 'admin';
    };

    const checkAdminAccess = (role?: 'customer' | 'admin' | 'staff') => {
      return role === 'admin';
    };

    it('allows STAFF role to access Staff Console', () => {
      expect(checkStaffAccess('staff')).toBe(true);
    });

    it('allows ADMIN role to access Staff Console (for desk supervision)', () => {
      expect(checkStaffAccess('admin')).toBe(true);
    });

    it('strictly denies CUSTOMER role from accessing Staff Console', () => {
      expect(checkStaffAccess('customer')).toBe(false);
      expect(checkStaffAccess(undefined)).toBe(false);
    });

    it('strictly denies STAFF role from accessing Admin Dashboard', () => {
      expect(checkAdminAccess('staff')).toBe(false);
    });

    it('allows ADMIN role to access Admin Dashboard', () => {
      expect(checkAdminAccess('admin')).toBe(true);
    });
  });

  describe('Box Office Sale Pricing Logic', () => {
    const calculateBoxOfficeTotal = (seats: string[], pricePerSeat = 95000) => {
      if (seats.length > 8) throw new Error('Tối đa 8 vé cho 1 lần bán tại quầy');
      return seats.length * pricePerSeat;
    };

    it('calculates single ticket walk-in price accurately', () => {
      expect(calculateBoxOfficeTotal(['E5'])).toBe(95000);
    });

    it('calculates multiple tickets walk-in price accurately', () => {
      expect(calculateBoxOfficeTotal(['E5', 'E6', 'E7'])).toBe(285000);
    });

    it('rejects booking more than 8 tickets at box office desk', () => {
      const nineSeats = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9'];
      expect(() => calculateBoxOfficeTotal(nineSeats)).toThrow('Tối đa 8 vé cho 1 lần bán tại quầy');
    });
  });

  describe('QR Check-in & Double-Scan Detection Logic', () => {
    const scannedCodes = new Set<string>(['CL-624109', 'TK-100200']);

    const processQRCheckIn = (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return { success: false, reason: 'EMPTY_CODE' };
      if (scannedCodes.has(cleanCode)) {
        return { success: false, reason: 'ALREADY_SCANNED', code: cleanCode };
      }
      scannedCodes.add(cleanCode);
      return { success: true, reason: 'CHECKED_IN', code: cleanCode };
    };

    it('successfully checks in a valid new ticket QR', () => {
      const result = processQRCheckIn('CL-998877');
      expect(result.success).toBe(true);
      expect(result.reason).toBe('CHECKED_IN');
      expect(result.code).toBe('CL-998877');
    });

    it('detects and rejects duplicate check-in (double-scan prevention)', () => {
      const result = processQRCheckIn('CL-624109');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('ALREADY_SCANNED');
    });

    it('handles case-insensitive QR input from hardware scanners', () => {
      const result = processQRCheckIn('tk-100200');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('ALREADY_SCANNED');
    });
  });

  describe('Seat Swap Incident Handling Logic', () => {
    const swapSeat = (
      bookedSeats: string[],
      brokenSeat: string,
      targetSeat: string,
      availableRoomSeats: string[]
    ) => {
      if (!bookedSeats.includes(brokenSeat)) {
        throw new Error('Ghế cần đổi không thuộc vé này');
      }
      if (brokenSeat === targetSeat) {
        throw new Error('Ghế mới không thể trùng với ghế sự cố');
      }
      if (!availableRoomSeats.includes(targetSeat)) {
        throw new Error('Ghế mới không khả dụng');
      }

      const updated = bookedSeats.map((s) => (s === brokenSeat ? targetSeat : s));
      return {
        updatedSeats: updated,
        swappedFrom: brokenSeat,
        swappedTo: targetSeat,
        swappedAt: new Date().toISOString(),
      };
    };

    it('successfully swaps a broken seat with an available empty seat', () => {
      const result = swapSeat(['E5', 'E6'], 'E5', 'E8', ['E7', 'E8', 'E9']);
      expect(result.updatedSeats).toEqual(['E8', 'E6']);
      expect(result.swappedFrom).toBe('E5');
      expect(result.swappedTo).toBe('E8');
    });

    it('rejects swapping with the same broken seat', () => {
      expect(() => swapSeat(['E5', 'E6'], 'E5', 'E5', ['E5', 'E8'])).toThrow(
        'Ghế mới không thể trùng với ghế sự cố'
      );
    });

    it('rejects swapping an unavailable seat', () => {
      expect(() => swapSeat(['E5', 'E6'], 'E5', 'F1', ['E7', 'E8'])).toThrow(
        'Ghế mới không khả dụng'
      );
    });
  });
});
