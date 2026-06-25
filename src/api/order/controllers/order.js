// Updated code after new schema changes CartItems to Order Collection
// src/api/order/controllers/order.js
"use strict";

// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const getModelFromType = require("../../../utils/getModelFromType");

const LOW_STOCK_THRESHOLD = 5;

const checkLowStock = async (
  strapi,
  productId
) => {

  const product =
    await strapi.entityService.findOne(
      "api::product.product",
      productId,
      {
        populate: {
          gameKeys: true,
        },
      }
    );

  if (!product) return;

  const availableKeys =
    product.gameKeys.filter(
      key => key.isAvailable
    ).length;

  // Reset alert when restocked
  if (
    availableKeys > LOW_STOCK_THRESHOLD &&
    product.lowStockAlertSent
  ) {

    await strapi.entityService.update(
      "api::product.product",
      product.id,
      {
        data: {
          lowStockAlertSent: false,
        },
      }
    );

    console.log(
      `Stock restored: ${product.title}`
    );

    return;
  }

  console.log(
    `${product.title} has ${availableKeys} keys left`
  );

  if (
    availableKeys <= LOW_STOCK_THRESHOLD &&
    !product.lowStockAlertSent
  ) {

    console.log(
      `LOW STOCK ALERT: ${product.title}`
    );

    await resend.emails.send({
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_EMAIL}>`,
      to: "reply@mail.keyden.shop",
      subject: `⚠️ Low Stock Alert - ${product.title}`,
      html: `
    <div style="font-family:Arial,sans-serif;padding:20px;">
      <h2 style="color:#dc2626;">
        Low Stock Alert
      </h2>

      <p>
        A product is running low on inventory.
      </p>

      <table
        cellpadding="8"
        cellspacing="0"
        style="border-collapse:collapse;"
      >
        <tr>
          <td><strong>Product</strong></td>
          <td>${product.title}</td>
        </tr>

        <tr>
          <td><strong>Available Keys</strong></td>
          <td>${availableKeys}</td>
        </tr>

        <tr>
          <td><strong>Threshold</strong></td>
          <td>${LOW_STOCK_THRESHOLD}</td>
        </tr>
      </table>

      <br />

      <p style="color:#dc2626;">
        Please restock this product soon.
      </p>
    </div>
  `,
    });
  }
};

// function generateEmailTemplate(order, cartItems, assignedKeys) {

// const orderDate = new Date().toLocaleDateString("en-IN", {
//   day: "2-digit",
//   month: "long",
//   year: "numeric",
// });

// const itemsHtml = cartItems
//   .map((item) => {

//     const itemType = item.type?.trim().toLowerCase(); // 🔥 FIX HERE

//     const keysForProduct = (assignedKeys || [])
//       .filter(
//         (k) => k.productId === item.id && k.type === itemType
//       )
//       .map((k) => `<span style="color:#008000;">${k.key}</span>`).join("<br/>");

//     return `
//       <tr>
//         <td style="padding:15px; border-bottom:1px solid #eee;">
//           <strong>${item.title}</strong><br/>
//           Quantity: ${item.quantity}<br/>
//           Price: ₹${item.price}<br/>
//           Keys:<br/> ${keysForProduct || "<span style='color:orange;'>Pending delivery</span>"}
//         </td>
//       </tr>`;
//   })
//   .join("");

// return `
// <html>
//   <body style="font-family: Arial, sans-serif; background:#ffffff; margin:0; padding:0;">
//     <table width="100%" cellpadding="0" cellspacing="0">
//       <tr>
//         <td align="center">
//           <table width="600" style="max-width:600px; margin:0 auto;">

//             <tr>
//               <td style="padding:20px;">
//                 <img src="${process.env.EMAIL_LOGO_URL}" height="30"/>
//               </td>
//               <td style="padding:20px; text-align:right; font-size:12px;">
//                 ${orderDate}
//               </td>
//             </tr>

//             <tr>
//               <td colspan="2" style="padding:20px; text-align:center;">
//                 <h2>Here are your keys 🎉</h2>
//                 <p>Thank you for your purchase.</p>
//                 <a href="${process.env.FRONTEND_URL}/orders/${order.id}"
//                    style="padding:10px 20px; background:#000; color:#fff; text-decoration:none;">
//                   View Order
//                 </a>
//               </td>
//             </tr>

//             ${itemsHtml}

//             <tr>
//               <td colspan="2" style="background:#000; color:#fff; padding:20px; text-align:center;">
//                 Support: ${process.env.SUPPORT_EMAIL}
//               </td>
//             </tr>

//           </table>
//         </td>
//       </tr>
//     </table>
//   </body>
// </html>`;
// }

function generateEmailTemplate(order, cartItems) {

  const orderDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const productsHtml = cartItems.map((item) => `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="margin-top:10px;background:#f9fafb;border-radius:10px;padding:12px;">
      <tr>
        <td width="60">
          <img
            src="${item.image || "https://via.placeholder.com/50"}"
            width="50"
            style="border-radius:6px;"
          />
        </td>

        <td>
          <div style="font-size:14px;font-weight:bold;">
            ${item.title}
          </div>

          <div style="font-size:12px;color:#777;">
            Digital Code
          </div>
        </td>

        <td align="right" style="font-size:14px;">
          ₹${item.price}
        </td>
      </tr>
    </table>
  `).join("");

  return `
  <html>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">

      <table width="100%" cellpadding="40" cellspacing="0">
        <tr>
          <td align="center">

            <table width="520" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:12px;padding:30px;">

              <tr>
                <td align="center" style="padding-bottom:20px;">
                  <div
                    style="
                      color:#4f46e5;
                      font-weight:bold;
                      font-size:18px;
                    "
                  >
                    ${process.env.BRAND_NAME || "Keyzoo"}
                  </div>
                </td>
              </tr>

              <tr>
                <td>

                  <h2
                    style="
                      margin:0 0 10px 0;
                      font-size:22px;
                    "
                  >
                    Thank you for your purchase
                  </h2>

                  <p
                    style="
                      color:#555;
                      font-size:14px;
                    "
                  >
                    Hey ${order.deliveryEmail},
                  </p>

                  <p
                    style="
                      color:#555;
                      font-size:14px;
                      line-height:1.6;
                    "
                  >
                    Thank you for choosing
                    ${process.env.BRAND_NAME || "Keyzoo"}.
                    Your order has been confirmed and your keys are ready.
                  </p>

                </td>
              </tr>

              <tr>
                <td align="center" style="padding:20px 0;">

                  <a
                    href="${process.env.FRONTEND_URL}/orders/${order.id}"
                    target="_blank"
                    style="
                      display:inline-block;
                      background:#4f46e5;
                      color:#fff;
                      text-decoration:none;
                      padding:12px 28px;
                      border-radius:8px;
                      font-size:14px;
                      font-weight:bold;
                    "
                  >
                    Redeem Keys
                  </a>

                </td>
              </tr>

              <tr>
                <td
                  style="
                    border-top:1px solid #eee;
                    padding-top:20px;
                  "
                >

                  <table width="100%" style="font-size:13px;">
                    <tr>
                      <td style="color:#777;">
                        Order Number
                      </td>

                      <td align="right">
                        ${order.orderNumber}
                      </td>
                    </tr>

                    <tr>
                      <td style="color:#777;">
                        Order Date
                      </td>

                      <td align="right">
                        ${orderDate}
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <tr>
                <td style="padding-top:20px;">

                  <strong>Your Products</strong>

                  ${productsHtml}

                </td>
              </tr>

              <tr>
                <td style="padding-top:20px;">

                  <strong>Order Summary</strong>

                  <table
                    width="100%"
                    style="font-size:13px;margin-top:10px;"
                  >

                    <tr>
                      <td style="color:#777;">
                        Subtotal
                      </td>

                      <td align="right">
                        ₹${(order.totalAmount / 100).toFixed(2)}
                      </td>
                    </tr>

                    <tr>
                      <td style="color:#777;">
                        Service Fee
                      </td>

                      <td align="right">
                        ₹0
                      </td>
                    </tr>

                    <tr>
                      <td style="color:#777;">
                        Coupon Discount
                      </td>

                      <td align="right" style="color:green;">
                        ₹0
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-top:8px;">
                        <strong>Total</strong>
                      </td>

                      <td align="right" style="padding-top:8px;">
                        <strong>
                          ₹${(order.totalAmount / 100).toFixed(2)}
                        </strong>
                      </td>
                    </tr>

                  </table>

                </td>
              </tr>

              <tr>
                <td style="padding-top:20px;">

                  <strong>Payment Method</strong>

                  <p
                    style="
                      margin:5px 0;
                      color:#555;
                      font-size:13px;
                    "
                  >
                    ${order.paymentMethod}
                  </p>

                </td>
              </tr>

              <tr>
                <td
                  style="
                    padding-top:30px;
                    border-top:1px solid #eee;
                    font-size:12px;
                    color:#999;
                  "
                >

                  <p>
                    We hope to see you again.
                  </p>

                  <p>
                    Happy Gaming 🎮
                    <br />
                    Team ${process.env.BRAND_NAME || "Keyzoo"}
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
  </html>
  `;
}

// async function assignKeysAndSendEmail(order, cartItems, strapi) {
//   let assignedKeys = [];

//   for (const item of cartItems) {
//     const product = await strapi.db.query("api::product.product").findOne({
//       where: { title: item.title },
//       populate: { gameKeys: true },
//     });

//     if (!product) continue;

//     const availableKeys = product.gameKeys.filter(k => k.isAvailable);
//     const keysToAssign = availableKeys.slice(0, item.quantity);

//     for (const key of keysToAssign) {
//       await strapi.db.query("api::game-key.game-key").update({
//         where: { id: key.id },
//         data: { isAvailable: false, assignedAt: new Date() },
//       });

//       assignedKeys.push({ product: product.title, key: key.code });
//     }
//   }

//   const totalRequiredKeys = cartItems.reduce((sum, item) => sum + item.quantity, 0);

//   let deliveryStatus = "pending";
//   if (assignedKeys.length === totalRequiredKeys) deliveryStatus = "completed";
//   else if (assignedKeys.length > 0) deliveryStatus = "partial";

//   await strapi.db.query("api::order.order").update({
//     where: { id: order.id },
//     data: {
//       deliveryStatus,
//       manualDeliveryRequired: assignedKeys.length < totalRequiredKeys,
//       gameKeysAssigned: assignedKeys.length > 0,
//       deliveredAt: deliveryStatus === "completed" ? new Date() : null,
//       assignedKeys,
//       totalKeysRequired: totalRequiredKeys,
//       totalKeysAssigned: assignedKeys.length,
//     },
//   });

//   // send email
//   const htmlTemplate = generateEmailTemplate(order, cartItems, assignedKeys);

//   await resend.emails.send({
//     from: "Keyzoo <noreply@mail.quickcheckout.in>",
//     to: order.deliveryEmail,
//     subject: `Your Game Keys - Order #${order.orderNumber}`,
//     html: htmlTemplate,
//   });
// }

const crypto = require("crypto");
const getRawBody = require("raw-body");

function verifySignature(rawBodyBuffer, signature, secret, timestamp) {
  const bodyBuffer = Buffer.isBuffer(rawBodyBuffer)
    ? rawBodyBuffer
    : Buffer.from(rawBodyBuffer);

  const signedPayload = Buffer.concat([
    Buffer.from(String(timestamp), "utf8"),
    bodyBuffer,
  ]);

  const generatedSignature = crypto
    .createHmac("sha256", secret.trim())
    .update(signedPayload)
    .digest("base64");

  return generatedSignature === signature;
}

// @ts-ignore
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({

  async webhook(ctx) {
    const sig = ctx.request.headers["stripe-signature"];
    const raw = Buffer.from(ctx.request.body[Symbol.for("unparsedBody")], "utf8");

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        raw,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      strapi.log.error(`❌ Stripe signature verification failed: ${err.message}`);
      return ctx.badRequest("Webhook Error");
    }

    if (event.type !== "checkout.session.completed") {
      strapi.log.info(`Ignored Stripe event: ${event.type}`);
      return ctx.send({ received: true });
    }

    const session = event.data.object;
    strapi.log.info(`🎉 Checkout completed: ${session.id}`);

    try {
      const userId = session.metadata?.userId;
      if (!userId) throw new Error("Session missing userId in metadata.");

      const cartItems = JSON.parse(session.metadata.cart || "[]");
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error("Cart metadata missing or invalid.");
      }

      const existing = await strapi.db.query("api::order.order").findOne({
        where: { stripeSessionId: session.id },
      });

      if (existing) {
        strapi.log.warn("⚠️ Duplicate webhook ignored");
        return ctx.send({ received: true });
      }

      // 1. Create Order
      const order = await strapi.entityService.create("api::order.order", {
        data: {
          orderNumber: `STORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          totalAmount: session.amount_total,
          currency: session.currency?.toUpperCase() || "INR",
          paymentMethod: session.payment_method_types?.[0] || "card",
          paymentProvider: "stripe",
          paymentStatus: "paid",
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          deliveryEmail: session.customer_email,
          user: userId,
          cartSnapshot: cartItems, // ✅ save cart JSON
          status: "processing",
          deliveryStatus: "pending",
        },
      });

      strapi.log.info(
        `✅ Order ${order.orderNumber} created with ${cartItems.length} items.`
      );

      // await assignKeysAndSendEmail(order, cartItems, strapi);

      // 2. Assign Game Keys
      let assignedKeys = [];
      for (const item of cartItems) {

        // const product = await strapi.db.query("api::product.product").findOne({
        //   where: { id: item.id },
        //   populate: { gameKeys: true },
        // });

        if (!item.type) {
          strapi.log.error("❌ Missing type:", item);
          continue;
        }

        const itemType = item.type?.trim().toLowerCase();
        const model = getModelFromType(itemType);

        if (!model) {
          strapi.log.error("❌ Invalid type:", item);
          continue;
        }

        const entity = await strapi.db.query(model).findOne({
          where: { id: item.id },
          populate: { gameKeys: true },
        });

        if (!entity) {
          strapi.log.warn(`⚠️ Entity not found: ${item.title}`);
          continue;
        }

        const availableKeys = (entity.gameKeys || []).filter(k => k.isAvailable);
        const keysToAssign = availableKeys.slice(0, item.quantity);

        if (keysToAssign.length < item.quantity) {
          strapi.log.warn(
            `⚠️ Not enough keys for ${item.title}. Needed: ${item.quantity}, got: ${keysToAssign.length}`
          );
        }

        for (const key of keysToAssign) {
          await strapi.db.query("api::game-key.game-key").update({
            where: { id: key.id },
            data: { isAvailable: false, assignedAt: new Date() },
          });

          // assignedKeys.push({ product: product.title, key: key.code });
          assignedKeys.push({
            productId: entity.id,
            product: entity.title,
            type: itemType, // 🔥 VERY IMPORTANT
            key: key.code,
          });
        }
        await checkLowStock(
          strapi,
          entity.id
        );
      }

      const totalRequiredKeys = cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // 3. Update Order Delivery Info
      let deliveryStatus;

      if (assignedKeys.length === 0) {
        deliveryStatus = "pending";
      } else if (assignedKeys.length < totalRequiredKeys) {
        deliveryStatus = "partial";
      } else {
        deliveryStatus = "completed";
      }

      // await strapi.db.query("api::order.order").update({
      //   where: { id: order.id },
      //   data: {
      //     deliveryStatus,
      //     manualDeliveryRequired: assignedKeys.length < totalRequiredKeys,
      //     gameKeysAssigned: assignedKeys.length > 0,
      //     deliveredAt: deliveryStatus === "completed" ? new Date() : null,
      //     assignedKeys,
      //     totalKeysRequired: totalRequiredKeys,
      //     totalKeysAssigned: assignedKeys.length,
      //   },
      // });

      await strapi.entityService.update("api::order.order", order.id, {
        data: {
          deliveryStatus,
          manualDeliveryRequired: assignedKeys.length < totalRequiredKeys,
          gameKeysAssigned: assignedKeys.length > 0,
          deliveredAt: deliveryStatus === "completed" ? new Date() : null,
          assignedKeys: assignedKeys || [],
          totalKeysRequired: totalRequiredKeys,
          totalKeysAssigned: assignedKeys.length,
        },
      });

      // 4. Send Email with Keys
      if (order.deliveryEmail) {

        const htmlTemplate = generateEmailTemplate(order, cartItems, assignedKeys);

        await resend.emails.send({
          from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_EMAIL}>`,
          to: order.deliveryEmail,
          subject: assignedKeys.length > 0
            ? `Your Game Keys - Order #${order.orderNumber}`
            : `Order Confirmed - Keys will be delivered soon (#${order.orderNumber})`,
          html: htmlTemplate,
        });

        strapi.log.info(`📩 Email sent to ${order.deliveryEmail}`);
      }

    } catch (err) {
      strapi.log.error("❌ Webhook order handling failed:", err);
      return ctx.internalServerError("Order handling failed");
    }

    ctx.send({ received: true });
  },
  async sendKeysManually(ctx) {
    const { orderId } = ctx.request.body;

    if (!orderId) {
      return ctx.badRequest("Order ID required");
    }

    // if (ctx.request.header['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    //   return ctx.unauthorized("Not allowed");
    // }

    // if (ctx.state.user.role.name !== "Admin") {
    //   return ctx.forbidden("Admins only");
    // }

    // if any error then simply remove it...

    // 🔐 Must be logged in
    if (!ctx.state.user) {
      return ctx.unauthorized("Login required");
    }

    // 🔐 Must be admin
    if (ctx.state.user.role?.name !== "Admin") {
      return ctx.forbidden("Admins only");
    }

    const order = await strapi.entityService.findOne("api::order.order", orderId);

    if (!order) return ctx.notFound("Order not found");

    const cartItems = order.cartSnapshot || [];
    let assignedKeys = order.assignedKeys || [];

    // 🔥 Assign remaining keys from DB
    for (const item of cartItems) {

      if (!item.type) {
        strapi.log.error("❌ Missing type:", item);
        continue;
      }

      const itemType = item.type?.trim().toLowerCase();
      const model = getModelFromType(itemType);

      if (!model) {
        strapi.log.error("❌ Invalid type:", item);
        continue;
      }

      const entity = await strapi.db.query(model).findOne({
        where: { id: item.id },
        populate: { gameKeys: true },
      });

      if (!entity) continue;

      // const alreadyAssigned = assignedKeys.filter(
      //   k => k.productId === item.id && k.type === item.type
      // ).length;

      const alreadyAssigned = assignedKeys.filter(
        k => k.productId === item.id && k.type === itemType
      ).length;

      if (alreadyAssigned >= item.quantity) continue;

      const remainingQty = item.quantity - alreadyAssigned;

      if (remainingQty <= 0) continue;

      const availableKeys = (entity.gameKeys || []).filter(k => k.isAvailable);
      const keysToAssign = availableKeys.slice(0, remainingQty);

      for (const key of keysToAssign) {
        await strapi.db.query("api::game-key.game-key").update({
          where: { id: key.id },
          data: { isAvailable: false, assignedAt: new Date() },
        });

        // assignedKeys.push({ product: product.title, key: key.code });
        assignedKeys.push({
          productId: entity.id,
          product: entity.title,
          type: itemType, // 🔥 VERY IMPORTANT
          key: key.code,
        });
      }
    }

    // 🔥 Recalculate
    const totalRequiredKeys = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    let deliveryStatus;

    if (assignedKeys.length === 0) {
      deliveryStatus = "pending";
    } else if (assignedKeys.length < totalRequiredKeys) {
      deliveryStatus = "partial";
    } else {
      deliveryStatus = "completed";
    }

    // 🔥 Update order
    await strapi.entityService.update("api::order.order", orderId, {
      data: {
        assignedKeys,
        deliveryStatus,
        deliveredAt: deliveryStatus === "completed" ? new Date() : null,
        manualDeliveryRequired: assignedKeys.length < totalRequiredKeys,
        totalKeysAssigned: assignedKeys.length,
      },
    });

    // 🔥 Send email again
    const htmlTemplate = generateEmailTemplate(order, cartItems, assignedKeys);

    await resend.emails.send({
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_EMAIL}>`,
      to: order.deliveryEmail,
      subject:
        deliveryStatus === "completed"
          ? `Your Remaining Keys - Order #${order.orderNumber}`
          : `Partial Delivery Update (#${order.orderNumber})`,
      html: htmlTemplate,
    });

    return ctx.send({ success: true });
  },
  async resendEmail(ctx) {
    if (!ctx.state.user) {
      return ctx.unauthorized("Login required");
    }

    if (ctx.state.user.role.name !== "Admin") {
      return ctx.forbidden("Admins only");
    }

    const { orderId } = ctx.request.body;

    const order = await strapi.entityService.findOne("api::order.order", orderId);

    if (!order) {
      return ctx.notFound("Order not found");
    }

    const html = generateEmailTemplate(
      order,
      order.cartSnapshot,
      order.assignedKeys
    );

    await resend.emails.send({
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_EMAIL}>`,
      to: order.deliveryEmail,
      subject: `Your Keys - ${order.orderNumber}`,
      html,
    });

    return ctx.send({ success: true });
  },
  async deleteOrder(ctx) {
    if (!ctx.state.user) {
      return ctx.unauthorized("Login required");
    }

    if (ctx.state.user.role.name !== "Admin") {
      return ctx.forbidden("Admins only");
    }

    const { orderId } = ctx.request.body;

    await strapi.entityService.delete("api::order.order", orderId);

    return ctx.send({ success: true });
  },
  async cashfreeWebhook(ctx) {
    try {
      const payload = ctx.request.body;

      const payment = payload?.data?.payment;
      const orderData = payload?.data?.order;

      if (!payment || payment.payment_status !== "SUCCESS") {
        return ctx.send({ received: true });
      }

      // 🔍 Find temp order
      const order = await strapi.db.query("api::order.order").findOne({
        where: { cashfreeOrderId: orderData.order_id },
      });

      if (!order) {
        strapi.log.error("❌ Order not found:", orderData.order_id);
        return ctx.send({ received: true });
      }

      // 🔁 Prevent duplicate
      if (order.paymentStatus === "paid") {
        return ctx.send({ received: true });
      }

      // 💰 Update order
      const updatedOrder = await strapi.entityService.update(
        "api::order.order",
        order.id,
        {
          data: {
            paymentStatus: "paid",
            paymentMethod: payment.payment_method || "unknown",
            cashfreePaymentId: payment.cf_payment_id,
            paymentDetails: payment,
          },
        }
      );

      strapi.log.info("✅ Cashfree order paid:", updatedOrder.id);

      // 🎮 Assign keys + email
      await assignKeysAndSendEmail(updatedOrder, order.cartSnapshot, strapi);

      return ctx.send({ received: true });

    } catch (err) {
      strapi.log.error("❌ Cashfree webhook error:", err);
      return ctx.send({ received: false });
    }
  },

  // async createCashfreeOrder(ctx) {
  //   try {
  //     const { cartItems = [], email, userId, total } = ctx.request.body || {};

  //     if (!userId) return ctx.badRequest("Login required");
  //     if (!cartItems.length) return ctx.badRequest("Cart empty");
  //     if (!email) return ctx.badRequest("Email required");

  //     const order_id = `cf_${Date.now()}`;

  //     const payload = {
  //       order_id,
  //       order_amount: total,
  //       order_currency: "INR",
  //       customer_details: {
  //         customer_id: String(userId),
  //         customer_email: email,
  //         customer_phone: "9999999999",
  //         customer_name: "User",
  //       },
  //       order_meta: {
  //         return_url: `${process.env.FRONTEND_URL}/success`,
  //       },
  //     };

  //     const res = await fetch("https://sandbox.cashfree.com/pg/orders", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         "x-api-version": "2022-09-01",
  //         "x-client-id": process.env.CASHFREE_APP_ID,
  //         "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       strapi.log.error("❌ Cashfree API Error:", data);
  //       return ctx.throw(400, "Cashfree order creation failed");
  //     }

  //     const existing = await strapi.db.query("api::order.order").findOne({
  //       where: { cashfreeOrderId: order_id },
  //     });
  //     if (existing) {
  //       return ctx.send({ payment_session_id: data.payment_session_id });
  //     }

  //     // 🔥 SAVE TEMP ORDER (CRITICAL)
  //     // await strapi.entityService.create("api::order.order", {
  //     //   data: {
  //     //     orderNumber: `CF-TEMP-${Date.now()}`,
  //     //     cashfreeOrderId: order_id,
  //     //     cartSnapshot: cartItems,
  //     //     user: { connect: userId },
  //     //     deliveryEmail: email,
  //     //     totalAmount: total, // ✅ ADD THIS
  //     //     paymentStatus: "pending",
  //     //     paymentProvider: "cashfree",
  //     //     status: "processing",
  //     //     deliveryStatus: "pending",
  //     //   },
  //     // });

  //     // ctx.send({
  //     //   payment_session_id: data.payment_session_id,
  //     // });

  //     console.log("Creating order with:", {
  //       order_id,
  //       userId,
  //       email,
  //       total,
  //     });

  //     console.log("STEP 1: before DB create");

  //     let created;
  //     try {
  //       created = await strapi.entityService.create("api::order.order", {
  //         data: {
  //           orderNumber: `CF-TEMP-${Date.now()}`,
  //           cashfreeOrderId: order_id,
  //           cartSnapshot: cartItems,
  //           user: userId,
  //           deliveryEmail: email,
  //           totalAmount: total,
  //           paymentStatus: "pending",
  //           paymentProvider: "cashfree",
  //           status: "processing",
  //           deliveryStatus: "pending",
  //         },
  //       });

  //       console.log("STEP 2: after DB create", created);

  //     } catch (e) {
  //       console.log("STEP ERROR:", e);
  //       strapi.log.error("❌ DB create failed:", e);
  //       return ctx.internalServerError("Order save failed");
  //     }

  //     strapi.log.info("CREATED ORDER:", created);

  //     return ctx.send({
  //       payment_session_id: data.payment_session_id,
  //       order_id, // 🔥 ADD THIS
  //     });

  //   } catch (err) {
  //     strapi.log.error("❌ Cashfree create error:", err);
  //     return ctx.internalServerError("Cashfree order failed");
  //   }
  // },




  // async cashfreeWebhook(ctx) {
  //   try {
  //     const signature = ctx.request.headers["x-webhook-signature"];
  //     const timestamp = ctx.request.headers["x-webhook-timestamp"];

  //     const rawBodyBuffer = ctx.request.body?.[Symbol.for("unparsedBody")];

  //     if (!rawBodyBuffer) {
  //       strapi.log.error("❌ Raw body missing");
  //       return ctx.send({ received: false });
  //     }

  //     const isValid = verifySignature(
  //       rawBodyBuffer,
  //       signature,
  //       process.env.CASHFREE_WEBHOOK_SECRET,
  //       timestamp
  //     );

  //     if (!isValid) {
  //       strapi.log.error("❌ Invalid signature");
  //       return ctx.send({ received: false });
  //     }

  //     const payload = JSON.parse(rawBodyBuffer.toString());

  //     // continue logic...

  //     const payment = payload.data?.payment;
  //     const orderData = payload.data?.order;

  //     if (!payment || payment.payment_status !== "SUCCESS") {
  //       return ctx.send({ received: true });
  //     }

  //     // ✅ continue your logic...

  //     const tempOrder = await strapi.db.query("api::order.order").findOne({
  //       where: { cashfreeOrderId: orderData.order_id },
  //     });

  //     if (!tempOrder) return ctx.send({ received: true });

  //     // 🔁 duplicate protection
  //     if (tempOrder.paymentStatus === "paid") {
  //       return ctx.send({ received: true });
  //     }

  //     // 🔒 amount validation
  //     if (Number(tempOrder.totalAmount) !== Number(orderData.order_amount)) {
  //       strapi.log.error("❌ Amount mismatch");
  //       return ctx.send({ received: false });
  //     }

  //     const updatedOrder = await strapi.entityService.update(
  //       "api::order.order",
  //       tempOrder.id,
  //       {
  //         data: {
  //           orderNumber: `CF-${Date.now()}`,
  //           paymentStatus: "paid",
  //           paymentMethod: payment.payment_method || "unknown",
  //           cashfreePaymentId: payment.cf_payment_id,
  //           paymentDetails: payment,
  //         },
  //       }
  //     );

  //     await assignKeysAndSendEmail(updatedOrder, tempOrder.cartSnapshot, strapi);

  //     ctx.send({ received: true });

  //   } catch (err) {
  //     strapi.log.error("❌ Cashfree webhook error:", err);
  //     return ctx.send({ received: false });
  //   }
  // },

  // async cashfreeWebhook(ctx) {
  //   try {
  //     const signature = ctx.request.headers["x-webhook-signature"];
  //     const timestamp = ctx.request.headers["x-webhook-timestamp"];

  //     const raw = ctx.request.body?.[Symbol.for("unparsedBody")];

  //     if (!raw) {
  //       strapi.log.error("❌ Raw body missing");
  //       return ctx.send({ received: false });
  //     }

  //     const rawBodyBuffer = Buffer.isBuffer(raw)
  //       ? raw
  //       : Buffer.from(raw);

  //     const signedPayload = Buffer.concat([
  //       Buffer.from(String(timestamp), "utf8"),
  //       rawBodyBuffer,
  //     ]);

  //     const generatedSignature = crypto
  //       .createHmac("sha256", process.env.CASHFREE_WEBHOOK_SECRET.trim())
  //       .update(signedPayload)
  //       .digest("base64");

  //     console.log("EXPECTED:", generatedSignature);
  //     console.log("RECEIVED:", signature);

  //     if (generatedSignature !== signature) {
  //       strapi.log.error("❌ Invalid signature");
  //       return ctx.send({ received: false });
  //     }

  //     const payload = JSON.parse(rawBodyBuffer.toString());

  //     const payment = payload.data?.payment;
  //     const orderData = payload.data?.order;

  //     if (!payment || payment.payment_status !== "SUCCESS") {
  //       return ctx.send({ received: true });
  //     }

  //     const tempOrder = await strapi.db.query("api::order.order").findOne({
  //       where: { cashfreeOrderId: orderData.order_id },
  //     });

  //     if (!tempOrder) return ctx.send({ received: true });

  //     if (tempOrder.paymentStatus === "paid") {
  //       return ctx.send({ received: true });
  //     }

  //     if (Number(tempOrder.totalAmount) !== Number(orderData.order_amount)) {
  //       strapi.log.error("❌ Amount mismatch");
  //       return ctx.send({ received: false });
  //     }

  //     const updatedOrder = await strapi.entityService.update(
  //       "api::order.order",
  //       tempOrder.id,
  //       {
  //         data: {
  //           orderNumber: `CF-${Date.now()}`,
  //           paymentStatus: "paid",
  //           paymentMethod: payment.payment_method || "unknown",
  //           cashfreePaymentId: payment.cf_payment_id,
  //           paymentDetails: payment,
  //         },
  //       }
  //     );

  //     await assignKeysAndSendEmail(updatedOrder, tempOrder.cartSnapshot, strapi);

  //     ctx.send({ received: true });

  //   } catch (err) {
  //     strapi.log.error("❌ Cashfree webhook error:", err);
  //     return ctx.send({ received: false });
  //   }
  // },













  async razorpaySuccess(ctx) {
    try {
      const { orderId, paymentId, userId, email, cartItems = [], amount } = ctx.request.body;

      if (!userId || !email || !cartItems.length) {
        return ctx.badRequest("Missing required fields");
      }

      // Create order in Strapi (like Stripe webhook)
      const order = await strapi.entityService.create("api::order.order", {
        data: {
          orderNumber: `RZP-${Date.now()}`,
          totalAmount: amount,
          currency: "INR",
          paymentMethod: "upi",
          paymentProvider: "razorpay",
          paymentStatus: "paid",
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          deliveryEmail: email,
          user: userId,
          cartSnapshot: cartItems,
          status: "processing",
          deliveryStatus: "pending",
        },
      });

      // 🕹️ assign keys & send email (reuse same logic from webhook)
      await strapi.controller("api::order.order").assignKeysAndSendEmail(order, cartItems);

      ctx.send({ success: true, orderId: order.id });
    } catch (err) {
      strapi.log.error("❌ Razorpay order save failed:", err);
      return ctx.internalServerError("Razorpay order creation failed");
    }
  },

}));


