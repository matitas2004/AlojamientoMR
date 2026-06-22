cd C:\Users\MATHIAS\source\repos\Clientes\AlojamientoPrototipo\Microservices\Alojamientos\Alojamientos.API
$process = Start-Process -FilePath "dotnet" -ArgumentList "run" -PassThru -NoNewWindow
Start-Sleep -Seconds 10
$body = @{ alojamientoId=8; nombre="Habitacion"; descripcion="Test"; capacidadAdultos=2; capacidadNinos=0; numBanos=1; numDormitorios=1; tieneCocina=$false; tieneAireAcondicionado=$false; precioNoche=50.00 } | ConvertTo-Json
try { 
    Invoke-RestMethod -Uri "http://localhost:5002/api/v1/habitaciones" -Method Post -Body $body -ContentType "application/json" 
} catch { 
    Write-Host "HTTP Error: $_"
    $_.Exception.Response.GetResponseStream() | %{ (New-Object IO.StreamReader($_)).ReadToEnd() } 
}
Start-Sleep -Seconds 2
Stop-Process -Id $process.Id
