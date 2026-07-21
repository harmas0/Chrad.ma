DO $$ 
DECLARE
    admin_id uuid := '6066729c-9446-4f4c-91cf-795965a71934';
    runner_1_id uuid := gen_random_uuid();
    runner_2_id uuid := gen_random_uuid();
    client_1_id uuid := gen_random_uuid();
    client_2_id uuid := gen_random_uuid();
    task_1_id uuid := gen_random_uuid();
    task_2_id uuid := gen_random_uuid();
    task_3_id uuid := gen_random_uuid();
    task_4_id uuid := gen_random_uuid();
    conv_1_id uuid := gen_random_uuid();
    cat_delivery_id text := 'delivery';
    cat_errands_id text := 'shopping';
    cat_shopping_id text := 'personal_shopping';
BEGIN
    -- 1. DELETE EXISTING DATA
    DELETE FROM public.admin_audit_log;
    DELETE FROM public.announcements;
    DELETE FROM public.support_tickets;
    DELETE FROM public.disputes;
    DELETE FROM public.reviews;
    DELETE FROM public.messages;
    DELETE FROM public.conversations;
    DELETE FROM public.bids;
    DELETE FROM public.tasks;
    DELETE FROM public.task_categories;
    
    -- Delete profiles except admin
    DELETE FROM public.profiles WHERE id != admin_id;
    -- Delete auth users except admin
    DELETE FROM auth.users WHERE id != admin_id;
    
    -- 2. INSERT MOCK USERS INTO AUTH.USERS
    INSERT INTO auth.users (id, email, raw_user_meta_data, encrypted_password, created_at, updated_at)
    VALUES 
    (runner_1_id, 'runner1@chrad.ma', '{"name": "Ahmed Runner", "role": "runner"}', 'not-a-real-hash', now(), now()),
    (runner_2_id, 'runner2@chrad.ma', '{"name": "Fatima Runner", "role": "runner"}', 'not-a-real-hash', now(), now()),
    (client_1_id, 'client1@chrad.ma', '{"name": "Youssef Client", "role": "client"}', 'not-a-real-hash', now(), now()),
    (client_2_id, 'client2@chrad.ma', '{"name": "Sara Client", "role": "client"}', 'not-a-real-hash', now(), now());

    -- 3. INSERT PROFILES
    INSERT INTO public.profiles (id, email, name, role, phone, avatar_url, kyc_status, verified, is_runner, runner_tier, joined_date)
    VALUES
    (runner_1_id, 'runner1@chrad.ma', 'Ahmed Runner', 'runner', '+212600000001', 'https://i.pravatar.cc/150?u=ahmed', 'approved', true, true, 'gold', now() - interval '60 days'),
    (runner_2_id, 'runner2@chrad.ma', 'Fatima Runner', 'runner', '+212600000002', 'https://i.pravatar.cc/150?u=fatima', 'pending', false, true, 'bronze', now() - interval '2 days'),
    (client_1_id, 'client1@chrad.ma', 'Youssef Client', 'client', '+212600000003', 'https://i.pravatar.cc/150?u=youssef', 'none', false, false, 'bronze', now() - interval '100 days'),
    (client_2_id, 'client2@chrad.ma', 'Sara Client', 'client', '+212600000004', 'https://i.pravatar.cc/150?u=sara', 'none', false, false, 'bronze', now() - interval '5 days');
    
    -- Update stats for profiles
    UPDATE public.profiles SET tasks_created = 5, total_spent = 1500 WHERE id = client_1_id;
    UPDATE public.profiles SET tasks_completed = 12, rating = 4.8, total_earned = 3200 WHERE id = runner_1_id;

    -- Ensure Categories exist
    INSERT INTO public.task_categories (id, name_en, name_fr, name_ar, icon, description, commission_rate, is_featured)
    VALUES 
    ('delivery', 'Delivery', 'Livraison', 'توصيل', 'Package', 'Send or receive packages', 10, true),
    ('documents', 'Documents', 'Documents', 'وثائق', 'FileText', 'Office runs & paperwork', 8, true),
    ('shopping', 'Shopping & Errands', 'Courses', 'تسوق', 'ShoppingCart', 'Grocery shopping and errands', 12, true),
    ('personal_shopping', 'Personal Shopping', 'Achats', 'تسوق شخصي', 'Store', 'Buy specific items', 15, false),
    ('custom', 'Custom Task', 'Tâche personnalisée', 'مهمة خاصة', 'Wrench', 'Anything else you need done', 10, false)
    ON CONFLICT (id) DO UPDATE SET 
      name_en = EXCLUDED.name_en,
      icon = EXCLUDED.icon,
      description = EXCLUDED.description;

    -- 4. INSERT TASKS
    INSERT INTO public.tasks (id, client_id, title, description, category, pickup_location, pickup_lat, pickup_lng, delivery_location, delivery_lat, delivery_lng, item_budget, offered_price, status, created_at, accepted_runner_id, runner_paid)
    VALUES
    (task_1_id, client_1_id, 'Deliver Documents to Maarif', 'Need urgent document delivery from Casa Port to Maarif.', cat_delivery_id, 'Casa Port', 33.589886, -7.603869, 'Maarif', 33.581, -7.632, 0, 50, 'open', now() - interval '1 hour', null, false),
    (task_2_id, client_2_id, 'Grocery Shopping from Marjane', 'Please buy eggs, milk, and bread.', cat_errands_id, 'Marjane Hay Riad', 33.969, -6.866, 'Agdal', 33.998, -6.848, 200, 40, 'open', now() - interval '2 hours', null, false),
    (task_3_id, client_1_id, 'Pickup Laptop from Repair Shop', 'Dell XPS 15 repair pickup.', cat_delivery_id, 'Derb Ghalef', 33.583, -7.625, 'Ain Diab', 33.588, -7.669, 0, 100, 'in_progress', now() - interval '1 day', runner_1_id, false),
    (task_4_id, client_1_id, 'Deliver Cake', 'Fragile birthday cake delivery.', cat_delivery_id, 'Gauthier', 33.589, -7.628, 'Oulfa', 33.551, -7.665, 0, 80, 'completed', now() - interval '5 days', runner_1_id, true);

    -- 5. INSERT BIDS
    INSERT INTO public.bids (task_id, runner_id, amount, message, status, created_at)
    VALUES
    (task_1_id, runner_1_id, 60, 'I am nearby and can do this immediately.', 'pending', now() - interval '45 minutes'),
    (task_2_id, runner_2_id, 45, 'I am currently at Marjane.', 'pending', now() - interval '1 hour'),
    (task_3_id, runner_1_id, 100, 'I know the shop.', 'accepted', now() - interval '23 hours');

    -- 6. INSERT CONVERSATIONS & MESSAGES
    INSERT INTO public.conversations (id, task_id, created_at, updated_at)
    VALUES (conv_1_id, task_3_id, now() - interval '22 hours', now() - interval '20 hours');
    
    INSERT INTO public.messages (conversation_id, sender_id, receiver_id, content, timestamp)
    VALUES
    (conv_1_id, runner_1_id, client_1_id, 'I have picked up the laptop.', now() - interval '22 hours'),
    (conv_1_id, client_1_id, runner_1_id, 'Great, thank you!', now() - interval '21 hours');

    -- 7. INSERT REVIEWS
    INSERT INTO public.reviews (task_id, reviewer_id, reviewee_id, rating, comment, created_at)
    VALUES
    (task_4_id, client_1_id, runner_1_id, 5, 'Perfect delivery, cake was intact!', now() - interval '4 days');

    -- 8. INSERT DISPUTES
    INSERT INTO public.disputes (task_id, reporter_id, reported_user_id, reason, description, status, created_at)
    VALUES
    (task_3_id, client_1_id, runner_1_id, 'late_delivery', 'Runner is 2 hours late and not answering.', 'open', now() - interval '2 hours');

END $$;
