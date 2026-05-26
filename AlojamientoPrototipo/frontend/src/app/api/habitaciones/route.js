// API Route Handler - Proxy para habitaciones
export async function GET(request) {
  try {
    const res = await fetch('https://alojamientosmr-api.onrender.com/api/v1/habitaciones', {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 15 }, // Caché por 15 segundos para ultra-velocidad
    });
    const data = await res.json();
    const items = data?.value || data || [];
    return Response.json(items);
  } catch (err) {
    return Response.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch('https://alojamientosmr-api.onrender.com/api/v1/habitaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    let data;
    try { data = await res.json(); } catch { data = { message: res.statusText }; }
    
    // Si la respuesta de Render fue un error (ej. 400), devolver el error
    if (!res.ok) {
      return Response.json(data, { status: res.status });
    }
    
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
