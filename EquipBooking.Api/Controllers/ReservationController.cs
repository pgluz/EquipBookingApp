using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EquipBooking.Api.Data;
using EquipBooking.Api.Models;
using System.Security.Claims;

namespace EquipBooking.Api.Controllers;

[Authorize] // Wszystkie akcje rezerwacji wymagają bycia zalogowanym
[ApiController]
[Route("api/[controller]")]
public class ReservationController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReservationController(AppDbContext context)
    {
        _context = context;
    }

    // POST: Tworzenie nowej rezerwacji
    [HttpPost]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationDto dto)
    {
        if (dto.EndDate <= dto.StartDate)
            return BadRequest(new { message = "Data zakończenia musi być późniejsza niż data rozpoczęcia." });

        // Bezpieczne wyciągnięcie ID użytkownika z tokena JWT
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int userId))
            return Unauthorized(new { message = "Nie można zidentyfikować zalogowanego użytkownika." });

        // Sprawdzenie, czy sprzęt o podanym ID w ogóle istnieje
        var equipment = await _context.Equipments.FindAsync(dto.EquipmentId);
        if (equipment == null)
            return NotFound(new { message = "Podany sprzęt nie istnieje w bazie." });

        // Tworzenie właściwej encji dla bazy danych
        var reservation = new Reservation
        {
            EquipmentId = dto.EquipmentId,
            UserId = userId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Purpose = dto.Purpose,
            Status = "Oczekująca"
        };

        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Rezerwacja została zgłoszona pomyślnie.", reservationId = reservation.Id });
    }

    // GET: Pobranie wszystkich rezerwacji
    [HttpGet]
    public async Task<IActionResult> GetReservations()
    {
        // Dzięki "Include" EF Core automatycznie dociągnie nazwy sprzętu i loginy użytkowników z innych tabel
        var reservations = await _context.Reservations
            .Include(r => r.Equipment)
            .Include(r => r.User)
            .Select(r => new 
            {
                r.Id,
                r.Purpose,
                r.StartDate,
                r.EndDate,
                r.Status,
                EquipmentName = r.Equipment != null ? r.Equipment.Name : "Brak",
                UserName = r.User != null ? r.User.Login : "Brak"
            })
            .ToListAsync();

        return Ok(reservations);
    }

    // GET: Pobranie rezerwacji zalogowanego użytkownika
    [HttpGet("me")]
    public async Task<IActionResult> GetMyReservations()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int userId))
            return Unauthorized(new { message = "Nie można zidentyfikować zalogowanego użytkownika." });

        var reservations = await _context.Reservations
            .Include(r => r.Equipment)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.StartDate)
            .Select(r => new 
            {
                r.Id,
                r.Purpose,
                r.StartDate,
                r.EndDate,
                r.Status,
                EquipmentName = r.Equipment != null ? r.Equipment.Name : "Nieznany sprzęt"
            })
            .ToListAsync();

        return Ok(reservations);
    }

    // PUT: Akceptacja rezerwacji
    [HttpPut("{id:int}/accept")]
    public async Task<IActionResult> AcceptReservation(int id)
    {
        if (User.Identity?.Name != "admin")
            return StatusCode(403, new { message = "Tylko administrator może akceptować rezerwacje." });

        var reservation = await _context.Reservations.FindAsync(id);
        if (reservation == null)
            return NotFound(new { message = "Nie znaleziono rezerwacji o podanym ID." });

        if (reservation.Status != "Oczekująca")
            return BadRequest(new { message = "Można akceptować tylko oczekujące rezerwacje." });

        reservation.Status = "Zaakceptowana";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Rezerwacja została zaakceptowana." });
    }

    // PUT: Odrzucenie rezerwacji
    [HttpPut("{id:int}/reject")]
    public async Task<IActionResult> RejectReservation(int id)
    {
        if (User.Identity?.Name != "admin")
            return StatusCode(403, new { message = "Tylko administrator może odrzucać rezerwacje." });

        var reservation = await _context.Reservations.FindAsync(id);
        if (reservation == null)
            return NotFound(new { message = "Nie znaleziono rezerwacji." });

        if (reservation.Status != "Oczekująca")
            return BadRequest(new { message = "Można odrzucać tylko oczekujące rezerwacje." });

        reservation.Status = "Odrzucona";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Rezerwacja została odrzucona." });
    }
}

// DTO do obierania danych z frontendu
public class CreateReservationDto
{
    public int EquipmentId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Purpose { get; set; } = string.Empty;
}