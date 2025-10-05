using Microsoft.AspNetCore.Mvc;
using PortfolioBackend.DTOs;
using PortfolioBackend.Services;

namespace PortfolioBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SkillTypesController : ControllerBase
{
    private readonly ISkillTypeService _skillTypeService;

    public SkillTypesController(ISkillTypeService skillTypeService)
    {
        _skillTypeService = skillTypeService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SkillTypeDto>>> GetSkillTypes(
        [FromQuery] string? sort = null,
        [FromQuery] string? order = null)
    {
        try
        {
            var skillTypes = await _skillTypeService.GetAllAsync(sort, order);
            return Ok(new { data = skillTypes });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SkillTypeDto>> GetSkillType(string id)
    {
        try
        {
            var skillType = await _skillTypeService.GetByIdAsync(id);
            if (skillType == null)
            {
                return NotFound(new { error = "Skill type not found" });
            }

            return Ok(skillType);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<SkillTypeDto>> GetSkillTypeByCode(string code)
    {
        try
        {
            var skillType = await _skillTypeService.GetByCodeAsync(code);
            if (skillType == null)
            {
                return NotFound(new { error = "Skill type not found" });
            }

            return Ok(skillType);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<SkillTypeDto>> CreateSkillType([FromBody] CreateSkillTypeDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var skillType = await _skillTypeService.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetSkillType), new { id = skillType.Id }, skillType);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SkillTypeDto>> UpdateSkillType(string id, [FromBody] UpdateSkillTypeDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var skillType = await _skillTypeService.UpdateAsync(id, updateDto);
            if (skillType == null)
            {
                return NotFound(new { error = "Skill type not found" });
            }

            return Ok(skillType);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSkillType(string id)
    {
        try
        {
            var result = await _skillTypeService.DeleteAsync(id);
            if (!result)
            {
                return NotFound(new { error = "Skill type not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}
