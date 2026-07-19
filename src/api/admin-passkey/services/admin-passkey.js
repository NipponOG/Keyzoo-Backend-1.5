'use strict';

/**
 * admin-passkey service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::admin-passkey.admin-passkey');
