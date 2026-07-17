export async function calculateRouteDistance(pickup, destination) {
  if (!pickup || !destination) return null;
  const coords = `${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}`;
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`
    );
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      const route = data.routes[0];
      return {
        distanceKm: Number((route.distance / 1000).toFixed(2)),
        durationMin: Math.ceil(route.duration / 60),
      };
    }
  } catch (err) {
    console.error('calculateRouteDistance error:', err);
  }
  return null;
}
