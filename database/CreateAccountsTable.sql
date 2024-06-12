DROP TABLE IF EXISTS `account`;
CREATE TABLE IF NOT EXISTS `account` (
	`id` int PRIMARY KEY AUTO_INCREMENT,
	`username` varchar(50) NOT NULL UNIQUE,
    `password` varchar(255) NOT NULL,
    `email` varchar(100) NOT NULL UNIQUE,
    `is_admin` bool NOT NULL,
    `is_enabled` bool NOT NULL
) ENGINE=InnoDB;

INSERT INTO `account` (`username`, `password`, `email`, `is_admin`, `is_enabled`)
VALUES ('admin', 'admin', 'admin@example.net', true, true);