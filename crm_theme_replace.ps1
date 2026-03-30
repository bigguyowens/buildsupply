# Targeted CRM color → CSS variable replacements
# Only touches inline style properties, not dark-intentional backgrounds

$crmFiles = Get-ChildItem -Path "C:\NextJS_Ecomm\src\app\crm" -Recurse -Filter "*.tsx"
$crmComponents = Get-ChildItem -Path "C:\NextJS_Ecomm\src\components" -Filter "crm-*.tsx"
$allFiles = @($crmFiles) + @($crmComponents)

# [property]: "[color]" → [property]: "var(--crm-[var])"
# Ordered carefully — more specific first
$replacements = @(
  # ── Backgrounds (surface only — NOT #0d0d0d headers or status badges) ──
  @{ From = 'background: "#ffffff"';    To = 'background: "var(--crm-surface)"'  },
  @{ From = "background: '#ffffff'";    To = "background: 'var(--crm-surface)'"  },
  @{ From = 'background: "#fff"';       To = 'background: "var(--crm-surface)"'  },
  @{ From = "background: '#fff'";       To = "background: 'var(--crm-surface)'"  },
  @{ From = 'background: "#fafafa"';    To = 'background: "var(--crm-surface2)"' },
  @{ From = 'background: "#f9f9f9"';    To = 'background: "var(--crm-surface2)"' },
  @{ From = 'background: "#f5f5f5"';    To = 'background: "var(--crm-surface2)"' },
  @{ From = 'background: "#f2f2f2"';    To = 'background: "var(--crm-bg)"'       },
  # Ternary row striping
  @{ From = '? "#fff" : "#fafafa"';     To = '? "var(--crm-surface)" : "var(--crm-surface2)"' },
  @{ From = '? "#fafafa" : "#fff"';     To = '? "var(--crm-surface2)" : "var(--crm-surface)"' },
  @{ From = '? "#fff" : "#f9f9f9"';     To = '? "var(--crm-surface)" : "var(--crm-surface2)"' },

  # ── Text colors ──
  @{ From = 'color: "#0d0d0d"';         To = 'color: "var(--crm-text)"'   },
  @{ From = 'color: "#374151"';         To = 'color: "var(--crm-text2)"'  },
  @{ From = 'color: "#6b7280"';         To = 'color: "var(--crm-muted)"'  },
  @{ From = 'color: "#9ca3af"';         To = 'color: "var(--crm-muted2)"' },
  @{ From = 'color: "#6b6b6b"';         To = 'color: "var(--crm-muted)"'  },

  # ── Borders ──
  @{ From = '"1px solid #e5e5e5"';      To = '"1px solid var(--crm-border)"'  },
  @{ From = '"1px solid #f1f1f1"';      To = '"1px solid var(--crm-border2)"' },
  @{ From = '"1px solid #f5f5f5"';      To = '"1px solid var(--crm-border2)"' },
  @{ From = '"1px solid #f9f9f9"';      To = '"1px solid var(--crm-border2)"' },
  @{ From = '"2px solid #e5e5e5"';      To = '"2px solid var(--crm-border)"'  },
  @{ From = 'borderColor: "#e5e5e5"';   To = 'borderColor: "var(--crm-border)"' },
  @{ From = 'borderBottom: "1px solid #e5e5e5"'; To = 'borderBottom: "1px solid var(--crm-border)"' },
  @{ From = 'borderTop: "1px solid #e5e5e5"';    To = 'borderTop: "1px solid var(--crm-border)"' },
  @{ From = 'borderBottom: "1px solid #f1f1f1"'; To = 'borderBottom: "1px solid var(--crm-border2)"' },
  @{ From = 'borderBottom: "1px solid #f5f5f5"'; To = 'borderBottom: "1px solid var(--crm-border2)"' },
  @{ From = 'borderBottom: "1px solid #f9f9f9"'; To = 'borderBottom: "1px solid var(--crm-border2)"' }
)

$totalChanges = 0
foreach ($file in $allFiles) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content
  foreach ($r in $replacements) {
    $content = $content.Replace($r.From, $r.To)
  }
  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    $changes = ($replacements | ForEach-Object {
      $cnt = ([regex]::Matches($original, [regex]::Escape($r.From))).Count
      $cnt
    } | Measure-Object -Sum).Sum
    Write-Host ("OK " + $file.Name)
    $totalChanges++
  }
}
Write-Host ("Done. Updated " + $totalChanges + " files")
