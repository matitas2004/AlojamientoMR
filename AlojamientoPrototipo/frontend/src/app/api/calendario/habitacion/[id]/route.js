export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes');
  const anio = searchParams.get('anio');

  try {
    const res = await fetch(`https://alojamientosmr-api.onrender.com/api/v1/Calendario/habitacion/${id}?mes=${mes}&anio=${anio}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json();
    const items = data?.value || data || [];
    return Response.json(items);
  } catch (err) {
    return Response.json([], { status: 200 });
  }
}
