# Stop processes on given ports
$ports = @(8080, 3000, 3003, 3004, 3005)
foreach ($port in $ports) {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  if ($conn) {
    $conn | ForEach-Object {
      $procId = $_.OwningProcess
      Write-Host "Stopping process $procId on port $port"
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
  }
}
Write-Host "Done stopping ports."
