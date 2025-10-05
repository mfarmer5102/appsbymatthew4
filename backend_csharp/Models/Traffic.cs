using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PortfolioBackend.Models;

public class Traffic
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("ip_address")]
    public string IpAddress { get; set; } = string.Empty;

    [BsonElement("first_visit")]
    public DateTime FirstVisit { get; set; } = DateTime.UtcNow;

    [BsonElement("last_visit")]
    public DateTime LastVisit { get; set; } = DateTime.UtcNow;

    [BsonElement("total_visits")]
    public int TotalVisits { get; set; } = 1;

    [BsonElement("user_agents")]
    public List<UserAgent> UserAgents { get; set; } = new();

    [BsonElement("location")]
    public string Location { get; set; } = string.Empty;

    [BsonElement("actions")]
    public List<TrafficAction> Actions { get; set; } = new();

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
