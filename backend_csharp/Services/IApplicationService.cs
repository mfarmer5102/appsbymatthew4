using PortfolioBackend.DTOs;
using PortfolioBackend.Models;

namespace PortfolioBackend.Services;

public interface IApplicationService
{
    Task<IEnumerable<ApplicationDto>> GetAllAsync(string? filter = null, string? sort = null, string? order = null, int page = 1, int limit = 20, string? search = null);
    Task<ApplicationDto?> GetByIdAsync(string id);
    Task<ApplicationDto> CreateAsync(CreateApplicationDto createDto);
    Task<ApplicationDto?> UpdateAsync(string id, UpdateApplicationDto updateDto);
    Task<bool> DeleteAsync(string id);
    Task<bool> SoftDeleteAsync(string id);
    Task<int> GetTotalCountAsync(string? filter = null, string? search = null);
}
