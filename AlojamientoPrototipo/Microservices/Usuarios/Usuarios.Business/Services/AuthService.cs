using Usuarios.Business.DTOs.Auth;
using Usuarios.Business.Interfaces;
using Usuarios.DataManagement.Interfaces;

namespace Usuarios.Business.Services;

public class AuthService : IAuthService
{
    private readonly IUsuariosDataService _usuariosDataService;
    private readonly IClientesDataService _clientesDataService;

    public AuthService(IUsuariosDataService usuariosDataService, IClientesDataService clientesDataService)
    {
        _usuariosDataService = usuariosDataService;
        _clientesDataService = clientesDataService;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var usuario = await _usuariosDataService.GetByEmailAsync(request.Email);
        
        // Basic plain-text password check since no hashing is applied yet in this prototype
        if (usuario == null || usuario.PasswordHash != request.Password)
        {
            return null;
        }

        if (!usuario.Estado)
        {
            return null;
        }

        // Fetch ClienteId if the user is a Cliente
        int? clienteId = null;
        if (usuario.Rol == "Cliente")
        {
            var cliente = await _clientesDataService.GetByUsuarioIdAsync(usuario.UsuarioId);
            if (cliente != null)
            {
                clienteId = cliente.ClienteId;
            }
        }

        // Return a mock token for now
        var mockToken = $"mock-jwt-token-for-{usuario.UsuarioId}";
        
        return new LoginResponse(mockToken, usuario.Rol, usuario.NombreCompleto, usuario.UsuarioId, clienteId, usuario.Email);
    }
}
