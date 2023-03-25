import { Static, Type } from "@sinclair/typebox";

const TokenResponseSchema = Type.Object({
    token: Type.String({ description: "bearer access token" }),
    expires_in: Type.Number({
        description:
            "the duration in seconds since the token was issued that it will remain valid",
    }),
    issued_at: Type.Optional(
        Type.String({
            description:
                "the RFC3339-serialized UTC standard time at which a given token was issued",
        })
    ),
    refresh_token: Type.Optional(
        Type.String({
            description:
                "token which can be used to get additional access tokens for the same subject with different scopes",
        })
    ),
});

export const TokenSchema = {
    summary: "Docker registry authentication",
    querystring: Type.Object({
        client_id: Type.Optional(
            Type.String({
                description: "string identifying the client",
                examples: ["ygIbNE0FiaWydgT6LH1aRdQlUJUf1rYe"],
            })
        ),
        offline_token: Type.Optional(
            Type.String({
                description:
                    "whether to return a refresh token along with the bearer token",
                examples: ["true", "false"],
            })
        ),
        service: Type.String({
            description: "service requesting authentication",
            examples: ["registry.sunodo.io"],
        }),
        scope: Type.Optional(
            Type.String({
                description: "requested repositories authorization",
                examples: ["repository:samalba/my-app:pull,push"],
            })
        ),
        account: Type.Optional(
            Type.String({ description: "username logging in" })
        ),
        hostname: Type.Optional(
            Type.String({ description: "hostname called by registry" })
        ),
        remoteAddress: Type.Optional(
            Type.String({
                description: "remote address of egistry",
            })
        ),
        remotePort: Type.Optional(
            Type.Number({ description: "port of registry" })
        ),
    }),
    response: {
        200: TokenResponseSchema,
    },
};

export type TokenResponse = Static<typeof TokenResponseSchema>;

const EventSchema = Type.Object({
    id: Type.String({
        description: "ID provides a unique identifier for the event.",
    }),
    timestamp: Type.String({
        description: "Timestamp is the time at which the event occurred.",
    }),
    action: Type.String({
        description:
            "Action indicates what action encompasses the provided event.",
    }),
    target: Type.Object({
        mediaType: Type.Optional(Type.String()),
        size: Type.Optional(Type.Number()),
        digest: Type.String(),
        length: Type.Optional(Type.Number()),
        repository: Type.String(),
        url: Type.Optional(Type.String()),
        tag: Type.Optional(Type.String()),
    }),
    request: Type.Object({
        id: Type.String(),
        addr: Type.String(),
        host: Type.String(),
        method: Type.String(),
        useragent: Type.String(),
    }),
    actor: Type.Object({
        name: Type.String(),
    }),
    source: Type.Object({
        addr: Type.String(),
        instanceID: Type.String(),
    }),
});

export const EventNotificationSchema = {
    body: Type.Object({ events: Type.Array(EventSchema) }),
};
