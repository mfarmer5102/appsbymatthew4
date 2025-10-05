using MongoDB.Driver;
using MongoDB.Driver.Core.Configuration;
using PortfolioBackend.Models;
using PortfolioBackend.Services;
using PortfolioBackend.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// MongoDB configuration - use same environment variable as Node.js backend
var connectionString = Environment.GetEnvironmentVariable("MONGO_INSTANCE_URL") ?? 
                      builder.Configuration.GetConnectionString("MongoDB") ?? 
                      "mongodb://localhost:27017";
var databaseName = builder.Configuration["MongoDB:DatabaseName"] ?? "apps_by_matthew";

builder.Services.AddSingleton<IMongoClient>(sp => 
{
    var settings = MongoClientSettings.FromConnectionString(connectionString);
    settings.ServerApi = new ServerApi(ServerApiVersion.V1);
    return new MongoClient(settings);
});
builder.Services.AddScoped<IMongoDatabase>(sp => 
{
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(databaseName);
});

// Register services
builder.Services.AddScoped<IApplicationService, ApplicationService>();
builder.Services.AddScoped<ISkillService, SkillService>();
builder.Services.AddScoped<ISkillTypeService, SkillTypeService>();
builder.Services.AddScoped<ISupportStatusService, SupportStatusService>();
builder.Services.AddScoped<ITrafficService, TrafficService>();

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",  // Vite dev server
                "http://localhost:5174",  // C# frontend dev server
                "http://localhost:3000",  // Alternative dev port
                "https://localhost:5173", // HTTPS dev server
                "https://localhost:5174", // HTTPS C# frontend dev server
                "http://localhost:5002",  // C# backend port
                "https://www.appsbymatthew.com"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Rate limiting disabled for now

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

// Custom middleware
app.UseMiddleware<TrafficTrackerMiddleware>();

// Note: No authentication configured, so no UseAuthorization() needed
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

try
{
    Log.Information("Starting Portfolio Backend API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
