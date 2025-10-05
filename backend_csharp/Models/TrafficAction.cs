using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PortfolioBackend.Models;

public class TrafficAction
{
    [BsonElement("action")]
    public string Action { get; set; } = string.Empty;

    [BsonElement("page")]
    public string Page { get; set; } = string.Empty;

    [BsonElement("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [BsonElement("filter")]
    public string? Filter { get; set; }

    [BsonElement("value")]
    public string? Value { get; set; }

    [BsonElement("sort")]
    public string? Sort { get; set; }

    [BsonElement("order")]
    public string? Order { get; set; }

    [BsonElement("page_number")]
    public int? PageNumber { get; set; }

    [BsonElement("page_size")]
    public int? PageSize { get; set; }

    [BsonElement("search")]
    public string? Search { get; set; }
}
