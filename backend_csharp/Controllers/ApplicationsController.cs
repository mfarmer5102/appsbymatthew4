using Microsoft.AspNetCore.Mvc;
using PortfolioBackend.DTOs;
using PortfolioBackend.Services;

namespace PortfolioBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationService _applicationService;

    public ApplicationsController(IApplicationService applicationService)
    {
        _applicationService = applicationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApplicationDto>>> GetApplications(
        [FromQuery] string? filter = null,
        [FromQuery] string? sort = null,
        [FromQuery] string? order = null,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] int? offset = null,
        [FromQuery] string? search = null)
    {
        try
        {
            // Convert offset to page if provided
            if (offset.HasValue)
            {
                page = (offset.Value / limit) + 1;
            }
            
            var applications = await _applicationService.GetAllAsync(filter, sort, order, page, limit, search);
            var totalCount = await _applicationService.GetTotalCountAsync(filter, search);

            Response.Headers.Add("X-Total-Count", totalCount.ToString());
            Response.Headers.Add("X-Page", page.ToString());
            Response.Headers.Add("X-Limit", limit.ToString());

            return Ok(new { 
                data = applications,
                pagination = new {
                    total = totalCount,
                    limit = limit,
                    offset = (page - 1) * limit,
                    hasMore = (page * limit) < totalCount
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApplicationDto>> GetApplication(string id)
    {
        try
        {
            var application = await _applicationService.GetByIdAsync(id);
            if (application == null)
            {
                return NotFound(new { error = "Application not found" });
            }

            return Ok(application);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApplicationDto>> CreateApplication([FromBody] CreateApplicationDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var application = await _applicationService.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetApplication), new { id = application.Id }, application);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApplicationDto>> UpdateApplication(string id, [FromBody] UpdateApplicationDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var application = await _applicationService.UpdateAsync(id, updateDto);
            if (application == null)
            {
                return NotFound(new { error = "Application not found" });
            }

            return Ok(application);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteApplication(string id)
    {
        try
        {
            var result = await _applicationService.DeleteAsync(id);
            if (!result)
            {
                return NotFound(new { error = "Application not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPatch("{id}/soft-delete")]
    public async Task<ActionResult> SoftDeleteApplication(string id)
    {
        try
        {
            var result = await _applicationService.SoftDeleteAsync(id);
            if (!result)
            {
                return NotFound(new { error = "Application not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}
