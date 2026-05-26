using System;

namespace EquipBooking.Api.Models;

public class Reservation
{
public int Id { get; set; }
public string Purpose { get; set; } = string.Empty;
public DateTime StartDate { get; set; }
public DateTime EndDate { get; set; }
public string Status { get; set; } = "Oczekująca"; // Oczekująca, Zaakceptowana, Odrzucona

// Relacje
public int EquipmentId { get; set; }
public Equip? Equipment { get; set; }

public int UserId { get; set; }
public User? User { get; set; }
}