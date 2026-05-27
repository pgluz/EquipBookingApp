namespace EquipBooking.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Login { get; set; } = string.Empty;
    public string? Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public bool CanReserve { get; set; }
    public bool CanMarkBorrowed { get; set; }
    public bool CanMarkAvailable { get; set; }
    public bool CanMarkUnavailable { get; set; }
    public ICollection<Reservation>? Reservations { get; set; }
}