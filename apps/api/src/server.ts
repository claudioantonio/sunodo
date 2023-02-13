import Fastify from "fastify";
import jwt from "fastify-auth0-verify";
import stripe from "fastify-stripe";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import rawBody from "fastify-raw-body";
import {
    TypeBoxTypeProvider,
    TypeBoxValidatorCompiler,
} from "@fastify/type-provider-typebox";
import { PrismaClient } from "@prisma/client";

import billingPlugin, { BillingManager } from "./billing";
import appsRoutes from "./modules/apps/apps.routes";
import authRoutes from "./modules/auth/auth.routes";
import chainsRoutes from "./modules/chains/chains.routes";
import orgsRoutes from "./modules/orgs/orgs.routes";
import regionsRoutes from "./modules/regions/regions.routes";
import runtimesRoutes from "./modules/runtimes/runtimes.routes";
import { FastifyTypebox } from "./types";

const issuer = process.env.AUTH_ISSUER;
const stripeApiKey = process.env.STRIPE_SECRET_KEY!;

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: { id: number };
        user: {
            iss: string;
            sub: string;
            aud: string[];
            iat: number;
            exp: number;
            azp: string;
            scope: string;
        };
    }
}

export interface ServerOptions {
    prisma: PrismaClient;
    billing: BillingManager;
    logger: boolean;
}

const buildServer = async (options: ServerOptions): Promise<FastifyTypebox> => {
    const server: FastifyTypebox = Fastify({
        logger: options.logger,
        ajv: {
            customOptions: {
                allErrors: true,
            },
        },
    })
        .setValidatorCompiler(TypeBoxValidatorCompiler)
        .withTypeProvider<TypeBoxTypeProvider>();

    // healthcheck
    server.get("/healthz", async (request, response) => {
        return {
            status: "OK",
        };
    });

    // make PrismaClient available through the fastify server instance and server request
    server
        .decorate<PrismaClient>("prisma", options.prisma)
        .addHook("onRequest", async (request, reply) => {
            request.prisma = options.prisma;
        })
        .addHook("onClose", async (server: FastifyTypebox) => {
            // disconnect here
            await server.prisma?.$disconnect();
        });

    // setup JWT validator using Auth0
    await server.register(jwt, {
        domain: issuer,
        audience: ["https://api.sunodo.io", `${issuer}userinfo`],
    });

    // install this plugin so we can access the rawBody property of the request, so we can use in stripe webhook
    await server.register(rawBody, { global: false });

    // stripe plugin
    await server.register(stripe, {
        apiKey: stripeApiKey,
        apiVersion: "2022-11-15",
        typescript: true,
    });

    // billing manager plugin
    await server.register(billingPlugin, {
        billing: options.billing,
        stripeSigningSecret: process.env.STRIPE_SECRET_KEY!,
    });

    // register schemas
    // server.addSchema(createSchema);

    // swagger
    await server.register(swagger, {
        openapi: {
            info: {
                title: "Sunodo API",
                description: "Sunodo = Cartesi DApp management API",
                version: "v1",
            },
            components: {
                securitySchemes: {
                    openId: {
                        type: "openIdConnect",
                        openIdConnectUrl: `${issuer}.well-known/openid-configuration`,
                    },
                },
            },
        },
    });
    await server.register(swaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
            deepLinking: false,
        },
        initOAuth: {
            clientId: process.env.AUTH_OPEN_API_CLIENT_ID,
            scopes: ["email", "openid", "profile"],
        },
    });

    // register application routes
    await server.register(appsRoutes, { prefix: "apps" });
    await server.register(authRoutes, { prefix: "auth" });
    await server.register(chainsRoutes, { prefix: "chains" });
    await server.register(orgsRoutes, { prefix: "orgs" });
    await server.register(regionsRoutes, { prefix: "regions" });
    await server.register(runtimesRoutes, { prefix: "runtimes" });

    return server;
};

export default buildServer;
