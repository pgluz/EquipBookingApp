using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EquipBooking.Api.Data;
using EquipBooking.Api.Models;

namespace EquipBooking.Api.Controllers;

[Authorize] // Zabezpiecza cały kontroler - wymaga przekazania tokenu JWT
[ApiController]
[Route("api/[controller]")]
public class EquipmentController : ControllerBase
{
    private readonly AppDbContext _context;

    public EquipmentController(AppDbContext context)
    {
        _context = context;
    }

    // GET: Pobieranie listy całego sprzętu (dostępne dla wszystkich zalogowanych)
    [HttpGet]
    public IActionResult GetAllEquipment()
    {
        var equipmentList = _context.Equipments.ToList();
        return Ok(equipmentList);
    }

    // POST: Dodawanie nowego sprzętu
    [HttpPost]
    public IActionResult AddEquipment([FromBody] CreateEquipmentDto dto)
    {
        // Sprawdzam czy zalogowany użytkownik ma login "admin"
        if (User.Identity?.Name != "admin")
        {
            return StatusCode(403, new { message = "Tylko administrator może dodawać sprzęt." });
        }

        var newEquipment = new Equipment
        {
            Name = dto.Name,
            Type = dto.Type,
            Description = dto.Description,
            Location = dto.Location,
            Status = "Dostępny" // Domyślny status przy dodaniu
        };

        _context.Equipments.Add(newEquipment);
        _context.SaveChanges();

        return Ok(newEquipment);
    }

    // DELETE: Usuwanie sprzętu z bazy
    [HttpDelete("{id}")]
    public IActionResult DeleteEquipment(int id)
    {
        if (User.Identity?.Name != "admin")
        {
            return StatusCode(403, new { message = "Tylko administrator może usuwać sprzęt." });
        }

        var equipment = _context.Equipments.FirstOrDefault(e => e.Id == id);
        if (equipment == null)
        {
            return NotFound(new { message = "Nie znaleziono sprzętu o podanym ID." });
        }

        _context.Equipments.Remove(equipment);
        _context.SaveChanges();

        return Ok(new { message = "Sprzęt został usunięty pomyślnie." });
    }
}