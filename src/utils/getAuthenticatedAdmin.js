"use strict";

module.exports = async function getAuthenticatedAdmin(ctx) {
    const authHeader = ctx.request.header.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        ctx.unauthorized("Missing token");
        return null;
    }

    const token = authHeader.replace("Bearer ", "");

    const jwtService = strapi
        .plugin("users-permissions")
        .service("jwt");

    const payload = await jwtService.verify(token);

    if (!payload?.id) {
        ctx.unauthorized("Invalid token");
        return null;
    }

    const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
            where: {
                id: payload.id,
            },
            populate: {
                role: true,
            },
        });

    if (!user) {
        ctx.unauthorized();
        return null;
    }

    if (user.role?.name !== "Admin") {
        ctx.forbidden("Not an admin");
        return null;
    }

    return user;
};