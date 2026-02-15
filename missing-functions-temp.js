// Handle job status change from dropdown
        function handleJobStatusChange(jobId) {
            const dropdown = document.getElementById('jobStatusDropdown');
            const selectedStatus = dropdown.value;
            
            console.log('🔄 Job status changed:', jobId, selectedStatus);
            
            if (selectedStatus === 'start_job') {
                // Start Job - trigger required pre-job photos
                startJobWithRequiredPhotos(jobId);
            } else if (selectedStatus === 'in_progress') {
                // Update status to In Progress
                updateJobStatusToValue(jobId, 'in_progress');
            } else if (selectedStatus === 'complete') {
                // Update status to Complete
                updateJobStatusToValue(jobId, 'completed');
            } else if (selectedStatus) {
                // Handle other status changes
                updateJobStatusToValue(jobId, selectedStatus);
            }
            
            // Reset dropdown
            dropdown.value = '';
        }
        
        // Start Job with Required Photos Workflow
        function startJobWithRequiredPhotos(jobId) {
            console.log('🚀 Starting job with required photos:', jobId);
            
            // Create required photos modal
            const requiredPhotosModal = `
                <div id="requiredPhotosModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 30000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: #1a1a1a; border: 2px solid #00ff00; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; font-family: monospace;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #00ff00; padding-bottom: 10px;">
                            <h3 style="margin: 0; color: #00ff00; font-size: 16px;">📷 Required Pre-Job Photos</h3>
                            <button onclick="closeRequiredPhotosModal()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
                        </div>
                        
                        <div style="color: #00ff00; margin-bottom: 20px;">
                            <p style="margin-bottom: 15px;">📋 <strong>Required photos before starting work:</strong></p>
                            <div style="background: #2a2a2a; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                                <div style="margin-bottom: 8px;">✅ Front of building with address visible</div>
                                <div style="margin-bottom: 8px;">✅ Left side of property</div>
                                <div style="margin-bottom: 8px;">✅ Right side of property</div>
                                <div style="margin-bottom: 8px;">✅ Rear of property</div>
                                <div style="margin-bottom: 8px;">✅ Existing damage (if any)</div>
                            </div>
                            <p style="font-size: 12px; color: #888;">Tap each photo category below to capture the required photos.</p>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button onclick="captureRequiredPhoto('${jobId}', 'front_building')" style="background: #28a745; color: white; border: 1px solid #00ff00; padding: 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">🏠 Front Building</button>
                            <button onclick="captureRequiredPhoto('${jobId}', 'left_side')" style="background: #28a745; color: white; border: 1px solid #00ff00; padding: 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">⬅️ Left Side</button>
                            <button onclick="captureRequiredPhoto('${jobId}', 'right_side')" style="background: #28a745; color: white; border: 1px solid #00ff00; padding: 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">➡️ Right Side</button>
                            <button onclick="captureRequiredPhoto('${jobId}', 'rear_property')" style="background: #28a745; color: white; border: 1px solid #00ff00; padding: 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">🔙 Rear Property</button>
                            <button onclick="captureRequiredPhoto('${jobId}', 'existing_damage')" style="background: #ffc107; color: #000; border: 1px solid #00ff00; padding: 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">⚠️ Existing Damage</button>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <button onclick="checkAllRequiredPhotos('${jobId}')" style="background: #17a2b8; color: white; border: 1px solid #00ff00; padding: 15px 30px; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">✅ Complete & Start Job</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', requiredPhotosModal);
            
            // Store required photos tracking
            window.requiredJobPhotos = window.requiredJobPhotos || {};
            window.requiredJobPhotos[jobId] = {
                front_building: false,
                left_side: false,
                right_side: false,
                rear_property: false,
                existing_damage: true // Optional
            };
        }
        
        // Capture required photo
        function captureRequiredPhoto(jobId, photoType) {
            console.log('📷 Capturing required photo:', jobId, photoType);
            
            // Create photo capture interface
            const photoCaptureModal = `
                <div id="photoCaptureModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 40000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%; text-align: center;">
                        <h3 style="margin: 0 0 20px 0; color: #333;">📷 ${photoType.replace('_', ' ').toUpperCase()}</h3>
                        
                        <div id="photoPreview" style="margin-bottom: 20px; min-height: 200px; border: 2px dashed #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999;">
                            <span>📷 Tap to capture photo</span>
                        </div>
                        
                        <input type="file" id="photoInput" accept="image/*" capture="environment" style="display: none;">
                        
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="document.getElementById('photoInput').click()" style="background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 4px; cursor: pointer; font-size: 16px;">📷 Capture</button>
                            <button onclick="closePhotoCaptureModal()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 4px; cursor: pointer; font-size: 16px;">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', photoCaptureModal);
            
            // Setup photo capture
            document.getElementById('photoInput').addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        document.getElementById('photoPreview').innerHTML = 
                            `<img src="${e.target.result}" style="max-width: 100%; max-height: 300px; border-radius: 4px;">`;
                        
                        // Save photo after 2 seconds
                        setTimeout(() => {
                            saveRequiredPhoto(jobId, photoType, file);
                        }, 2000);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Save required photo with Firebase Storage upload
        function saveRequiredPhoto(jobId, photoType, file) {
            console.log('💾 Saving required photo:', jobId, photoType);
            
            // Upload to Firebase Storage
            if (storage && window.installerData) {
                const fileName = `required_${jobId}_${photoType}_${Date.now()}.jpg`;
                const storageRef = storage.ref();
                const photoRef = storageRef.child(`job-photos/${window.installerData.id}/${fileName}`);
                
                const uploadTask = photoRef.put(file);
                
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('📷 Required photo upload progress:', progress + '%');
                    },
                    (error) => {
                        console.error('❌ Required photo upload error:', error);
                        alert('❌ Error uploading required photo: ' + error.message);
                        closePhotoCaptureModal();
                    },
                    () => {
                        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                            console.log('✅ Required photo uploaded:', downloadURL);
                            
                            // Save photo metadata to Firestore
                            const photoData = {
                                jobId: jobId,
                                installerId: window.installerData.id,
                                installerName: window.installerData.name,
                                category: 'required_pre_job',
                                subCategory: photoType,
                                photoUrl: downloadURL,
                                fileName: fileName,
                                notes: `Required pre-job photo: ${photoType.replace('_', ' ')}`,
                                capturedAt: new Date().toISOString(),
                                fileSize: file.size,
                                tags: ['required', 'pre-job', photoType]
                            };
                            
                            db.collection('photos').add(photoData)
                            .then(() => {
                                console.log('✅ Required photo metadata saved to Firestore');
                                
                                // Mark photo as captured locally
                                if (window.requiredJobPhotos && window.requiredJobPhotos[jobId]) {
                                    window.requiredJobPhotos[jobId][photoType] = true;
                                }
                                
                                closePhotoCaptureModal();
                                showPhotoSuccess(photoType);
                            })
                            .catch(error => {
                                console.error('❌ Error saving photo metadata:', error);
                                alert('❌ Error saving photo metadata: ' + error.message);
                                closePhotoCaptureModal();
                            });
                        }).catch(error => {
                            console.error('❌ Error getting download URL:', error);
                            alert('❌ Error getting photo URL: ' + error.message);
                            closePhotoCaptureModal();
                        });
                    }
                );
            } else {
                console.error('❌ Storage not initialized or installer data not available');
                alert('❌ Storage not available');
                closePhotoCaptureModal();
            }
        }
        
        // Show photo success feedback
        function showPhotoSuccess(photoType) {
            const feedback = document.createElement('div');
            feedback.style.cssText = `
                position: fixed; top: 20px; right: 20px; background: #28a745; color: white; 
                padding: 10px 20px; border-radius: 4px; z-index: 50000; font-size: 14px;
            `;
            feedback.textContent = `✅ ${photoType.replace('_', ' ')} captured`;
            document.body.appendChild(feedback);
            
            setTimeout(() => feedback.remove(), 3000);
        }
        
        // Check all required photos and start job
        function checkAllRequiredPhotos(jobId) {
            const requiredPhotos = window.requiredJobPhotos[jobId];
            const requiredTypes = ['front_building', 'left_side', 'right_side', 'rear_property'];
            
            const missingPhotos = requiredTypes.filter(type => !requiredPhotos[type]);
            
            if (missingPhotos.length > 0) {
                alert(`❌ Missing required photos:\n${missingPhotos.map(type => type.replace('_', ' ').toUpperCase()).join('\n')}`);
                return;
            }
            
            // All required photos captured - start job
            console.log('🚀 All required photos captured, starting job:', jobId);
            updateJobStatusToValue(jobId, 'in_progress');
            closeRequiredPhotosModal();
            
            // Show success
            const success = document.createElement('div');
            success.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: #28a745; color: white; padding: 20px; border-radius: 8px; 
                z-index: 60000; font-size: 16px; font-weight: bold; text-align: center;
            `;
            success.innerHTML = '🚀 Job Started Successfully!<br>Status: In Progress';
            document.body.appendChild(success);
            
            setTimeout(() => success.remove(), 3000);
        }
        
        // Update job status to specific value
        function updateJobStatusToValue(jobId, status) {
            if (db) {
                const updateData = {
                    status: status,
                    statusUpdated: new Date().toISOString(),
                    statusUpdatedBy: window.installerData ? window.installerData.name : 'Unknown Installer'
                };
                
                db.collection('jobs').doc(jobId).update(updateData)
                .then(() => {
                    console.log('✅ Status updated successfully:', status);
                    
                    // Reload jobs to show updated status
                    if (window.installerData) {
                        loadInstallerJobsWithCalendar(window.installerData);
                    }
                })
                .catch(error => {
                    console.error('❌ Error updating status:', error);
                    alert('❌ Error updating status: ' + error.message);
                });
            }
        }
        
        // Close required photos modal
        function closeRequiredPhotosModal() {
            const modal = document.getElementById('requiredPhotosModal');
            if (modal) modal.remove();
        }
        
        // Close photo capture modal
        function closePhotoCaptureModal() {
            const modal = document.getElementById('photoCaptureModal');
            if (modal) modal.remove();
        }
