# Page templates

Copy any file here, rename it, and drop it into the matching `docs/` subfolder.

| Template | Use for | Lives in |
|----------|---------|----------|
| `concept.mdx` | Coined terms, lexicon entries | `docs/concepts/` |
| `tool.mdx` | One page per tool (LLMs, CLIs, frameworks, SaaS) | `docs/reference/tools/` |
| `playbook.mdx` | Step-by-step procedure with prerequisites and failure modes | `docs/playbooks/` (create section as needed) |
| `case-study.mdx` | Narrative of an engagement, sanitized | `docs/case-studies/` (create section as needed) |

Every template includes the load-bearing page anatomy: frontmatter, H1, italic one-liner, divider, named sections, Further Reading. Do not remove any of these. Add sections inside the body as needed.

Each one also carries a **graphic slot** directly under the divider, because a page without a graphic is not finished. Two ways to fill it, and they are not equal:

- **A code-drawn diagram** (`diagrams/build.mjs`) is free and is the default. Most pages argue a structure, and a structure should be computed. See `diagrams/README.md`.
- **A rendered illustration** (`illustrations/scripts/render-hero.sh`) costs money per image and suits a hero with people in it. When you use one, set `image:` in the frontmatter to the same path so the share card is the page's own hero.

Draw what the page argues. Decoration is not a graphic, and the sentence you write as alt text is the test: if you cannot say what the reader now knows, the graphic is not earning its space.
