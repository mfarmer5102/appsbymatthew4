using System.ComponentModel.DataAnnotations;

namespace PortfolioBackend.DTOs;

public class SkillTypeDto
{
    public string? Id { get; set; }
    public string? Code { get; set; }
    public string? Label { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateSkillTypeDto
{
    [Required]
    public string? Code { get; set; }
    
    [Required]
    public string? Label { get; set; }
}

public class UpdateSkillTypeDto
{
    public string? Code { get; set; }
    public string? Label { get; set; }
}
