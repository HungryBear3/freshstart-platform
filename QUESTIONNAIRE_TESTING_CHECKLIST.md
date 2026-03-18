# Questionnaire Testing Checklist

## Prerequisites
- ✅ You're logged into your account
- ✅ You have an active subscription (trialing or active)
- ✅ Questionnaires are seeded (visit `/admin/seed-questionnaires` if needed)

---

## Test 1: Questionnaire Listing Page

**Location:** `/questionnaires`

### What to Test:
- [ ] Page loads without errors
- [ ] Lists all available questionnaires (Petition, Financial Affidavit, Parenting Plan)
- [ ] Shows questionnaire names and descriptions
- [ ] "Start" button appears for new questionnaires
- [ ] "Continue" button appears if you have a draft response
- [ ] Status shows correctly (Draft, Completed)
- [ ] Clicking "Start" or "Continue" navigates to questionnaire page

### Expected Behavior:
- Should see at least 3 questionnaires
- Should see "Start" button for questionnaires you haven't started

---

## Test 2: Load Individual Questionnaire

**Location:** `/questionnaires/[type]` (e.g., `/questionnaires/petition`)

### What to Test:
- [ ] Questionnaire loads without errors
- [ ] Progress bar appears at top
- [ ] Section navigation tabs appear (if multiple sections)
- [ ] Questions render correctly based on type:
  - [ ] Text inputs
  - [ ] Textareas
  - [ ] Number inputs
  - [ ] Date inputs
  - [ ] Select dropdowns
  - [ ] Radio buttons
  - [ ] Checkboxes
  - [ ] Yes/No buttons
- [ ] Required fields show red asterisk (*)
- [ ] Help text displays (if available)
- [ ] Description text displays (if available)

### Expected Behavior:
- Page should render completely
- All question types should display properly
- No console errors

---

## Test 3: Fill Out Questionnaire

### What to Test:
- [ ] Type in text fields - values update
- [ ] Select from dropdown - value updates
- [ ] Choose radio option - value updates
- [ ] Check/uncheck checkboxes - values update
- [ ] Fill date field - value updates
- [ ] Progress bar updates as you answer questions
- [ ] Auto-save triggers after 2 seconds (check Network tab)
- [ ] "Save Progress" button works
- [ ] Can navigate between sections using tabs or Previous/Next buttons

### Expected Behavior:
- Values should update immediately
- Auto-save should happen silently (check Network tab for POST requests)
- Progress bar should show completion percentage

---

## Test 4: Save and Resume

### Steps:
1. Fill out part of a questionnaire
2. Leave the page (navigate away or refresh)
3. Go back to `/questionnaires`
4. Click "Continue" on the questionnaire

### What to Test:
- [ ] Previous answers are restored
- [ ] Progress is maintained (same section)
- [ ] All entered values are present

### Expected Behavior:
- Should resume exactly where you left off
- All previously entered answers should be visible

---

## Test 5: Validation

### What to Test:
- [ ] Try submitting with required fields empty
- [ ] Try entering invalid email format
- [ ] Try entering invalid date
- [ ] Try entering number outside min/max range
- [ ] Check that error messages appear
- [ ] Check that form won't submit with validation errors

### Expected Behavior:
- Clear error messages under invalid fields
- Submit button should be disabled or show errors
- First error should scroll into view

---

## Test 6: Conditional Logic

### What to Test:
- [ ] Answer a question that should show/hide other questions
- [ ] Verify questions appear/disappear correctly
- [ ] Change answer - verify conditional questions update
- [ ] Progress bar updates when sections become visible/hidden

### Example:
- If "Do you have children?" = Yes, child-related questions should appear
- If "Do you have children?" = No, child-related questions should hide

### Expected Behavior:
- Questions should show/hide dynamically
- Progress should recalculate based on visible questions

---

## Test 7: Multi-Section Navigation

### What to Test:
- [ ] Click section tabs to jump between sections
- [ ] Use Previous/Next buttons to navigate
- [ ] Progress bar reflects current section
- [ ] Section counter shows correct section number
- [ ] Cannot go to section before first or after last

### Expected Behavior:
- Smooth navigation between sections
- Progress updates correctly
- Previous button disabled on first section
- Next button changes to Submit on last section

---

## Test 8: Submit Questionnaire

### Steps:
1. Complete all required fields
2. Navigate to last section
3. Click "Submit" button

### What to Test:
- [ ] Submit button appears on last section
- [ ] Validation runs before submission
- [ ] Success message appears
- [ ] Redirects to `/documents` page (or shows success)
- [ ] Response status changes to "completed"
- [ ] Questionnaire shows as "Completed" on listing page

### Expected Behavior:
- Successful submission with confirmation
- Redirects to documents page
- Status updates to "completed"

---

## Test 9: Error Handling

### What to Test:
- [ ] Disconnect internet, try to save - should show error
- [ ] Try accessing questionnaire when not logged in - should redirect
- [ ] Try accessing non-existent questionnaire type - should show error
- [ ] Check browser console for errors

### Expected Behavior:
- Graceful error handling
- User-friendly error messages
- No unhandled errors in console

---

## Test 10: Mobile Responsiveness

### What to Test:
- [ ] Open questionnaire on mobile device or resize browser
- [ ] All fields are usable on mobile
- [ ] Progress bar displays correctly
- [ ] Section tabs scroll horizontally if needed
- [ ] Buttons are large enough to tap easily

### Expected Behavior:
- Fully functional on mobile devices
- No horizontal scrolling needed
- Touch-friendly interface

---

## Known Issues to Watch For

### Potential Issues:
1. **Auto-save not working**: Check Network tab for failed POST requests
2. **Conditional logic not working**: May need to check questionnaire structure JSON
3. **Validation errors not showing**: Check browser console for JavaScript errors
4. **Progress bar stuck**: May need to refresh page
5. **Responses not saving**: Check API route logs in Vercel

---

## Debugging Tips

### Check Browser Console:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - Red errors (these are problems)
   - Yellow warnings (less critical)
   - Network errors (check Network tab)

### Check Network Tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Watch for:
   - `/api/questionnaires/[type]` - Loading questionnaire
   - `/api/questionnaires/responses` - Saving responses
   - Status codes: 200 (success), 400 (bad request), 401 (unauthorized), 500 (server error)

### Check Vercel Logs:
1. Vercel Dashboard → Your Project → Deployments
2. Latest deployment → Runtime Logs
3. Look for errors related to questionnaires

---

## Report Issues

When reporting issues, include:
- Which test failed
- What you expected vs. what happened
- Browser console errors (screenshot or copy text)
- Network request failures (check Network tab)
- Steps to reproduce the issue

---

## Quick Test Commands

### Test Questionnaire Loading:
```javascript
// In browser console on /questionnaires page
fetch('/api/questionnaires/petition').then(r => r.json()).then(console.log)
```

### Test Response Saving:
```javascript
// While on questionnaire page
fetch('/api/questionnaires/responses', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    formType: 'petition',
    responses: {test: 'value'},
    currentSection: 0,
    status: 'draft'
  })
}).then(r => r.json()).then(console.log)
```

---

*Last Updated: January 2026*