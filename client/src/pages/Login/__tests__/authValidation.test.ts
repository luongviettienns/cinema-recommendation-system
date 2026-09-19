import { describe, it, expect } from 'vitest';
import { loginSchema } from '../Login';
import { registerSchema } from '../../Register/Register';

describe('Authentication Form Validation (Zod Schemas)', () => {
  describe('Login Schema', () => {
    it('accepts valid email and password >= 6 chars', () => {
      const result = loginSchema.safeParse({
        email: 'customer@cinelight.vn',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email-address',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('email');
      }
    });

    it('rejects password shorter than 6 characters', () => {
      const result = loginSchema.safeParse({
        email: 'customer@cinelight.vn',
        password: '12345',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('6 ký tự');
      }
    });
  });

  describe('Register Schema', () => {
    it('accepts valid registration payload with Vietnamese phone number', () => {
      const result = registerSchema.safeParse({
        name: 'Trần Văn B',
        email: 'tranvanb@cinelight.vn',
        phone: '0908765432',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
      });
      expect(result.success).toBe(true);
    });

    it('validates Vietnamese phone numbers correctly (03, 05, 07, 08, 09)', () => {
      const validPhones = ['0381234567', '0521234567', '0771234567', '0851234567', '0912345678'];
      validPhones.forEach((phone) => {
        const result = registerSchema.safeParse({
          name: 'Test User',
          email: 'test@example.com',
          phone,
          password: 'password123',
          confirmPassword: 'password123',
        });
        expect(result.success).toBe(true);
      });

      const invalidPhones = ['12345', '0123456789', 'abcdefghij', '090123'];
      invalidPhones.forEach((phone) => {
        const result = registerSchema.safeParse({
          name: 'Test User',
          email: 'test@example.com',
          phone,
          password: 'password123',
          confirmPassword: 'password123',
        });
        expect(result.success).toBe(false);
      });
    });

    it('rejects registration when confirmPassword does not match password', () => {
      const result = registerSchema.safeParse({
        name: 'Nguyễn C',
        email: 'nguyenc@cinelight.vn',
        phone: '0901234567',
        password: 'password123',
        confirmPassword: 'mismatchPassword456',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const mismatchIssue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
        expect(mismatchIssue).toBeDefined();
        expect(mismatchIssue?.message).toContain('không khớp');
      }
    });

    it('rejects name with less than 2 characters', () => {
      const result = registerSchema.safeParse({
        name: 'A',
        email: 'user@example.com',
        phone: '0901234567',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });
});
