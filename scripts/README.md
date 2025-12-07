# Integration Test Script

यो script ले DevPulse application को पूरा workflow test गर्छ।

## के Test गर्छ?

1. **Product Creation** - नयाँ product बनाउँछ
2. **Client Creation** - Product मा client जोड्छ  
3. **Project Creation** - Client मा project बनाउँछ
4. **Developer Creation** - Developer बनाएर project मा assign गर्छ
5. **Issue Creation** - Project मा 4 issues बनाउँछ (Critical, High, Medium, Low)
6. **Complete Hierarchy** - पूरा structure verify गर्छ
7. **Update Operations** - Project, Issue, Developer update test गर्छ
8. **Query Operations** - सबै queries test गर्छ
9. **Cleanup** - Test data सफा गर्छ

## कसरी चलाउने?

```bash
npm run test:integration
```

## के हुन्छ?

Script ले:
- ✅ Product → Client → Project → Developer → Issues hierarchy बनाउँछ
- ✅ सबै connections verify गर्छ
- ✅ Update operations test गर्छ
- ✅ Query operations test गर्छ
- ✅ अन्तमा सबै test data delete गर्छ

## Output Example

```
🧪 DevPulse Integration Test Suite
Testing complete application workflow

════════════════════════════════════════════════════════════
  1. Testing Product Creation
════════════════════════════════════════════════════════════
✅ Created product: 🧪 TEST Product
✅ Product verified successfully

📊 Complete Hierarchy:

🏢 Product: TEST Product
  └─ 👥 Client: TEST Client
     └─ 📁 Project: TEST Project
        ├─ 👨‍💻 Developers: 1
        │  └─ Test Developer
        └─ 🐛 Issues: 4
           ├─ [CRITICAL] Database Connection → Test Developer
           ├─ [HIGH] Performance Issue → Test Developer
           ├─ [MEDIUM] New Feature Request → Unassigned
           └─ [LOW] Documentation Update → Unassigned

✅ Passed: 43
❌ Failed: 0
🎉 All tests passed!
```

## Kहिले चलाउने?

हरेक पटक तपाईंले code update गर्दा यो script चलाएर verify गर्नुहोस्:

```bash
# Code change गरेपछि
npm run test:integration

# सबै ठीक छ भने
git add .
git commit -m "your changes"
git push
```

## Test Data

Script ले automatically:
- Test product, client, project बनाउँछ
- Test developer create गर्छ
- 4 test issues बनाउँछ
- Run सकिएपछि सबै delete गर्छ

तपाईंको real data मा कुनै असर पर्दैन! 🛡️

## Troubleshooting

यदि test fail भयो भने:

1. Database file exists भनेर check गर्नुहोस्
2. App चलिरहेको छैन भनेर ensure गर्नुहोस् (port conflict)
3. Terminal मा error message हेर्नुहोस्

## Features Tested

- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Hierarchy relationships
- ✅ Data validation
- ✅ Query filtering
- ✅ Developer assignments
- ✅ Issue management
- ✅ Complete data flow
