namespace Shared.Kernel.Events;

public class ReservaCreadaEvent
{
    public int ReservaId { get; set; }
    public int ClienteId { get; set; }
    public decimal MontoTotal { get; set; }
    
    // Necesitamos pasar los detalles para la factura (descripcion, cantidad, precioUnitario)
    public List<DetalleHabitacionEventModel> Detalles { get; set; } = new();
}

public class DetalleHabitacionEventModel
{
    public string Descripcion { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
}
