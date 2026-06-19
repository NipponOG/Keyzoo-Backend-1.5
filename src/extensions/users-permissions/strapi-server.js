module.exports = (plugin) => {

  plugin.controllers.auth.register = async (ctx) => {

    const {
      username,
      email,
      password,
      firstName,
      lastName,
    } = ctx.request.body;

    if (
      !username ||
      !email ||
      !password ||
      !firstName ||
      !lastName
    ) {
      return ctx.badRequest("Missing fields");
    }

    try {

      const user = await strapi
        .plugin("users-permissions")
        .service("user")
        .add({
          username,
          email,
          password,
          firstName,
          lastName,
          provider: "local",
          confirmed: true,
          blocked: false,
        });

      const jwt = strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({ id: user.id });

      ctx.send({
        jwt,
        user,
      });

    } catch (error) {

      ctx.badRequest(error.message);

    }
  };

  return plugin;
};