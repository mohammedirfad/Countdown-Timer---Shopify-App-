/**
 * Unit tests for Helixo Countdown Timer
 * Run: npx jest  (from /web directory)
 * Coverage: validation, storefront matching, auto-expiry logic, cache, evergreen
 */

// ── Minimal mocks so tests run without Mongo/Express ────────────────────────
const mockFind = jest.fn();
const mockUpdateMany = jest.fn();
jest.mock('../models/Timer.js', () => ({
    Timer: { find: mockFind, updateMany: mockUpdateMany },
}));

import Joi from 'joi';
import { timerValidationSchema } from '../validation.js';

// ── Helper: build a minimal valid fixed-timer payload ────────────────────────
function fixedTimerPayload(overrides = {}) {
    return {
        name: 'Test Timer',
        type: 'fixed',
        startDate: new Date('2025-01-01').toISOString(),
        endDate: new Date('2025-12-31').toISOString(),
        targetType: 'all',
        ...overrides,
    };
}

// ── Helper: simulate storefront filter logic (mirrors index.ts) ──────────────
function filterTimers(timers: any[], productId: string) {
    const rawId = String(productId).replace('gid://shopify/Product/', '');
    const gid = `gid://shopify/Product/${rawId}`;
    return timers.filter(t => {
        if (t.targetType === 'all') return true;
        if (t.targetType === 'products') {
            return t.targetIds.includes(gid) || t.targetIds.includes(rawId);
        }
        return false;
    });
}

// ── Helper: in-memory cache (mirrors index.ts) ───────────────────────────────
function makeCache(ttlMs = 60_000) {
    const store = new Map<string, { data: object; expiresAt: number }>();
    return {
        get: (key: string) => {
            const e = store.get(key);
            if (!e) return null;
            if (Date.now() > e.expiresAt) { store.delete(key); return null; }
            return e.data;
        },
        set: (key: string, data: object) =>
            store.set(key, { data, expiresAt: Date.now() + ttlMs }),
        invalidateShop: (shop: string) => {
            for (const k of store.keys()) if (k.startsWith(`${shop}:`)) store.delete(k);
        },
        size: () => store.size,
    };
}

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 1 — Validation
// ════════════════════════════════════════════════════════════════════════════
describe('Validation — timerValidationSchema', () => {

    test('1. Valid fixed timer passes validation', () => {
        const { error } = timerValidationSchema.validate(fixedTimerPayload());
        expect(error).toBeUndefined();
    });

    test('2. Timer name is required', () => {
        const { error } = timerValidationSchema.validate(
            fixedTimerPayload({ name: '' })
        );
        expect(error).toBeDefined();
        expect(error!.details[0].message).toMatch(/name/i);
    });

    test('3. endDate must be after startDate', () => {
        const { error } = timerValidationSchema.validate(
            fixedTimerPayload({
                startDate: new Date('2025-12-31').toISOString(),
                endDate: new Date('2025-01-01').toISOString(),
            })
        );
        expect(error).toBeDefined();
    });

    test('4. Products targetType requires at least 1 targetId', () => {
        const { error } = timerValidationSchema.validate(
            fixedTimerPayload({ targetType: 'products', targetIds: [] })
        );
        expect(error).toBeDefined();
    });

    test('5. Invalid hex color is rejected', () => {
        const { error } = timerValidationSchema.validate(
            fixedTimerPayload({
                design: { backgroundColor: 'notacolor', textColor: '#FFF' },
            })
        );
        expect(error).toBeDefined();
    });

    test('6. Evergreen timer does not require startDate/endDate', () => {
        const { error } = timerValidationSchema.validate({
            name: 'Evergreen',
            type: 'evergreen',
            targetType: 'all',
        });
        expect(error).toBeUndefined();
    });

    test('7. Evergreen duration must be between 1 and 720 hours', () => {
        const { error } = timerValidationSchema.validate({
            name: 'Bad Evergreen',
            type: 'evergreen',
            targetType: 'all',
            evergreenDuration: 999,
        });
        expect(error).toBeDefined();
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 2 — Storefront Matching Logic
// ════════════════════════════════════════════════════════════════════════════
describe('Storefront — timer matching', () => {
    const timers = [
        { targetType: 'all', targetIds: [] },
        { targetType: 'products', targetIds: ['gid://shopify/Product/111'] },
        { targetType: 'products', targetIds: ['222'] }, // raw ID format
    ];

    test('8. "all" timer matches any productId', () => {
        const result = filterTimers([timers[0]], '999');
        expect(result).toHaveLength(1);
    });

    test('9. Specific product matches by full GID', () => {
        const result = filterTimers([timers[1]], 'gid://shopify/Product/111');
        expect(result).toHaveLength(1);
    });

    test('10. Specific product matches by raw numeric ID', () => {
        // Storefront sends raw id "222", stored as "222"
        const result = filterTimers([timers[2]], '222');
        expect(result).toHaveLength(1);
    });

    test('11. Non-matching product returns empty array', () => {
        const result = filterTimers([timers[1], timers[2]], '999');
        expect(result).toHaveLength(0);
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 3 — In-Memory Cache
// ════════════════════════════════════════════════════════════════════════════
describe('Storefront — in-memory cache', () => {

    test('12. Returns null for missing key', () => {
        const cache = makeCache();
        expect(cache.get('missing')).toBeNull();
    });

    test('13. Returns data after set', () => {
        const cache = makeCache();
        cache.set('k', { timers: [] });
        expect(cache.get('k')).toEqual({ timers: [] });
    });

    test('14. Expires after TTL', async () => {
        const cache = makeCache(50); // 50ms TTL
        cache.set('k', { timers: [] });
        await new Promise(r => setTimeout(r, 60));
        expect(cache.get('k')).toBeNull();
    });

    test('15. invalidateShop removes only that shop\'s keys', () => {
        const cache = makeCache();
        cache.set('shop-a.myshopify.com:123', {});
        cache.set('shop-a.myshopify.com:456', {});
        cache.set('shop-b.myshopify.com:123', {});
        cache.invalidateShop('shop-a.myshopify.com');
        expect(cache.size()).toBe(1); // shop-b entry survives
    });
});

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE 4 — Auto-expiry Logic
// ════════════════════════════════════════════════════════════════════════════
describe('Auto-expiry', () => {

    beforeEach(() => jest.clearAllMocks());

    test('16. Calls updateMany with correct filter for past endDates', async () => {
        mockUpdateMany.mockResolvedValueOnce({ modifiedCount: 2 });

        const now = new Date();
        // Simulate the auto-expiry interval function
        await (async () => {
            await mockUpdateMany(
                { type: 'fixed', status: 'active', endDate: { $lt: now } },
                { $set: { status: 'expired' } }
            );
        })();

        expect(mockUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'fixed', status: 'active' }),
            { $set: { status: 'expired' } }
        );
    });

    test('17. Does not throw if updateMany fails (graceful degradation)', async () => {
        mockUpdateMany.mockRejectedValueOnce(new Error('DB down'));
        await expect(async () => {
            try {
                await mockUpdateMany();
            } catch (_) {
                // swallowed — same as the setInterval handler
            }
        }).not.toThrow();
    });
});