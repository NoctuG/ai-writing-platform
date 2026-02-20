ALTER TABLE `references`
ADD `documentType` enum('journal','book','thesis','conference','report','standard','patent','web') NOT NULL DEFAULT 'journal';
