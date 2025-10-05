using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace PortfolioBackend.Models;

public class Application
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("title")]
    public string? Title { get; set; }

    [BsonElement("publish_date")]
    public DateTime? PublishDate { get; set; }

    [BsonElement("is_featured")]
    public bool IsFeatured { get; set; } = false;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("deployed_link")]
    public string? DeployedLink { get; set; }

    [BsonElement("repositories")]
    public List<string> Repositories { get; set; } = new();

    [BsonElement("support_status_code")]
    public string? SupportStatusCode { get; set; }

    [BsonElement("associated_skill_codes")]
    public List<string> AssociatedSkillCodes { get; set; } = new();

    [BsonElement("embeddings")]
    public List<double> Embeddings { get; set; } = new();

    [BsonElement("image_url_relative")]
    public string? ImageUrlRelative { get; set; }

    [BsonElement("front_end_repo_link")]
    public string? FrontEndRepoLink { get; set; }

    [BsonElement("back_end_repo_link")]
    public string? BackEndRepoLink { get; set; }

    [BsonElement("image_url")]
    public string? ImageUrl { get; set; }

    [BsonElement("deleted_date")]
    public DateTime? DeletedDate { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
