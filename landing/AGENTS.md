<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the public landing page at the index route and express its visual styling through semantic tokens in src/styles.css, so branding stays consistent.
- Reference uploaded media through Lovable Assets pointers, except the square favicon served from public, to avoid storing large binaries.
- Keep landing-page actions frontend-only until real account and sales destinations are supplied; never simulate account creation or lead delivery.
