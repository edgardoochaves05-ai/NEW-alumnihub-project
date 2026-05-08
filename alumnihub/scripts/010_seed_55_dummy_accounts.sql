-- ============================================================
-- Migration 010: Seed 55 dummy accounts (30 alumni + 25 students)
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Alumni password : Alumni@Hub2026!
-- Student password: Student@Hub2026!
-- ============================================================


-- ── ALUMNI ───────────────────────────────────────────────────────────────────

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'ana.reyes@alumnihub.com') THEN
    RAISE NOTICE 'Skipping ana.reyes@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','ana.reyes@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Ana","last_name":"Reyes"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','ana.reyes@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'ana.reyes@alumnihub.com','alumni','Ana','Reyes','BS Information Systems','College of Information Technology','2017-00101',2017,2021,'Software Engineer','Accenture Philippines','Information Technology',ARRAY['JavaScript','React','Node.js','SQL'],'Passionate software engineer with 4 years in web development.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created ana.reyes@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'carlo.mendoza@alumnihub.com') THEN
    RAISE NOTICE 'Skipping carlo.mendoza@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','carlo.mendoza@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Carlo","last_name":"Mendoza"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','carlo.mendoza@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'carlo.mendoza@alumnihub.com','alumni','Carlo','Mendoza','BS Information Technology','College of Information Technology','2016-00102',2016,2020,'Systems Analyst','Concentrix','Information Technology',ARRAY['Python','Django','PostgreSQL','Docker'],'Systems analyst specializing in enterprise IT infrastructure.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created carlo.mendoza@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'diana.cruz@alumnihub.com') THEN
    RAISE NOTICE 'Skipping diana.cruz@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','diana.cruz@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Diana","last_name":"Cruz"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','diana.cruz@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'diana.cruz@alumnihub.com','alumni','Diana','Cruz','BS Computer Science','College of Information Technology','2018-00103',2018,2022,'Data Analyst','Globe Telecom','Telecommunications',ARRAY['Data Analysis','Excel','Power BI','Python'],'Data analyst with a focus on business intelligence.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created diana.cruz@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'emilio.garcia@alumnihub.com') THEN
    RAISE NOTICE 'Skipping emilio.garcia@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','emilio.garcia@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Emilio","last_name":"Garcia"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','emilio.garcia@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'emilio.garcia@alumnihub.com','alumni','Emilio','Garcia','BS Computer Engineering','College of Engineering','2015-00104',2015,2019,'Network Administrator','PLDT','Telecommunications',ARRAY['Network Security','Cisco','Firewall','Linux'],'Network administrator ensuring uptime for critical telco systems.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created emilio.garcia@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'felicia.torres@alumnihub.com') THEN
    RAISE NOTICE 'Skipping felicia.torres@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','felicia.torres@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Felicia","last_name":"Torres"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','felicia.torres@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'felicia.torres@alumnihub.com','alumni','Felicia','Torres','BS Information Systems','College of Information Technology','2017-00105',2017,2021,'IT Project Manager','BDO Unibank','Banking and Finance',ARRAY['Project Management','Agile','JIRA','Confluence'],'IT project manager leading digital transformation at a bank.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created felicia.torres@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'gian.bautista@alumnihub.com') THEN
    RAISE NOTICE 'Skipping gian.bautista@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','gian.bautista@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Gian","last_name":"Bautista"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','gian.bautista@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'gian.bautista@alumnihub.com','alumni','Gian','Bautista','BS Information Technology','College of Information Technology','2018-00106',2018,2022,'Full Stack Developer','Metrobank','Banking and Finance',ARRAY['JavaScript','React','Node.js','SQL'],'Full stack developer building fintech products.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created gian.bautista@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'hannah.villanueva@alumnihub.com') THEN
    RAISE NOTICE 'Skipping hannah.villanueva@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','hannah.villanueva@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Hannah","last_name":"Villanueva"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','hannah.villanueva@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'hannah.villanueva@alumnihub.com','alumni','Hannah','Villanueva','BS Computer Science','College of Information Technology','2016-00107',2016,2020,'QA Engineer','Sprout Solutions','Software Development',ARRAY['Python','Django','PostgreSQL','Docker'],'QA engineer passionate about delivering bug-free software.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created hannah.villanueva@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'ivan.lim@alumnihub.com') THEN
    RAISE NOTICE 'Skipping ivan.lim@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','ivan.lim@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Ivan","last_name":"Lim"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','ivan.lim@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'ivan.lim@alumnihub.com','alumni','Ivan','Lim','BS Computer Engineering','College of Engineering','2017-00108',2017,2021,'Database Administrator','UnionBank','Banking and Finance',ARRAY['Java','Spring Boot','MySQL','AWS'],'DBA managing high-availability databases for a major bank.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created ivan.lim@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'jasmine.ocampo@alumnihub.com') THEN
    RAISE NOTICE 'Skipping jasmine.ocampo@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','jasmine.ocampo@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Jasmine","last_name":"Ocampo"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','jasmine.ocampo@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'jasmine.ocampo@alumnihub.com','alumni','Jasmine','Ocampo','BS Information Systems','College of Information Technology','2015-00109',2015,2019,'DevOps Engineer','Accenture Philippines','Information Technology',ARRAY['C#','.NET','Azure','SQL Server'],'DevOps engineer streamlining CI/CD pipelines at a global consultancy.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created jasmine.ocampo@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'kevin.aquino@alumnihub.com') THEN
    RAISE NOTICE 'Skipping kevin.aquino@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','kevin.aquino@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Kevin","last_name":"Aquino"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','kevin.aquino@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'kevin.aquino@alumnihub.com','alumni','Kevin','Aquino','BS Information Technology','College of Information Technology','2018-00110',2018,2022,'Business Analyst','Concentrix','Software Development',ARRAY['PHP','Laravel','MySQL','Linux'],'Business analyst bridging IT and business stakeholders.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created kevin.aquino@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'laura.santos@alumnihub.com') THEN
    RAISE NOTICE 'Skipping laura.santos@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','laura.santos@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Laura","last_name":"Santos"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','laura.santos@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'laura.santos@alumnihub.com','alumni','Laura','Santos','BS Computer Science','College of Information Technology','2016-00111',2016,2020,'Software Engineer','Lazada Philippines','E-Commerce',ARRAY['TypeScript','Angular','REST APIs','Git'],'Software engineer building scalable e-commerce platforms.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created laura.santos@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'miguel.delarosa@alumnihub.com') THEN
    RAISE NOTICE 'Skipping miguel.delarosa@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','miguel.delarosa@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Miguel","last_name":"Dela Rosa"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','miguel.delarosa@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'miguel.delarosa@alumnihub.com','alumni','Miguel','Dela Rosa','BS Electronics Engineering','College of Engineering','2017-00112',2017,2021,'Systems Analyst','Shopee Philippines','E-Commerce',ARRAY['Data Analysis','Excel','Power BI','Python'],'Electronics engineer turned data analyst in retail tech.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created miguel.delarosa@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nina.pascual@alumnihub.com') THEN
    RAISE NOTICE 'Skipping nina.pascual@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','nina.pascual@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Nina","last_name":"Pascual"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','nina.pascual@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'nina.pascual@alumnihub.com','alumni','Nina','Pascual','BS Information Systems','College of Information Technology','2015-00113',2015,2019,'Data Analyst','Globe Telecom','Telecommunications',ARRAY['Network Security','Cisco','Firewall','Linux'],'Senior data analyst at a leading telco company.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created nina.pascual@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'oscar.fernandez@alumnihub.com') THEN
    RAISE NOTICE 'Skipping oscar.fernandez@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','oscar.fernandez@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Oscar","last_name":"Fernandez"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','oscar.fernandez@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'oscar.fernandez@alumnihub.com','alumni','Oscar','Fernandez','BS Information Technology','College of Information Technology','2016-00114',2016,2020,'Network Administrator','PLDT','Telecommunications',ARRAY['Project Management','Agile','JIRA','Confluence'],'Network specialist with expertise in enterprise wireless solutions.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created oscar.fernandez@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'patricia.navarro@alumnihub.com') THEN
    RAISE NOTICE 'Skipping patricia.navarro@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','patricia.navarro@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Patricia","last_name":"Navarro"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','patricia.navarro@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'patricia.navarro@alumnihub.com','alumni','Patricia','Navarro','BS Computer Science','College of Information Technology','2018-00115',2018,2022,'IT Project Manager','BDO Unibank','Banking and Finance',ARRAY['Android','Kotlin','Firebase','REST APIs'],'Mobile developer focused on Android banking apps.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created patricia.navarro@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'ramon.castillo@alumnihub.com') THEN
    RAISE NOTICE 'Skipping ramon.castillo@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','ramon.castillo@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Ramon","last_name":"Castillo"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','ramon.castillo@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'ramon.castillo@alumnihub.com','alumni','Ramon','Castillo','BS Computer Engineering','College of Engineering','2017-00116',2017,2021,'Full Stack Developer','Metrobank','Banking and Finance',ARRAY['JavaScript','React','Node.js','SQL'],'Full stack developer at one of the Philippines'' top banks.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created ramon.castillo@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'sofia.ramos@alumnihub.com') THEN
    RAISE NOTICE 'Skipping sofia.ramos@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','sofia.ramos@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Sofia","last_name":"Ramos"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','sofia.ramos@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'sofia.ramos@alumnihub.com','alumni','Sofia','Ramos','BS Information Systems','College of Information Technology','2015-00117',2015,2019,'QA Engineer','Sprout Solutions','Software Development',ARRAY['Python','Django','PostgreSQL','Docker'],'QA lead with 6+ years in software quality assurance.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created sofia.ramos@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'tristan.morales@alumnihub.com') THEN
    RAISE NOTICE 'Skipping tristan.morales@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','tristan.morales@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Tristan","last_name":"Morales"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','tristan.morales@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'tristan.morales@alumnihub.com','alumni','Tristan','Morales','BS Information Technology','College of Information Technology','2016-00118',2016,2020,'Database Administrator','UnionBank','Banking and Finance',ARRAY['Java','Spring Boot','MySQL','AWS'],'Database architect specializing in cloud migration.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created tristan.morales@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'ursula.aguilar@alumnihub.com') THEN
    RAISE NOTICE 'Skipping ursula.aguilar@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','ursula.aguilar@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Ursula","last_name":"Aguilar"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','ursula.aguilar@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'ursula.aguilar@alumnihub.com','alumni','Ursula','Aguilar','BS Computer Science','College of Information Technology','2018-00119',2018,2022,'DevOps Engineer','Lazada Philippines','E-Commerce',ARRAY['C#','.NET','Azure','SQL Server'],'DevOps engineer automating deployments for e-commerce.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created ursula.aguilar@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'victor.flores@alumnihub.com') THEN
    RAISE NOTICE 'Skipping victor.flores@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','victor.flores@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Victor","last_name":"Flores"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','victor.flores@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'victor.flores@alumnihub.com','alumni','Victor','Flores','BS Electronics Engineering','College of Engineering','2017-00120',2017,2021,'Business Analyst','Shopee Philippines','E-Commerce',ARRAY['PHP','Laravel','MySQL','Linux'],'Business analyst in a high-growth retail tech company.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created victor.flores@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'wendy.reyes@alumnihub.com') THEN
    RAISE NOTICE 'Skipping wendy.reyes@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','wendy.reyes@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Wendy","last_name":"Reyes"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','wendy.reyes@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'wendy.reyes@alumnihub.com','alumni','Wendy','Reyes','BS Information Systems','College of Information Technology','2015-00121',2015,2019,'Software Engineer','Accenture Philippines','Information Technology',ARRAY['TypeScript','Angular','REST APIs','Git'],'Senior software engineer at a global IT consultancy.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created wendy.reyes@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'xavier.deleon@alumnihub.com') THEN
    RAISE NOTICE 'Skipping xavier.deleon@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','xavier.deleon@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Xavier","last_name":"De Leon"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','xavier.deleon@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'xavier.deleon@alumnihub.com','alumni','Xavier','De Leon','BS Information Technology','College of Information Technology','2016-00122',2016,2020,'Systems Analyst','Concentrix','Information Technology',ARRAY['Data Analysis','Excel','Power BI','Python'],'Systems analyst with expertise in ERP implementations.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created xavier.deleon@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'yvonne.santiago@alumnihub.com') THEN
    RAISE NOTICE 'Skipping yvonne.santiago@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','yvonne.santiago@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Yvonne","last_name":"Santiago"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','yvonne.santiago@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'yvonne.santiago@alumnihub.com','alumni','Yvonne','Santiago','BS Computer Science','College of Information Technology','2018-00123',2018,2022,'Data Analyst','Globe Telecom','Telecommunications',ARRAY['Network Security','Cisco','Firewall','Linux'],'Data analyst turning raw telecom data into actionable insights.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created yvonne.santiago@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'zachary.hernandez@alumnihub.com') THEN
    RAISE NOTICE 'Skipping zachary.hernandez@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','zachary.hernandez@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Zachary","last_name":"Hernandez"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','zachary.hernandez@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'zachary.hernandez@alumnihub.com','alumni','Zachary','Hernandez','BS Computer Engineering','College of Engineering','2017-00124',2017,2021,'Network Administrator','PLDT','Telecommunications',ARRAY['Project Management','Agile','JIRA','Confluence'],'Network security engineer protecting telco infrastructure.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created zachary.hernandez@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'abigail.lopez@alumnihub.com') THEN
    RAISE NOTICE 'Skipping abigail.lopez@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','abigail.lopez@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Abigail","last_name":"Lopez"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','abigail.lopez@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'abigail.lopez@alumnihub.com','alumni','Abigail','Lopez','BS Information Systems','College of Information Technology','2015-00125',2015,2019,'IT Project Manager','BDO Unibank','Banking and Finance',ARRAY['Android','Kotlin','Firebase','REST APIs'],'Project manager delivering banking digital projects on time.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created abigail.lopez@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'benjamin.tan@alumnihub.com') THEN
    RAISE NOTICE 'Skipping benjamin.tan@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','benjamin.tan@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Benjamin","last_name":"Tan"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','benjamin.tan@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'benjamin.tan@alumnihub.com','alumni','Benjamin','Tan','BS Information Technology','College of Information Technology','2016-00126',2016,2020,'Full Stack Developer','Metrobank','Banking and Finance',ARRAY['JavaScript','React','Node.js','SQL'],'Full stack developer with deep expertise in fintech APIs.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created benjamin.tan@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'carla.guevara@alumnihub.com') THEN
    RAISE NOTICE 'Skipping carla.guevara@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','carla.guevara@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Carla","last_name":"Guevara"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','carla.guevara@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'carla.guevara@alumnihub.com','alumni','Carla','Guevara','BS Computer Science','College of Information Technology','2018-00127',2018,2022,'QA Engineer','Sprout Solutions','Software Development',ARRAY['Python','Django','PostgreSQL','Docker'],'QA engineer with ISTQB certification.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created carla.guevara@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'dante.peralta@alumnihub.com') THEN
    RAISE NOTICE 'Skipping dante.peralta@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','dante.peralta@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Dante","last_name":"Peralta"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','dante.peralta@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'dante.peralta@alumnihub.com','alumni','Dante','Peralta','BS Computer Engineering','College of Engineering','2017-00128',2017,2021,'Database Administrator','UnionBank','Banking and Finance',ARRAY['Java','Spring Boot','MySQL','AWS'],'Database administrator ensuring data integrity for financial systems.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created dante.peralta@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'elena.valdez@alumnihub.com') THEN
    RAISE NOTICE 'Skipping elena.valdez@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','elena.valdez@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Elena","last_name":"Valdez"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','elena.valdez@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'elena.valdez@alumnihub.com','alumni','Elena','Valdez','BS Information Systems','College of Information Technology','2015-00129',2015,2019,'DevOps Engineer','Lazada Philippines','E-Commerce',ARRAY['C#','.NET','Azure','SQL Server'],'DevOps lead with 6 years driving cloud-native transformation.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created elena.valdez@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'franco.magno@alumnihub.com') THEN
    RAISE NOTICE 'Skipping franco.magno@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','franco.magno@alumnihub.com',crypt('Alumni@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"alumni","first_name":"Franco","last_name":"Magno"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','franco.magno@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,graduation_year,current_job_title,current_company,industry,skills,bio,is_verified)
    VALUES (uid,'franco.magno@alumnihub.com','alumni','Franco','Magno','BS Electronics Engineering','College of Engineering','2016-00130',2016,2020,'Business Analyst','Shopee Philippines','E-Commerce',ARRAY['PHP','Laravel','MySQL','Linux'],'Business analyst at a leading Philippine e-commerce platform.',true)
    ON CONFLICT (id) DO UPDATE SET role='alumni';
    RAISE NOTICE 'Created franco.magno@alumnihub.com';
  END IF;
END $$;


-- ── STUDENTS ─────────────────────────────────────────────────────────────────

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'alyssa.bautista@alumnihub.com') THEN
    RAISE NOTICE 'Skipping alyssa.bautista@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','alyssa.bautista@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Alyssa","last_name":"Bautista"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','alyssa.bautista@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'alyssa.bautista@alumnihub.com','student','Alyssa','Bautista','BS Information Systems','College of Information Technology','2022-00201',2022,'2nd year IS student interested in UX design.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created alyssa.bautista@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'bernard.corpus@alumnihub.com') THEN
    RAISE NOTICE 'Skipping bernard.corpus@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','bernard.corpus@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Bernard","last_name":"Corpus"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','bernard.corpus@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'bernard.corpus@alumnihub.com','student','Bernard','Corpus','BS Information Technology','College of Information Technology','2023-00202',2023,'1st year IT student with a passion for networking.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created bernard.corpus@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'christine.domingo@alumnihub.com') THEN
    RAISE NOTICE 'Skipping christine.domingo@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','christine.domingo@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Christine","last_name":"Domingo"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','christine.domingo@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'christine.domingo@alumnihub.com','student','Christine','Domingo','BS Computer Science','College of Information Technology','2021-00203',2021,'3rd year CS student focusing on machine learning.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created christine.domingo@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'dennis.enriquez@alumnihub.com') THEN
    RAISE NOTICE 'Skipping dennis.enriquez@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','dennis.enriquez@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Dennis","last_name":"Enriquez"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','dennis.enriquez@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'dennis.enriquez@alumnihub.com','student','Dennis','Enriquez','BS Computer Engineering','College of Engineering','2022-00204',2022,'2nd year CpE student building embedded systems projects.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created dennis.enriquez@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'erica.fajardo@alumnihub.com') THEN
    RAISE NOTICE 'Skipping erica.fajardo@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','erica.fajardo@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Erica","last_name":"Fajardo"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','erica.fajardo@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'erica.fajardo@alumnihub.com','student','Erica','Fajardo','BS Electronics Engineering','College of Engineering','2023-00205',2023,'1st year ECE student eager to learn signal processing.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created erica.fajardo@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'felix.guerrero@alumnihub.com') THEN
    RAISE NOTICE 'Skipping felix.guerrero@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','felix.guerrero@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Felix","last_name":"Guerrero"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','felix.guerrero@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'felix.guerrero@alumnihub.com','student','Felix','Guerrero','BS Information Systems','College of Information Technology','2021-00206',2021,'3rd year IS student working on thesis on alumni tracking.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created felix.guerrero@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'grace.hidalgo@alumnihub.com') THEN
    RAISE NOTICE 'Skipping grace.hidalgo@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','grace.hidalgo@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Grace","last_name":"Hidalgo"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','grace.hidalgo@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'grace.hidalgo@alumnihub.com','student','Grace','Hidalgo','BS Information Technology','College of Information Technology','2022-00207',2022,'2nd year IT student with internship at a startup.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created grace.hidalgo@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'harold.ignacio@alumnihub.com') THEN
    RAISE NOTICE 'Skipping harold.ignacio@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','harold.ignacio@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Harold","last_name":"Ignacio"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','harold.ignacio@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'harold.ignacio@alumnihub.com','student','Harold','Ignacio','BS Computer Science','College of Information Technology','2023-00208',2023,'1st year CS student competitive programmer.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created harold.ignacio@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'irene.julian@alumnihub.com') THEN
    RAISE NOTICE 'Skipping irene.julian@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','irene.julian@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Irene","last_name":"Julian"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','irene.julian@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'irene.julian@alumnihub.com','student','Irene','Julian','BS Computer Engineering','College of Engineering','2021-00209',2021,'3rd year CpE student specializing in IoT.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created irene.julian@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'jerome.kalaw@alumnihub.com') THEN
    RAISE NOTICE 'Skipping jerome.kalaw@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','jerome.kalaw@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Jerome","last_name":"Kalaw"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','jerome.kalaw@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'jerome.kalaw@alumnihub.com','student','Jerome','Kalaw','BS Electronics Engineering','College of Engineering','2022-00210',2022,'2nd year ECE student interested in robotics.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created jerome.kalaw@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'karen.luna@alumnihub.com') THEN
    RAISE NOTICE 'Skipping karen.luna@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','karen.luna@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Karen","last_name":"Luna"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','karen.luna@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'karen.luna@alumnihub.com','student','Karen','Luna','BS Information Systems','College of Information Technology','2023-00211',2023,'1st year IS student with strong Excel and data skills.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created karen.luna@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'lorenzo.manalo@alumnihub.com') THEN
    RAISE NOTICE 'Skipping lorenzo.manalo@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','lorenzo.manalo@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Lorenzo","last_name":"Manalo"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','lorenzo.manalo@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'lorenzo.manalo@alumnihub.com','student','Lorenzo','Manalo','BS Information Technology','College of Information Technology','2021-00212',2021,'3rd year IT student specializing in cybersecurity.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created lorenzo.manalo@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'monica.natividad@alumnihub.com') THEN
    RAISE NOTICE 'Skipping monica.natividad@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','monica.natividad@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Monica","last_name":"Natividad"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','monica.natividad@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'monica.natividad@alumnihub.com','student','Monica','Natividad','BS Computer Science','College of Information Technology','2022-00213',2022,'2nd year CS student doing research on NLP.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created monica.natividad@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'nathaniel.ong@alumnihub.com') THEN
    RAISE NOTICE 'Skipping nathaniel.ong@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','nathaniel.ong@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Nathaniel","last_name":"Ong"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','nathaniel.ong@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'nathaniel.ong@alumnihub.com','student','Nathaniel','Ong','BS Computer Engineering','College of Engineering','2023-00214',2023,'1st year CpE student learning VHDL and FPGA design.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created nathaniel.ong@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'olivia.padilla@alumnihub.com') THEN
    RAISE NOTICE 'Skipping olivia.padilla@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','olivia.padilla@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Olivia","last_name":"Padilla"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','olivia.padilla@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'olivia.padilla@alumnihub.com','student','Olivia','Padilla','BS Information Systems','College of Information Technology','2021-00215',2021,'3rd year IS student with part-time work as a web developer.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created olivia.padilla@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'paulo.quizon@alumnihub.com') THEN
    RAISE NOTICE 'Skipping paulo.quizon@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','paulo.quizon@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Paulo","last_name":"Quizon"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','paulo.quizon@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'paulo.quizon@alumnihub.com','student','Paulo','Quizon','BS Information Technology','College of Information Technology','2022-00216',2022,'2nd year IT student building a startup mobile app.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created paulo.quizon@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'queenie.rivero@alumnihub.com') THEN
    RAISE NOTICE 'Skipping queenie.rivero@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','queenie.rivero@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Queenie","last_name":"Rivero"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','queenie.rivero@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'queenie.rivero@alumnihub.com','student','Queenie','Rivero','BS Computer Science','College of Information Technology','2023-00217',2023,'1st year CS student fascinated by computer graphics.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created queenie.rivero@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'renato.soriano@alumnihub.com') THEN
    RAISE NOTICE 'Skipping renato.soriano@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','renato.soriano@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Renato","last_name":"Soriano"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','renato.soriano@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'renato.soriano@alumnihub.com','student','Renato','Soriano','BS Electronics Engineering','College of Engineering','2021-00218',2021,'3rd year ECE student doing thesis on smart grid systems.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created renato.soriano@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'sheila.tugade@alumnihub.com') THEN
    RAISE NOTICE 'Skipping sheila.tugade@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','sheila.tugade@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Sheila","last_name":"Tugade"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','sheila.tugade@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'sheila.tugade@alumnihub.com','student','Sheila','Tugade','BS Information Systems','College of Information Technology','2022-00219',2022,'2nd year IS student with interest in business process modeling.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created sheila.tugade@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'timothy.uy@alumnihub.com') THEN
    RAISE NOTICE 'Skipping timothy.uy@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','timothy.uy@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Timothy","last_name":"Uy"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','timothy.uy@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'timothy.uy@alumnihub.com','student','Timothy','Uy','BS Information Technology','College of Information Technology','2023-00220',2023,'1st year IT student excited about cloud computing.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created timothy.uy@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'uriel.vega@alumnihub.com') THEN
    RAISE NOTICE 'Skipping uriel.vega@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','uriel.vega@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Uriel","last_name":"Vega"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','uriel.vega@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'uriel.vega@alumnihub.com','student','Uriel','Vega','BS Computer Science','College of Information Technology','2021-00221',2021,'3rd year CS student participating in ACM ICPC.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created uriel.vega@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'vanessa.wenceslao@alumnihub.com') THEN
    RAISE NOTICE 'Skipping vanessa.wenceslao@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','vanessa.wenceslao@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Vanessa","last_name":"Wenceslao"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','vanessa.wenceslao@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'vanessa.wenceslao@alumnihub.com','student','Vanessa','Wenceslao','BS Computer Engineering','College of Engineering','2022-00222',2022,'2nd year CpE student building Arduino-based projects.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created vanessa.wenceslao@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'walter.xavier@alumnihub.com') THEN
    RAISE NOTICE 'Skipping walter.xavier@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','walter.xavier@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Walter","last_name":"Xavier"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','walter.xavier@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'walter.xavier@alumnihub.com','student','Walter','Xavier','BS Electronics Engineering','College of Engineering','2023-00223',2023,'1st year ECE student with a background in ham radio.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created walter.xavier@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'xandra.yap@alumnihub.com') THEN
    RAISE NOTICE 'Skipping xandra.yap@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','xandra.yap@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Xandra","last_name":"Yap"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','xandra.yap@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'xandra.yap@alumnihub.com','student','Xandra','Yap','BS Information Systems','College of Information Technology','2021-00224',2021,'3rd year IS student interning at a government IT agency.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created xandra.yap@alumnihub.com';
  END IF;
END $$;

DO $$ DECLARE uid UUID := gen_random_uuid(); BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'yvan.zamora@alumnihub.com') THEN
    RAISE NOTICE 'Skipping yvan.zamora@alumnihub.com (exists)';
  ELSE
    INSERT INTO auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated','yvan.zamora@alumnihub.com',crypt('Student@Hub2026!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"role":"student","first_name":"Yvan","last_name":"Zamora"}',NOW(),NOW(),'','','','');
    INSERT INTO auth.identities (id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    VALUES (gen_random_uuid(),uid,jsonb_build_object('sub',uid::text,'email','yvan.zamora@alumnihub.com'),'email',NOW(),NOW(),NOW());
    INSERT INTO profiles (id,email,role,first_name,last_name,program,department,student_number,batch_year,bio)
    VALUES (uid,'yvan.zamora@alumnihub.com','student','Yvan','Zamora','BS Information Technology','College of Information Technology','2022-00225',2022,'2nd year IT student with strong Linux administration skills.')
    ON CONFLICT (id) DO UPDATE SET role='student';
    RAISE NOTICE 'Created yvan.zamora@alumnihub.com';
  END IF;
END $$;
