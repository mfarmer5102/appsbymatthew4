using MongoDB.Driver;
using PortfolioBackend.DTOs;
using PortfolioBackend.Models;

namespace PortfolioBackend.Services;

public class SkillService : ISkillService
{
    private readonly IMongoCollection<Skill> _skills;

    public SkillService(IMongoDatabase database)
    {
        _skills = database.GetCollection<Skill>("skills");
    }

    public async Task<IEnumerable<SkillDto>> GetAllAsync(string? filter = null, string? sort = null, string? order = null, int page = 1, int limit = 20, string? search = null)
    {
        var filterBuilder = Builders<Skill>.Filter;
        var filters = new List<FilterDefinition<Skill>>();

        // Apply search filter
        if (!string.IsNullOrEmpty(search))
        {
            var searchFilter = filterBuilder.Or(
                filterBuilder.Regex(s => s.Name, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                filterBuilder.Regex(s => s.Code, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
            filters.Add(searchFilter);
        }

        // Apply skill type filter
        if (!string.IsNullOrEmpty(filter) && filter != "all")
        {
            filters.Add(filterBuilder.Eq(s => s.SkillTypeCode, filter.ToUpper()));
        }

        var combinedFilter = filters.Count > 0 ? filterBuilder.And(filters) : FilterDefinition<Skill>.Empty;

        // Build sort definition
        SortDefinition<Skill> sortDefinition;
        if (!string.IsNullOrEmpty(sort))
        {
            var isDescending = order?.ToLower() == "desc";
            sortDefinition = sort.ToLower() switch
            {
                "name" => isDescending ? Builders<Skill>.Sort.Descending(s => s.Name) : Builders<Skill>.Sort.Ascending(s => s.Name),
                "code" => isDescending ? Builders<Skill>.Sort.Descending(s => s.Code) : Builders<Skill>.Sort.Ascending(s => s.Code),
                "skill_type_code" => isDescending ? Builders<Skill>.Sort.Descending(s => s.SkillTypeCode) : Builders<Skill>.Sort.Ascending(s => s.SkillTypeCode),
                "is_proficient" => isDescending ? Builders<Skill>.Sort.Descending(s => s.IsProficient) : Builders<Skill>.Sort.Ascending(s => s.IsProficient),
                _ => Builders<Skill>.Sort.Ascending(s => s.Name)
            };
        }
        else
        {
            sortDefinition = Builders<Skill>.Sort.Ascending(s => s.Name);
        }

        var skip = (page - 1) * limit;
        var skills = await _skills
            .Find(combinedFilter)
            .Sort(sortDefinition)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();

        return skills.Select(MapToDto);
    }

    public async Task<SkillDto?> GetByIdAsync(string id)
    {
        var skill = await _skills.Find(s => s.Id == id).FirstOrDefaultAsync();
        return skill != null ? MapToDto(skill) : null;
    }

    public async Task<SkillDto?> GetByCodeAsync(string code)
    {
        var skill = await _skills.Find(s => s.Code == code.ToUpper()).FirstOrDefaultAsync();
        return skill != null ? MapToDto(skill) : null;
    }

    public async Task<SkillDto> CreateAsync(CreateSkillDto createDto)
    {
        var skill = new Skill
        {
            IsProficient = createDto.IsProficient,
            Name = createDto.Name,
            SkillTypeCode = createDto.SkillTypeCode?.ToUpper(),
            Code = createDto.Code?.ToUpper(),
            IsVisibleInAppDetails = createDto.IsVisibleInAppDetails,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _skills.InsertOneAsync(skill);
        return MapToDto(skill);
    }

    public async Task<SkillDto?> UpdateAsync(string id, UpdateSkillDto updateDto)
    {
        var updateBuilder = Builders<Skill>.Update;
        var updates = new List<UpdateDefinition<Skill>>();

        if (updateDto.IsProficient.HasValue) updates.Add(updateBuilder.Set(s => s.IsProficient, updateDto.IsProficient));
        if (updateDto.Name != null) updates.Add(updateBuilder.Set(s => s.Name, updateDto.Name));
        if (updateDto.SkillTypeCode != null) updates.Add(updateBuilder.Set(s => s.SkillTypeCode, updateDto.SkillTypeCode.ToUpper()));
        if (updateDto.Code != null) updates.Add(updateBuilder.Set(s => s.Code, updateDto.Code.ToUpper()));
        if (updateDto.IsVisibleInAppDetails.HasValue) updates.Add(updateBuilder.Set(s => s.IsVisibleInAppDetails, updateDto.IsVisibleInAppDetails));

        updates.Add(updateBuilder.Set(s => s.UpdatedAt, DateTime.UtcNow));

        var result = await _skills.UpdateOneAsync(s => s.Id == id, updateBuilder.Combine(updates));
        
        if (result.ModifiedCount > 0)
        {
            var updatedSkill = await _skills.Find(s => s.Id == id).FirstOrDefaultAsync();
            return updatedSkill != null ? MapToDto(updatedSkill) : null;
        }

        return null;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _skills.DeleteOneAsync(s => s.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<int> GetTotalCountAsync(string? filter = null, string? search = null)
    {
        var filterBuilder = Builders<Skill>.Filter;
        var filters = new List<FilterDefinition<Skill>>();

        if (!string.IsNullOrEmpty(search))
        {
            var searchFilter = filterBuilder.Or(
                filterBuilder.Regex(s => s.Name, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                filterBuilder.Regex(s => s.Code, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
            filters.Add(searchFilter);
        }

        if (!string.IsNullOrEmpty(filter) && filter != "all")
        {
            filters.Add(filterBuilder.Eq(s => s.SkillTypeCode, filter.ToUpper()));
        }

        var combinedFilter = filters.Count > 0 ? filterBuilder.And(filters) : FilterDefinition<Skill>.Empty;
        return (int)await _skills.CountDocumentsAsync(combinedFilter);
    }

    private static SkillDto MapToDto(Skill skill)
    {
        return new SkillDto
        {
            Id = skill.Id,
            IsProficient = skill.IsProficient,
            Name = skill.Name,
            SkillTypeCode = skill.SkillTypeCode,
            Code = skill.Code,
            IsVisibleInAppDetails = skill.IsVisibleInAppDetails,
            CreatedAt = skill.CreatedAt,
            UpdatedAt = skill.UpdatedAt
        };
    }
}
