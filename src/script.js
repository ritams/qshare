// QShare - Modern File Sharing Interface
// Drag & Drop, Copy & Paste Support

class QShareInterface {
  constructor() {
    this.files = [];
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
    this.allowedTypes = null; // Allow all file types

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.dropZone = document.querySelector('.drop-zone');
    this.fileInput = document.querySelector('.file-input');
    this.fileList = document.querySelector('.file-list');
    this.shareButton = document.querySelector('.share-button');
    this.form = document.getElementById('share-form');
  }

  bindEvents() {
    // Drag and drop events
    this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this));

    // File input change
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // Copy paste support
    document.addEventListener('paste', this.handlePaste.bind(this));

    // Form submission
    this.form.addEventListener('submit', this.handleShare.bind(this));

    // Share button click (fallback)
    this.shareButton.addEventListener('click', this.handleShare.bind(this));

    // Prevent default drag behaviors
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }

  handleDragOver(e) {
    e.preventDefault();
    this.dropZone.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    // Only remove class if we're actually leaving the drop zone
    if (!this.dropZone.contains(e.relatedTarget)) {
      this.dropZone.classList.remove('dragover');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    this.dropZone.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files);
    this.addFiles(files);
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.addFiles(files);
  }

  handlePaste(e) {
    const items = Array.from(e.clipboardData.items);

    const files = items
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter(file => file !== null);

    if (files.length > 0) {
      e.preventDefault();
      this.addFiles(files);
      this.showToast('Files pasted successfully!', 'success');
    }
  }

  addFiles(newFiles) {
    const validFiles = newFiles.filter(file => this.validateFile(file));

    if (validFiles.length === 0) {
      this.showToast('No valid files selected', 'error');
      return;
    }

    // Add new files, avoiding duplicates by name
    const existingNames = new Set(this.files.map(f => f.name));
    const uniqueFiles = validFiles.filter(file => !existingNames.has(file.name));

    if (uniqueFiles.length < validFiles.length) {
      this.showToast(`${validFiles.length - uniqueFiles.length} duplicate file(s) skipped`, 'warning');
    }

    this.files.push(...uniqueFiles);
    this.updateFileList();
    this.updateShareButton();

    if (uniqueFiles.length > 0) {
      this.showToast(`${uniqueFiles.length} file(s) added successfully!`, 'success');
    }
  }

  validateFile(file) {
    if (file.size > this.maxFileSize) {
      this.showToast(`File "${file.name}" is too large (max 100MB)`, 'error');
      return false;
    }

    return true;
  }

  removeFile(index) {
    const removedFile = this.files[index];
    this.files.splice(index, 1);
    this.updateFileList();
    this.updateShareButton();
    this.showToast(`"${removedFile.name}" removed`, 'warning');
  }

  updateFileList() {
    if (this.files.length === 0) {
      this.fileList.style.display = 'none';
      return;
    }

    this.fileList.style.display = 'block';
    this.fileList.innerHTML = `
      <div class="file-list-title">
        📎 Selected Files (${this.files.length})
      </div>
      ${this.files.map((file, index) => this.createFileItem(file, index)).join('')}
    `;
  }

  createFileItem(file, index) {
    const icon = this.getFileIcon(file.type);
    const size = this.formatFileSize(file.size);

    return `
      <div class="file-item">
        <div class="file-icon">${icon}</div>
        <div class="file-info">
          <div class="file-name">${this.escapeHtml(file.name)}</div>
          <div class="file-size">${size}</div>
        </div>
        <button class="remove-file" onclick="qshare.removeFile(${index})" title="Remove file">
          ✕
        </button>
      </div>
    `;
  }

  getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('text')) return '📝';
    return '📄';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  updateShareButton() {
    const hasFiles = this.files.length > 0;
    this.shareButton.disabled = !hasFiles;
    this.shareButton.textContent = hasFiles ? 'Share Files' : 'Select Files First';
  }

  handleShare(e) {
    e.preventDefault();

    if (this.files.length === 0) {
      this.showToast('Please select files to share', 'error');
      return;
    }

    this.shareButton.disabled = true;
    this.shareButton.innerHTML = '<span class="loading"></span> Sharing...';

    // Create FormData and submit via fetch
    const formData = new FormData();
    this.files.forEach(file => {
      formData.append('file', file);
    });

    fetch('/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .then(html => {
      // Replace the current page with the response (QR code page)
      document.documentElement.innerHTML = html;
    })
    .catch(error => {
      console.error('Upload failed:', error);
      this.showToast('Failed to share files. Please try again.', 'error');
      this.shareButton.disabled = false;
      this.shareButton.innerHTML = 'Share Files';
    });
  }

  showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + V for paste
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    // Focus on drop zone to ensure paste events are captured
    document.querySelector('.drop-zone').focus();
  }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.qshare = new QShareInterface();
});
