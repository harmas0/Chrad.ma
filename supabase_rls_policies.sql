-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================
-- PROFILES POLICIES
-- =====================================
-- Anyone can view profiles (public read)
CREATE POLICY "Public profiles are viewable by everyone." 
ON profiles FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile." 
ON profiles FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile." 
ON profiles FOR UPDATE USING (auth.uid()::text = id);

-- =====================================
-- TASKS POLICIES
-- =====================================
-- Clients can see their own tasks.
-- Runners can see tasks that are 'open', 'bidding', or assigned to them.
CREATE POLICY "Tasks visibility" 
ON tasks FOR SELECT 
USING (
  auth.uid()::text = client_id OR 
  auth.uid()::text = accepted_runner_id OR 
  status IN ('open', 'bidding')
);

-- Clients can insert tasks (auth.uid() must match client_id)
CREATE POLICY "Clients can create tasks." 
ON tasks FOR INSERT 
WITH CHECK (auth.uid()::text = client_id);

-- Tasks can be updated by the client OR the assigned runner
CREATE POLICY "Clients and assigned runners can update tasks." 
ON tasks FOR UPDATE 
USING (
  auth.uid()::text = client_id OR 
  auth.uid()::text = accepted_runner_id OR
  status IN ('open', 'bidding') -- Allow runners to accept open tasks (setting accepted_runner_id)
);

-- =====================================
-- MESSAGES POLICIES
-- =====================================
-- A user can see messages if they are the sender, OR if they are the client/runner of the task associated with the conversation.
-- Note: Assuming conversation_id matches task_id for simplicity (1:1 mapping). 
-- If they are separate tables, we'd need a JOIN, but this assumes conversation_id = task_id.
CREATE POLICY "Users can view their conversation messages." 
ON messages FOR SELECT 
USING (
  auth.uid()::text = sender_id OR 
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = messages.conversation_id 
    AND (tasks.client_id = auth.uid()::text OR tasks.accepted_runner_id = auth.uid()::text)
  )
);

-- Users can only send messages as themselves in conversations they belong to
CREATE POLICY "Users can send messages." 
ON messages FOR INSERT 
WITH CHECK (
  auth.uid()::text = sender_id AND
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = messages.conversation_id 
    AND (tasks.client_id = auth.uid()::text OR tasks.accepted_runner_id = auth.uid()::text)
  )
);
