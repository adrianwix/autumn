import type { Organization } from "@autumn/shared";

/** The `tax_code` every Stripe product Autumn creates for this org carries;
 * undefined leaves the product on Stripe's preset tax code. */
export const orgToStripeProductTaxCode = ({
	org,
}: {
	org: Pick<Organization, "config">;
}): string | undefined => org.config?.product_tax_code ?? undefined;

/** Spread into a `products.create` body or a Checkout `product_data`. */
export const orgToStripeProductTaxCodeParams = ({
	org,
}: {
	org: Pick<Organization, "config">;
}): { tax_code?: string } => {
	const taxCode = orgToStripeProductTaxCode({ org });
	return taxCode ? { tax_code: taxCode } : {};
};
