using EquipBooking.Api.Data;
using EquipBooking.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Rejestracja bazy danych
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Konfiguracja JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
builder.Services.AddAuthorization();

// Dodanie obsługi kontrolerów
builder.Services.AddControllers();

// Konfiguracja CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Dodanie obsługi swaggera - na testy
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Seedowanie administratora (dodawanie z palca, jeśli go nie ma)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); // Upewnia się, że baza jest aktualna z migracjami

    if (!db.Users.Any(u => u.Login == "admin"))
    {
        db.Users.Add(new User
        {
            Login = "admin",
            Email = "admin@uczelnia.edu.pl",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), // Szyfrowanie hasła
            CanReserve = true,
            CanMarkBorrowed = true,
            CanMarkAvailable = true,
            CanMarkUnavailable = true
        });
        db.SaveChanges();
    }
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers(); // Mapowanie endpointów

app.Run();