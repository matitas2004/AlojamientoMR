// API Route Handler - Proxy para reservas
export async function GET(request) {
  const { pathname } = new URL(request.url);
  const suffix = pathname.replace('/api/reservas', '').replace(/^\//, ''); // ej: 'cliente/1'
  
  try {
    const url = suffix
      ? `https://reservasmr-api.onrender.com/api/v1/Reservas/${suffix}`
      : 'https://reservasmr-api.onrender.com/api/v1/Reservas';
    
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 }, // no cache para reservas
    });
    const data = await res.json();
    const items = data?.value || data || [];
    return Response.json(items);
  } catch (err) {
    return Response.json([], { status: 200 });
  }
}

export async function POST(request) {
  const { pathname } = new URL(request.url);
  const suffix = pathname.replace('/api/reservas', '').replace(/^\//, '');
  try {
    const body = await request.json();
    const url = suffix 
      ? `https://reservasmr-api.onrender.com/api/v1/Reservas/${suffix}`
      : 'https://reservasmr-api.onrender.com/api/v1/Reservas';
      
    const res = await fetch(url, {
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

export async function PATCH(request) {
  const { pathname } = new URL(request.url);
  const suffix = pathname.replace('/api/reservas', '').replace(/^\//, '');
  
  if (!suffix) return Response.json({ error: 'Path required' }, { status: 400 });

  try {
    const body = await request.json();
    const res = await fetch(`https://reservasmr-api.onrender.com/api/v1/Reservas/${suffix}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    // C# PATCH usually returns 204 No Content
    if (res.status === 204) return new Response(null, { status: 204 });

    let data;
    try { data = await res.json(); } catch { data = { message: res.statusText }; }
    
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
