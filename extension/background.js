// Background script with retry mechanism for failed uploads
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'POPUP_DETECTED') {
      console.log('Cookie popup detected and sent to database:', sender.tab?.url);
      updateBadge(sender.tab?.id);
    }
  });
  
  // Retry failed uploads periodically
  chrome.alarms.create('retryFailedUploads', { periodInMinutes: 30 });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'retryFailedUploads') {
      retryFailedUploads();
    }
  });
  
  async function retryFailedUploads() {
    try {
      const result = await chrome.storage.local.get(['failedUploads']);
      const failedUploads = result.failedUploads || [];
      
      if (failedUploads.length === 0) return;
      
      console.log(`🔄 Retrying ${failedUploads.length} failed uploads...`);
      
      const successful = [];
      const stillFailed = [];
      
      for (const upload of failedUploads) {
        try {
          const response = await fetch('http://localhost:3000/api/cookie-banners', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(upload)
          });
          
          if (response.ok) {
            successful.push(upload);
            console.log('✅ Retry successful for:', upload.domain);
          } else {
            stillFailed.push(upload);
          }
        } catch (error) {
          stillFailed.push(upload);
        }
      }
      
      // Update storage with remaining failed attempts
      await chrome.storage.local.set({
        failedUploads: stillFailed
      });
      
      console.log(`✅ Retry complete: ${successful.length} successful, ${stillFailed.length} still failed`);
      
    } catch (error) {
      console.error('❌ Error during retry:', error);
    }
  }
  
  async function updateBadge(tabId) {
    if (!tabId) return;
    
    try {
      // Show count from database instead of local storage
      const response = await fetch('http://localhost:3000/api/stats');
      if (response.ok) {
        const data = await response.json();
        const count = data.stats.totalBanners;
        
        chrome.action.setBadgeText({
          text: count > 0 ? count.toString() : '',
          tabId: tabId
        });
        
        chrome.action.setBadgeBackgroundColor({
          color: '#4CAF50'
        });
      }
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }