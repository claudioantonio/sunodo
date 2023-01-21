import { handlerPath } from "@libs/handler-resolver";
import schema from "./schema";

const config = {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            http: {
                method: "post",
                path: "auth/login",
                request: {
                    schemas: {
                        "application/json": schema,
                    },
                },
            },
        },
    ],
};

export default config;
