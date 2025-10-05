using MongoDB.Driver;
using PortfolioBackend.DTOs;
using PortfolioBackend.Models;

namespace PortfolioBackend.Services;

public class SkillTypeService : ISkillTypeService
{
    private readonly IMongoCollection<SkillType> _skillTypes;

    public SkillTypeService(IMongoDatabase database)
    {
        _skillTypes = database.GetCollection<SkillType>("skill_types");
    }

    public async Task<IEnumerable<SkillTypeDto>> GetAllAsync(string? sort = null, string? order = null)
    {
        // Build sort definition
        SortDefinition<SkillType> sortDefinition;
        if (!string.IsNullOrEmpty(sort))
        {
            var isDescending = order?.ToLower() == "desc";
            sortDefinition = sort.ToLower() switch
            {
                "code" => isDescending ? Builders<SkillType>.Sort.Descending(st => st.Code) : Builders<SkillType>.Sort.Ascending(st => st.Code),
                "label" => isDescending ? Builders<SkillType>.Sort.Descending(st => st.Label.ToLower()) : Builders<SkillType>.Sort.Ascending(st => st.Label.ToLower()),
                _ => Builders<SkillType>.Sort.Ascending(st => st.Label.ToLower())
            };
        }
        else
        {
            // Default sort: by label asc
            sortDefinition = Builders<SkillType>.Sort.Ascending(st => st.Label.ToLower());
        }

        var skillTypes = await _skillTypes.Find(_ => true).Sort(sortDefinition).ToListAsync();
        return skillTypes.Select(MapToDto);
    }

    public async Task<SkillTypeDto?> GetByIdAsync(string id)
    {
        var skillType = await _skillTypes.Find(st => st.Id == id).FirstOrDefaultAsync();
        return skillType != null ? MapToDto(skillType) : null;
    }

    public async Task<SkillTypeDto?> GetByCodeAsync(string code)
    {
        var skillType = await _skillTypes.Find(st => st.Code == code.ToUpper()).FirstOrDefaultAsync();
        return skillType != null ? MapToDto(skillType) : null;
    }

    public async Task<SkillTypeDto> CreateAsync(CreateSkillTypeDto createDto)
    {
        var skillType = new SkillType
        {
            Code = createDto.Code?.ToUpper(),
            Label = createDto.Label,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _skillTypes.InsertOneAsync(skillType);
        return MapToDto(skillType);
    }

    public async Task<SkillTypeDto?> UpdateAsync(string id, UpdateSkillTypeDto updateDto)
    {
        var updateBuilder = Builders<SkillType>.Update;
        var updates = new List<UpdateDefinition<SkillType>>();

        if (updateDto.Code != null) updates.Add(updateBuilder.Set(st => st.Code, updateDto.Code.ToUpper()));
        if (updateDto.Label != null) updates.Add(updateBuilder.Set(st => st.Label, updateDto.Label));

        updates.Add(updateBuilder.Set(st => st.UpdatedAt, DateTime.UtcNow));

        var result = await _skillTypes.UpdateOneAsync(st => st.Id == id, updateBuilder.Combine(updates));
        
        if (result.ModifiedCount > 0)
        {
            var updatedSkillType = await _skillTypes.Find(st => st.Id == id).FirstOrDefaultAsync();
            return updatedSkillType != null ? MapToDto(updatedSkillType) : null;
        }

        return null;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _skillTypes.DeleteOneAsync(st => st.Id == id);
        return result.DeletedCount > 0;
    }

    private static SkillTypeDto MapToDto(SkillType skillType)
    {
        return new SkillTypeDto
        {
            Id = skillType.Id,
            Code = skillType.Code,
            Label = skillType.Label,
            CreatedAt = skillType.CreatedAt,
            UpdatedAt = skillType.UpdatedAt
        };
    }
}
