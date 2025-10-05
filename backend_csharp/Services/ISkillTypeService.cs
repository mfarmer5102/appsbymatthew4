using PortfolioBackend.DTOs;

namespace PortfolioBackend.Services;

public interface ISkillTypeService
{
    Task<IEnumerable<SkillTypeDto>> GetAllAsync();
    Task<SkillTypeDto?> GetByIdAsync(string id);
    Task<SkillTypeDto?> GetByCodeAsync(string code);
    Task<SkillTypeDto> CreateAsync(CreateSkillTypeDto createDto);
    Task<SkillTypeDto?> UpdateAsync(string id, UpdateSkillTypeDto updateDto);
    Task<bool> DeleteAsync(string id);
}
