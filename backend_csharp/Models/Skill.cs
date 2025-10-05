using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PortfolioBackend.Models;

public class Skill
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("is_proficient")]
    public bool IsProficient { get; set; }

    [BsonElement("name")]
    public string? Name { get; set; }

    [BsonElement("skill_type_code")]
    public string? SkillTypeCode { get; set; }

    [BsonElement("code")]
    public string? Code { get; set; }

    [BsonElement("is_visible_in_app_details")]
    public bool IsVisibleInAppDetails { get; set; } = true;

    [BsonElement("provide_disclaimer")]
    public bool? ProvideDisclaimer { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
