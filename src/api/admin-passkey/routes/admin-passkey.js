module.exports = {
    routes: [
        {
            method: "POST",
            path: "/admin-passkey/register/options",
            handler: "admin-passkey.registerOptions",
            config: {
                auth: false,
            },
        },
        {
            method: "POST",
            path: "/admin-passkey/register/verify",
            handler: "admin-passkey.registerVerify",
            config: {
                auth: false,
            },
        },
        {
            method: "POST",
            path: "/admin-passkey/login/options",
            handler: "admin-passkey.loginOptions",
            config: {
                auth: false,
            },
        },
        {
            method: "POST",
            path: "/admin-passkey/login/verify",
            handler: "admin-passkey.loginVerify",
            config: {
                auth: false,
            },
        },
    ],
};