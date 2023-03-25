import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { FastifyTypebox } from "../../types";
import { eventsHandler, tokenHandler } from "./registry.handlers";
import { EventNotificationSchema, TokenSchema } from "./registry.schemas";

const routes: FastifyPluginAsyncTypebox = async (server: FastifyTypebox) => {
    server.get(
        "/token",
        {
            schema: TokenSchema,
            preValidation: server.authenticate,
        },
        tokenHandler
    );

    server.addContentTypeParser(
        "application/vnd.docker.distribution.events.v1+json",
        { parseAs: "string" },
        server.getDefaultJsonParser("ignore", "ignore")
    );
    server.post("/events", { schema: EventNotificationSchema }, eventsHandler);
};

export default routes;
