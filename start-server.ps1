$port = 8080
$dir = "D:\Desktop\habit-tracker"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║       习惯追踪 - 本地服务器         ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get local IP
$ips = Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -ne "127.0.0.1" }
if ($ips) {
    Write-Host "  📱 手机浏览器打开:" -ForegroundColor Yellow
    foreach ($ip in $ips) {
        Write-Host "     http://$($ip.IPAddress):$port" -ForegroundColor White
    }
    Write-Host ""
} else {
    Write-Host "  📱 请确保电脑和手机连接同一个 WiFi" -ForegroundColor Yellow
    Write-Host "  然后查看电脑IP后访问: http://IP:$port" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "  💻 电脑浏览器打开:" -ForegroundColor Green
Write-Host "     http://localhost:$port" -ForegroundColor White
Write-Host ""
Write-Host "  按 Ctrl+C 停止服务器" -ForegroundColor DarkGray
Write-Host "  ═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location $dir
python -m http.server $port
