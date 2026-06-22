using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();
        var json = "{\"AlojamientoId\":8,\"Nombre\":\"Habitacion\",\"Descripcion\":\"Test\",\"CapacidadAdultos\":2,\"CapacidadNinos\":0,\"NumBanos\":1,\"NumDormitorios\":1,\"TieneCocina\":false,\"TieneAireAcondicionado\":false,\"PrecioNoche\":50.00}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await client.PostAsync("https://alojamientosmr-api.onrender.com/api/v1/habitaciones", content);
        var body = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"Status: {response.StatusCode}");
        Console.WriteLine($"Body: {body}");
    }
}
