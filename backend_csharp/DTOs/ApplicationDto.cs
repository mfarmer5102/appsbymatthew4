using System.ComponentModel.DataAnnotations;

namespace PortfolioBackend.DTOs;

public class ApplicationDto
{
    public string? Id { get; set; }
    public string? Title { get; set; }
    public DateTime? PublishDate { get; set; }
    public bool IsFeatured { get; set; }
    public string? Description { get; set; }
    public string? DeployedLink { get; set; }
    public List<string> Repositories { get; set; } = new();
    public string? SupportStatusCode { get; set; }
    public List<string> AssociatedSkillCodes { get; set; } = new();
    public List<double> Embeddings { get; set; } = new();
    public string? ImageUrlRelative { get; set; }
    public DateTime? DeletedDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateApplicationDto
{
    [Required]
    public string? Title { get; set; }
    public DateTime? PublishDate { get; set; }
    public bool IsFeatured { get; set; } = false;
    public string? Description { get; set; }
    public string? DeployedLink { get; set; }
    public List<string> Repositories { get; set; } = new();
    public string? SupportStatusCode { get; set; }
    public List<string> AssociatedSkillCodes { get; set; } = new();
    public List<double> Embeddings { get; set; } = new();
    public string? ImageUrlRelative { get; set; }
}

public class UpdateApplicationDto
{
    public string? Title { get; set; }
    public DateTime? PublishDate { get; set; }
    public bool? IsFeatured { get; set; }
    public string? Description { get; set; }
    public string? DeployedLink { get; set; }
    public List<string>? Repositories { get; set; }
    public string? SupportStatusCode { get; set; }
    public List<string>? AssociatedSkillCodes { get; set; }
    public List<double>? Embeddings { get; set; }
    public string? ImageUrlRelative { get; set; }
    public DateTime? DeletedDate { get; set; }
}
