using MongoDB.Driver;
using PortfolioBackend.DTOs;
using PortfolioBackend.Models;

namespace PortfolioBackend.Services;

public class SupportStatusService : ISupportStatusService
{
    private readonly IMongoCollection<SupportStatus> _supportStatuses;

    public SupportStatusService(IMongoDatabase database)
    {
        _supportStatuses = database.GetCollection<SupportStatus>("support_statuses");
    }

    public async Task<IEnumerable<SupportStatusDto>> GetAllAsync(string? sort = null, string? order = null)
    {
        // Build sort definition
        SortDefinition<SupportStatus> sortDefinition;
        if (!string.IsNullOrEmpty(sort))
        {
            var isDescending = order?.ToLower() == "desc";
            sortDefinition = sort.ToLower() switch
            {
                "code" => isDescending ? Builders<SupportStatus>.Sort.Descending(ss => ss.Code) : Builders<SupportStatus>.Sort.Ascending(ss => ss.Code),
                "label" => isDescending ? Builders<SupportStatus>.Sort.Descending(ss => ss.Label) : Builders<SupportStatus>.Sort.Ascending(ss => ss.Label),
                _ => Builders<SupportStatus>.Sort.Ascending(ss => ss.Label)
            };
        }
        else
        {
            // Default sort: by label asc
            sortDefinition = Builders<SupportStatus>.Sort.Ascending(ss => ss.Label);
        }

        var supportStatuses = await _supportStatuses.Find(_ => true).Sort(sortDefinition).ToListAsync();
        return supportStatuses.Select(MapToDto);
    }

    public async Task<SupportStatusDto?> GetByIdAsync(string id)
    {
        var supportStatus = await _supportStatuses.Find(ss => ss.Id == id).FirstOrDefaultAsync();
        return supportStatus != null ? MapToDto(supportStatus) : null;
    }

    public async Task<SupportStatusDto?> GetByCodeAsync(string code)
    {
        var supportStatus = await _supportStatuses.Find(ss => ss.Code == code.ToUpper()).FirstOrDefaultAsync();
        return supportStatus != null ? MapToDto(supportStatus) : null;
    }

    public async Task<SupportStatusDto> CreateAsync(CreateSupportStatusDto createDto)
    {
        var supportStatus = new SupportStatus
        {
            Code = createDto.Code?.ToUpper(),
            Label = createDto.Label,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _supportStatuses.InsertOneAsync(supportStatus);
        return MapToDto(supportStatus);
    }

    public async Task<SupportStatusDto?> UpdateAsync(string id, UpdateSupportStatusDto updateDto)
    {
        var updateBuilder = Builders<SupportStatus>.Update;
        var updates = new List<UpdateDefinition<SupportStatus>>();

        if (updateDto.Code != null) updates.Add(updateBuilder.Set(ss => ss.Code, updateDto.Code.ToUpper()));
        if (updateDto.Label != null) updates.Add(updateBuilder.Set(ss => ss.Label, updateDto.Label));

        updates.Add(updateBuilder.Set(ss => ss.UpdatedAt, DateTime.UtcNow));

        var result = await _supportStatuses.UpdateOneAsync(ss => ss.Id == id, updateBuilder.Combine(updates));
        
        if (result.ModifiedCount > 0)
        {
            var updatedSupportStatus = await _supportStatuses.Find(ss => ss.Id == id).FirstOrDefaultAsync();
            return updatedSupportStatus != null ? MapToDto(updatedSupportStatus) : null;
        }

        return null;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _supportStatuses.DeleteOneAsync(ss => ss.Id == id);
        return result.DeletedCount > 0;
    }

    private static SupportStatusDto MapToDto(SupportStatus supportStatus)
    {
        return new SupportStatusDto
        {
            Id = supportStatus.Id,
            Code = supportStatus.Code,
            Label = supportStatus.Label,
            CreatedAt = supportStatus.CreatedAt,
            UpdatedAt = supportStatus.UpdatedAt
        };
    }
}
