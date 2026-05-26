export async function GET(request) {
  const { pathname } = new URL(request.url);
  const suffix = pathname.replace('/api/facturacion', '').replace(/^\//, '');
  try {
    const url = suffix
      ? `https://facturacionmr-api.onrender.com/api/v1/Facturas/${suffix}`
      : 'https://facturacionmr-api.onrender.com/api/v1/Facturas';
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 },
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
  const suffix = pathname.replace('/api/facturacion', '').replace(/^\//, '');
  try {
    const body = await request.json();
    const url = suffix 
      ? `https://facturacionmr-api.onrender.com/api/v1/Facturas/${suffix}`
      : 'https://facturacionmr-api.onrender.com/api/v1/Facturas';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data;
    try { data = await res.json(); } catch { data = { message: res.statusText }; }
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
