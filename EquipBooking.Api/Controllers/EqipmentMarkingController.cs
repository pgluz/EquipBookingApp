using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EquipBooking.Api.Data;
using EquipBooking.Api.Models;

namespace EquipBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EqipmentMarkingController : ControllerBase
{
    private readonly AppDbContext _context;

    public EqipmentMarkingController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpPut("{id:int}/mark-available")]
    public async Task<IActionResult> MarkAvailable(int id)
    {
        var equipment = await _context.Equipments.FindAsync(id);
        if (equipment == null)
            return NotFound();

        if (!HasClaim("CanMarkAvailable"))
            return Forbid();

        equipment.Status = "Dostępny";
        await _context.SaveChangesAsync();

        return Ok(equipment);
    }

    [Authorize]
    [HttpPut("{id:int}/mark-unavailable")]
    public async Task<IActionResult> MarkUnavailable(int id, [FromBody] EquipmentStatusUpdateRequest? request)
    {
        var equipment = await _context.Equipments.FindAsync(id);
        if (equipment == null)
            return NotFound();

        if (!HasClaim("CanMarkUnavailable"))
            return Forbid();

        equipment.Status = string.IsNullOrWhiteSpace(request?.Reason)
            ? "Niedostępny"
            : request!.Reason.Trim();

        await _context.SaveChangesAsync();

        return Ok(equipment);
    }

    private bool HasClaim(string claimType)
    {
        var claim = User.FindFirst(claimType);
        return claim != null && string.Equals(claim.Value, "True", StringComparison.OrdinalIgnoreCase);
    }

    public class EquipmentStatusUpdateRequest
    {
        public string? Reason { get; set; }
    }
}
