using Microsoft.EntityFrameworkCore;
using Alojamientos.DataAccess.Contexts;
using Alojamientos.API.Extensions;
using Alojamientos.API.Middleware;
using MassTransit;
using Alojamientos.API.Consumers;

var builder = WebApplication.CreateBuilder(args);

// Forzar compatibilidad de Entity Framework con Postgres en zonas horarias
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// ── 1. Base de datos ─────────────────────────────────
builder.Services.AddDbContext<AlojamientosDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ConexionAlojamientos"))
           .UseLowerCaseNamingConvention());

// ── 2. Dependencias de la Aplicación ─────────────────
builder.Services.AddApplicationServices();

// ── 3. Presentación (Controllers & gRPC) ───────────────
builder.Services.AddControllers();
builder.Services.AddGrpc();

// ── 4. Infraestructura Web (Swagger & CORS) ──────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCustomSwagger();
builder.Services.AddCustomCors();

// ── 5. MassTransit / RabbitMQ ────────────────────────
builder.Services.AddMassTransit(x =>
{
    x.SetEndpointNameFormatter(new KebabCaseEndpointNameFormatter("alojamientos", false));
    x.AddConsumer<ReservaCreadaConsumer>();
    
    x.UsingRabbitMq((context, cfg) =>
    {
        var rmqUrl = builder.Configuration.GetConnectionString("RabbitMQ");
        if (!string.IsNullOrEmpty(rmqUrl))
        {
            cfg.Host(new Uri(rmqUrl));
        }
        else
        {
            cfg.Host("localhost", "/", h =>
            {
                h.Username("guest");
                h.Password("guest");
            });
        }
        
        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

// ── Pipeline ─────────────────────────────────────────

// Manejo Global de Excepciones
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger (siempre activo para el prototipo)
app.UseSwagger();
app.UseSwaggerUI();

// CORS
app.UseCors();

app.UseRouting();

// Mapeo de Controladores
app.MapControllers();

// gRPC Service
app.UseGrpcWeb(new GrpcWebOptions { DefaultEnabled = true });
app.MapGrpcService<Alojamientos.API.GrpcServices.CalendarioGrpcService>()
   .EnableGrpcWeb();

app.Run();
