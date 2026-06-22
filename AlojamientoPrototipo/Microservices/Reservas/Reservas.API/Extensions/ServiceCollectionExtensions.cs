using Microsoft.Extensions.DependencyInjection;
using Reservas.DataAccess.Repositories;
using Reservas.DataAccess.Repositories.Interfaces;
using Reservas.DataManagement.Interfaces;
using Reservas.DataManagement.Services;
using Reservas.Business.Interfaces;
using Reservas.Business.Services;

using Microsoft.Extensions.Configuration;
using Polly;
using Polly.Extensions.Http;

namespace Reservas.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // ── DataAccess ──────────────────────────────────
        services.AddScoped<IReservasRepository, ReservasRepository>();
        services.AddScoped<IDescuentosRepository, DescuentosRepository>();
        services.AddScoped<IReservaDetallesRepository, ReservaDetallesRepository>();

        // ── DataManagement ──────────────────────────────
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IReservasDataService, ReservasDataService>();
        services.AddScoped<IDescuentosDataService, DescuentosDataService>();

        // ── Business ────────────────────────────────────
        services.AddScoped<IReservasService, ReservasService>();

        // ── gRPC Clients ────────────────────────────────
        // Leemos la URL desde configuración o variables de entorno (Render). Fallback a localhost.
        var grpcUrl = configuration["GrpcUrls:Alojamientos"] ?? "http://localhost:5002";
        services.AddGrpcClient<Shared.Protos.CalendarioGrpc.CalendarioGrpcClient>(o =>
        {
            o.Address = new Uri(grpcUrl);
        })
        .ConfigurePrimaryHttpMessageHandler(() => new Grpc.Net.Client.Web.GrpcWebHandler(new HttpClientHandler()))
        .AddPolicyHandler(HttpPolicyExtensions
            .HandleTransientHttpError()
            .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))))
        .AddPolicyHandler(HttpPolicyExtensions
            .HandleTransientHttpError()
            .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));

        return services;
    }
}
