-- username asd, password asdf
INSERT INTO `user` VALUES
('69891648-07bb-4991-8035-7fbc89fb6035', 'asd', '$argon2i$v=19$m=65536,t=2,p=1$KSyt5XCibxRx6hj0Ji8kgA$W3jMt/0aQH97gCzXotb4MMSFo+XZ2VJItOj4gX9+8Pw', NULL, NULL, NULL, NULL),
('c90aa48a-d296-4103-97c2-0c0b1701c50e', 'zxc', '$argon2i$v=19$m=65536,t=2,p=1$KSyt5XCibxRx6hj0Ji8kgA$W3jMt/0aQH97gCzXotb4MMSFo+XZ2VJItOj4gX9+8Pw', NULL, NULL, NULL, NULL);

INSERT INTO exercise (id, `name`) VALUES
    ('c5b8ede5-4859-4f0e-a2c8-df09948886d4', 'Maastaveto'),
    ('801961f1-f12a-459a-a9f8-82398c813032', 'Leuanveto'),
    ('f2e8f7c1-4ec0-47f4-a2ec-cb3c4da0e61f', 'Alatalja'),
    ('57338e1d-edb0-47a7-b457-d85fd12ac071', 'Ylätalja'),

    ('b5a9dd79-440c-4549-a504-65d7a0a5b2c6', 'Kulmasoutu'),
    ('45a1feb3-7ec3-4f05-8a91-4f62f19287f8', 'Vatsarutistus'),
    ('3545b161-08a3-4652-89a6-514b5dcf2b8e', 'Jalka-lantionosto'),
    ('51bc585d-62eb-4503-857e-b89aa1504c96', 'Reiden koukistus'),
    ('237411d2-2669-4231-8e14-7da49a910929', 'Vipunostot'),

    ('faee5dea-7684-416c-bd18-6fadf2bee3f7', 'Olankohotus'),
    ('5e9c2306-d66f-403e-be5e-3bda7398bf0a', 'Selänojennus'),
    ('85531ed5-f549-4893-a527-5dc56a94ba33' ,'Hauiskääntö'),
    ('5423cc4c-b839-4a1f-b809-dd07df733645', 'Rannekääntö'),
    ('48e94314-1a3a-4e6a-adb1-d1f3b6b29d44', 'Hyvää huomenta'),

    ('87f8c098-be1c-41bc-addd-d88b596e430e', 'Penkkipunnerrus'),
    ('f117b182-348d-4e16-8bff-4df495e033af', 'Jalkakyykky'),
    ('63676765-efc7-48b7-ae1b-486308e778aa', 'Jalkaprässi'),
    ('a833b0a2-2499-4774-a5de-16699e623edf', 'Reiden ojennus'),
    ('6f6facee-ad75-4b5c-8e04-34bec8794ee9', 'Pystypunnerrus'),

    ('9eb1e92d-3c85-4a74-b7a3-0b744d983358', 'Pystysoutu'),
    ('8449ff98-13f6-4865-9a4c-496540d2b245', 'Pohjenostot'),
    ('dc6e5d06-a46e-4ca5-9acd-dec4aeb7b3b0', 'Dippi'),
    ('033ac5ce-e5dc-48bf-9b76-c53757fe6d24', 'Rintavipunosto'),
    ('39aa2b9d-9434-4620-bcda-409228256fb2', 'Peckdeck'),

    ('70ac80d1-2f7b-4552-bdc6-3018e68b9edb', 'Ranskalainen punnerrus'), -- ojentajat
    ('4c0d033b-f64c-4238-b426-a477609c432a', 'Käden ojennus'),
    ('385fcbe3-8925-48c7-b2df-830f1a6b1d3c', 'Kiertäjäkalvosin'),
    ('be206ba1-b449-4735-8621-d9171f1bed8d', 'Askelkyykky');

INSERT INTO exerciseVariant (id, exerciseId, content) VALUES
    ('330ee6a9-fdaa-4715-bfde-99ecf724f5dc', 'c5b8ede5-4859-4f0e-a2c8-df09948886d4', 'käsipainoilla'),
    ('5e23caf8-6d42-4ea1-bbb1-852570123214', '85531ed5-f549-4893-a527-5dc56a94ba33', 'levytangolla'),
    ('a84fd1fa-c0ca-4e3d-8537-aacdf901687d', '801961f1-f12a-459a-a9f8-82398c813032', 'myötäotteella'),
    ('8ebc19e3-1b3b-49b3-a81b-e81694be91ed', 'f2e8f7c1-4ec0-47f4-a2ec-cb3c4da0e61f', 'leveä'),

    ('68129957-8004-4245-80c2-c24a92d7a793', '87f8c098-be1c-41bc-addd-d88b596e430e', 'kapea'),
    ('0ec45dde-19cf-4b27-9d5b-d12fa9fc3d34', '57338e1d-edb0-47a7-b457-d85fd12ac071', 'vastaottella'),
    ('a329404a-9c8f-4206-af09-4ce34e16cea1', 'b5a9dd79-440c-4549-a504-65d7a0a5b2c6', 'käsipainoilla'),
    ('d865966a-6e83-4cde-ad41-7bb1f3758c76', 'b5a9dd79-440c-4549-a504-65d7a0a5b2c6', 'vastaottella'),
    ('228f7350-1c74-446b-89ac-db3ef90ddfcb', '51bc585d-62eb-4503-857e-b89aa1504c96', 'yhden jalan'),

    ('bb8f9280-394b-4702-aaac-83a9d92a4b1a', '237411d2-2669-4231-8e14-7da49a910929', 'istuen'),
    ('6f82e014-4fa9-4f43-b15c-62d4299f579e', '237411d2-2669-4231-8e14-7da49a910929', 'suorin vartaloin'),
    ('05f264c4-17bb-4ad1-93a8-e0bf3b5bd2b8', '237411d2-2669-4231-8e14-7da49a910929', 'taakse'),
    ('411fd76e-90c6-420b-a79a-7effd7df54b0', 'faee5dea-7684-416c-bd18-6fadf2bee3f7', 'levytangolla'),
    ('5d359688-2577-49e4-af1b-86bb43850db5', '87f8c098-be1c-41bc-addd-d88b596e430e', 'käsipainoilla'),

    ('b3f7c66f-cfd0-4fa4-ae6f-ee6ea1bfe8d9', 'a833b0a2-2499-4774-a5de-16699e623edf', 'yhden jalan'),
    ('535c5e78-165b-42d2-9a8c-a74efa84e6b8', '8449ff98-13f6-4865-9a4c-496540d2b245', 'hack-laittessa'),
    ('b0fa631f-3785-4001-b544-5f9deda69934', '63676765-efc7-48b7-ae1b-486308e778aa', 'kapea'),
    ('1a9331ab-2b18-4cb1-93fd-17e8f0a59826', 'be206ba1-b449-4735-8621-d9171f1bed8d', 'taakse'),
    ('b06b54ef-79b9-4346-a7e9-0bbba4070060', '6f6facee-ad75-4b5c-8e04-34bec8794ee9', 'käsipainoilla'),

    ('840c8e54-924c-4653-98b7-b08ac770f306', '8449ff98-13f6-4865-9a4c-496540d2b245', 'yhden jalan hack'),
    ('792ecdf0-b152-4035-b575-9b565f85d74a', 'f117b182-348d-4e16-8bff-4df495e033af', 'kapea'),
    ('d0ba654c-90a2-4821-b09e-5ddcd2e4708b', 'f117b182-348d-4e16-8bff-4df495e033af', 'syvä'),
    ('6466c7d7-457b-4335-be8a-8027a3115533', '63676765-efc7-48b7-ae1b-486308e778aa', 'takapainoinen'),
    ('7ab1f571-5d26-4666-b189-320a2167bf3d', 'f117b182-348d-4e16-8bff-4df495e033af', 'hack-laittessa'),

    ('f5a17ccf-8cfe-49e0-8cf1-2314a0695e1e', '8449ff98-13f6-4865-9a4c-496540d2b245', 'lait. yhden jalan'),
    ('b5c3f89c-0f36-4d7d-a44c-21275fff5a39', '63676765-efc7-48b7-ae1b-486308e778aa', 'yhden jalan'),
    ('6a5dc547-9589-4593-be91-4aeeade7088d', 'c5b8ede5-4859-4f0e-a2c8-df09948886d4', 'sumo');
