export {};
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { validationResult } = require('express-validator');
const { validateListingQuery, validateObjectId } = require('../middlewares/validation');

test('validateListingQuery: allows empty / no query parameters', async () => {
  const req = {
    query: {},
  };
  for (const middleware of validateListingQuery) {
    await new Promise((resolve) => {
      const res = {
        status: () => res,
        json: () => resolve(),
      };
      middleware(req, res, resolve);
    });
  }
  const errors = validationResult(req);
  assert.equal(errors.isEmpty(), true);
});

test('validateListingQuery: allows empty string query parameters without failing validation', async () => {
  const req = {
    query: {
      page: '',
      limit: '',
      minPrice: '',
      maxPrice: '',
      guests: '',
      rating: '',
      lat: '',
      lng: '',
      radius: '',
    },
  };
  for (const middleware of validateListingQuery) {
    await new Promise((resolve) => {
      const res = {
        status: () => res,
        json: () => resolve(),
      };
      middleware(req, res, resolve);
    });
  }
  const errors = validationResult(req);
  assert.equal(errors.isEmpty(), true);
});

test('validateListingQuery: validates positive numbers correctly', async () => {
  const req = {
    query: {
      page: '1',
      limit: '12',
      minPrice: '1000',
      maxPrice: '5000',
      guests: '2',
      rating: '4.5',
      lat: '28.3758',
      lng: '83.8083',
      radius: '25',
    },
  };
  for (const middleware of validateListingQuery) {
    await new Promise((resolve) => {
      const res = {
        status: () => res,
        json: () => resolve(),
      };
      middleware(req, res, resolve);
    });
  }
  const errors = validationResult(req);
  assert.equal(errors.isEmpty(), true);
});

test('validateListingQuery: rejects invalid values like negative numbers or out-of-range ratings', async () => {
  const req = {
    query: {
      page: '0',
      limit: '100',
      minPrice: '-50',
      rating: '6',
    },
  };
  for (const middleware of validateListingQuery) {
    await new Promise((resolve) => {
      const res = {
        status: () => res,
        json: () => resolve(),
      };
      middleware(req, res, resolve);
    });
  }
  const errors = validationResult(req);
  assert.equal(errors.isEmpty(), false);
  const errArray = errors.array();
  assert.ok(errArray.some((e: any) => e.path === 'page'));
  assert.ok(errArray.some((e: any) => e.path === 'limit'));
  assert.ok(errArray.some((e: any) => e.path === 'minPrice'));
  assert.ok(errArray.some((e: any) => e.path === 'rating'));
});

test('validateObjectId: rejects "undefined", "null", or malformed IDs with 400', async () => {
  const invalidIds = ['undefined', 'null', '123', 'host'];
  for (const invalidId of invalidIds) {
    const req = {
      params: { id: invalidId },
    };
    const middlewares = validateObjectId('id');
    for (const middleware of middlewares) {
      await new Promise((resolve) => {
        const res = {
          status: () => res,
          json: () => resolve(),
        };
        middleware(req, res, resolve);
      });
    }
    const errors = validationResult(req);
    assert.equal(errors.isEmpty(), false, `Expected validation error for id=${invalidId}`);
    assert.equal(errors.array()[0].path, 'id');
  }
});

test('validateObjectId: accepts valid 24-character hexadecimal MongoDB ObjectId', async () => {
  const req = {
    params: { id: '6aa3c3004e4b6d018b697e32' },
  };
  const middlewares = validateObjectId('id');
  for (const middleware of middlewares) {
    await new Promise((resolve) => {
      const res = {
        status: () => res,
        json: () => resolve(),
      };
      middleware(req, res, resolve);
    });
  }
  const errors = validationResult(req);
  assert.equal(errors.isEmpty(), true);
});
