$ErrorActionPreference = 'Stop'

$outDir = Join-Path $PSScriptRoot '..\..\output\pdf'
$outDir = [System.IO.Path]::GetFullPath($outDir)
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$pdfPath = Join-Path $outDir 'CakeJDR-app-summary.pdf'

function Escape-PdfText {
  param([string]$Text)
  return $Text.Replace('\', '\\').Replace('(', '\(').Replace(')', '\)')
}

$lines = @(
  @{ Font = 'F2'; Size = 22; X = 42; Y = 800; Text = 'CakeJDR' }
  @{ Font = 'F1'; Size = 10; X = 42; Y = 784; Text = 'One-page app summary generated from repo evidence only' }

  @{ Font = 'F2'; Size = 13; X = 42; Y = 754; Text = 'What It Is' }
  @{ Font = 'F1'; Size = 10.5; X = 42; Y = 738; Text = 'CakeJDR is a Next.js app for playing tabletop RPGs online with shared rooms, real-time collaboration,' }
  @{ Font = 'F1'; Size = 10.5; X = 42; Y = 724; Text = 'character sheets, chat, and dice tools. README notes online features are still incomplete and local run only.' }

  @{ Font = 'F2'; Size = 13; X = 42; Y = 696; Text = 'Who It''s For' }
  @{ Font = 'F1'; Size = 10.5; X = 42; Y = 680; Text = 'Primary users are tabletop RPG groups: players and a game master sharing rooms, sheets, chat, dice, and a board.' }

  @{ Font = 'F2'; Size = 13; X = 42; Y = 652; Text = 'What It Does' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 636; Text = '- Lets users log in locally with a saved profile and room selection stored in browser storage.' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 622; Text = '- Creates, lists, joins, renames, and deletes rooms, including password-protected rooms.' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 608; Text = '- Provides a collaborative canvas with drawing, erasing, live cursors, and image upload/placement.' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 594; Text = '- Supports real-time chat, dice rolling, dice history, and live participant/avatar presence.' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 580; Text = '- Manages character sheets with stats, equipment, description tabs, leveling, and GM selection.' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 566; Text = '- Imports/exports character sheets locally or from cloud storage; README says Blob storage is menu-page only.' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 552; Text = '- Includes music playback/queue, side notes, and session-summary structures in room state.' }

  @{ Font = 'F2'; Size = 13; X = 42; Y = 522; Text = 'How It Works' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 506; Text = '- UI: Next.js App Router routes users from / to /menu, then into /menu-accueil, /rooms, and /room/[id].' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 492; Text = '- Real-time room shell: app/Room.tsx wraps each room in LiveblocksProvider and RoomProvider with storage for' }
  @{ Font = 'F1'; Size = 10.5; X = 66; Y = 478; Text = 'characters, images, strokes, music, summary, quick notes, editor data, events, and rooms.' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 464; Text = '- Services: /api/liveblocks-auth authorizes room access; /api/rooms and lib/liveRooms manage room records;' }
  @{ Font = 'F1'; Size = 10.5; X = 66; Y = 450; Text = '/api/roomstorage persists character data in Liveblocks storage; /api/cloudinary uploads canvas images;' }
  @{ Font = 'F1'; Size = 10.5; X = 66; Y = 436; Text = '/api/blob uploads/lists/deletes character-sheet files in Vercel Blob.' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 422; Text = '- Data flow: browser localStorage keeps profile, theme, and current selections; Liveblocks syncs room state;' }
  @{ Font = 'F1'; Size = 10.5; X = 66; Y = 408; Text = 'Cloudinary stores image assets; Vercel Blob stores character-sheet files. Database: Not found in repo.' }

  @{ Font = 'F2'; Size = 13; X = 42; Y = 378; Text = 'How To Run' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 362; Text = '- Install dependencies: npm install' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 348; Text = '- Copy .env.example to .env.local and set CLOUDINARY_*, LIVEBLOCKS_SECRET_KEY, BLOB_READ_WRITE_TOKEN,' }
  @{ Font = 'F1'; Size = 10.5; X = 66; Y = 334; Text = 'and VERCEL_OIDC_TOKEN.' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 320; Text = '- Start the dev server: npm run dev' }
  @{ Font = 'F1'; Size = 10.5; X = 52; Y = 306; Text = '- Open http://localhost:3000' }

  @{ Font = 'F1'; Size = 9; X = 42; Y = 54; Text = 'Repo evidence used: README.md, package.json, app/Room.tsx, app/room/[id]/page.tsx, HomePageInner.tsx,' }
  @{ Font = 'F1'; Size = 9; X = 42; Y = 42; Text = 'InteractiveCanvas.tsx, CharacterSheet.tsx, lib/liveRooms.ts, and app/api routes.' }
)

$contentBuilder = New-Object System.Text.StringBuilder
[void]$contentBuilder.AppendLine("0.2 w")
[void]$contentBuilder.AppendLine("42 770 m 553 770 l S")

foreach ($line in $lines) {
  $text = Escape-PdfText $line.Text
  [void]$contentBuilder.AppendLine("BT")
  [void]$contentBuilder.AppendLine("/$($line.Font) $($line.Size) Tf")
  [void]$contentBuilder.AppendLine("1 0 0 1 $($line.X) $($line.Y) Tm")
  [void]$contentBuilder.AppendLine("($text) Tj")
  [void]$contentBuilder.AppendLine("ET")
}

$content = $contentBuilder.ToString()
$contentBytes = [System.Text.Encoding]::ASCII.GetBytes($content)

$objects = New-Object System.Collections.Generic.List[string]
$objects.Add("<< /Type /Catalog /Pages 2 0 R >>")
$objects.Add("<< /Type /Pages /Count 1 /Kids [3 0 R] >>")
$objects.Add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>")
$objects.Add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
$objects.Add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
$objects.Add("<< /Length $($contentBytes.Length) >>`nstream`n$content`nendstream")

$pdfBuilder = New-Object System.Text.StringBuilder
[void]$pdfBuilder.Append("%PDF-1.4`n")

$offsets = New-Object System.Collections.Generic.List[int]
$offsets.Add(0)

for ($i = 0; $i -lt $objects.Count; $i++) {
  $offsets.Add($pdfBuilder.Length)
  [void]$pdfBuilder.Append("$($i + 1) 0 obj`n")
  [void]$pdfBuilder.Append($objects[$i])
  [void]$pdfBuilder.Append("`nendobj`n")
}

$xrefStart = $pdfBuilder.Length
[void]$pdfBuilder.Append("xref`n")
[void]$pdfBuilder.Append("0 $($objects.Count + 1)`n")
[void]$pdfBuilder.Append("0000000000 65535 f `n")

for ($i = 1; $i -le $objects.Count; $i++) {
  [void]$pdfBuilder.Append(($offsets[$i].ToString('0000000000')) + " 00000 n `n")
}

[void]$pdfBuilder.Append("trailer`n")
[void]$pdfBuilder.Append("<< /Size $($objects.Count + 1) /Root 1 0 R >>`n")
[void]$pdfBuilder.Append("startxref`n")
[void]$pdfBuilder.Append("$xrefStart`n")
[void]$pdfBuilder.Append("%%EOF")

[System.IO.File]::WriteAllText($pdfPath, $pdfBuilder.ToString(), [System.Text.Encoding]::ASCII)
Write-Output $pdfPath
