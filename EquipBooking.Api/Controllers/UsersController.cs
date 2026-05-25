using EquipBooking.Api.Data;
using EquipBooking.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(user => user.Id)
            .Select(user => new UserResponseDto
            {
                Id = user.Id,
                Login = user.Login,
                Email = user.Email,
                CanReserve = user.CanReserve,
                CanMarkBorrowed = user.CanMarkBorrowed,
                CanMarkAvailable = user.CanMarkAvailable,
                CanMarkUnavailable = user.CanMarkUnavailable
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == id);

        if (user is null)
        {
            return NotFound(new { message = "Nie znaleziono użytkownika." });
        }

        return Ok(ToResponse(user));
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Login))
        {
            return BadRequest(new { message = "Login jest wymagany." });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email jest wymagany." });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Hasło jest wymagane." });
        }

        var login = request.Login.Trim();
        var email = request.Email.Trim();

        var loginExists = await _context.Users.AnyAsync(user => user.Login == login);

        if (loginExists)
        {
            return Conflict(new { message = "Użytkownik o takim loginie już istnieje." });
        }

        var user = new User
        {
            Login = login,
            Email = email,

            // Hasło zapisujemy jako hash, żeby było zgodne z AuthControllerem.
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),

            CanReserve = request.CanReserve,
            CanMarkBorrowed = request.CanMarkBorrowed,
            CanMarkAvailable = request.CanMarkAvailable,
            CanMarkUnavailable = request.CanMarkUnavailable
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, ToResponse(user));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto request)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
        {
            return NotFound(new { message = "Nie znaleziono użytkownika." });
        }

        if (!string.IsNullOrWhiteSpace(request.Login))
        {
            var login = request.Login.Trim();

            var loginExists = await _context.Users
                .AnyAsync(existingUser => existingUser.Id != id && existingUser.Login == login);

            if (loginExists)
            {
                return Conflict(new { message = "Użytkownik o takim loginie już istnieje." });
            }

            user.Login = login;
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            user.Email = request.Email.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        if (request.CanReserve.HasValue)
        {
            user.CanReserve = request.CanReserve.Value;
        }

        if (request.CanMarkBorrowed.HasValue)
        {
            user.CanMarkBorrowed = request.CanMarkBorrowed.Value;
        }

        if (request.CanMarkAvailable.HasValue)
        {
            user.CanMarkAvailable = request.CanMarkAvailable.Value;
        }

        if (request.CanMarkUnavailable.HasValue)
        {
            user.CanMarkUnavailable = request.CanMarkUnavailable.Value;
        }

        await _context.SaveChangesAsync();

        return Ok(ToResponse(user));
    }

    [HttpPatch("{id:int}/permissions")]
    public async Task<IActionResult> UpdatePermissions(int id, [FromBody] UpdateUserPermissionsDto request)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
        {
            return NotFound(new { message = "Nie znaleziono użytkownika." });
        }

        // Osobny endpoint pod zmianę checkboxów uprawnień w panelu administratora.
        user.CanReserve = request.CanReserve;
        user.CanMarkBorrowed = request.CanMarkBorrowed;
        user.CanMarkAvailable = request.CanMarkAvailable;
        user.CanMarkUnavailable = request.CanMarkUnavailable;

        await _context.SaveChangesAsync();

        return Ok(ToResponse(user));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);

        if (user is null)
        {
            return NotFound(new { message = "Nie znaleziono użytkownika." });
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static UserResponseDto ToResponse(User user)
    {
        // Nie zwracamy PasswordHash w odpowiedzi API.
        return new UserResponseDto
        {
            Id = user.Id,
            Login = user.Login,
            Email = user.Email,
            CanReserve = user.CanReserve,
            CanMarkBorrowed = user.CanMarkBorrowed,
            CanMarkAvailable = user.CanMarkAvailable,
            CanMarkUnavailable = user.CanMarkUnavailable
        };
    }
}

public class UserResponseDto
{
    public int Id { get; set; }
    public string Login { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool CanReserve { get; set; }
    public bool CanMarkBorrowed { get; set; }
    public bool CanMarkAvailable { get; set; }
    public bool CanMarkUnavailable { get; set; }
}

public class CreateUserDto
{
    public string Login { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool CanReserve { get; set; }
    public bool CanMarkBorrowed { get; set; }
    public bool CanMarkAvailable { get; set; }
    public bool CanMarkUnavailable { get; set; }
}

public class UpdateUserDto
{
    public string? Login { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public bool? CanReserve { get; set; }
    public bool? CanMarkBorrowed { get; set; }
    public bool? CanMarkAvailable { get; set; }
    public bool? CanMarkUnavailable { get; set; }
}

public class UpdateUserPermissionsDto
{
    public bool CanReserve { get; set; }
    public bool CanMarkBorrowed { get; set; }
    public bool CanMarkAvailable { get; set; }
    public bool CanMarkUnavailable { get; set; }
}
