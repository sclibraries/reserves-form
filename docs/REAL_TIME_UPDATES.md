# Real-Time Updates Implementation

## Overview
Implemented **short polling** to provide near-real-time updates for faculty viewing their course reserve submissions. This ensures that when library staff update the status of materials on the backend, faculty see the changes automatically without manual page refresh.

## Architecture

### Short Polling Strategy
Since we're using a YII 2 REST API (not GraphQL/WebSockets), we implemented **short polling** which periodically pings the backend API to check for updates.

**Alternatives Considered:**
- ✅ **Short Polling** (Implemented) - Simple, reliable, works with REST APIs
- ❌ **Long Polling** - More complex, not standard for REST APIs
- ❌ **Server-Sent Events (SSE)** - Requires server support, one-way only
- ❌ **WebSockets** - Most complex, requires separate infrastructure

## Implementation Details

### 1. Store Changes (`courseReservesStore.ts`)

#### New State Properties
```typescript
pollingInterval: NodeJS.Timeout | null; // Tracks active polling interval
```

#### Updated Functions
- `fetchSubmissions(silent?: boolean)` - Added silent mode to prevent UI flicker during auto-refresh
- `fetchSubmissionDetails(submissionId, silent?: boolean)` - Added silent mode for background updates

#### New Functions
```typescript
startPolling: (intervalMs?: number) => void; // Start auto-refresh
stopPolling: () => void; // Stop auto-refresh and cleanup
```

### 2. Dashboard Page (`Index.tsx`)

**Polling Behavior:**
- ✅ Starts when user is authenticated
- ✅ Polls every **30 seconds** (list view)
- ✅ Automatically stops on logout or unmount
- ✅ Silent refresh (no loading spinner)

```typescript
useEffect(() => {
  if (isAuthenticated && user) {
    fetchSubmissions();
    startPolling(30000); // 30 seconds
    
    return () => stopPolling(); // Cleanup
  }
}, [isAuthenticated, user]);
```

### 3. Submission Detail Page (`SubmissionDetail.tsx`)

**Polling Behavior:**
- ✅ More frequent updates: every **15 seconds** (detail view)
- ✅ Only polls for backend submissions (skips test data)
- ✅ Silent refresh (no loading spinner)
- ✅ Automatically cleans up on unmount

```typescript
useEffect(() => {
  if (!id || !reserve || reserve.isTestData) return;

  const interval = setInterval(() => {
    fetchSubmissionDetails(id, true); // Silent
  }, 15000); // 15 seconds

  return () => clearInterval(interval);
}, [id, reserve]);
```

## Benefits

### For Faculty
1. ✅ **Real-time visibility** - See status updates as library staff processes materials
2. ✅ **No manual refresh needed** - Updates appear automatically
3. ✅ **Seamless UX** - Silent updates, no loading spinners interrupting workflow
4. ✅ **Confidence** - Know the current status of all materials in real-time

### For Library Staff
1. ✅ **Immediate feedback** - Faculty see changes right away
2. ✅ **Reduced support requests** - Faculty don't need to ask "did you get my request?"
3. ✅ **Better communication** - Status changes are reflected immediately

## Performance Considerations

### Network Traffic
- **Dashboard**: 1 API call every 30 seconds per logged-in user
- **Detail View**: 1 API call every 15 seconds per user viewing a submission
- **Worst case**: User on dashboard viewing detail = 2 API calls every 15 seconds

### Optimization Strategies
1. ✅ **Silent mode** - No loading states during polling
2. ✅ **Conditional polling** - Only poll when authenticated
3. ✅ **Smart cleanup** - Stop polling on logout/unmount
4. ✅ **Test data skip** - Don't poll for mock data
5. ✅ **Efficient caching** - Zustand persist only saves user data, not test data

### Future Optimizations (if needed)
- Add **exponential backoff** if API is slow
- Implement **visibility API** to pause polling when tab is hidden
- Add **ETag/If-Modified-Since** headers to reduce bandwidth
- Implement **WebSockets** for truly real-time updates (requires backend changes)

## Configuration

### Polling Intervals
Edit these values in the code to adjust frequency:

```typescript
// Dashboard polling (Index.tsx)
startPolling(30000); // 30 seconds - adjust as needed

// Detail view polling (SubmissionDetail.tsx)
setInterval(() => {
  fetchSubmissionDetails(id, true);
}, 15000); // 15 seconds - adjust as needed
```

### Recommended Settings
- **Low traffic**: 15-30 seconds (current setting)
- **High traffic**: 60 seconds
- **Very high traffic**: 120 seconds or implement WebSockets

## Testing

### Manual Testing Checklist
1. ✅ Login as faculty member
2. ✅ Open console to see polling logs: `🔄 Auto-refreshing submissions...`
3. ✅ Open submission detail page
4. ✅ Change material status in backend database
5. ✅ Wait 15-30 seconds
6. ✅ Verify status updates automatically in UI
7. ✅ Navigate away - verify polling stops (check console)
8. ✅ Logout - verify polling stops

### Console Logs
- `🔄 Starting auto-refresh polling (every X seconds)` - Polling started
- `🔄 Auto-refreshing submissions...` - Background refresh triggered
- `⏸️ Stopping auto-refresh polling` - Polling stopped
- `✅ Updated reserves:` - Data successfully refreshed (only on manual fetch)

## Troubleshooting

### Updates Not Appearing?
1. Check console for polling logs
2. Verify backend API is responding
3. Check JWT token is still valid
4. Ensure no CORS errors in console

### Performance Issues?
1. Increase polling interval (60s instead of 30s)
2. Check network tab for API response times
3. Consider implementing WebSockets for high-traffic scenarios

### Polling Not Stopping?
1. Check cleanup functions in useEffect
2. Verify logout calls `stopPolling()`
3. Check for memory leaks with React DevTools

## Migration Notes

### Breaking Changes
✅ None - Fully backwards compatible

### Database Changes
✅ None required

### API Changes
✅ None required - uses existing REST endpoints

## Future Enhancements

### Short-term (REST API)
- [ ] Add visual indicator when updates are being fetched
- [ ] Show "last updated" timestamp
- [ ] Add manual refresh button
- [ ] Implement optimistic UI updates

### Long-term (Server Changes)
- [ ] Implement Server-Sent Events (SSE) for one-way updates
- [ ] Implement WebSockets for bidirectional real-time communication
- [ ] Add push notifications for status changes
- [ ] Implement webhook notifications

## Related Files
- `/src/store/courseReservesStore.ts` - Polling logic and silent fetch
- `/src/pages/Index.tsx` - Dashboard polling (30s)
- `/src/pages/SubmissionDetail.tsx` - Detail view polling (15s)
