using MassTransit;
using Shared.Kernel.Events;
using Facturacion.Business.Interfaces;
using Facturacion.Business.DTOs;

namespace Facturacion.API.Consumers;

public class ReservaCreadaConsumer : IConsumer<ReservaCreadaEvent>
{
    private readonly IFacturasService _facturasService;
    private readonly ILogger<ReservaCreadaConsumer> _logger;

    public ReservaCreadaConsumer(IFacturasService facturasService, ILogger<ReservaCreadaConsumer> logger)
    {
        _facturasService = facturasService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ReservaCreadaEvent> context)
    {
        var evento = context.Message;
        
        _logger.LogInformation("📩 Evento ReservaCreadaEvent recibido. Creando factura para ReservaId={ReservaId}", evento.ReservaId);

        try
        {
            var request = new CrearFacturaRequest
            {
                ReservaId = evento.ReservaId,
                Monto = evento.MontoTotal,
                MetodoPagoId = 1, // Asumiendo un método de pago por defecto (ej. Efectivo/Sitio) o manejado posteriormente
                Detalles = evento.Detalles.Select(d => new CrearDetalleFacturaRequest
                {
                    Descripcion = d.Descripcion,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario
                }).ToList()
            };

            await _facturasService.CrearAsync(request);

            _logger.LogInformation("✅ Factura generada exitosamente para la Reserva {ReservaId}", evento.ReservaId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error al generar factura para la Reserva {ReservaId}", evento.ReservaId);
            throw; // Permite a MassTransit reintentar el mensaje
        }
    }
}
