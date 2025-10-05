using PortfolioBackend.DTOs;

namespace PortfolioBackend.Services;

public interface ISupportStatusService
{
    Task<IEnumerable<SupportStatusDto>> GetAllAsync();
    Task<SupportStatusDto?> GetByIdAsync(string id);
    Task<SupportStatusDto?> GetByCodeAsync(string code);
    Task<SupportStatusDto> CreateAsync(CreateSupportStatusDto createDto);
    Task<SupportStatusDto?> UpdateAsync(string id, UpdateSupportStatusDto updateDto);
    Task<bool> DeleteAsync(string id);
}
