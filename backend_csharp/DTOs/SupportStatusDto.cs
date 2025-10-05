using System.ComponentModel.DataAnnotations;

namespace PortfolioBackend.DTOs;

public class SupportStatusDto
{
    public string? Id { get; set; }
    public string? Code { get; set; }
    public string? Label { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateSupportStatusDto
{
    [Required]
    public string? Code { get; set; }
    
    [Required]
    public string? Label { get; set; }
}

public class UpdateSupportStatusDto
{
    public string? Code { get; set; }
    public string? Label { get; set; }
}
