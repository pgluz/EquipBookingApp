using Microsoft.AspNetCore.Mvc;
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
        // Szukam użytkownika w bazie
        var user = _context.Users.FirstOrDefault(u => u.Login == request.Login);
        
        // Weryfikuję hasło
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Nieprawidłowy login lub hasło." });
        }

        // Generuje token JWT
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Login),
                // Zaszywam uprawnienia bezpośrednio w tokenie
                new Claim("CanReserve", user.CanReserve.ToString()),
                new Claim("CanMarkBorrowed", user.CanMarkBorrowed.ToString()),
                new Claim("CanMarkAvailable", user.CanMarkAvailable.ToString()),
                new Claim("CanMarkUnavailable", user.CanMarkUnavailable.ToString())
            }),
            Expires = DateTime.UtcNow.AddHours(4),
            Issuer = _configuration["Jwt:Issuer"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return Ok(new { token = tokenHandler.WriteToken(token) });
    }
}