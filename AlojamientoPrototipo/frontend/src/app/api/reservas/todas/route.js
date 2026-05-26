export const dynamic = 'force-dynamic';

// BFF Aggregation para obtener todas las reservas de todos los clientes
export async function GET(request) {
  try {
    // 1. Obtener todos los clientes
    const usersRes = await fetch('https://usuariosmr-api.onrender.com/api/v1/usuarios', {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    
    if (!usersRes.ok) {
      throw new Error('No se pudo obtener la lista de usuarios');
    }

    const usersText = await usersRes.text();
    if (!usersText) return Response.json([]);
    const users = JSON.parse(usersText);
    
    // 2. Extraer solo usuarios tipo Cliente (opcional, pero para optimizar)
    // Asumiendo que el modelo CQRS los expone. Iteraremos sobre todos por seguridad si no hay rol explicito.
    const validUsers = Array.isArray(users) ? users : [];

    // 3. Obtener las reservas de cada usuario simultáneamente
    const promises = validUsers.map(u => 
      fetch(`https://reservasmr-api.onrender.com/api/v1/Reservas/cliente/${u.usuarioId || u.id}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
      .then(async r => {
        if (!r.ok) return [];
        const text = await r.text();
        if (!text) return [];
        const data = JSON.parse(text);
        return data?.value || data || [];
      })
      .catch(() => [])
    );

    const results = await Promise.allSettled(promises);
    
    // 4. Combinar todo en un solo array
    let todasLasReservas = [];
    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        todasLasReservas = [...todasLasReservas, ...res.value];
      }
    });

    // 5. Devolver la respuesta agregada
    return Response.json(todasLasReservas);

  } catch (err) {
    console.error('BFF Aggregation Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
