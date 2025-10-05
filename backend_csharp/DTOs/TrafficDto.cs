namespace PortfolioBackend.DTOs;

public class TrafficDto
{
    public string? Id { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public DateTime FirstVisit { get; set; }
    public DateTime LastVisit { get; set; }
    public int TotalVisits { get; set; }
    public List<UserAgentDto> UserAgents { get; set; } = new();
    public string Location { get; set; } = string.Empty;
    public List<TrafficActionDto> Actions { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UserAgentDto
{
    public string UserAgentString { get; set; } = string.Empty;
    public string? Os { get; set; }
    public string? Browser { get; set; }
    public string? Device { get; set; }
    public DateTime FirstSeen { get; set; }
    public DateTime LastSeen { get; set; }
    public int VisitCount { get; set; }
}

public class TrafficActionDto
{
    public string Action { get; set; } = string.Empty;
    public string Page { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Filter { get; set; }
    public string? Value { get; set; }
    public string? Sort { get; set; }
    public string? Order { get; set; }
    public int? PageNumber { get; set; }
    public int? PageSize { get; set; }
    public string? Search { get; set; }
}

public class TrackPageRequest
{
    public string Page { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class TrafficAnalyticsDto
{
    public int TotalVisitors { get; set; }
    public int TotalPageViews { get; set; }
    public List<PageViewStats> PageViews { get; set; } = new();
    public List<DeviceStats> DeviceStats { get; set; } = new();
    public List<BrowserStats> BrowserStats { get; set; } = new();
    public List<LocationStats> LocationStats { get; set; } = new();
    public List<RecentActivity> RecentActivity { get; set; } = new();
}

public class PageViewStats
{
    public string Page { get; set; } = string.Empty;
    public int Views { get; set; }
}

public class DeviceStats
{
    public string Device { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class BrowserStats
{
    public string Browser { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class LocationStats
{
    public string Location { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class RecentActivity
{
    public string IpAddress { get; set; } = string.Empty;
    public string Page { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Device { get; set; }
    public string? Browser { get; set; }
}
