$path = "c:\Users\oumei\PFE\WorkflowDynamique\front\app\Workflows\_components\NodeDetailsPanel.tsx"
$content = Get-Content $path
$content[647] = "                                )}"
$content | Set-Content $path
