'use strict';

/**
 * admin-auth service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::admin-auth.admin-auth');
