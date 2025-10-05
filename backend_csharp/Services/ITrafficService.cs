using PortfolioBackend.DTOs;

namespace PortfolioBackend.Services;

public interface ITrafficService
{
    Task<TrafficAnalyticsDto> GetAnalyticsAsync();
    Task<IEnumerable<RecentActivity>> GetRecentActivityAsync(int limit = 50);
    Task<TrafficDto?> GetTrafficByIpAsync(string ipAddress);
    Task<TrafficDto> CreateOrUpdateTrafficAsync(string ipAddress, string userAgent, string? page = null, Dictionary<string, string>? queryParams = null);
}
