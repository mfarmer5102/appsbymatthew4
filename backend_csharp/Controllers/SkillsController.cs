using Microsoft.AspNetCore.Mvc;
using PortfolioBackend.DTOs;
using PortfolioBackend.Services;

namespace PortfolioBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SkillsController : ControllerBase
{
    private readonly ISkillService _skillService;

    public SkillsController(ISkillService skillService)
    {
        _skillService = skillService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SkillDto>>> GetSkills(
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
            
            var skills = await _skillService.GetAllAsync(filter, sort, order, page, limit, search);
            var totalCount = await _skillService.GetTotalCountAsync(filter, search);

            Response.Headers.Add("X-Total-Count", totalCount.ToString());
            Response.Headers.Add("X-Page", page.ToString());
            Response.Headers.Add("X-Limit", limit.ToString());

            return Ok(new { 
                data = skills,
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
    public async Task<ActionResult<SkillDto>> GetSkill(string id)
    {
        try
        {
            var skill = await _skillService.GetByIdAsync(id);
            if (skill == null)
            {
                return NotFound(new { error = "Skill not found" });
            }

            return Ok(skill);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<SkillDto>> GetSkillByCode(string code)
    {
        try
        {
            var skill = await _skillService.GetByCodeAsync(code);
            if (skill == null)
            {
                return NotFound(new { error = "Skill not found" });
            }

            return Ok(skill);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<SkillDto>> CreateSkill([FromBody] CreateSkillDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var skill = await _skillService.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetSkill), new { id = skill.Id }, skill);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SkillDto>> UpdateSkill(string id, [FromBody] UpdateSkillDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var skill = await _skillService.UpdateAsync(id, updateDto);
            if (skill == null)
            {
                return NotFound(new { error = "Skill not found" });
            }

            return Ok(skill);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSkill(string id)
    {
        try
        {
            var result = await _skillService.DeleteAsync(id);
            if (!result)
            {
                return NotFound(new { error = "Skill not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}
