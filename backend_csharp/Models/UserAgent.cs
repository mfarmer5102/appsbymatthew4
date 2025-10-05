using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PortfolioBackend.Models;

public class UserAgent
{
    [BsonElement("user_agent")]
    public string UserAgentString { get; set; } = string.Empty;

    [BsonElement("os")]
    public string? Os { get; set; }

    [BsonElement("browser")]
    public string? Browser { get; set; }

    [BsonElement("device")]
    public string? Device { get; set; }

    [BsonElement("first_seen")]
    public DateTime FirstSeen { get; set; } = DateTime.UtcNow;

    [BsonElement("last_seen")]
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;

    [BsonElement("visit_count")]
    public int VisitCount { get; set; } = 1;
}
