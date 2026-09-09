# Remove followers label from homepage

## Goal
Remove the "118 followers" label from the hero section of the homepage.

## Change
- Edit `src/routes/index.tsx`.
- Remove the hero `<span>` that displays `<Users /> 118 followers`.
- If `Users` is no longer used anywhere in the file, remove the `Users` import from `lucide-react`.
- Leave the service tags line (`Mobile mechanic · Electrician · Booking · Classes · Delivery · Reservations`) intact.

## Verification
- Run `bunx tsgo --noEmit` to confirm no type errors after the import change.
- Visually confirm the hero no longer shows a followers count.
