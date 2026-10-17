/**
 * Org `product_tax_code` on the Stripe products Autumn creates.
 *
 * Unset → no `tax_code` param and the product idempotency keys stay as they were.
 * Set → `tax_code` param, and the keys carry it so a create retried after the
 * code changed is a new request instead of a Stripe idempotency mismatch.
 */

import { describe, expect, test } from "bun:test";
import { OrgConfigSchema } from "@autumn/shared";
import {
	buildStripeFeatureProductIdempotencyKey,
	buildStripeProductIdempotencyKey,
} from "@/external/stripe/prices/utils/buildIdempotencyKey.js";
import {
	orgToStripeProductTaxCode,
	orgToStripeProductTaxCodeParams,
} from "@/external/stripe/products/utils/orgToStripeProductTaxCode.js";

const orgWith = (product_tax_code?: string | null) => ({
	config: OrgConfigSchema.parse({ product_tax_code }),
});

describe("orgToStripeProductTaxCodeParams", () => {
	test("adds nothing when the org sets no tax code", () => {
		for (const org of [orgWith(), orgWith(null)]) {
			expect(orgToStripeProductTaxCodeParams({ org })).toEqual({});
			expect(orgToStripeProductTaxCode({ org })).toBeUndefined();
		}
	});

	test("sets the org's tax code", () => {
		const org = orgWith("txcd_10103000");
		expect(orgToStripeProductTaxCodeParams({ org })).toEqual({
			tax_code: "txcd_10103000",
		});
	});
});

describe("product_tax_code validation", () => {
	test.each(["txcd_10103000", "txcd_00000000"])("accepts %s", (code) => {
		expect(
			OrgConfigSchema.partial().safeParse({ product_tax_code: code }).success,
		).toBe(true);
	});

	test.each([
		"10103000",
		"txcd_1010300",
		"txcd_101030001",
		"TXCD_10103000",
		"",
	])("rejects %p", (code) => {
		expect(
			OrgConfigSchema.partial().safeParse({ product_tax_code: code }).success,
		).toBe(false);
	});
});

describe("product idempotency keys", () => {
	test("are unchanged without a tax code", () => {
		expect(
			buildStripeProductIdempotencyKey({ productInternalId: "ip_1" }),
		).toBe(
			buildStripeProductIdempotencyKey({
				productInternalId: "ip_1",
				taxCode: undefined,
			}),
		);
		expect(
			buildStripeProductIdempotencyKey({ productInternalId: "ip_1" }),
		).toEndWith("product:ip_1");
		expect(
			buildStripeFeatureProductIdempotencyKey({ featureInternalId: "if_1" }),
		).toEndWith("product:feature:if_1");
	});

	test("differ per tax code", () => {
		const plain = buildStripeProductIdempotencyKey({
			productInternalId: "ip_1",
		});
		const taxed = buildStripeProductIdempotencyKey({
			productInternalId: "ip_1",
			taxCode: "txcd_10103000",
		});
		const otherTaxed = buildStripeProductIdempotencyKey({
			productInternalId: "ip_1",
			taxCode: "txcd_10103001",
		});
		expect(new Set([plain, taxed, otherTaxed]).size).toBe(3);

		expect(
			buildStripeFeatureProductIdempotencyKey({
				featureInternalId: "if_1",
				taxCode: "txcd_10103000",
			}),
		).not.toBe(
			buildStripeFeatureProductIdempotencyKey({ featureInternalId: "if_1" }),
		);
	});
});
