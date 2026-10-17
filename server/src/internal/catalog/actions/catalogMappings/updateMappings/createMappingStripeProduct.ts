import { createStripeCli } from "@/external/connect/createStripeCli.js";
import { orgToStripeProductTaxCodeParams } from "@/external/stripe/products/utils/orgToStripeProductTaxCode.js";
import type { AutumnContext } from "@/honoUtils/HonoEnv.js";

export const createMappingStripeProduct = async ({
	ctx,
	name,
}: {
	ctx: AutumnContext;
	name: string;
}) => {
	const stripeCli = createStripeCli({ org: ctx.org, env: ctx.env });
	const stripeProduct = await stripeCli.products.create({
		name,
		...orgToStripeProductTaxCodeParams({ org: ctx.org }),
	});
	return stripeProduct.id;
};
