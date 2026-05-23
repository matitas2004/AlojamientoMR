$baseUrl = "https://alojamientosmr-api.onrender.com/api/v1"
$alojamientosUrl = "$baseUrl/alojamientos"
$habitacionesUrl = "$baseUrl/habitaciones"

Write-Host "Comenzando a poblar datos en la BD de Producción (Render)..."

# Datos de prueba para 5 alojamientos
$alojamientos = @(
    @{ socioId=1; tipoAlojamientoId=1; nombre="Hotel Paraiso Azul"; ciudad="Quito"; direccion="Av. Naciones Unidas"; descripcion="Hotel 5 estrellas con vista a la ciudad"; admiteMascotas=$false; tienePiscina=$true; tieneParqueadero=$true },
    @{ socioId=2; tipoAlojamientoId=2; nombre="Cabanas del Bosque"; ciudad="Banos"; direccion="Sector la Cascada"; descripcion="Cabanas rusticas ideales para descansar"; admiteMascotas=$true; tienePiscina=$false; tieneParqueadero=$true },
    @{ socioId=3; tipoAlojamientoId=3; nombre="Hostal Backpackers Centro"; ciudad="Cuenca"; direccion="Calle Larga y Hermano Miguel"; descripcion="Lugar economico y centrico"; admiteMascotas=$false; tienePiscina=$false; tieneParqueadero=$false },
    @{ socioId=4; tipoAlojamientoId=1; nombre="Gran Hotel Imperial"; ciudad="Guayaquil"; direccion="Malecon 2000"; descripcion="Lujo y confort junto al rio"; admiteMascotas=$false; tienePiscina=$true; tieneParqueadero=$true },
    @{ socioId=5; tipoAlojamientoId=4; nombre="Resort Playa Bonita"; ciudad="Manta"; direccion="Via a San Mateo"; descripcion="Todo incluido con playa privada"; admiteMascotas=$true; tienePiscina=$true; tieneParqueadero=$true }
)

foreach ($alojamiento in $alojamientos) {
    Write-Host "Creando alojamiento: $($alojamiento.nombre)..."
    $bodyJson = $alojamiento | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $alojamientosUrl -Method Post -Body $bodyJson -ContentType "application/json"
        $alojamientoId = $response.alojamientoId
        Write-Host " -> Creado con ID: $alojamientoId"
        
        # Crear 2 habitaciones para este alojamiento
        for ($i=1; $i -le 2; $i++) {
            $tipoHabitacion = if ($i -eq 1) { "Sencilla" } else { "Doble" }
            $precio = if ($i -eq 1) { 50.00 } else { 90.00 }
            
            $habitacion = @{
                alojamientoId = $alojamientoId
                nombre = "Habitacion $tipoHabitacion $i"
                descripcion = "Habitacion $tipoHabitacion muy comoda"
                capacidadAdultos = $i
                capacidadNinos = 0
                numBanos = 1
                numDormitorios = 1
                tieneCocina = $false
                tieneAireAcondicionado = $true
                precioNoche = $precio
            }
            
            $habBodyJson = $habitacion | ConvertTo-Json
            $habResponse = Invoke-RestMethod -Uri $habitacionesUrl -Method Post -Body $habBodyJson -ContentType "application/json"
            Write-Host "    -> Creada habitación: $($habResponse.nombre) (ID: $($habResponse.habitacionId))"
        }
    } catch {
        Write-Host "Error creando alojamiento $($alojamiento.nombre): $_"
    }
}

Write-Host "Poblamiento completado."
