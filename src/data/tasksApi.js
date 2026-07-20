import { supabase } from '../utils/supabaseClient';

// Re-export constants that don't depend on Supabase
export const TASK_CATEGORIES = [
  { id: 'delivery', label: 'Delivery', icon: '📦', description: 'Send or receive packages' },
  { id: 'documents', label: 'Documents', icon: '📄', description: 'Office runs & paperwork' },
  { id: 'shopping', label: 'Shopping', icon: '🛒', description: 'Buy & bring items' },
  { id: 'custom', label: 'Custom Task', icon: '🔧', description: 'Anything you need done' },
];

export const TASK_STATUSES = {
  OPEN: 'open',
  BIDDING: 'bidding',
  ACCEPTED: 'accepted',
  PICKED_UP: 'picked_up',
  EN_ROUTE: 'en_route',
  DELIVERED: 'delivered',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

export const LOCATIONS = {
  derbOmar: { lat: 33.5912, lng: -7.6186, name: 'Derb Omar' },
  maarif: { lat: 33.5731, lng: -7.6322, name: 'Maarif' },
  ainDiab: { lat: 33.5885, lng: -7.6699, name: 'Ain Diab' },
  anfa: { lat: 33.5667, lng: -7.6476, name: 'Anfa' },
  habous: { lat: 33.5800, lng: -7.6100, name: 'Quartier Habous' },
  twinCenter: { lat: 33.5804, lng: -7.6331, name: 'Twin Center' },
  casaPort: { lat: 33.6039, lng: -7.6115, name: 'Casa Port' },
  bourgogne: { lat: 33.5750, lng: -7.6250, name: 'Bourgogne' },
  sidiMaarouf: { lat: 33.5450, lng: -7.6550, name: 'Sidi Maarouf' },
  mohammedia: { lat: 33.6916, lng: -7.3877, name: 'Mohammedia' },
};

// Helper to convert a DB row to the shape the UI components expect
function rowToTask(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    category: row.category,
    title: row.title,
    description: row.description,
    photos: row.photos || [],
    pickup: {
      lat: Number(row.pickup_lat),
      lng: Number(row.pickup_lng),
      name: row.pickup_name,
      address: row.pickup_address,
    },
    destination: row.destination_name ? {
      lat: Number(row.destination_lat),
      lng: Number(row.destination_lng),
      name: row.destination_name,
      address: row.destination_address,
    } : null,
    offeredPrice: Number(row.offered_price),
    itemBudget: row.item_budget ? Number(row.item_budget) : null,
    status: row.status,
    createdAt: row.created_at,
    acceptedBid: row.accepted_bid,
    acceptedRunnerId: row.accepted_runner_id,
    distance: row.distance ? Number(row.distance) : null,
    deliveryPhotoUrl: row.delivery_photo_url,
    waypoints: row.waypoints || [],
    // bids will be fetched separately
    bids: [],
  };
}

// Fetch all tasks
export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchTasks error:', error); return []; }
  return data.map(rowToTask);
}

// Fetch a single task by ID
export async function fetchTaskById(id) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('fetchTaskById error:', error); return null; }
  return rowToTask(data);
}

// Fetch open/bidding tasks
export async function fetchOpenTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('status', ['open', 'bidding'])
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchOpenTasks error:', error); return []; }
  return data.map(rowToTask);
}

// Fetch active tasks (accepted/picked_up/en_route)
export async function fetchActiveTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('status', ['accepted', 'picked_up', 'en_route'])
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchActiveTasks error:', error); return []; }
  return data.map(rowToTask);
}

// Fetch completed tasks
export async function fetchCompletedTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('status', ['delivered', 'confirmed'])
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchCompletedTasks error:', error); return []; }
  return data.map(rowToTask);
}

// Create a new task
export async function createTask(taskData) {
  const id = taskData.id || `task-${Date.now()}`;
  const row = {
    id,
    client_id: taskData.clientId,
    category: taskData.category,
    title: taskData.title,
    description: taskData.description,
    photos: taskData.photos || [],
    pickup_name: taskData.pickup?.name || null,
    pickup_address: taskData.pickup?.address || null,
    pickup_lat: taskData.pickup?.lat || null,
    pickup_lng: taskData.pickup?.lng || null,
    destination_name: taskData.destination?.name || null,
    destination_address: taskData.destination?.address || null,
    destination_lat: taskData.destination?.lat || null,
    destination_lng: taskData.destination?.lng || null,
    waypoints: taskData.waypoints || [],
    offered_price: taskData.price,
    item_budget: taskData.itemBudget || null,
    status: 'open',
    distance: taskData.distance || null,
  };
  const { data, error } = await supabase.from('tasks').insert(row).select().single();
  if (error) { console.error('createTask error:', error); return null; }
  return rowToTask(data);
}

// Update task status
export async function updateTaskStatus(taskId, status, extra = {}) {
  let query = supabase
    .from('tasks')
    .update({ status, ...extra })
    .eq('id', taskId);

  // Concurrency check: if assigning a runner, guarantee it's not already assigned
  if (status === 'accepted') {
    query = query.is('accepted_runner_id', null);
  }

  const { data, error } = await query.select().single();
  if (error) { console.error('updateTaskStatus error:', error); return null; }
  return rowToTask(data);
}
