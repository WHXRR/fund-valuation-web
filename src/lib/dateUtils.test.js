
import { describe, it, expect } from 'vitest';
import { isTradingDay, getEffectiveTransactionDate, getConfirmationDate } from './dateUtils';
import { addDays, subDays } from 'date-fns';

describe('dateUtils', () => {
  describe('isTradingDay', () => {
    it('should return true for weekdays', () => {
      const monday = new Date('2023-10-23'); // Monday
      const friday = new Date('2023-10-27'); // Friday
      expect(isTradingDay(monday)).toBe(true);
      expect(isTradingDay(friday)).toBe(true);
    });

    it('should return false for weekends', () => {
      const saturday = new Date('2023-10-28'); // Saturday
      const sunday = new Date('2023-10-29'); // Sunday
      expect(isTradingDay(saturday)).toBe(false);
      expect(isTradingDay(sunday)).toBe(false);
    });
  });

  describe('getEffectiveTransactionDate', () => {
    it('should return same day if trading day and before 3PM', () => {
      const monday = new Date('2023-10-23');
      const result = getEffectiveTransactionDate(monday, false);
      expect(result.toISOString().split('T')[0]).toBe('2023-10-23');
    });

    it('should return next trading day if trading day and after 3PM', () => {
      const monday = new Date('2023-10-23');
      const result = getEffectiveTransactionDate(monday, true);
      // Next day is Tuesday 2023-10-24
      expect(result.toISOString().split('T')[0]).toBe('2023-10-24');
    });

    it('should return next Monday if Friday after 3PM', () => {
      const friday = new Date('2023-10-27');
      const result = getEffectiveTransactionDate(friday, true);
      // Next trading day after Friday is Monday 2023-10-30
      expect(result.toISOString().split('T')[0]).toBe('2023-10-30');
    });

    it('should return next Monday if Saturday (regardless of time)', () => {
      const saturday = new Date('2023-10-28');
      const result = getEffectiveTransactionDate(saturday, false);
      // Saturday -> Monday 2023-10-30
      expect(result.toISOString().split('T')[0]).toBe('2023-10-30');
      
      const resultAfter3 = getEffectiveTransactionDate(saturday, true);
      expect(resultAfter3.toISOString().split('T')[0]).toBe('2023-10-30');
    });

    it('should return next Monday if Sunday', () => {
      const sunday = new Date('2023-10-29');
      const result = getEffectiveTransactionDate(sunday, false);
      expect(result.toISOString().split('T')[0]).toBe('2023-10-30');
    });
  });

  describe('getConfirmationDate (T+1)', () => {
    it('should return next day for Monday transaction', () => {
      const monday = new Date('2023-10-23'); // Effective Monday
      const result = getConfirmationDate(monday, 1);
      // Confirm Tuesday
      expect(result.toISOString().split('T')[0]).toBe('2023-10-24');
    });

    it('should return Monday for Friday transaction', () => {
      const friday = new Date('2023-10-27'); // Effective Friday
      const result = getConfirmationDate(friday, 1);
      // Confirm Monday
      expect(result.toISOString().split('T')[0]).toBe('2023-10-30');
    });

    it('should return Tuesday for Friday transaction (T+2)', () => {
      const friday = new Date('2023-10-27'); // Effective Friday
      const result = getConfirmationDate(friday, 2);
      // T+1 = Monday, T+2 = Tuesday
      expect(result.toISOString().split('T')[0]).toBe('2023-10-31');
    });
  });
});
