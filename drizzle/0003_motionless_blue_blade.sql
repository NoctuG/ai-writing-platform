CREATE TABLE `polishHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int NOT NULL,
	`originalText` text NOT NULL,
	`polishedText` text NOT NULL,
	`polishType` enum('expression','grammar','academic','comprehensive') NOT NULL,
	`suggestions` text,
	`applied` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `polishHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qualityChecks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int NOT NULL,
	`overallScore` int NOT NULL,
	`plagiarismScore` int,
	`grammarScore` int,
	`academicStyleScore` int,
	`structureScore` int,
	`issues` text,
	`suggestions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qualityChecks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `references` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int NOT NULL,
	`title` text NOT NULL,
	`authors` text NOT NULL,
	`year` int,
	`journal` text,
	`volume` varchar(50),
	`issue` varchar(50),
	`pages` varchar(50),
	`doi` varchar(255),
	`url` text,
	`citationFormat` enum('gbt7714','apa','mla','chicago') NOT NULL DEFAULT 'gbt7714',
	`formattedCitation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `references_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `polishHistory` ADD CONSTRAINT `polishHistory_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qualityChecks` ADD CONSTRAINT `qualityChecks_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `references` ADD CONSTRAINT `references_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE cascade ON UPDATE no action;