using Microsoft.AspNetCore.Mvc;
using PortfolioBackend.DTOs;
using PortfolioBackend.Services;

namespace PortfolioBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrafficController : ControllerBase
{
    private readonly ITrafficService _trafficService;

    public TrafficController(ITrafficService trafficService)
    {
        _trafficService = trafficService;
    }

    [HttpPost("track-page")]
    public async Task<ActionResult> TrackPage([FromBody] TrackPageRequest request)
    {
        try
        {
            // This endpoint is just for triggering the middleware
            // The actual tracking is handled by the TrafficTrackerMiddleware
            return Ok(new { success = true, message = "Page view tracked" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to track page view", message = ex.Message });
        }
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<TrafficAnalyticsDto>> GetAnalytics()
    {
        try
        {
            var analytics = await _trafficService.GetAnalyticsAsync();
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to get analytics", message = ex.Message });
        }
    }

    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<RecentActivity>>> GetRecentActivity([FromQuery] int limit = 50)
    {
        try
        {
            var recentActivity = await _trafficService.GetRecentActivityAsync(limit);
            return Ok(recentActivity);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to get recent activity", message = ex.Message });
        }
    }

    [HttpGet("ip/{ipAddress}")]
    public async Task<ActionResult<TrafficDto>> GetTrafficByIp(string ipAddress)
    {
        try
        {
            var traffic = await _trafficService.GetTrafficByIpAsync(ipAddress);
            if (traffic == null)
            {
                return NotFound(new { error = "Traffic data not found for this IP address" });
            }

            return Ok(traffic);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to get traffic data", message = ex.Message });
        }
    }
}
