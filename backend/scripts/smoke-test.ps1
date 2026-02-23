param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd("/")

$paths = @(
  "/api/health",
  "/api/products",
  "/api/reviews",
  "/api/partners",
  "/api/hero-banners"
)

foreach ($path in $paths) {
  $url = "$base$path"
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    Write-Output "OK  $path -> $($resp.StatusCode)"
  } catch {
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      Write-Output "FAIL $path -> $code"
    } else {
      Write-Output "FAIL $path -> $($_.Exception.Message)"
    }
  }
}
