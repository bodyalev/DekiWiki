ALTER TABLE `pages` ADD `page_content_type` VARCHAR( 255 ) NOT NULL DEFAULT 'application/x.deki-text';
ALTER TABLE `old` ADD `old_content_type` VARCHAR( 255 ) NOT NULL DEFAULT 'application/x.deki-text';