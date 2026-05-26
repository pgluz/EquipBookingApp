using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;

namespace EquipBooking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController : ControllerBase
    {
        private static readonly List<ReservationRequest> _requests = new();
        private static readonly object _lock = new();

        [HttpPost("requests")]
        public ActionResult<ReservationRequestResponse> CreateRequest([FromBody] CreateReservationRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Purpose))
                return BadRequest("Request data is required.");

            if (request.EndDate <= request.StartDate)
                return BadRequest("EndDate must be after StartDate.");

            var reservation = new ReservationRequest
            {
                Id = Guid.NewGuid(),
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Purpose = request.Purpose.Trim(),
                Status = ReservationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            lock (_lock)
            {
                _requests.Add(reservation);
            }

            return CreatedAtAction(nameof(GetRequestById), new { id = reservation.Id }, ToResponse(reservation));
        }

        [HttpGet("requests")]
        public ActionResult<IEnumerable<ReservationRequestResponse>> GetRequests()
        {
            return Ok(_requests.Select(ToResponse));
        }

        [HttpGet("requests/{id:guid}")]
        public ActionResult<ReservationRequestResponse> GetRequestById(Guid id)
        {
            var request = _requests.FirstOrDefault(r => r.Id == id);
            if (request == null)
                return NotFound();

            return Ok(ToResponse(request));
        }

        [HttpPost("requests/{id:guid}/accept")]
        public ActionResult<ReservationRequestResponse> AcceptRequest(Guid id)
        {
            return UpdateRequestStatus(id, ReservationStatus.Accepted);
        }

        [HttpPost("requests/{id:guid}/reject")]
        public ActionResult<ReservationRequestResponse> RejectRequest(Guid id)
        {
            return UpdateRequestStatus(id, ReservationStatus.Rejected);
        }

        private ActionResult<ReservationRequestResponse> UpdateRequestStatus(Guid id, ReservationStatus status)
        {
            lock (_lock)
            {
                var request = _requests.FirstOrDefault(r => r.Id == id);
                if (request == null)
                    return NotFound();

                if (request.Status != ReservationStatus.Pending)
                    return BadRequest("Only pending requests can be changed.");

                request.Status = status;
                return Ok(ToResponse(request));
            }
        }

        private static ReservationRequestResponse ToResponse(ReservationRequest request)
        {
            return new ReservationRequestResponse
            {
                Id = request.Id,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Purpose = request.Purpose,
                Status = request.Status.ToString(),
                CreatedAt = request.CreatedAt
            };
        }

        public class CreateReservationRequest
        {
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string Purpose { get; set; }
        }

        public class ReservationRequestResponse
        {
            public Guid Id { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string Purpose { get; set; }
            public string Status { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        private class ReservationRequest
        {
            public Guid Id { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string Purpose { get; set; }
            public ReservationStatus Status { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        private enum ReservationStatus
        {
            Pending,
            Accepted,
            Rejected
        }
    }
}
