// CLEAN VERSION - Replace the broken loadInstallerJobsWithCalendar function

async function loadInstallerJobsWithCalendar(installer) {
    console.log('🔍 Loading jobs for installer:', installer.name);
    console.log('🔍 Full installer object:', installer);
    
    const jobsListEl = document.getElementById('jobsList');
    if (!jobsListEl) {
        console.error('❌ jobsList element not found');
        return;
    }
    
    // Show loading
    jobsListEl.innerHTML = '<div style="text-align: center; padding: 20px;">🔄 Loading jobs...</div>';
    
    // Calculate week range
    const today = new Date();
    const weekStart = new Date(today.getTime() + (currentWeekOffset * 7 * 24 * 60 * 60 * 1000));
    const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
    
    // Set to Monday-Sunday
    const dayOfWeek = weekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    
    console.log('📅 Week range:', weekStart.toDateString(), 'to', weekEnd.toDateString());
    
    // ONLY use Firebase - NO demo fallback
    if (db) {
        console.log('🔍 Using Firebase database');
        
        try {
            // First, check what's actually in the database
            console.log('🔍 Checking database contents...');
            const allJobsSnapshot = await db.collection('jobs').limit(5).get();
            console.log('🔍 Sample jobs in database:');
            allJobsSnapshot.forEach(doc => {
                console.log('  -', doc.id, ':', doc.data());
            });
            
            // Now query for this installer's jobs
            console.log('🔍 Querying jobs where assignedInstaller =', installer.name);
            const jobsSnapshot = await db.collection('jobs')
                .where('assignedInstaller', '==', installer.name)
                .where('scheduledDate', '>=', weekStart)
                .where('scheduledDate', '<=', weekEnd)
                .orderBy('scheduledDate')
                .get();
            
            const jobs = [];
            jobsSnapshot.forEach(doc => {
                jobs.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('✅ Found jobs:', jobs.length, 'for', installer.name);
            console.log('🔍 Jobs:', jobs);
            
            // Render calendar with real jobs (or empty if none)
            renderCalendar(jobs, weekStart, jobsListEl);
            
        } catch (error) {
            console.error('❌ Error loading jobs:', error);
            jobsListEl.innerHTML = '<div style="text-align: center; padding: 20px;">❌ Error loading jobs</div>';
        }
    } else {
        console.error('❌ No Firebase database connection');
        jobsListEl.innerHTML = '<div style="text-align: center; padding: 20px;">❌ No database connection</div>';
    }
}

function renderCalendar(jobs, weekStart, jobsListEl) {
    // Group jobs by date
    const jobsByDate = {};
    jobs.forEach(job => {
        const jobDate = new Date(job.scheduledDate).toLocaleDateString();
        if (!jobsByDate[jobDate]) {
            jobsByDate[jobDate] = [];
        }
        jobsByDate[jobDate].push(job);
    });
    
    // Create calendar HTML
    let calendarHTML = '<div class="terminal-card p-3">';
    
    // Week navigation
    calendarHTML += '<div class="flex justify-between items-center mb-2">';
    calendarHTML += '<h3 class="text-sm font-bold text-terminal">📅 ' + weekStart.toLocaleDateString() + '</h3>';
    calendarHTML += '<div class="flex gap-1">';
    calendarHTML += '<button onclick="changeWeek(-1)" class="terminal-button px-2 py-1 text-xs">◀</button>';
    calendarHTML += '<button onclick="changeWeek(1)" class="terminal-button px-2 py-1 text-xs">▶</button>';
    calendarHTML += '</div></div>';
    
    // Week grid
    calendarHTML += '<div class="grid grid-cols-7 gap-1 mb-3">';
    const dayNames = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'];
    
    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart.getTime() + (i * 24 * 60 * 60 * 1000));
        const dateStr = currentDay.toLocaleDateString();
        const dayNum = currentDay.getDate();
        const dayName = dayNames[i];
        
        const jobCount = jobsByDate[dateStr] ? jobsByDate[dateStr].length : 0;
        
        calendarHTML += '<div onclick="showDayJobs(\'' + dateStr.replace(/\//g, '-') + '\')" class="terminal-card p-2 text-center cursor-pointer hover:bg-gray-800 min-h-[70px] flex flex-col justify-center">';
        calendarHTML += '<div class="text-xs text-terminal-muted">' + dayName + '</div>';
        calendarHTML += '<div class="text-sm font-bold text-terminal">' + dayNum + '</div>';
        if (jobCount > 0) {
            calendarHTML += '<div class="text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center mx-auto mt-1">' + jobCount + '</div>';
        }
        calendarHTML += '</div>';
    }
    
    calendarHTML += '</div>';
    
    // Blackout dates button
    calendarHTML += '<div class="text-center mt-3">';
    calendarHTML += '<button onclick="showBlackoutDatesModal()" class="terminal-button px-4 py-2 text-sm">📅 Blackout Dates</button>';
    calendarHTML += '</div>';
    
    calendarHTML += '</div>';
    
    jobsListEl.innerHTML = calendarHTML;
    console.log('✅ Calendar rendered with', jobs.length, 'real jobs');
}
