using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using EquipBooking.Api.Data;
using EquipBooking.Api.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EquipBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto request)
    {
        var user = _context.Users.FirstOrDefault(u => u.Login == request.Login);
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Nieprawidłowy login lub hasło." });
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
        
        // Wyciągamy rolę (jeśli pusta, domyślnie "User")
        var userRole = string.IsNullOrEmpty(user.Role) ? "User" : user.Role;

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Login),
                new Claim(ClaimTypes.Role, userRole), // Zapisujemy główną rolę do JWT
                new Claim("CanReserve", user.CanReserve.ToString()), 
            }),
            Expires = DateTime.UtcNow.AddHours(4),
            Issuer = _configuration["Jwt:Issuer"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return Ok(new 
        { 
            token = tokenHandler.WriteToken(token),
            user = new 
            {
                id = user.Id,
                login = user.Login,
                email = user.Email,
                role = userRole // Zwracamy rolę do frontendu
            }
        });
    }

    [Authorize]
    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        // Sprawdzamy, czy pytający to na pewno Główny Admin
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (role != "Admin") 
            return StatusCode(403, new { message = "Tylko Administrator może przeglądać listę użytkowników." });

        var users = _context.Users.Select(u => new 
        { 
            u.Id, 
            u.Login, 
            u.Email, 
            u.Role 
        }).ToList();
        
        return Ok(users);
    }

    [Authorize]
    [HttpPost("users")]
    public IActionResult CreateUser([FromBody] NewUserDto request)
    {
        var currentRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (currentRole != "Admin") 
            return StatusCode(403, new { message = "Tylko Administrator może tworzyć nowe konta." });

        if (_context.Users.Any(u => u.Login == request.Login))
            return BadRequest(new { message = "Użytkownik o takim loginie już istnieje." });

        var newUser = new User
        {
            Login = request.Login,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role, // Przypisujemy jedną z 3 ról
            CanReserve = true    // Domyślnie każdy może rezerwować
        };

        _context.Users.Add(newUser);
        _context.SaveChanges();

        return Ok(new { message = "Konto zostało utworzone pomyślnie." });
    }
}

// Nowe DTO do zakładania kont
public class NewUserDto
{
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}