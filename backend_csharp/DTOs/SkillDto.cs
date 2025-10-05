using System.ComponentModel.DataAnnotations;

namespace PortfolioBackend.DTOs;

public class SkillDto
{
    public string? Id { get; set; }
    public bool IsProficient { get; set; }
    public string? Name { get; set; }
    public string? SkillTypeCode { get; set; }
    public string? Code { get; set; }
    public bool IsVisibleInAppDetails { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateSkillDto
{
    [Required]
    public bool IsProficient { get; set; }
    
    [Required]
    public string? Name { get; set; }
    
    [Required]
    public string? SkillTypeCode { get; set; }
    
    [Required]
    public string? Code { get; set; }
    
    public bool IsVisibleInAppDetails { get; set; } = true;
}

public class UpdateSkillDto
{
    public bool? IsProficient { get; set; }
    public string? Name { get; set; }
    public string? SkillTypeCode { get; set; }
    public string? Code { get; set; }
    public bool? IsVisibleInAppDetails { get; set; }
}
