// "use strict";

// module.exports = {

//     async me(ctx) {

//         try {

//             //----------------------------------------
//             // Read JWT
//             //----------------------------------------

//             const auth = ctx.request.header.authorization;

//             if (!auth?.startsWith("Bearer ")) {

//                 return ctx.unauthorized("Missing token");

//             }

//             const token = auth.replace("Bearer ", "");

//             //----------------------------------------
//             // Validate JWT
//             //----------------------------------------

//             const jwtService =
//                 strapi.plugin("users-permissions").service("jwt");

//             const payload = await jwtService.verify(token);

//             console.log("JWT Payload:", payload);

//             //----------------------------------------
//             // Load User + Role
//             //----------------------------------------

//             // const user = await strapi.documents(
//             //     "plugin::users-permissions.user"
//             // ).findOne({

//             //     documentId: payload.documentId,

//             //     populate: ["role"],

//             // });

//             const user = await strapi.documents(
//                 "plugin::users-permissions.user"
//             ).findFirst({

//                 filters: {
//                     id: payload.id,
//                 },

//                 populate: ["role"],

//             });

//             if (!user) {

//                 return ctx.unauthorized();

//             }

//             //----------------------------------------
//             // Check Role
//             //----------------------------------------

//             if (user.role?.name !== "Admin") {

//                 return ctx.forbidden("Not an admin");

//             }

//             //----------------------------------------
//             // Success
//             //----------------------------------------

//             ctx.body = {

//                 success: true,

//                 user,

//             };

//         } catch (err) {

//             console.error(err);

//             return ctx.unauthorized();

//         }

//     },

// };

"use strict";

const bcrypt = require("bcryptjs");
const getAuthenticatedAdmin = require("../../../utils/getAuthenticatedAdmin");

module.exports = {

    async me(ctx) {

        try {

            const auth = ctx.request.header.authorization;

            if (!auth?.startsWith("Bearer ")) {
                return ctx.unauthorized("Missing token");
            }

            const token = auth.replace("Bearer ", "");

            const jwtService =
                strapi.plugin("users-permissions").service("jwt");

            const payload = await jwtService.verify(token);

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
                return ctx.unauthorized();
            }

            if (user.role?.name !== "Admin") {
                return ctx.forbidden();
            }

            ctx.body = {
                success: true,
                user: {
                    id: user.id,
                    documentId: user.documentId,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    twoFactorEnabled: user.twoFactorEnabled,
                    role: user.role,
                },
            };

        } catch (err) {

            console.error(err);
            return ctx.unauthorized();

        }

    },

    async changePassword(ctx) {

        try {

            const user = await getAuthenticatedAdmin(ctx);

            if (!user) {
                return;
            }

            const {
                currentPassword,
                newPassword,
            } = ctx.request.body;

            if (!currentPassword || !newPassword) {
                return ctx.badRequest("All fields are required.");
            }

            const dbUser = await strapi.db
                .query("plugin::users-permissions.user")
                .findOne({
                    where: {
                        id: user.id,
                    },
                });

            if (!dbUser) {
                return ctx.notFound("User not found.");
            }

            const validPassword = await bcrypt.compare(
                currentPassword,
                dbUser.password
            );

            if (!validPassword) {
                return ctx.badRequest("Current password is incorrect.");
            }

            if (currentPassword === newPassword) {
                return ctx.badRequest(
                    "New password must be different from your current password."
                );
            }

            // We'll add stronger validation next.
            if (newPassword.length < 8) {
                return ctx.badRequest(
                    "Password must be at least 8 characters."
                );
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await strapi.db
                .query("plugin::users-permissions.user")
                .update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        password: hashedPassword,
                    },
                });

            return ctx.send({
                success: true,
                message: "Password updated successfully.",
            });

        } catch (err) {

            strapi.log.error(err);

            return ctx.internalServerError(
                "Unable to change password."
            );

        }

    },

};