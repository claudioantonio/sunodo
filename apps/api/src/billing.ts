import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Account, Plan } from "@prisma/client";
import { FastifyPluginOptions } from "fastify";
import Stripe from "stripe";
import fp from "fastify-plugin";
import { FastifyTypebox } from "./types";

export type CustomerCreateParams = {
    email?: string;
    name?: string;
    description?: string;
    metadata?: Record<string, string>;
};

export type CheckoutParams = {
    email?: string;
    account: Account & { plan: Plan };
};

export interface BillingManager {
    /**
     * Creates
     * @param params customer information
     */
    createCustomer(params: CustomerCreateParams): Promise<string>;
    createCheckoutUrl(params: CheckoutParams): Promise<string | null>;
}

export class StripeBillingManager implements BillingManager {
    protected stripe: Stripe;

    constructor(stripe: Stripe) {
        this.stripe = stripe;
    }

    async createCustomer(params: CustomerCreateParams): Promise<string> {
        const customer = await this.stripe.customers.create({
            email: params.email,
            description: params.description,
            name: params.name,
            metadata: params.metadata,
        });
        return customer.id;
    }

    async createCheckoutUrl(params: CheckoutParams): Promise<string | null> {
        const session = await this.stripe.checkout.sessions.create({
            client_reference_id: params.account.id,
            customer_email: params.email,
            mode: "subscription",
            success_url: `${process.env.WEBSITE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            allow_promotion_codes: true,
            line_items: [{ price: params.account.plan.stripePriceId }],
        });
        return session.url;
    }
}

export type BillingPluginOptions = {
    billing: BillingManager;
    stripeSigningSecret: string;
} & FastifyPluginOptions;

const billingPlugin: FastifyPluginAsyncTypebox<BillingPluginOptions> = async (
    server: FastifyTypebox,
    options
) => {
    server.decorate<BillingManager>("billing", options.billing);

    server.post(
        "/stripe/webhook",
        {
            config: {
                rawBody: true,
            },
        },
        async (request, reply) => {
            const { prisma, stripe } = request.server;
            let event: Stripe.Event;
            try {
                event = stripe.webhooks.constructEvent(
                    request.rawBody!,
                    request.headers["stripe-signature"]!,
                    options.stripeSigningSecret
                );
            } catch (e) {
                return reply
                    .status(400)
                    .send("Webhook signature verification failed");
            }
            const data = event.data;

            switch (event.type) {
                case "customer.subscription.updated":
                    const subscription = event.data
                        .object as Stripe.Subscription;

                    // XXX: code below is not nice
                    // XXX: transfer code to BillingManager class
                    let account: Account | undefined = undefined;
                    const user = await prisma.user.findUnique({
                        where: {
                            billingCustomerId: subscription.customer as string,
                        },
                        include: { account: true },
                    });
                    if (user) {
                        account = user.account;
                    } else {
                        const organization =
                            await prisma.organization.findUnique({
                                where: {
                                    billingCustomerId:
                                        subscription.customer as string,
                                },
                                include: { account: true },
                            });
                        if (organization) {
                            account = organization.account;
                        }
                    }

                    if (!account) {
                        // return coult not find account
                        return reply.code(400).send();
                    }

                    prisma.account.update({
                        where: { id: account.id },
                        data: { billingSubscriptionId: subscription.id },
                    });

                    // XXX: save itemId for usage reporting?
                    const itemId = subscription.items.data[0].id;
                    break;
            }
            if (event.type === "") {
            }
        }
    );
};

export default fp(billingPlugin);
