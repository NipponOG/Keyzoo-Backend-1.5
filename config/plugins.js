module.exports = ({ env }) => ({
    // ...
    upload: {
        config: {
            provider: "cloudinary",
            providerOptions: {
                cloud_name: env("CLOUDINARY_NAME"),
                api_key: env("CLOUDINARY_KEY"),
                api_secret: env("CLOUDINARY_SECRET"),
            },
            actionOptions: {
                upload: {},
                delete: {},
            },
        },
    },
    email: {
        config: {
            provider: 'strapi-provider-email-resend',
            providerOptions: {
                apiKey: env('RESEND_API_KEY'), // Required
            },
            settings: {
                defaultFrom: "Keyzoo <no-reply@quickcheckout.in>",
                defaultReplyTo: "support@quickcheckout.in",
            }
        }
    },
    "strapi-cache": {
        enabled: true,

        config: {
            provider: "redis",

            redisConfig: env("REDIS_URL"),

            // Cache lifetime: 30 minutes
            ttl: 1000 * 60 * 30,

            // Only cache the public API routes we actually need
            cacheableRoutes: [
                "/api/products",
                "/api/gift-cards",
                "/api/regions",
                "/api/hero-banners",
            ],

            // Never cache authenticated requests
            cacheAuthorizedRequests: false,

            // Automatically invalidate relevant cache
            // when content is created, updated, or deleted.
            autoPurgeCache: true,

            // Keyzoo currently doesn't use GraphQL
            autoPurgeGraphQL: false,

            // Don't wipe Redis every time Strapi restarts
            autoPurgeCacheOnStart: false,

            // Keep Strapi's manual purge controls enabled
            disableAdminButtons: false,

            // Show plugin notifications
            disableAdminPopups: false,

            // Cache response headers
            cacheHeaders: true,

            // Prevent cached compression/header problems
            cacheHeadersDenyList: [
                "content-encoding",
            ],

            // Cache read timeout
            cacheGetTimeoutInMs: 1000,

            // Redis SCAN purge batch size
            redisScanDeleteCount: 100,
        },
    },
});