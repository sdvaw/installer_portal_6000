# Photo Management System Redesign Plan

This plan redesigns the photo capture system to use only two modules: Start Job and Progress Photos, with opening-based organization for field operations.

## 📋 Current Issues
- Single flat photo structure doesn't match field workflow
- No opening-based organization (Window 1, Door 2, etc.)
- Can't add more photos to existing openings
- Missing required vs optional photo categories
- No persistent opening management

## 🎯 New Photo Workflow Structure

### **1. Job Status Dropdown Options**
- **"Start Job"** → Opens **Start Job Required Photos Module** (one-time setup)
- **"In Progress"** → Opens **Progress Photos**
- **"Final"** → Opens **Progress Photos** (same module)

### **2. Progress Photos Features**
- **Opening Type Dropdown**: Window, Door, Slider, Skylight, etc.
- **Opening Number Dropdown**: 1, 2, 3, 4, 5, 6, 7, 8...
- **Location Field** (optional): Living Room, Master Bedroom, etc.
- **Photo Gallery** for specific opening
- **Add More Photos** capability for existing openings
- **Single module handles all photos** regardless of when they're taken

### **3. Photo Categories per Opening**
- **Required Photos**: front, back, left, right, detail
- **Optional Photos**: custom shots
- **Issue Photos**: defects/problems

### **4. Data Structure**
```javascript
photos/
{
  jobId: "JOB001",
  openingType: "Window",
  openingNumber: "1",
  location: "Living Room", 
  photoStage: "start-job", // or "progress"
  photoCategory: "required", // or "optional", "issue"
  angle: "front",
  url: "firebase_url",
  capturedAt: "timestamp"
}
```

## 🔧 Implementation Steps

### **Phase 1: Update Job Status Workflow**
1. Modify `handleJobStatusChange()` to route to correct photo module
2. Create `openStartJobPhotos()` for required setup photos
3. Create `openProgressPhotos()` for opening-based photos
4. Route both "In Progress" and "Final" status to same progress module

### **Phase 2: Opening-Based Photo Module**
1. Design opening selection interface (type + number dropdowns)
2. Create opening management system (create, edit, view existing)
3. Implement photo gallery per opening
4. Add "Add More Photos" functionality

### **Phase 3: Photo Category System**
1. Separate required vs optional photo capture
2. Implement issue photo reporting
3. Create photo preview and management
4. Add photo metadata tracking

### **Phase 4: Mobile-First UI**
1. Large touch targets for field use
2. Clear opening navigation
3. Intuitive photo capture workflow
4. Visual hierarchy for required vs optional

## 🎯 Key Features
- **Two Modules Only**: Start Job + Progress Photos
- **Single Progress Module**: Handles all photos after start job
- **Persistent Openings**: Once Window 1 created, can revisit and add photos
- **Opening History**: All photos for Window 1 in one place
- **Map Alignment**: Opening numbers match job site numbered maps
- **Photo Organization**: Structured by opening and category
- **Field Optimized**: Mobile-first with large buttons and clear workflow

## 📱 Mobile Considerations
- Large dropdown targets for gloved hands
- Clear visual feedback for photo capture
- Easy navigation between openings
- Quick access to add more photos
- Offline capability for field use

## 🔄 Integration Points
- Firebase Storage for photo uploads
- Firestore for opening metadata
- Job status updates tied to photo completion
- Certificate generation using opening photos
