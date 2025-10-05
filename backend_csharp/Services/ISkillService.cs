using PortfolioBackend.DTOs;

namespace PortfolioBackend.Services;

public interface ISkillService
{
    Task<IEnumerable<SkillDto>> GetAllAsync(string? filter = null, string? sort = null, string? order = null, int page = 1, int limit = 20, string? search = null);
    Task<SkillDto?> GetByIdAsync(string id);
    Task<SkillDto?> GetByCodeAsync(string code);
    Task<SkillDto> CreateAsync(CreateSkillDto createDto);
    Task<SkillDto?> UpdateAsync(string id, UpdateSkillDto updateDto);
    Task<bool> DeleteAsync(string id);
    Task<int> GetTotalCountAsync(string? filter = null, string? search = null);
}
