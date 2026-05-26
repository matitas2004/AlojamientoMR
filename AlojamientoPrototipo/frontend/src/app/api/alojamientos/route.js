// API Route Handler - Proxy para alojamientos
// Esto corre en el SERVIDOR de Next.js, no en el navegador, así no hay CORS
export async function GET(request) {
  try {
    const res = await fetch('https://alojamientosmr-api.onrender.com/api/v1/alojamientos', {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 15 },
    });
    const data = await res.json();
    // La API de Render devuelve { value: [...], Count: X }
    // Normalizamos para que el frontend siempre reciba un array limpio
    const items = data?.value || data || [];
    return Response.json(items);
  } catch (err) {
    console.error('Proxy /api/alojamientos error:', err.message);
    return Response.json([], { status: 200 }); // Devolver array vacío en vez de error
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch('https://alojamientosmr-api.onrender.com/api/v1/alojamientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    let data;
    try { data = await res.json(); } catch { data = { message: res.statusText }; }
    
    if (!res.ok) {
      return Response.json(data, { status: res.status });
    }
    
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
