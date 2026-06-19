// src/utils/getModelFromType.js

module.exports = function getModelFromType(type) {
    const map = {
        "product": "api::product.product",
        "gift-card": "api::gift-card.gift-card",
    };

    return map[type] || null;
};