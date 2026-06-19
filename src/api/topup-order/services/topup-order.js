'use strict';

/**
 * topup-order service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::topup-order.topup-order');
