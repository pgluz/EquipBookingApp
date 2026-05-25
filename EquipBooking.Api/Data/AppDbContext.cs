using Microsoft.EntityFrameworkCore;
using EquipBooking.Api.Models;

namespace EquipBooking.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<Equip> Equipments { get; set; }
    public DbSet<Reservation> Reservations { get; set; }
}