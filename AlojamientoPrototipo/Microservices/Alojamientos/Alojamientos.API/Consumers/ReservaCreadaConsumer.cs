using MassTransit;
using Shared.Kernel.Events;
using Alojamientos.Business.Interfaces;
using Alojamientos.Business.DTOs;

namespace Alojamientos.API.Consumers;

public class ReservaCreadaConsumer : IConsumer<ReservaCreadaEvent>
{
    private readonly ICalendarioService _calendarioService;
    private readonly ILogger<ReservaCreadaConsumer> _logger;

    public ReservaCreadaConsumer(ICalendarioService calendarioService, ILogger<ReservaCreadaConsumer> logger)
    {
        _calendarioService = calendarioService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ReservaCreadaEvent> context)
    {
        var evento = context.Message;
        
        _logger.LogInformation("📩 Evento ReservaCreadaEvent recibido. Bloqueando calendario para ReservaId={ReservaId}", evento.ReservaId);

        try
        {
            // Bloquear fechas para cada habitación de la reserva
            foreach (var detalle in evento.Detalles)
            {
                if (detalle.HabitacionId <= 0)
                {
                    _logger.LogWarning("⚠️ HabitacionId inválido ({HabitacionId}) en la ReservaId={ReservaId}", detalle.HabitacionId, evento.ReservaId);
                    continue;
                }

                var request = new BloquearFechasRequest
                {
                    HabitacionId = detalle.HabitacionId,
                    FechaInicio = DateOnly.FromDateTime(evento.FechaCheckIn),
                    FechaFin = DateOnly.FromDateTime(evento.FechaCheckOut).AddDays(-1) // Se bloquea hasta el día antes del checkout (la noche que duermen)
                };

                await _calendarioService.BloquearFechasAsync(request);
                _logger.LogInformation("✅ Calendario bloqueado exitosamente para la Habitación {HabitacionId} desde {Inicio} hasta {Fin}", 
                    request.HabitacionId, request.FechaInicio, request.FechaFin);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error al bloquear el calendario para la Reserva {ReservaId}", evento.ReservaId);
            throw; // Permite a MassTransit reintentar el mensaje
        }
    }
}
