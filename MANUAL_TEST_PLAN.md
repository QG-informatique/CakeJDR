# Manual Release Checklist

Manual validation for a full CakeJDR session with one GM, two desktop players, and one tablet client.

## Preparation
1. Start the app with `NEXT_PUBLIC_DEBUG=1`.
2. Open four clients:
   1. GM desktop
   2. Player desktop A
   3. Player desktop B
   4. Tablet
3. Confirm `.env.local` is populated for Liveblocks, Cloudinary, and Vercel Blob.
4. Create one fresh room from the GM account and share the room link with the other clients.

## Login And Menu
1. Log in from each client and verify the profile state persists after refresh.
2. Change the profile color on one client and verify it is retained locally.
3. Cycle background themes from the menu and verify the selected theme survives a reload.
4. Confirm room creation, selection, rename, and deletion all surface clear success or failure behavior.

## Room Lifecycle
1. Join the same room from all clients.
2. Leave the room to the menu and re-enter twice from each client.
3. Refresh one client while staying in the room and confirm the client can recover without selecting a different room.
4. If the room is password-protected, verify:
   1. valid password joins successfully
   2. invalid password is rejected cleanly
   3. remembered password allows re-entry without a prompt

## Realtime Session
1. Send chat messages from every client and confirm identical ordering everywhere.
2. Roll dice from every client and confirm:
   1. result popup appears
   2. history is synchronized
   3. stats update consistently
3. Toggle chat, stats, summary, notes, and any side panels repeatedly and verify panel state remains coherent.
4. Confirm live presence indicators and avatar stacks update as clients join and leave.

## Character And Storage
1. Create, edit, select, and delete local character sheets.
2. Import and export a character locally and verify no data loss.
3. Save a character to room storage and verify another client can load the same state.
4. Save, list, import, and delete a character through Blob cloud storage.
5. Confirm the selected character persists correctly after menu-to-room round trips.

## Canvas, Media, And Music
1. Draw on the shared canvas from two clients at once and confirm strokes remain synchronized.
2. Upload at least one image and confirm the uploaded asset appears for all connected clients.
3. Move or interact with uploaded canvas elements and verify shared state remains stable.
4. Test YouTube music controls and verify playback state, queue state, and initial volume behavior stay consistent across reloads.

## Responsive And Recovery
1. Test the tablet in portrait and landscape.
2. Resize desktop windows through several widths and confirm no unusable layouts or hidden critical actions.
3. Disconnect one client from the network, reconnect it, and verify the room state, chat history, and character state recover cleanly.
4. Confirm debug logs appear only when `NEXT_PUBLIC_DEBUG=1`.

## Release Criteria
- No blocking console, runtime, or route errors during the checklist.
- No state loss when navigating menu to room, refreshing, or reconnecting.
- No leaked secrets or raw passwords in API responses visible from browser tools.
- Any remaining issue must be documented as explicitly non-blocking before release.
