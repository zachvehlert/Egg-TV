// Keke TV Extension Popup Script
// Handles the extension popup interface

document.addEventListener('DOMContentLoaded', async function() {
    const statusElement = document.getElementById('status');
    const serverUrlInput = document.getElementById('serverUrl');
    const enableToggle = document.getElementById('enableToggle');
    const saveBtn = document.getElementById('saveBtn');
    
    let currentConfig = {
        enabled: true,
        serverUrl: 'http://localhost:5000'
    };
    
    // Load current configuration
    async function loadConfig() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'getConfig' });
            currentConfig = response;
            
            // Update UI with current settings
            serverUrlInput.value = currentConfig.serverUrl;
            enableToggle.classList.toggle('active', currentConfig.enabled);
            
            await testConnection();
        } catch (error) {
            console.error('Failed to load config:', error);
            showStatus('Error loading settings', 'disconnected');
        }
    }
    
    // Test connection to server
    async function testConnection() {
        showStatus('Testing connection...', 'disconnected');
        
        try {
            const result = await chrome.runtime.sendMessage({
                type: 'testConnection',
                serverUrl: currentConfig.serverUrl
            });
            
            if (result.success) {
                showStatus(`Connected to Keke TV v${result.version}`, 'connected');
            } else {
                showStatus(`Connection failed: ${result.error}`, 'disconnected');
            }
        } catch (error) {
            showStatus(`Connection error: ${error.message}`, 'disconnected');
        }
    }
    
    // Update status display
    function showStatus(message, type) {
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
    }
    
    // Save configuration
    async function saveConfig() {
        const newConfig = {
            enabled: enableToggle.classList.contains('active'),
            serverUrl: serverUrlInput.value.trim() || 'http://localhost:5000'
        };
        
        // Validate URL format
        try {
            new URL(newConfig.serverUrl);
        } catch (error) {
            showStatus('Invalid server URL format', 'disconnected');
            return;
        }
        
        try {
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;
            
            const response = await chrome.runtime.sendMessage({
                type: 'setConfig',
                config: newConfig
            });
            
            if (response.success) {
                currentConfig = newConfig;
                showStatus('Settings saved successfully', 'connected');
                
                // Test connection with new settings
                setTimeout(testConnection, 500);
            } else {
                showStatus(`Save failed: ${response.error}`, 'disconnected');
            }
        } catch (error) {
            showStatus(`Save error: ${error.message}`, 'disconnected');
        } finally {
            saveBtn.textContent = 'Save Settings';
            saveBtn.disabled = false;
        }
    }
    
    // Event listeners
    enableToggle.addEventListener('click', function() {
        this.classList.toggle('active');
    });
    
    serverUrlInput.addEventListener('input', function() {
        // Remove trailing slashes
        this.value = this.value.replace(/\/+$/, '');
    });
    
    serverUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveConfig();
        }
    });
    
    saveBtn.addEventListener('click', saveConfig);
    
    // Auto-save when toggle changes
    enableToggle.addEventListener('click', function() {
        setTimeout(saveConfig, 100); // Small delay to ensure class toggle completes
    });
    
    // Load initial configuration
    await loadConfig();
    
    // Refresh connection status every 30 seconds
    setInterval(testConnection, 30000);
});