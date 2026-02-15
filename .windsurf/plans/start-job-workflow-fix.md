# Start Job Photo Workflow Correction

This plan fixes the Start Job photo workflow to follow the correct sequence: signature photo → front with address → left side → right side → rear → optional damage photos with notes.

## 🎯 Correct Start Job Workflow
When installer chooses "Start Job" from status dropdown:

### **Required Photos (in order):**
1. **Signature photo** - Customer/installer signature
2. **Front of house** - Must show address clearly
3. **Left side** - Left side of property
4. **Right side** - Right side of property  
5. **Rear** - Back of property

### **Optional Photos:**
6. **Existing damage** - Any pre-existing damage with notes

## 🔄 Current Issues
- Start Job is using opening-based system (wrong)
- Should be sequential photo walkthrough
- Missing signature photo requirement
- Missing notes for damage photos
- Wrong workflow structure

## 🎨 New Start Job Design
- **Step-by-step photo guide** (not opening selection)
- **Progress indicator** showing which photo required
- **Sequential capture** with "Next" buttons
- **Notes field** for damage photos
- **Signature capture** for first photo
- **Professional UI** (sleek design)

## 📱 Implementation Steps
1. Create sequential Start Job photo module
2. Add signature capture for first photo
3. Implement step-by-step photo guide
4. Add notes field for damage photos
5. Add progress indicator (1/5, 2/5, etc.)
6. Add "Next" and "Skip" navigation
7. Apply sleek modern design

## 🔄 Workflow Flow
```
Start Job → Signature Photo → Front Address → Left Side → Right Side → Rear → Damage (optional) → Complete
```

## 🎯 Key Features
- **Guided photo capture** with clear instructions
- **Progress tracking** through required photos
- **Signature pad** for first photo
- **Notes capability** for damage documentation
- **Skip option** for non-critical photos
- **Professional sleek design**
