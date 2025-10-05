using PortfolioBackend.Services;
using System.Text.Json;

namespace PortfolioBackend.Middleware;

public class TrafficTrackerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TrafficTrackerMiddleware> _logger;

    public TrafficTrackerMiddleware(RequestDelegate next, ILogger<TrafficTrackerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITrafficService trafficService)
    {
        try
        {
            _logger.LogDebug("🔍 TRAFFIC MIDDLEWARE EXECUTING: {Method} {Path}", context.Request.Method, context.Request.Path);

            // Skip tracking for certain paths
            var skipPaths = new[] { "/health", "/api/traffic/analytics", "/api/traffic/recent", "/favicon.ico" };
            if (skipPaths.Any(path => context.Request.Path.StartsWithSegments(path)))
            {
                _logger.LogDebug("🔍 Skipping {Path} - in skipPaths", context.Request.Path);
                await _next(context);
                return;
            }

            // Skip tracking if admin mode is enabled (check for admin cookie or header)
            var isAdminMode = context.Request.Cookies["adminMode"] == "true" || 
                             context.Request.Headers["x-admin-mode"].ToString() == "true";
            if (isAdminMode)
            {
                _logger.LogDebug("🔍 Skipping {Path} - admin mode enabled", context.Request.Path);
                await _next(context);
                return;
            }

            // Track both the explicit page tracking endpoint and API calls with non-default parameters
            var isTrackPageEndpoint = context.Request.Path.StartsWithSegments("/api/traffic/track-page");
            var isApiCallWithParams = context.Request.Path.StartsWithSegments("/api/") && 
                                     !context.Request.Path.StartsWithSegments("/api/traffic/") && 
                                     (context.Request.Query.ContainsKey("filter") || 
                                      context.Request.Query.ContainsKey("sort") || 
                                      context.Request.Query.ContainsKey("search") || 
                                      context.Request.Query.ContainsKey("page"));

            if (!isTrackPageEndpoint && !isApiCallWithParams)
            {
                _logger.LogDebug("🔍 Skipping {Path} - not trackable endpoint", context.Request.Path);
                await _next(context);
                return;
            }

            var ipAddress = GetClientIpAddress(context);
            _logger.LogDebug("🔍 Tracking page view: {Method} {Path} from IP: {IpAddress}", 
                context.Request.Method, context.Request.Path, ipAddress);

            // Determine the actual page being viewed
            var actualPage = "home";
            
            if (isTrackPageEndpoint)
            {
                // For explicit page tracking requests, use the page from headers or body
                var pageFromHeader = context.Request.Headers["X-Page"].FirstOrDefault() ?? 
                                   context.Request.Headers["X-Current-Page"].FirstOrDefault();
                if (!string.IsNullOrEmpty(pageFromHeader))
                {
                    actualPage = pageFromHeader;
                }
                else
                {
                    // Try to read from request body
                    context.Request.EnableBuffering();
                    var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
                    context.Request.Body.Position = 0;
                    
                    if (!string.IsNullOrEmpty(body))
                    {
                        try
                        {
                            var requestData = JsonSerializer.Deserialize<Dictionary<string, object>>(body);
                            if (requestData != null && requestData.ContainsKey("page"))
                            {
                                actualPage = requestData["page"]?.ToString() ?? "home";
                            }
                        }
                        catch
                        {
                            // If JSON parsing fails, use query parameter
                            actualPage = context.Request.Query["page"].FirstOrDefault() ?? "home";
                        }
                    }
                    else
                    {
                        actualPage = context.Request.Query["page"].FirstOrDefault() ?? "home";
                    }
                }
            }
            else if (isApiCallWithParams)
            {
                // For API calls with parameters, determine page from the API endpoint
                var path = context.Request.Path.Value?.ToLower() ?? "";
                if (path.Contains("/applications"))
                    actualPage = "applications";
                else if (path.Contains("/skills"))
                    actualPage = "skills";
                else if (path.Contains("/skill-types"))
                    actualPage = "skill-types";
                else if (path.Contains("/support-status"))
                    actualPage = "support-status";
                else
                {
                    actualPage = path.Replace("/api/", "").Split('/')[0];
                    if (string.IsNullOrEmpty(actualPage))
                        actualPage = "home";
                }
            }

            var userAgent = context.Request.Headers["User-Agent"].ToString();
            var queryParams = context.Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());

            _logger.LogDebug("🔍 Tracking traffic: {Method} {Path} -> Page: {Page} from IP: {IpAddress}", 
                context.Request.Method, context.Request.Path, actualPage, ipAddress);

            // Track the traffic
            await trafficService.CreateOrUpdateTrafficAsync(ipAddress, userAgent, actualPage, queryParams);

            await _next(context);
        }
        catch (Exception ex)
        {
            // Don't let traffic tracking errors break the app
            _logger.LogError(ex, "Traffic tracking error");
            await _next(context);
        }
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        // Check for forwarded IP first (in case of reverse proxy)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
