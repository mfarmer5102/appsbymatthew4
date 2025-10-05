using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Driver;
using PortfolioBackend.DTOs;
using PortfolioBackend.Models;

namespace PortfolioBackend.Services;

public class TrafficService : ITrafficService
{
    private readonly IMongoCollection<Traffic> _traffic;

    public TrafficService(IMongoDatabase database)
    {
        _traffic = database.GetCollection<Traffic>("traffic");
    }

    public async Task<TrafficAnalyticsDto> GetAnalyticsAsync()
    {
        var totalVisitors = await _traffic.CountDocumentsAsync(_ => true);
        
        var allTraffic = await _traffic.Find(_ => true).ToListAsync();
        var totalPageViews = allTraffic.Sum(t => t.Actions.Count(a => a.Action == "page_view"));

        // Page view statistics
        var pageViews = allTraffic
            .SelectMany(t => t.Actions.Where(a => a.Action == "page_view"))
            .GroupBy(a => a.Page)
            .Select(g => new PageViewStats { Page = g.Key, Views = g.Count() })
            .OrderByDescending(p => p.Views)
            .ToList();

        // Device statistics
        var deviceStats = allTraffic
            .SelectMany(t => t.UserAgents)
            .GroupBy(ua => ua.Device)
            .Select(g => new DeviceStats { Device = g.Key ?? "Unknown", Count = g.Sum(ua => ua.VisitCount) })
            .OrderByDescending(d => d.Count)
            .ToList();

        // Browser statistics
        var browserStats = allTraffic
            .SelectMany(t => t.UserAgents)
            .GroupBy(ua => ua.Browser)
            .Select(g => new BrowserStats { Browser = g.Key ?? "Unknown", Count = g.Sum(ua => ua.VisitCount) })
            .OrderByDescending(b => b.Count)
            .ToList();

        // Location statistics
        var locationStats = allTraffic
            .GroupBy(t => t.Location)
            .Select(g => new LocationStats { Location = g.Key, Count = g.Sum(t => t.TotalVisits) })
            .OrderByDescending(l => l.Count)
            .ToList();

        // Recent activity
        var recentActivity = await GetRecentActivityAsync(10);

        return new TrafficAnalyticsDto
        {
            TotalVisitors = (int)totalVisitors,
            TotalPageViews = totalPageViews,
            PageViews = pageViews,
            DeviceStats = deviceStats,
            BrowserStats = browserStats,
            LocationStats = locationStats,
            RecentActivity = recentActivity.ToList()
        };
    }

    public async Task<IEnumerable<RecentActivity>> GetRecentActivityAsync(int limit = 50)
    {
        var recentActions = await _traffic
            .Aggregate()
            .Unwind(t => t.Actions)
            .Sort(Builders<BsonDocument>.Sort.Descending("Actions.timestamp"))
            .Limit(limit)
            .ToListAsync();

        return recentActions.Select(doc =>
        {
            var traffic = BsonSerializer.Deserialize<Traffic>(doc);
            var action = traffic.Actions.FirstOrDefault();
            var userAgent = traffic.UserAgents.FirstOrDefault();

            return new RecentActivity
            {
                IpAddress = traffic.IpAddress,
                Page = action?.Page ?? "",
                Action = action?.Action ?? "",
                Timestamp = action?.Timestamp ?? DateTime.UtcNow,
                Device = userAgent?.Device,
                Browser = userAgent?.Browser
            };
        });
    }

    public async Task<TrafficDto?> GetTrafficByIpAsync(string ipAddress)
    {
        var traffic = await _traffic.Find(t => t.IpAddress == ipAddress).FirstOrDefaultAsync();
        return traffic != null ? MapToDto(traffic) : null;
    }

    public async Task<TrafficDto> CreateOrUpdateTrafficAsync(string ipAddress, string userAgent, string? page = null, Dictionary<string, string>? queryParams = null)
    {
        var existingTraffic = await _traffic.Find(t => t.IpAddress == ipAddress).FirstOrDefaultAsync();
        var now = DateTime.UtcNow;

        if (existingTraffic != null)
        {
            // Update existing traffic record
            var updateBuilder = Builders<Traffic>.Update;
            var updates = new List<UpdateDefinition<Traffic>>();

            updates.Add(updateBuilder.Set(t => t.LastVisit, now));
            updates.Add(updateBuilder.Inc(t => t.TotalVisits, 1));

            // Add page view action if provided
            if (!string.IsNullOrEmpty(page))
            {
                var pageViewAction = new TrafficAction
                {
                    Action = "page_view",
                    Page = page,
                    Timestamp = now
                };

                // Check if this page was already viewed in the last 5 minutes to avoid duplicates
                var fiveMinutesAgo = now.AddMinutes(-5);
                var recentPageView = existingTraffic.Actions.Any(a => 
                    a.Action == "page_view" && 
                    a.Page == page && 
                    a.Timestamp > fiveMinutesAgo);

                if (!recentPageView)
                {
                    updates.Add(updateBuilder.Push(t => t.Actions, pageViewAction));
                }
            }

            // Add actions based on query parameters (only non-default values)
            if (queryParams != null)
            {
                var actionsToAdd = new List<TrafficAction>();

                // Add filter action only if it's not a default value
                if (queryParams.ContainsKey("filter") && queryParams["filter"] != "all" && !string.IsNullOrEmpty(queryParams["filter"]))
                {
                    actionsToAdd.Add(new TrafficAction
                    {
                        Action = "filter",
                        Page = page ?? "unknown",
                        Filter = queryParams["filter"],
                        Value = queryParams.GetValueOrDefault("value", queryParams["filter"]),
                        Timestamp = now
                    });
                }

                // Add sort action only if it's not default (name asc)
                if (queryParams.ContainsKey("sort") && !(queryParams["sort"] == "name" && (queryParams.GetValueOrDefault("order", "asc") == "asc")))
                {
                    actionsToAdd.Add(new TrafficAction
                    {
                        Action = "sort",
                        Page = page ?? "unknown",
                        Sort = queryParams["sort"],
                        Order = queryParams.GetValueOrDefault("order", "asc"),
                        Timestamp = now
                    });
                }

                // Add pagination action only if it's not default (page 1, limit 20)
                var pageNum = int.TryParse(queryParams.GetValueOrDefault("page", "1"), out var p) ? p : 1;
                var pageSize = int.TryParse(queryParams.GetValueOrDefault("limit", "20"), out var l) ? l : 20;
                if (pageNum > 1 || pageSize != 20)
                {
                    actionsToAdd.Add(new TrafficAction
                    {
                        Action = "pagination",
                        Page = page ?? "unknown",
                        PageNumber = pageNum,
                        PageSize = pageSize,
                        Timestamp = now
                    });
                }

                // Add search action only if there's actual search text
                if (queryParams.ContainsKey("search") && !string.IsNullOrEmpty(queryParams["search"]?.Trim()))
                {
                    actionsToAdd.Add(new TrafficAction
                    {
                        Action = "search",
                        Page = page ?? "unknown",
                        Search = queryParams["search"].Trim(),
                        Timestamp = now
                    });
                }

                if (actionsToAdd.Any())
                {
                    updates.Add(updateBuilder.PushEach(t => t.Actions, actionsToAdd));
                }
            }

            // Update user agent info
            var existingUserAgent = existingTraffic.UserAgents.FirstOrDefault(ua => ua.UserAgentString == userAgent);
            if (existingUserAgent != null)
            {
                await _traffic.UpdateOneAsync(
                    t => t.Id == existingTraffic.Id && t.UserAgents.Any(ua => ua.UserAgentString == userAgent),
                    Builders<Traffic>.Update
                        .Inc("user_agents.$.visit_count", 1)
                        .Set("user_agents.$.last_seen", now)
                );
            }
            else
            {
                var newUserAgent = new UserAgent
                {
                    UserAgentString = userAgent,
                    Os = GetOSInfo(userAgent),
                    Browser = GetBrowserInfo(userAgent),
                    Device = GetDeviceType(userAgent),
                    FirstSeen = now,
                    LastSeen = now,
                    VisitCount = 1
                };
                updates.Add(updateBuilder.Push(t => t.UserAgents, newUserAgent));
            }

            updates.Add(updateBuilder.Set(t => t.UpdatedAt, now));

            await _traffic.UpdateOneAsync(t => t.Id == existingTraffic.Id, updateBuilder.Combine(updates));
            
            var updatedTraffic = await _traffic.Find(t => t.Id == existingTraffic.Id).FirstOrDefaultAsync();
            return updatedTraffic != null ? MapToDto(updatedTraffic) : MapToDto(existingTraffic);
        }
        else
        {
            // Create new traffic record
            var actions = new List<TrafficAction>();
            
            if (!string.IsNullOrEmpty(page))
            {
                actions.Add(new TrafficAction
                {
                    Action = "page_view",
                    Page = page,
                    Timestamp = now
                });
            }

            // Add additional actions based on query parameters (only non-default values)
            if (queryParams != null)
            {
                if (queryParams.ContainsKey("filter") && queryParams["filter"] != "all" && !string.IsNullOrEmpty(queryParams["filter"]))
                {
                    actions.Add(new TrafficAction
                    {
                        Action = "filter",
                        Page = page ?? "unknown",
                        Filter = queryParams["filter"],
                        Value = queryParams.GetValueOrDefault("value", queryParams["filter"]),
                        Timestamp = now
                    });
                }

                if (queryParams.ContainsKey("sort") && !(queryParams["sort"] == "name" && (queryParams.GetValueOrDefault("order", "asc") == "asc")))
                {
                    actions.Add(new TrafficAction
                    {
                        Action = "sort",
                        Page = page ?? "unknown",
                        Sort = queryParams["sort"],
                        Order = queryParams.GetValueOrDefault("order", "asc"),
                        Timestamp = now
                    });
                }

                var pageNum = int.TryParse(queryParams.GetValueOrDefault("page", "1"), out var p) ? p : 1;
                var pageSize = int.TryParse(queryParams.GetValueOrDefault("limit", "20"), out var l) ? l : 20;
                if (pageNum > 1 || pageSize != 20)
                {
                    actions.Add(new TrafficAction
                    {
                        Action = "pagination",
                        Page = page ?? "unknown",
                        PageNumber = pageNum,
                        PageSize = pageSize,
                        Timestamp = now
                    });
                }

                if (queryParams.ContainsKey("search") && !string.IsNullOrEmpty(queryParams["search"]?.Trim()))
                {
                    actions.Add(new TrafficAction
                    {
                        Action = "search",
                        Page = page ?? "unknown",
                        Search = queryParams["search"].Trim(),
                        Timestamp = now
                    });
                }
            }

            var newTraffic = new Traffic
            {
                IpAddress = ipAddress,
                FirstVisit = now,
                LastVisit = now,
                TotalVisits = 1,
                UserAgents = new List<UserAgent>
                {
                    new UserAgent
                    {
                        UserAgentString = userAgent,
                        Os = GetOSInfo(userAgent),
                        Browser = GetBrowserInfo(userAgent),
                        Device = GetDeviceType(userAgent),
                        FirstSeen = now,
                        LastSeen = now,
                        VisitCount = 1
                    }
                },
                Location = GetLocation(ipAddress),
                Actions = actions,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _traffic.InsertOneAsync(newTraffic);
            return MapToDto(newTraffic);
        }
    }

    private static string GetDeviceType(string userAgent)
    {
        if (userAgent.Contains("tablet", StringComparison.OrdinalIgnoreCase))
            return "Tablet";
        else if (userAgent.Contains("mobile", StringComparison.OrdinalIgnoreCase))
            return "Mobile";
        else
            return "Desktop";
    }

    private static string GetBrowserInfo(string userAgent)
    {
        if (userAgent.Contains("firefox", StringComparison.OrdinalIgnoreCase))
            return "Firefox";
        else if (userAgent.Contains("chrome", StringComparison.OrdinalIgnoreCase))
            return "Chrome";
        else if (userAgent.Contains("safari", StringComparison.OrdinalIgnoreCase))
            return "Safari";
        else if (userAgent.Contains("edge", StringComparison.OrdinalIgnoreCase))
            return "Edge";
        else if (userAgent.Contains("msie", StringComparison.OrdinalIgnoreCase) || userAgent.Contains("trident", StringComparison.OrdinalIgnoreCase))
            return "IE";
        else
            return "Other";
    }

    private static string GetOSInfo(string userAgent)
    {
        if (userAgent.Contains("windows", StringComparison.OrdinalIgnoreCase))
            return "Windows";
        else if (userAgent.Contains("mac", StringComparison.OrdinalIgnoreCase))
            return "macOS";
        else if (userAgent.Contains("android", StringComparison.OrdinalIgnoreCase))
            return "Android";
        else if (userAgent.Contains("iphone", StringComparison.OrdinalIgnoreCase) || userAgent.Contains("ipad", StringComparison.OrdinalIgnoreCase))
            return "iOS";
        else if (userAgent.Contains("linux", StringComparison.OrdinalIgnoreCase))
            return "Linux";
        else
            return "Other";
    }

    private static string GetLocation(string ip)
    {
        // Placeholder for IP geolocation
        // In production, you'd use a service like MaxMind GeoIP2 or similar
        return "United States";
    }

    private static TrafficDto MapToDto(Traffic traffic)
    {
        return new TrafficDto
        {
            Id = traffic.Id,
            IpAddress = traffic.IpAddress,
            FirstVisit = traffic.FirstVisit,
            LastVisit = traffic.LastVisit,
            TotalVisits = traffic.TotalVisits,
            UserAgents = traffic.UserAgents.Select(ua => new UserAgentDto
            {
                UserAgentString = ua.UserAgentString,
                Os = ua.Os,
                Browser = ua.Browser,
                Device = ua.Device,
                FirstSeen = ua.FirstSeen,
                LastSeen = ua.LastSeen,
                VisitCount = ua.VisitCount
            }).ToList(),
            Location = traffic.Location,
            Actions = traffic.Actions.Select(a => new TrafficActionDto
            {
                Action = a.Action,
                Page = a.Page,
                Timestamp = a.Timestamp,
                Filter = a.Filter,
                Value = a.Value,
                Sort = a.Sort,
                Order = a.Order,
                PageNumber = a.PageNumber,
                PageSize = a.PageSize,
                Search = a.Search
            }).ToList(),
            CreatedAt = traffic.CreatedAt,
            UpdatedAt = traffic.UpdatedAt
        };
    }
}
