CREATE DATABASE IF NOT EXISTS `kanban` DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;
USE `kanban`;

CREATE TABLE IF NOT EXISTS `user` (
	`user_username` VARCHAR(255) PRIMARY KEY,
    `user_password` VARCHAR(255) NOT NULL,
    `user_email` VARCHAR(255),
    `user_enabled` BOOL NOT NULL
) ENGINE=InnoDB; 	
/* Super Admin Username: admin
   Super Admin Password: password */
INSERT INTO `user` (`user_username`, `user_password`, `user_email`, `user_enabled`) VALUES ("admin", "$2a$10$H5KMED.t.xxaXamzzxE7j.BRLjmIH19BuRtGKdlvtOzMnuqMnTvRu", "admin@mailinator.com", true);

/* Call it tag because group is a reserved keyword. */
CREATE TABLE IF NOT EXISTS `tag` (
	`tag_name` VARCHAR(255) PRIMARY KEY
) ENGINE=InnoDB;
INSERT INTO `tag` (`tag_name`) VALUES ('admin');
INSERT INTO `tag` (`tag_name`) VALUES ('project_lead');
INSERT INTO `tag` (`tag_name`) VALUES ('project_manager');

CREATE TABLE IF NOT EXISTS `tagging` (
	`tagging_user` VARCHAR(255),
    `tagging_tag` VARCHAR(255),
     PRIMARY KEY (`tagging_user`, `tagging_tag`),
     FOREIGN KEY (`tagging_user`) REFERENCES `user`(`user_username`),
     FOREIGN KEY (`tagging_tag`) REFERENCES `tag`(`tag_name`)
) ENGINE=InnoDB;
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("admin", "admin");

CREATE TABLE IF NOT EXISTS `app` (
	`app_acronym` VARCHAR(255) PRIMARY KEY,
    `app_description` TEXT,
    `app_rnumber` INT NOT NULL,
    `app_startdate` DATE NOT NULL,
    `app_enddate` DATE NOT NULL,
    `app_permit_create` VARCHAR(255),
    `app_permit_open` VARCHAR(255),
    `app_permit_todolist` VARCHAR(255),
    `app_permit_doing` VARCHAR(255),
    `app_permit_done` VARCHAR(255),
    FOREIGN KEY (`app_permit_create`) REFERENCES `tag`(`tag_name`),
    FOREIGN KEY (`app_permit_open`) REFERENCES `tag`(`tag_name`),
    FOREIGN KEY (`app_permit_todolist`) REFERENCES `tag`(`tag_name`),
    FOREIGN KEY (`app_permit_doing`) REFERENCES `tag`(`tag_name`),
    FOREIGN KEY (`app_permit_done`) REFERENCES `tag`(`tag_name`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `plan` (
	`plan_app_acronym` VARCHAR(255),
    `plan_mvp_name` VARCHAR(255),
    `plan_startdate` DATE NOT NULL,
    `plan_enddate` DATE NOT NULL,
    PRIMARY KEY (`plan_app_acronym`, `plan_mvp_name`),
    FOREIGN KEY (`plan_app_acronym`) REFERENCES `app`(`app_acronym`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `task` (
	`task_id` VARCHAR(255) PRIMARY KEY,
    `task_name` VARCHAR(255) NOT NULL,
    `task_description` TEXT,
    `task_plan` VARCHAR(255), /* Cannot be foreign key as it is not unique on its own. */
	`task_createdate` DATE NOT NULL,
    `task_creator` VARCHAR(255) NOT NULL,
    `task_owner` VARCHAR(255) NOT NULL,
    `task_state` ENUM("open", "todo", "doing", "done", "closed"),
    `task_notes` LONGTEXT,
    `task_app_acronym` VARCHAR(255) NOT NULL,
    FOREIGN KEY (`task_creator`) REFERENCES `user`(`user_username`),
    FOREIGN KEY (`task_owner`) REFERENCES `user`(`user_username`),
    FOREIGN KEY (`task_app_acronym`) REFERENCES `app`(`app_acronym`)
) ENGINE=InnoDB;

/* Test user for development. */
INSERT INTO `user` (`user_username`, `user_password`, `user_email`, `user_enabled`) VALUES ("dev1", "$2a$10$H5KMED.t.xxaXamzzxE7j.BRLjmIH19BuRtGKdlvtOzMnuqMnTvRu", "dev1@mailinator.com", true);

INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("dev1", "admin");
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("dev1", "project_lead");
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("dev1", "project_manager");
