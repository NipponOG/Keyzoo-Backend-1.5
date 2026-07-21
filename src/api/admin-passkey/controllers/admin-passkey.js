"use strict";

// const { generateRegistrationOptions } = require("@simplewebauthn/server");
// const isoBase64URL = require("@simplewebauthn/server/helpers");

const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require("@simplewebauthn/server");
const getAuthenticatedAdmin = require("../../../utils/getAuthenticatedAdmin");
// const { v4: uuidv4 } = require("uuid");

module.exports = {
    async registerOptions(ctx) {
        try {
            // Get Bearer token
            // const authHeader = ctx.request.header.authorization;

            // if (!authHeader?.startsWith("Bearer ")) {
            //     return ctx.unauthorized("Missing token");
            // }

            // const token = authHeader.replace("Bearer ", "");

            // Verify JWT
            // const jwtService = strapi
            //     .plugin("users-permissions")
            //     .service("jwt");

            // const payload = await jwtService.verify(token);

            // if (!payload?.id) {
            //     return ctx.unauthorized("Invalid token");
            // }

            // Load admin
            // const user = await strapi.db
            //     .query("plugin::users-permissions.user")
            //     .findOne({
            //         where: { id: payload.id },
            //         populate: ["role"],
            //     });

            // if (!user || user.role?.name !== "Admin") {
            //     return ctx.forbidden("Only admins can register passkeys.");
            // }

            const user = await getAuthenticatedAdmin(ctx);
            const { deviceName } = ctx.request.body;

            if (!user) {
                return;
            }

            const existingPasskeys = await strapi.documents("api::admin-passkey.admin-passkey").findMany({
                filters: {
                    user: {
                        id: user.id,
                    },
                },
            });

            console.log(existingPasskeys);

            const options = await generateRegistrationOptions({
                rpName: "Keyzoo Admin",
                rpID: process.env.WEBAUTHN_RP_ID || "localhost",

                userID: Buffer.from(String(user.id)),
                userName: user.email,
                userDisplayName: user.username,

                timeout: 60000,

                attestationType: "none",

                authenticatorSelection: {
                    residentKey: "preferred",
                    userVerification: "preferred",
                },

                supportedAlgorithmIDs: [-7, -257],

                excludeCredentials: existingPasskeys.map((passkey) => ({
                    id: passkey.credentialID,
                    type: "public-key",
                })),
            });

            await strapi.db
                .query("plugin::users-permissions.user")
                .update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        passkeyChallenge: options.challenge,
                        pendingDeviceName: deviceName || "Unnamed Device",
                    },
                });

            return ctx.send({
                success: true,
                options,
            });
        } catch (err) {
            console.error(err);

            return ctx.badRequest("Unable to generate passkey options.");
        }
    },

    async registerVerify(ctx) {
        try {

            const user = await getAuthenticatedAdmin(ctx);

            if (!user) return;

            const { credential } = ctx.request.body;

            if (!credential) {
                return ctx.badRequest("Missing credential.");
            }

            if (!user.passkeyChallenge) {
                return ctx.badRequest("Registration challenge expired.");
            }

            const verification = await verifyRegistrationResponse({
                response: credential,

                expectedChallenge: user.passkeyChallenge,

                expectedOrigin: [
                    process.env.WEBAUTHN_ORIGIN || "http://localhost:3000",
                ],

                expectedRPID: process.env.WEBAUTHN_RP_ID || "localhost",

                expectedType: "webauthn.create",

                requireUserVerification: true,
            });

            if (!verification.verified) {
                return ctx.badRequest("Passkey verification failed.");
            }

            const registrationInfo = verification.registrationInfo;
            console.log(registrationInfo);

            if (!registrationInfo) {
                return ctx.badRequest("Registration information missing.");
            }

            const {
                credential: registeredCredential,
                credentialDeviceType,
                credentialBackedUp,
            } = registrationInfo;

            await strapi.documents("api::admin-passkey.admin-passkey").create({
                data: {
                    name: "Passkey",

                    credentialID: registeredCredential.id,

                    publicKey: Buffer.from(registeredCredential.publicKey).toString("base64url"),

                    counter: registeredCredential.counter,

                    deviceType: credentialDeviceType,

                    backedUp: credentialBackedUp,

                    transports: registeredCredential.transports || [],

                    lastUsedAt: new Date(),

                    userAgent: ctx.request.header["user-agent"],

                    // deviceName:
                    //     credentialDeviceType === "singleDevice"
                    //         ? "This Device"
                    //         : "Multi-device Passkey",

                    deviceName: user.pendingDeviceName || "Unnamed Device",

                    user: user.id,
                },
            });

            await strapi.db
                .query("plugin::users-permissions.user")
                .update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        passkeyChallenge: null,
                        pendingDeviceName: null,
                    },
                });

            return ctx.send({
                success: true,
                message: "Passkey registered successfully.",
            });

        } catch (err) {
            console.error(err);
            return ctx.badRequest("Unable to verify passkey.");
        }
    },

    async loginOptions(ctx) {
        try {

            const { email } = ctx.request.body;

            if (!email) {
                return ctx.badRequest("Email is required.");
            }

            const user = await strapi.db
                .query("plugin::users-permissions.user")
                .findOne({
                    where: {
                        email,
                    },
                    populate: ["role"],
                });

            if (!user || user.role?.name !== "Admin") {
                return ctx.badRequest("Invalid credentials.");
            }

            const passkeys = await strapi
                .documents("api::admin-passkey.admin-passkey")
                .findMany({
                    filters: {
                        user: {
                            id: user.id,
                        },
                    },
                    sort: ["createdAt:asc"],
                });

            if (!passkeys.length) {
                return ctx.badRequest("Invalid credentials.");
            }

            const options = await generateAuthenticationOptions({

                rpID: process.env.WEBAUTHN_RP_ID || "localhost",

                timeout: 60000,

                userVerification: "required",

                allowCredentials: passkeys.map((passkey) => ({
                    id: passkey.credentialID,
                    type: "public-key",
                    transports: passkey.transports || [],
                })),
            });

            await strapi.db
                .query("plugin::users-permissions.user")
                .update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        passkeyChallenge: options.challenge,
                    },
                });

            return ctx.send({
                success: true,
                options,
            });

        } catch (err) {
            console.error(err);
            return ctx.badRequest("Unable to generate login options.");
        }
    },

    async loginVerify(ctx) {
        try {

            const { email, credential } = ctx.request.body;

            if (!email || !credential) {
                return ctx.badRequest("Missing authentication data.");
            }

            const user = await strapi.db
                .query("plugin::users-permissions.user")
                .findOne({
                    where: {
                        email,
                    },
                    populate: ["role"],
                });

            if (!user || user.role?.name !== "Admin") {
                return ctx.badRequest("Invalid credentials.");
            }

            if (!user.passkeyChallenge) {
                return ctx.badRequest("Authentication challenge expired.");
            }

            const passkeys = await strapi
                .documents("api::admin-passkey.admin-passkey")
                .findMany({
                    filters: {
                        user: {
                            id: user.id,
                        },
                    },
                });

            const storedPasskey = passkeys.find(
                (passkey) => passkey.credentialID === credential.id
            );

            if (!storedPasskey) {
                return ctx.badRequest("Invalid credentials.");
            }

            const verification = await verifyAuthenticationResponse({
                response: credential,

                expectedChallenge: user.passkeyChallenge,

                expectedOrigin: [
                    process.env.WEBAUTHN_ORIGIN || "http://localhost:3000",
                ],

                expectedRPID:
                    process.env.WEBAUTHN_RP_ID || "localhost",

                credential: {
                    id: storedPasskey.credentialID,

                    publicKey: Buffer.from(
                        storedPasskey.publicKey,
                        "base64url"
                    ),

                    counter: storedPasskey.counter,

                    transports: storedPasskey.transports || [],
                },

                requireUserVerification: true,
            });

            if (!verification.verified) {
                return ctx.badRequest("Passkey verification failed.");
            }

            console.log(verification);

            const { newCounter } = verification.authenticationInfo;

            await strapi.documents("api::admin-passkey.admin-passkey").update({
                documentId: storedPasskey.documentId,
                data: {
                    counter: newCounter,
                    lastUsedAt: new Date(),
                },
            });

            await strapi.db
                .query("plugin::users-permissions.user")
                .update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        passkeyChallenge: null,
                    },
                });

            const jwtService = strapi
                .plugin("users-permissions")
                .service("jwt");

            const jwt = jwtService.issue({
                id: user.id,
            });

            const adminUser = {
                id: user.id,
                documentId: user.documentId,
                username: user.username,
                email: user.email,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled,
            };

            return ctx.send({
                success: true,
                jwt,
                user: adminUser,
            });

        } catch (err) {
            console.error(err);
            return ctx.badRequest("Unable to verify passkey.");
        }
    },

    async list(ctx) {
        try {

            const user = await getAuthenticatedAdmin(ctx);

            if (!user) {
                return;
            }

            const passkeys = await strapi
                .documents("api::admin-passkey.admin-passkey")
                .findMany({
                    filters: {
                        user: {
                            id: user.id,
                        },
                    },
                    sort: ["createdAt:asc"],
                });

            return ctx.send({
                success: true,
                passkeys: passkeys.map((passkey) => ({
                    documentId: passkey.documentId,
                    deviceName: passkey.deviceName,
                    deviceType: passkey.deviceType,
                    backedUp: passkey.backedUp,
                    lastUsedAt: passkey.lastUsedAt,
                    createdAt: passkey.createdAt,
                })),
            });

        } catch (err) {
            console.error(err);

            return ctx.badRequest(
                "Unable to load passkeys."
            );
        }
    },

    async rename(ctx) {
        try {
            const user = await getAuthenticatedAdmin(ctx);

            if (!user) {
                return;
            }

            const { documentId } = ctx.params;
            const { deviceName } = ctx.request.body;

            if (!deviceName?.trim()) {
                return ctx.badRequest("Device name is required.");
            }

            const passkey = await strapi.documents(
                "api::admin-passkey.admin-passkey"
            ).findOne({
                documentId,
                populate: {
                    user: true,
                },
            });

            if (!passkey) {
                return ctx.notFound("Passkey not found.");
            }

            if (passkey.user?.documentId !== user.documentId) {
                return ctx.forbidden("Unauthorized.");
            }

            const updated = await strapi.documents(
                "api::admin-passkey.admin-passkey"
            ).update({
                documentId,
                data: {
                    deviceName: deviceName.trim(),
                },
            });

            return ctx.send({
                success: true,
                passkey: updated,
            });

        } catch (err) {
            strapi.log.error("Rename passkey failed", err);
            return ctx.internalServerError("Unable to rename passkey.");
        }
    },

    async delete(ctx) {
        try {
            const user = await getAuthenticatedAdmin(ctx);

            if (!user) {
                return;
            }

            const { documentId } = ctx.params;

            const passkey = await strapi.documents(
                "api::admin-passkey.admin-passkey"
            ).findOne({
                documentId,
                populate: {
                    user: true,
                },
            });

            if (!passkey) {
                return ctx.notFound("Passkey not found.");
            }

            if (passkey.user?.documentId !== user.documentId) {
                return ctx.forbidden("Unauthorized.");
            }

            await strapi.documents(
                "api::admin-passkey.admin-passkey"
            ).delete({
                documentId,
            });

            return ctx.send({
                success: true,
            });

        } catch (err) {
            strapi.log.error("Delete passkey failed", err);
            return ctx.internalServerError("Unable to delete passkey.");
        }
    },
};