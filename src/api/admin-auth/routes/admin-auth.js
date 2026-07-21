'use strict';

/**
 * admin-auth router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
    routes: [
        {
            method: "GET",
            path: "/admin-auth/me",
            handler: "admin-auth.me",
            config: {
                auth: false,
            },
        },
        {
            method: "POST",
            path: "/admin-auth/change-password",
            handler: "admin-auth.changePassword",
        },
    ],
};