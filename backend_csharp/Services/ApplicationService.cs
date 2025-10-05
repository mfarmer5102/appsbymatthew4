using MongoDB.Driver;
using PortfolioBackend.DTOs;
using PortfolioBackend.Models;

namespace PortfolioBackend.Services;

public class ApplicationService : IApplicationService
{
    private readonly IMongoCollection<Application> _applications;

    public ApplicationService(IMongoDatabase database)
    {
        _applications = database.GetCollection<Application>("applications");
    }

    public async Task<IEnumerable<ApplicationDto>> GetAllAsync(string? filter = null, string? sort = null, string? order = null, int page = 1, int limit = 20, string? search = null)
    {
        var filterBuilder = Builders<Application>.Filter;
        var filters = new List<FilterDefinition<Application>>();

        // Exclude soft-deleted applications
        filters.Add(filterBuilder.Eq(a => a.DeletedDate, null));

        // Apply search filter
        if (!string.IsNullOrEmpty(search))
        {
            var searchFilter = filterBuilder.Or(
                filterBuilder.Regex(a => a.Title, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                filterBuilder.Regex(a => a.Description, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
            filters.Add(searchFilter);
        }

        // Apply support status filter
        if (!string.IsNullOrEmpty(filter) && filter != "all")
        {
            filters.Add(filterBuilder.Eq(a => a.SupportStatusCode, filter));
        }

        var combinedFilter = filters.Count > 0 ? filterBuilder.And(filters) : FilterDefinition<Application>.Empty;

        // Build sort definition
        SortDefinition<Application> sortDefinition;
        if (!string.IsNullOrEmpty(sort))
        {
            var isDescending = order?.ToLower() == "desc";
            sortDefinition = sort.ToLower() switch
            {
                "title" => isDescending ? Builders<Application>.Sort.Descending(a => a.Title) : Builders<Application>.Sort.Ascending(a => a.Title),
                "publish_date" => isDescending ? Builders<Application>.Sort.Descending(a => a.PublishDate) : Builders<Application>.Sort.Ascending(a => a.PublishDate),
                "created_at" => isDescending ? Builders<Application>.Sort.Descending(a => a.CreatedAt) : Builders<Application>.Sort.Ascending(a => a.CreatedAt),
                _ => Builders<Application>.Sort.Ascending(a => a.Title)
            };
        }
        else
        {
            sortDefinition = Builders<Application>.Sort.Ascending(a => a.Title);
        }

        var skip = (page - 1) * limit;
        var applications = await _applications
            .Find(combinedFilter)
            .Sort(sortDefinition)
            .Skip(skip)
            .Limit(limit)
            .ToListAsync();

        return applications.Select(MapToDto);
    }

    public async Task<ApplicationDto?> GetByIdAsync(string id)
    {
        var application = await _applications.Find(a => a.Id == id).FirstOrDefaultAsync();
        return application != null ? MapToDto(application) : null;
    }

    public async Task<ApplicationDto> CreateAsync(CreateApplicationDto createDto)
    {
        var application = new Application
        {
            Title = createDto.Title,
            PublishDate = createDto.PublishDate,
            IsFeatured = createDto.IsFeatured,
            Description = createDto.Description,
            DeployedLink = createDto.DeployedLink,
            Repositories = createDto.Repositories,
            SupportStatusCode = createDto.SupportStatusCode,
            AssociatedSkillCodes = createDto.AssociatedSkillCodes,
            Embeddings = createDto.Embeddings,
            ImageUrlRelative = createDto.ImageUrlRelative,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _applications.InsertOneAsync(application);
        return MapToDto(application);
    }

    public async Task<ApplicationDto?> UpdateAsync(string id, UpdateApplicationDto updateDto)
    {
        var updateBuilder = Builders<Application>.Update;
        var updates = new List<UpdateDefinition<Application>>();

        if (updateDto.Title != null) updates.Add(updateBuilder.Set(a => a.Title, updateDto.Title));
        if (updateDto.PublishDate.HasValue) updates.Add(updateBuilder.Set(a => a.PublishDate, updateDto.PublishDate));
        if (updateDto.IsFeatured.HasValue) updates.Add(updateBuilder.Set(a => a.IsFeatured, updateDto.IsFeatured));
        if (updateDto.Description != null) updates.Add(updateBuilder.Set(a => a.Description, updateDto.Description));
        if (updateDto.DeployedLink != null) updates.Add(updateBuilder.Set(a => a.DeployedLink, updateDto.DeployedLink));
        if (updateDto.Repositories != null) updates.Add(updateBuilder.Set(a => a.Repositories, updateDto.Repositories));
        if (updateDto.SupportStatusCode != null) updates.Add(updateBuilder.Set(a => a.SupportStatusCode, updateDto.SupportStatusCode));
        if (updateDto.AssociatedSkillCodes != null) updates.Add(updateBuilder.Set(a => a.AssociatedSkillCodes, updateDto.AssociatedSkillCodes));
        if (updateDto.Embeddings != null) updates.Add(updateBuilder.Set(a => a.Embeddings, updateDto.Embeddings));
        if (updateDto.ImageUrlRelative != null) updates.Add(updateBuilder.Set(a => a.ImageUrlRelative, updateDto.ImageUrlRelative));
        if (updateDto.DeletedDate.HasValue) updates.Add(updateBuilder.Set(a => a.DeletedDate, updateDto.DeletedDate));

        updates.Add(updateBuilder.Set(a => a.UpdatedAt, DateTime.UtcNow));

        var result = await _applications.UpdateOneAsync(a => a.Id == id, updateBuilder.Combine(updates));
        
        if (result.ModifiedCount > 0)
        {
            var updatedApplication = await _applications.Find(a => a.Id == id).FirstOrDefaultAsync();
            return updatedApplication != null ? MapToDto(updatedApplication) : null;
        }

        return null;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _applications.DeleteOneAsync(a => a.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<bool> SoftDeleteAsync(string id)
    {
        var result = await _applications.UpdateOneAsync(
            a => a.Id == id,
            Builders<Application>.Update
                .Set(a => a.DeletedDate, DateTime.UtcNow)
                .Set(a => a.UpdatedAt, DateTime.UtcNow)
        );
        return result.ModifiedCount > 0;
    }

    public async Task<int> GetTotalCountAsync(string? filter = null, string? search = null)
    {
        var filterBuilder = Builders<Application>.Filter;
        var filters = new List<FilterDefinition<Application>>();

        filters.Add(filterBuilder.Eq(a => a.DeletedDate, null));

        if (!string.IsNullOrEmpty(search))
        {
            var searchFilter = filterBuilder.Or(
                filterBuilder.Regex(a => a.Title, new MongoDB.Bson.BsonRegularExpression(search, "i")),
                filterBuilder.Regex(a => a.Description, new MongoDB.Bson.BsonRegularExpression(search, "i"))
            );
            filters.Add(searchFilter);
        }

        if (!string.IsNullOrEmpty(filter) && filter != "all")
        {
            filters.Add(filterBuilder.Eq(a => a.SupportStatusCode, filter));
        }

        var combinedFilter = filters.Count > 0 ? filterBuilder.And(filters) : FilterDefinition<Application>.Empty;
        return (int)await _applications.CountDocumentsAsync(combinedFilter);
    }

    private static ApplicationDto MapToDto(Application application)
    {
        return new ApplicationDto
        {
            Id = application.Id,
            Title = application.Title,
            PublishDate = application.PublishDate,
            IsFeatured = application.IsFeatured,
            Description = application.Description,
            DeployedLink = application.DeployedLink,
            Repositories = application.Repositories,
            SupportStatusCode = application.SupportStatusCode,
            AssociatedSkillCodes = application.AssociatedSkillCodes,
            Embeddings = application.Embeddings,
            ImageUrlRelative = application.ImageUrlRelative,
            DeletedDate = application.DeletedDate,
            CreatedAt = application.CreatedAt,
            UpdatedAt = application.UpdatedAt
        };
    }
}
