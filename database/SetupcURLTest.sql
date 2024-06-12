INSERT INTO `tag` (`tag_name`) VALUES ('permit_create');
INSERT INTO `tag` (`tag_name`) VALUES ('permit_open');
INSERT INTO `tag` (`tag_name`) VALUES ('permit_todo');
INSERT INTO `tag` (`tag_name`) VALUES ('permit_doing');
INSERT INTO `tag` (`tag_name`) VALUES ('permit_done');

INSERT INTO `user` (`user_username`, `user_password`, `user_email`, `user_enabled`) VALUES ("test_user", "$2a$10$Qznq2esYgQAkMLe0ks/04uz/ASlQkfTiJ1vZOWRI4NarJmK32g2vm", "test_user@mailinator.com", true);
INSERT INTO `user` (`user_username`, `user_password`, `user_email`, `user_enabled`) VALUES ("test_user2", "$2a$10$Qznq2esYgQAkMLe0ks/04uz/ASlQkfTiJ1vZOWRI4NarJmK32g2vm", "test_user2@mailinator.com", true);

INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("test_user", "admin");
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("test_user", "project_lead");
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("test_user", "project_manager");
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("test_user", "permit_create");
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("test_user", "permit_open");
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("test_user", "permit_todo");
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("test_user", "permit_doing");
INSERT INTO `tagging` (`tagging_user`, `tagging_tag`) VALUES ("test_user", "permit_done");

INSERT INTO `app` (`app_acronym`, `app_description`, `app_rnumber`, `app_startdate`, `app_enddate`, `app_permit_create`, `app_permit_open`, `app_permit_todolist`, `app_permit_doing`, `app_permit_done`) VALUES ("test_app", "This is an application description.", 1, "2025-01-01", "2025-12-31", "permit_create", "permit_open", "permit_todo", "permit_doing", "permit_done");

INSERT INTO `plan` (`plan_app_acronym`, `plan_mvp_name`, `plan_startdate`, `plan_enddate`) VALUES ("test_app", "Test Plan 1", "2025-01-01", "2025-01-31");
INSERT INTO `plan` (`plan_app_acronym`, `plan_mvp_name`, `plan_startdate`, `plan_enddate`) VALUES ("test_app", "Test Plan 2", "2025-02-01", "2025-02-28");
INSERT INTO `plan` (`plan_app_acronym`, `plan_mvp_name`, `plan_startdate`, `plan_enddate`) VALUES ("test_app", "Test Plan 3", "2025-03-01", "2025-03-31");