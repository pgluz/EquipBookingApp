using Microsoft.EntityFrameworkCore;
using EquipmentBooking.Api.Models;

namespace EquipmentBooking.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<Equipment> Equipments { get; set; }
    public DbSet<Reservation> Reservations { get; set; }
}