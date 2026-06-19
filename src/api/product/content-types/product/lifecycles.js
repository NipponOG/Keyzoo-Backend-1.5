const redis = require("../../../../utils/redis");

module.exports = {
    async afterUpdate(event) {

        const { result } = event;

        if (result?.slug) {
            const cacheKey = `product:${result.slug}`;

            try {
                await redis.del(cacheKey);

                console.log(`🗑️ Cache cleared: ${cacheKey}`);
            } catch (err) {
                console.error("Redis delete error:", err);
            }
        }
    },

    async afterCreate(event) {

        const { result } = event;

        if (result?.slug) {
            const cacheKey = `product:${result.slug}`;

            try {
                await redis.del(cacheKey);

                console.log(`🗑️ Cache cleared: ${cacheKey}`);
            } catch (err) {
                console.error("Redis delete error:", err);
            }
        }
    },

    async afterDelete(event) {
        
        const { result } = event;

        if (result?.slug) {
            const cacheKey = `product:${result.slug}`;

            try {
                await redis.del(cacheKey);

                console.log(`🗑️ Cache cleared: ${cacheKey}`);
            } catch (err) {
                console.error("Redis delete error:", err);
            }
        }
    },
};