export const dynamic = 'force-dynamic'; // Evitar caché de Vercel

export async function GET(request) {
  // URLs de los 5 servicios de Render
  const urls = [
    'https://alojamientosmr-api.onrender.com/swagger/v1/swagger.json',
    'https://reservasmr-api.onrender.com/swagger/v1/swagger.json',
    'https://usuariosmr-api.onrender.com/swagger/v1/swagger.json',
    'https://facturacionmr-api.onrender.com/swagger/v1/swagger.json',
    'https://apigateway-mr.onrender.com/swagger/v1/swagger.json'
  ];

  try {
    // Forzamos peticiones GET a todos los servicios para despertarlos.
    // Usamos catch para que si uno falla temporalmente (Cold Start), no bloquee a los demás.
    const promises = urls.map(url => 
      fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } })
        .catch(() => null)
    );

    // No esperamos a que respondan todas con await Promise.all()
    // porque el Cold Start de Render toma ~50s y Vercel corta las peticiones a los 10s (Timeout).
    // Con hacer el fetch(), el servidor de Render ya recibe la señal de despertarse.
    Promise.allSettled(promises);

    return new Response(JSON.stringify({ status: 'ok', message: 'Wakeup signals sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
  }
}

// Next.js automáticamente soporta peticiones HEAD si definimos el GET
export async function HEAD(request) {
  return new Response(null, { status: 200 });
}
