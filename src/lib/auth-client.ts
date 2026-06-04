import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { RENDER_API_BASE_URL } from "../config";

export const authClient = createAuthClient({
    // O backend roda na porta 3001. RENDER_API_BASE_URL já é http://localhost:3001/api
    // O Better Auth por padrão já adiciona /api/auth, então precisamos do host base.
    baseURL: RENDER_API_BASE_URL.replace(/\/api$/, ''),
    fetchOptions: {
        onRequest: (context) => {
            const token = sessionStorage.getItem('authToken');
            if (token) {
                context.request.headers.set('Authorization', `Bearer ${token}`);
            }
        }
    },
    plugins: [
        passkeyClient()
    ]
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    passkey
} = authClient;
