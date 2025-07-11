# PowerShell script to test AI Chat System
# Usage: .\test-ai-chat.ps1

# Configuration - Replace with your actual values
$SUPABASE_URL = "https://your-project.supabase.co"
$ANON_KEY = "your-anon-key"

function Test-AIChat {
    param(
        [string]$Message,
        [string]$ConversationId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    )
    
    Write-Host "`n🧪 Testing: `"$Message`"" -ForegroundColor Cyan
    Write-Host ("-" * 50)
    
    $body = @{
        message = $Message
        conversationId = $ConversationId
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/functions/v1/ai-chat" `
            -Method Post `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $ANON_KEY"
            } `
            -Body $body
        
        Write-Host "✅ Response received:" -ForegroundColor Green
        Write-Host "Type: $($response.type)"
        Write-Host "Content: $($response.content)"
        if ($response.functionUsed) { Write-Host "Function Used: $($response.functionUsed)" }
        if ($response.confidence) { Write-Host "Confidence: $($response.confidence)%" }
        if ($response.reasoning) { Write-Host "Reasoning: $($response.reasoning)" }
        
        return $response
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test queries
$testQueries = @(
    "What are our top selling products?",
    "Show me recent transactions",
    "What products are out of stock?",
    "Hello, how are you?",
    "What is our total sales this month?",
    "List all companies from USA"
)

Write-Host "🚀 Starting AI Chat System Tests..." -ForegroundColor Yellow
Write-Host "Configuration:"
Write-Host "URL: $SUPABASE_URL"
Write-Host "Key: $($ANON_KEY.Substring(0, 20))..."

foreach ($query in $testQueries) {
    Test-AIChat -Message $query
    Start-Sleep -Seconds 1
}

Write-Host "`n🎉 All tests completed!" -ForegroundColor Green
