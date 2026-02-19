ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('none','active','canceled','past_due') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionEndDate` timestamp;