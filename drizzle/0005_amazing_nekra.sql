CREATE TABLE `charts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`chartType` enum('line','bar','scatter','pie','radar','area') NOT NULL,
	`dataSource` text NOT NULL,
	`chartConfig` text NOT NULL,
	`description` text,
	`figureNumber` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `charts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`parentId` int,
	`color` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`paperId` int,
	`fileName` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`extractedText` text,
	`summary` text,
	`metadata` text,
	`status` enum('uploading','processing','ready','failed') NOT NULL DEFAULT 'uploading',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paperTagAssociations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `paperTagAssociations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paperTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paperTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int,
	`userId` int NOT NULL,
	`sourceText` text NOT NULL,
	`translatedText` text NOT NULL,
	`sourceLang` varchar(10) NOT NULL,
	`targetLang` varchar(10) NOT NULL,
	`domain` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `translations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `papers` ADD `folderId` int;--> statement-breakpoint
ALTER TABLE `papers` ADD `isDeleted` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `papers` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `charts` ADD CONSTRAINT `charts_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `charts` ADD CONSTRAINT `charts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `folders` ADD CONSTRAINT `folders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `knowledgeDocuments` ADD CONSTRAINT `knowledgeDocuments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `knowledgeDocuments` ADD CONSTRAINT `knowledgeDocuments_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paperTagAssociations` ADD CONSTRAINT `paperTagAssociations_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paperTagAssociations` ADD CONSTRAINT `paperTagAssociations_tagId_paperTags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `paperTags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paperTags` ADD CONSTRAINT `paperTags_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `translations` ADD CONSTRAINT `translations_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `translations` ADD CONSTRAINT `translations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;