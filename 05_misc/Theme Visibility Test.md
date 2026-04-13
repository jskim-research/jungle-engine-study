## Theme Visibility Test

This page groups together the UI patterns that are most likely to regress when the site's colors or typography change.

Use this page to verify:

- body text against the post surface
- inline code inside paragraphs, lists, tables, and blockquotes
- fenced code blocks with different languages
- tables, horizontal rules, links, marks, and details blocks
- math, strong emphasis, and mixed inline formatting

---

## Paragraph And Inline Elements

This paragraph mixes regular copy, **strong text**, *italic text*, ~~strikethrough~~, [an inline link](https://github.com/jskim-research/jungle-engine-study), and `inline code` in the same line.

This line also includes <mark>highlighted text</mark> and a long inline token like `PrimaryActorTick.bCanEverTick = false;` to make sure emphasis styles remain readable.

## Lists

- `USceneComponent` should remain readable inside a list item.
- **`RootComp`** is a good check for inline code inside strong text.
- Nested emphasis like **bold**, `code`, and [links](https://jekyllrb.com/) should stay distinct.

1. Ordered lists should keep enough contrast for numbers and text.
2. `MeshComp` inside ordered content should keep its pill background.
3. Checklist-style items should still be readable even in dense blocks.

- [x] Completed checklist item
- [ ] Pending checklist item with `inline code`

## Blockquote

> A blockquote should still read as a separate surface.
>
> It should keep enough contrast for `inline code`, [links](https://example.com/), and **strong emphasis** at the same time.

## Table

| Case | Example | Notes |
| --- | --- | --- |
| Inline code | `TObjectPtr<UStaticMesh>` | Checks code pills inside cells |
| Link | [Open documentation](https://jekyllrb.com/docs/) | Checks link color inside tables |
| Mark | <mark>Important note</mark> | Checks highlighted text on table backgrounds |
| Mixed | **`RootComp`** and `CameraComp` | Checks stacked emphasis in one cell |

## Fenced Code Blocks

```cpp
UCLASS()
class AThemeAuditActor : public AActor
{
    GENERATED_BODY()

public:
    AThemeAuditActor()
    {
        PrimaryActorTick.bCanEverTick = false;
        Health = 100;
        MoveSpeed = 600.f;
    }

private:
    int32 Health;
    float MoveSpeed;
};
```

```json
{
  "page": "Theme Visibility Test",
  "checks": ["inline-code", "fenced-code", "table", "blockquote"],
  "theme": "dark"
}
```

```powershell
$env:PAGES_REPO_NWO = "jskim-research/jungle-engine-study"
powershell -ExecutionPolicy Bypass -File .\scripts\run-visual-audit.ps1
```

```text
This plain text block is useful for checking borders, spacing,
and whether long lines still feel like a separate visual region.
```

## Details

<details open>
<summary>Expanded details block</summary>

This section checks disclosure text, paragraph spacing, and `inline code` inside HTML blocks.

</details>

## Math

Inline math should stay readable: \( L = \frac{1}{2}\rho v^2 S C_L \)

\[
\int_{0}^{1} x^2\,dx = \frac{1}{3}
\]

## Horizontal Rule

The divider below should stay visible without drawing too much attention.

---

## Long Code Line

```cpp
const FString VeryLongDiagnosticLabel = TEXT("This line is intentionally long to confirm that horizontal scrolling still feels like a code block instead of looking like normal body text.");
```
