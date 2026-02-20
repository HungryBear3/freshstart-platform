# Testing Legal Information System

## Quick Start

1. **Seed the database with sample content:**
   ```bash
   cd newstart-il
   npm run seed:legal
   ```
   
   Or use the admin page:
   - Visit: `http://localhost:3000/admin/seed-content`
   - Click "Seed Legal Content"

2. **Start the development server** (if not running):
   ```bash
   npm run dev
   ```

3. **Test the pages:**
   - Main hub: `http://localhost:3000/legal-info`
   - Process guide: `http://localhost:3000/legal-info/process`
   - Timeline calculator: `http://localhost:3000/legal-info/timeline-calculator`
   - Cost estimator: `http://localhost:3000/legal-info/cost-estimator`
   - Glossary: `http://localhost:3000/legal-info/glossary`
   - Requirements: `http://localhost:3000/legal-info/requirements`
   - Court resources: `http://localhost:3000/legal-info/court-resources`

4. **Test dynamic content pages:**
   - `http://localhost:3000/legal-info/grounds-for-divorce`
   - `http://localhost:3000/legal-info/property-division`
   - `http://localhost:3000/legal-info/child-custody`
   - `http://localhost:3000/legal-info/spousal-maintenance`
   - `http://localhost:3000/legal-info/residency-requirements`

## Testing Checklist

### Timeline Calculator
- [ ] Select "Uncontested" - should show shorter timeline (~3 months)
- [ ] Select "Contested" - should show longer timeline (~6+ months)
- [ ] Select different counties - timeline should adjust
- [ ] Check "Children involved" - timeline should increase
- [ ] Check "Property to divide" - timeline should increase
- [ ] Check "Complex assets" - timeline should increase significantly
- [ ] Change filing date - milestones should update
- [ ] Verify milestones show correct dates

### Cost Estimator
- [ ] Select different counties - filing fees should adjust
- [ ] Select "Uncontested" vs "Contested" - costs should differ
- [ ] Check "Children involved" - parent education fee should appear
- [ ] Check "Mediation" - mediation costs should appear
- [ ] Verify total cost calculation
- [ ] Check fee waiver information displays

### Glossary
- [ ] Search for a term (e.g., "custody")
- [ ] Filter by category
- [ ] Verify terms are alphabetically grouped
- [ ] Click on different categories
- [ ] Verify search works across terms and definitions

### Step-by-Step Guide
- [ ] Expand/collapse steps
- [ ] Mark steps as complete
- [ ] Verify progress bar updates
- [ ] Check that completed steps show checkmark
- [ ] Verify step content displays when expanded

### Legal Content Pages
- [ ] Visit each seeded article
- [ ] Verify content displays correctly
- [ ] Check that disclaimers appear
- [ ] Verify tags display
- [ ] Check category badges

## Adding New Content

### Method 1: Using the API

```bash
curl -X POST http://localhost:3000/api/legal-content \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Your Article Title",
    "slug": "your-article-slug",
    "content": "<p>Your HTML content here</p>",
    "category": "process",
    "tags": ["tag1", "tag2"],
    "published": true
  }'
```

### Method 2: Using Prisma Studio

1. Run: `npm run db:studio`
2. Open `legal_content` table
3. Click "Add record"
4. Fill in the fields
5. Save

### Method 3: Add to Seed Script

Edit `lib/seed-legal-content.ts` and add your content to the array, then run:
```bash
npm run seed:legal
```

## Content Categories

- `process` - Divorce process information
- `requirements` - Filing requirements
- `glossary` - Legal terms (usually handled separately)
- `property` - Property division
- `children` - Child custody and support
- `financial` - Financial matters

## Troubleshooting

### Content not showing?
- Check that `published: true` in database
- Verify slug matches the URL
- Check browser console for errors

### Timeline calculator not working?
- Verify date-fns is installed: `npm list date-fns`
- Check browser console for errors
- Ensure filing date is in the future or today

### Cost estimator showing wrong amounts?
- Verify county name matches exactly (case-sensitive in some cases)
- Check that all checkboxes are working
- Review calculation logic in `lib/calculators/cost-estimator.ts`

## Next Steps After Testing

1. Add more legal content articles
2. Customize calculator values for your specific needs
3. Add more glossary terms
4. Enhance step-by-step guides with more detail
5. Add images or diagrams to content pages
