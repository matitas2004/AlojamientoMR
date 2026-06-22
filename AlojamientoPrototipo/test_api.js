fetch('https://alojamientosmr-api.onrender.com/api/v1/habitaciones', { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' }, 
  body: JSON.stringify({ 
    nombre: 'Test', 
    descripcion: 'test', 
    precioNoche: 100, 
    capacidadAdultos: 2, 
    capacidadNinos: 0, 
    cantidadBanos: 1, 
    cantidadDormitorios: 1, 
    superficieM2: 20, 
    tieneAireAcondicionado: false, 
    tieneCocina: false, 
    alojamientoId: 101 
  }) 
})
.then(r => r.text().then(t => console.log(r.status, t)))
.catch(e => console.error(e));
