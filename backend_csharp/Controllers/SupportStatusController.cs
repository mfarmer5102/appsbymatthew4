using Microsoft.AspNetCore.Mvc;
using PortfolioBackend.DTOs;
using PortfolioBackend.Services;

namespace PortfolioBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SupportStatusController : ControllerBase
{
    private readonly ISupportStatusService _supportStatusService;

    public SupportStatusController(ISupportStatusService supportStatusService)
    {
        _supportStatusService = supportStatusService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SupportStatusDto>>> GetSupportStatuses(
        [FromQuery] string? sort = null,
        [FromQuery] string? order = null)
    {
        try
        {
            var supportStatuses = await _supportStatusService.GetAllAsync(sort, order);
            return Ok(new { data = supportStatuses });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SupportStatusDto>> GetSupportStatus(string id)
    {
        try
        {
            var supportStatus = await _supportStatusService.GetByIdAsync(id);
            if (supportStatus == null)
            {
                return NotFound(new { error = "Support status not found" });
            }

            return Ok(supportStatus);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<SupportStatusDto>> GetSupportStatusByCode(string code)
    {
        try
        {
            var supportStatus = await _supportStatusService.GetByCodeAsync(code);
            if (supportStatus == null)
            {
                return NotFound(new { error = "Support status not found" });
            }

            return Ok(supportStatus);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<SupportStatusDto>> CreateSupportStatus([FromBody] CreateSupportStatusDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var supportStatus = await _supportStatusService.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetSupportStatus), new { id = supportStatus.Id }, supportStatus);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SupportStatusDto>> UpdateSupportStatus(string id, [FromBody] UpdateSupportStatusDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var supportStatus = await _supportStatusService.UpdateAsync(id, updateDto);
            if (supportStatus == null)
            {
                return NotFound(new { error = "Support status not found" });
            }

            return Ok(supportStatus);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSupportStatus(string id)
    {
        try
        {
            var result = await _supportStatusService.DeleteAsync(id);
            if (!result)
            {
                return NotFound(new { error = "Support status not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }
}
