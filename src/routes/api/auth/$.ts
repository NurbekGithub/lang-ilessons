import { createAPIFileRoute } from "@tanstack/react-start/api";
import { auth } from "@/lib/auth";
import { toWebRequest, fromWebResponse } from "@tanstack/react-start/server";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
    GET: async ({ request }) => {
        const webRequest = toWebRequest(request);
        const response = await auth.handler(webRequest);
        return fromWebResponse(response);
    },
    POST: async ({ request }) => {
        const webRequest = toWebRequest(request);
        const response = await auth.handler(webRequest);
        return fromWebResponse(response);
    },
});
