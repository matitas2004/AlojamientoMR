using Reservas.DataAccess.Common;
using Reservas.DataAccess.Contexts;
using Reservas.DataAccess.Entities;
using Reservas.DataAccess.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Reservas.DataAccess.Repositories;

public class ReservasRepository : RepositoryBase<ReservaEntity>, IReservasRepository
{
    public ReservasRepository(ReservasDbContext context) : base(context) { }

    public async Task<IEnumerable<ReservaEntity>> GetAllAsync()
    {
        return await _dbSet
            .Include(r => r.DetallesHabitacion)
            .OrderByDescending(r => r.FechaCreacion)
            .ToListAsync();
    }
}

public class DescuentosRepository : RepositoryBase<DescuentoEntity>, IDescuentosRepository
{
    public DescuentosRepository(ReservasDbContext context) : base(context) { }
}

public class ReservaDetallesRepository : RepositoryBase<ReservaDetalleHabitacionEntity>, IReservaDetallesRepository
{
    public ReservaDetallesRepository(ReservasDbContext context) : base(context) { }
}
