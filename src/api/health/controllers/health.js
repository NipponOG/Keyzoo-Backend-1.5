module.exports = {
    async index(ctx) {
        ctx.send({
            status: "ok",
            service: "Keyzoo Strapi API",
            timestamp: new Date().toISOString(),
        });
    },
};