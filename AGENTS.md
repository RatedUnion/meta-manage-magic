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

- Keep callback reminder state in the database behind existing admin RLS, separate from telephony activation, so reminders survive reloads without claiming provider delivery.
- Keep Simone contact and callback input validation in a shared browser-safe module so forms and server functions use the same rules.
