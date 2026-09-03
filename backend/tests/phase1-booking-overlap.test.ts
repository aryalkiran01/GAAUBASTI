export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const { overlappingDateWindow, validateBookingDates } = require('../services/bookingAvailability');

const day1 = new Date('2026-10-01');
const day2 = new Date('2026-10-02');
const day3 = new Date('2026-10-03');
const day4 = new Date('2026-10-04');
const day5 = new Date('2026-10-05');

test('overlap: identical dates conflict', () => {
  assert.equal(overlappingDateWindow(day1, day3, day1, day3), true);
});

test('overlap: partial overlap conflicts', () => {
  assert.equal(overlappingDateWindow(day1, day3, day2, day4), true);
});

test('overlap: contained booking conflicts', () => {
  assert.equal(overlappingDateWindow(day1, day5, day2, day4), true);
});

test('overlap: containing booking conflicts', () => {
  assert.equal(overlappingDateWindow(day2, day4, day1, day5), true);
});

test('overlap: adjacent dates do NOT conflict (checkout = next checkin)', () => {
  assert.equal(overlappingDateWindow(day1, day2, day2, day3), false);
  assert.equal(overlappingDateWindow(day2, day3, day1, day2), false);
});

test('overlap: completely separate dates do NOT conflict', () => {
  assert.equal(overlappingDateWindow(day1, day2, day3, day5), false);
});

test('date validation rejects past dates', () => {
  const past = new Date('2020-01-01');
  const future = new Date();
  future.setDate(future.getDate() + 2);
  const result = validateBookingDates(past.toISOString().slice(0, 10), future.toISOString().slice(0, 10));
  assert.equal(result.valid, false);
  assert.match(result.message, /past/i);
});

test('date validation rejects end before start', () => {
  const result = validateBookingDates('2026-10-05', '2026-10-01');
  assert.equal(result.valid, false);
  assert.match(result.message, /after check-in/i);
});

test('date validation accepts valid future range', () => {
  const start = new Date();
  start.setDate(start.getDate() + 10);
  const end = new Date();
  end.setDate(end.getDate() + 12);
  const result = validateBookingDates(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  assert.equal(result.valid, true);
});
