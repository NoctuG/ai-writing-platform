import type { Request, Response } from "express";
import { stripe } from "./stripe";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set - webhook verification disabled");
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: any;

  try {
    if (WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type}`);

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Stripe Webhook] Database not available");
      return res.status(500).send("Database not available");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("[Stripe Webhook] Checkout session completed:", session.id);

        const userId = session.metadata?.user_id;
        const customerEmail = session.customer_email || session.metadata?.customer_email;

        if (session.mode === "subscription") {
          // Handle subscription purchase
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          if (userId) {
            await db
              .update(users)
              .set({
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: "active",
              })
              .where(eq(users.id, parseInt(userId)));

            console.log(`[Stripe Webhook] Updated user ${userId} with subscription ${subscriptionId}`);
          }
        } else if (session.mode === "payment") {
          // Handle one-time payment
          const customerId = session.customer as string;

          if (userId && customerId) {
            await db
              .update(users)
              .set({
                stripeCustomerId: customerId,
              })
              .where(eq(users.id, parseInt(userId)));

            console.log(`[Stripe Webhook] Updated user ${userId} with customer ${customerId}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("[Stripe Webhook] Subscription updated:", subscription.id);

        const customerId = subscription.customer as string;

        // Find user by customer ID
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (userResult.length > 0) {
          const user = userResult[0];
          let status: "none" | "active" | "canceled" | "past_due" = "none";

          if (subscription.status === "active") {
            status = "active";
          } else if (subscription.status === "canceled") {
            status = "canceled";
          } else if (subscription.status === "past_due") {
            status = "past_due";
          }

          await db
            .update(users)
            .set({
              subscriptionStatus: status,
              subscriptionEndDate: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            })
            .where(eq(users.id, user.id));

          console.log(`[Stripe Webhook] Updated subscription status for user ${user.id}: ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("[Stripe Webhook] Subscription deleted:", subscription.id);

        const customerId = subscription.customer as string;

        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (userResult.length > 0) {
          const user = userResult[0];

          await db
            .update(users)
            .set({
              stripeSubscriptionId: null,
              subscriptionStatus: "canceled",
            })
            .where(eq(users.id, user.id));

          console.log(`[Stripe Webhook] Canceled subscription for user ${user.id}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("[Stripe Webhook] Invoice payment failed:", invoice.id);

        const customerId = invoice.customer as string;

        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (userResult.length > 0) {
          const user = userResult[0];

          await db
            .update(users)
            .set({
              subscriptionStatus: "past_due",
            })
            .where(eq(users.id, user.id));

          console.log(`[Stripe Webhook] Marked subscription as past_due for user ${user.id}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error processing event: ${error.message}`);
    res.status(500).send(`Webhook processing error: ${error.message}`);
  }
}
