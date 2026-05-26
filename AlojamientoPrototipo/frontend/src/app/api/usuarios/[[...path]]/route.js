export async function GET(request) {
  const { pathname } = new URL(request.url);
  const suffix = pathname.replace('/api/usuarios', '').replace(/^\//, '');
  try {
    const url = suffix
      ? `https://usuariosmr-api.onrender.com/api/v1/usuarios/${suffix}`
      : 'https://usuariosmr-api.onrender.com/api/v1/usuarios';
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
