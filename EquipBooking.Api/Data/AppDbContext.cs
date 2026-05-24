using Microsoft.EntityFrameworkCore;

namespace EquipmentBooking.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    
    // Miejsce na encje
}