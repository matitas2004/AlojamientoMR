namespace Shared.Kernel.Events;

public class ReservaCreadaEvent
{
    public int ReservaId { get; set; }
    public int ClienteId { get; set; }
    public decimal MontoTotal { get; set; }
    
    // Fechas generales de la reserva para bloqueo rápido si aplica
    public DateTime FechaCheckIn { get; set; }
    public DateTime FechaCheckOut { get; set; }

    // Detalles para facturación y calendarios
    public List<DetalleHabitacionEventModel> Detalles { get; set; } = new();
}

public class DetalleHabitacionEventModel
{
    public int HabitacionId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
}
