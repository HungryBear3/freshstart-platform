# Testing Guide: Questionnaire System

## Quick Start

### 1. Seed Sample Questionnaires

**Option A: Via Admin Page (Recommended)**
1. Start your dev server: `npm run dev`
2. Sign in to your account
3. Navigate to: `http://localhost:3000/admin/seed-questionnaires`
4. Click "Seed Questionnaires" button
5. You should see a success message

**Option B: Via Command Line**
```bash
cd newstart-il
npm run seed:questionnaires
```

### 2. Test Questionnaire Flow

1. **View Available Questionnaires**
   - Navigate to: `http://localhost:3000/questionnaires`
   - You should see 3 questionnaires:
     - Petition for Dissolution of Marriage
     - Financial Affidavit (Short Form)
     - Parenting Plan

2. **Start a Questionnaire**
   - Click "Start" on any questionnaire
   - Fill out the form
   - Notice:
     - Auto-save happens after 2 seconds of inactivity
     - Progress bar shows completion percentage
     - Conditional questions appear/disappear based on answers
     - Validation errors show in real-time

3. **Save and Resume**
   - Fill out part of a questionnaire
   - Navigate away or close the browser
   - Return to `/questionnaires`
   - Click "Continue" on the same questionnaire
   - Your progress should be restored

4. **Complete a Questionnaire**
   - Fill out all required fields
   - Click "Submit" on the last section
   - You should be redirected to `/documents`

### 3. Test Document Generation

1. **View Documents**
   - Navigate to: `http://localhost:3000/documents`
   - You should see:
     - Any generated documents (if any)
     - Completed questionnaires ready to generate documents

2. **Generate a Document**
   - Find a completed questionnaire in the "Ready to Generate Documents" section
   - Click "Generate Document"
   - A document record will be created in the database
   - The page will refresh showing the new document

## Test Cases

### Conditional Logic Testing

**Petition Questionnaire:**
- Select "Irreconcilable Differences" as grounds → Should show duration question
- Select other grounds → Duration question should hide
- Answer "Yes" to "Do you have children?" → Should show number of children question
- Answer "No" → Children questions should hide

**Financial Affidavit:**
- Enter income > $75,000 → Should show validation error
- Enter income < $75,000 → Should accept

### Validation Testing

1. **Required Fields**
   - Try to submit without filling required fields
   - Should see error messages
   - Should scroll to first error

2. **Date Validation**
   - Enter invalid date → Should show error
   - Enter valid date → Should accept

3. **Number Validation**
   - Enter text in number field → Should show error
   - Enter negative number where not allowed → Should show error

### Progress Tracking Testing

1. **Auto-Save**
   - Fill out a question
   - Wait 2 seconds
   - Check browser network tab → Should see POST to `/api/questionnaires/responses`
   - Navigate away and back → Progress should be saved

2. **Section Navigation**
   - Use section tabs to jump between sections
   - Progress should be maintained
   - Current section should be highlighted

## Expected Behavior

### ✅ Working Features
- Questionnaire listing page
- Dynamic form rendering
- Conditional logic (show/hide questions)
- Real-time validation
- Auto-save functionality
- Progress tracking
- Section navigation
- Form submission
- Document generation API (creates records)

### ⚠️ Known Limitations
- PDF generation creates database records but doesn't generate actual PDFs yet (needs templates)
- Document preview not implemented yet
- Document download not implemented yet
- Address field renders as text input (can be enhanced later)

## Troubleshooting

### Questionnaires Not Showing
- Check if questionnaires were seeded: `npm run seed:questionnaires`
- Check database: `npm run db:studio` and look at `questionnaires` table

### Auto-Save Not Working
- Check browser console for errors
- Verify you're logged in
- Check network tab for API errors

### Validation Not Working
- Check browser console for JavaScript errors
- Verify question structure in database has validation rules

### Document Generation Fails
- Check that questionnaire is marked as "completed"
- Check browser console for API errors
- Verify form template exists in database (for actual PDF generation)

## Next Steps After Testing

Once testing is complete, you can:
1. Create actual PDF templates for Illinois forms
2. Define field mappings for each document type
3. Implement actual PDF filling
4. Add document preview functionality
5. Move on to Financial Tools (Task 6.0)
