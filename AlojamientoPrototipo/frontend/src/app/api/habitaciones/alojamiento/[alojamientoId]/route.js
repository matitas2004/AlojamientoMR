// API Route Handler - Proxy para habitaciones por alojamiento
export async function GET(request, { params }) {
  const { alojamientoId } = await params;
  try {
    const res = await fetch(`https://alojamientosmr-api.onrender.com/api/v1/habitaciones/alojamiento/${alojamientoId}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json();
    const items = data?.value || data || [];
    return Response.json(items);
  } catch (err) {
    return Response.json([], { status: 200 });
  }
}
