# Testing Guide: Financial Tools

## Prerequisites

1. **Server Running**: Make sure `npm run dev` is running
2. **Database**: Prisma client should be generated (`npm run db:generate`)
3. **User Account**: You need to be logged in to access financial tools

## Testing Steps

### 1. Access Financial Tools

1. Navigate to: `http://localhost:3002/dashboard/financial`
   - Should see the Financial Tools dashboard
   - Should see 3 cards: Child Support Calculator, Spousal Maintenance, Financial Affidavit

### 2. Test Child Support Calculator

1. Click "Calculate Child Support"
2. Fill in the form:
   - Parent 1 Net Monthly Income: `5000`
   - Parent 2 Net Monthly Income: `3000`
   - Number of Children: `2`
   - Parent 1 Parenting Time: `60`
   - Parent 2 Parenting Time: `40`
   - (Optional fields can be left blank)
3. Click "Calculate Child Support"
4. **Expected**: Should see calculation results with:
   - Combined Net Income
   - Basic Obligation
   - Adjustments
   - Total Monthly Obligation
   - Support Amount

### 3. Test Spousal Maintenance Calculator

1. Go back to Financial Tools
2. Click "Calculate Maintenance"
3. Fill in the form:
   - Payer Annual Gross Income: `80000`
   - Payee Annual Gross Income: `40000`
   - Duration of Marriage: `10`
   - Combined Annual Gross Income: (should auto-calculate to `120000`)
4. Click "Calculate Maintenance"
5. **Expected**: Should see:
   - Monthly Maintenance Amount
   - Guideline Duration
   - Important notes

### 4. Test Financial Affidavit

1. Go back to Financial Tools
2. Click "Complete Affidavit"
3. **Step 1: Income**
   - Click "Add Income Source"
   - Fill in:
     - Income Type: "Wages/Salary"
     - Source Description: "ABC Company"
     - Amount: `5000`
     - Frequency: "Monthly"
     - Check "Current income source"
   - Click "Save Progress"
   - **Expected**: Should see "Financial data saved successfully"
   - Should see total monthly income calculated

4. **Step 2: Expenses**
   - Click "Next" or click "Expenses" tab
   - Click "Add Expense"
   - Fill in:
     - Category: "Housing (Rent/Mortgage)"
     - Description: "Monthly Rent"
     - Amount: `1500`
     - Frequency: "Monthly"
   - Add another expense:
     - Category: "Food/Groceries"
     - Description: "Monthly Groceries"
     - Amount: `600`
     - Frequency: "Monthly"
   - **Expected**: Should see total monthly expenses calculated

5. **Step 3: Assets**
   - Click "Next" or click "Assets" tab
   - Click "Add Asset"
   - Fill in:
     - Asset Type: "Vehicle"
     - Description: "2019 Toyota Camry"
     - Value: `15000`
     - Ownership: "Individual"
   - Add another asset:
     - Asset Type: "Bank Account"
     - Description: "Checking Account"
     - Value: `5000`
     - Ownership: "Individual"
   - **Expected**: Should see total asset value calculated

6. **Step 4: Debts**
   - Click "Next" or click "Debts" tab
   - Click "Add Debt"
   - Fill in:
     - Debt Type: "Credit Card"
     - Creditor Name: "Chase Bank"
     - Current Balance: `3000`
     - Monthly Payment: `150`
     - Ownership: "Individual"
   - **Expected**: Should see total debt balance and monthly payments

7. **Step 5: Summary**
   - Click "Next" or click "Summary" tab
   - **Expected**: Should see complete financial summary:
     - Total Monthly Income
     - Total Monthly Expenses
     - Net Monthly Income
     - Total Asset Value
     - Total Debt Balance
     - Net Worth
     - Form Type

### 5. Test Data Persistence

1. After saving, refresh the page
2. **Expected**: All entered data should still be there
3. Navigate away and come back
4. **Expected**: Data should persist

### 6. Test Navigation

1. Use step buttons at top to jump between steps
2. Use Previous/Next buttons
3. **Expected**: Should navigate smoothly between steps
4. Progress bar should update

## Common Issues & Solutions

### Issue: "Unauthorized" error
**Solution**: Make sure you're logged in. Visit `/auth/signin` first.

### Issue: Data not saving
**Solution**: 
- Check browser console for errors
- Check server terminal for API errors
- Verify database connection

### Issue: Calculations not showing
**Solution**:
- Make sure all required fields are filled
- Check browser console for JavaScript errors
- Verify amounts are valid numbers

### Issue: Page not loading
**Solution**:
- Check if server is running
- Check browser console for errors
- Try hard refresh (Ctrl+Shift+R)

## Expected Results

### Child Support Calculator
- Should calculate based on Illinois guidelines
- Should show detailed breakdown
- Should account for parenting time

### Spousal Maintenance Calculator
- Should calculate based on Illinois guidelines
- Should show amount and duration
- Should include notes about guidelines

### Financial Affidavit
- Should save all data
- Should calculate totals correctly
- Should persist across page refreshes
- Should show accurate summary

## Browser Console Checks

Open browser DevTools (F12) and check:
- No red errors in Console tab
- Network tab shows successful API calls (200 status)
- No failed requests to `/api/financial`

## Server Terminal Checks

Check the terminal where `npm run dev` is running:
- No Prisma errors
- No API route errors
- Successful database queries

## Next Steps After Testing

If everything works:
- ✅ Financial Tools are ready for use
- Next: Implement PDF generation (Task 6.9)

If issues found:
- Note the specific error
- Check the error message
- Review the relevant code section
