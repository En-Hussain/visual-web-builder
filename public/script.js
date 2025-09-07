// Visual Web Builder - Main JavaScript File
// Block external library errors completely
window.addEventListener('error', function(e) {
    if (e.filename && (e.filename.includes('socket.io') || e.filename.includes('three.min.js') || e.filename.includes('game3d.js') || e.filename.includes('three.js'))) {
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
});

// Override console methods to block external library errors
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('socket.io') || message.includes('three.min.js') || message.includes('game3d.js') || message.includes('io is not defined') || message.includes('three.js') || message.includes('deprecated')) {
        return;
    }
    originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('socket.io') || message.includes('three.min.js') || message.includes('game3d.js') || message.includes('three.js') || message.includes('deprecated')) {
        return;
    }
    originalConsoleWarn.apply(console, args);
};

console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('socket.io') || message.includes('three.min.js') || message.includes('game3d.js') || message.includes('three.js')) {
        return;
    }
    originalConsoleLog.apply(console, args);
};

// Block script loading for external libraries
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    if (tagName.toLowerCase() === 'script') {
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
            if (name === 'src' && (value.includes('socket.io') || value.includes('three.min.js') || value.includes('game3d.js') || value.includes('three.js'))) {
                return; // Block loading
            }
            return originalSetAttribute.call(this, name, value);
        };
    }
    return element;
};

class VisualWebBuilder {
    constructor() {
        this.elements = [];
        this.selectedElement = null;
        this.history = [];
        this.historyIndex = -1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProjects();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // Style controls
        document.getElementById('bgColor').addEventListener('change', (e) => {
            this.updateSelectedElement('background-color', e.target.value);
        });

        document.getElementById('textColor').addEventListener('change', (e) => {
            this.updateSelectedElement('color', e.target.value);
        });

        document.getElementById('fontSize').addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = e.target.value + 'px';
            this.updateSelectedElement('font-size', e.target.value + 'px');
        });

        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.updateSelectedElement('font-family', e.target.value);
        });
    }

    setupDragAndDrop() {
        const componentItems = document.querySelectorAll('.component-item');
        componentItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.type);
            });
        });
    }

    allowDrop(e) {
        e.preventDefault();
    }

    drop(e) {
        e.preventDefault();
        const componentType = e.dataTransfer.getData('text/plain');
        this.addElement(componentType, e.clientX, e.clientY);
    }

    addElement(type, x, y) {
        const element = this.createElement(type);
        const canvas = document.getElementById('canvas');
        
        // Remove placeholder if exists
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        // Add element to canvas
        canvas.appendChild(element);
        this.elements.push(element);
        
        // Select the new element
        this.selectElement(element);
        
        // Save to history
        this.saveToHistory();
    }

    createElement(type) {
        const element = document.createElement('div');
        element.className = 'canvas-element';
        element.dataset.type = type;
        
        let content = '';
        let tag = 'div';
        
        switch(type) {
            case 'text':
                tag = 'p';
                content = 'Click to edit text';
                break;
            case 'heading':
                tag = 'h2';
                content = 'Click to edit heading';
                break;
            case 'button':
                tag = 'button';
                content = 'Click me';
                break;
            case 'image':
                tag = 'img';
                content = '';
                element.innerHTML = '<img src="https://via.placeholder.com/300x200?text=Image" alt="Image" style="max-width: 100%; height: auto;">';
                break;
            case 'container':
                tag = 'div';
                content = 'Container - Drag elements here';
                element.style.minHeight = '100px';
                element.style.border = '2px dashed #ccc';
                element.style.padding = '20px';
                break;
            case 'link':
                tag = 'a';
                content = 'Click here';
                element.innerHTML = '<a href="#" onclick="return false;">Click here</a>';
                break;
            case 'list':
                tag = 'ul';
                content = '';
                element.innerHTML = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
                break;
            case 'form':
                tag = 'form';
                content = '';
                element.innerHTML = `
                    <form>
                        <input type="text" placeholder="Name" style="width: 100%; margin: 5px 0; padding: 8px;">
                        <input type="email" placeholder="Email" style="width: 100%; margin: 5px 0; padding: 8px;">
                        <button type="submit" style="margin: 5px 0; padding: 8px 16px;">Submit</button>
                    </form>
                `;
                break;
        }

        if (tag !== 'div' && type !== 'image' && type !== 'list' && type !== 'form') {
            const innerElement = document.createElement(tag);
            innerElement.textContent = content;
            innerElement.contentEditable = true;
            innerElement.addEventListener('blur', () => this.saveToHistory());
            element.appendChild(innerElement);
        }

        // Add element controls
        const controls = document.createElement('div');
        controls.className = 'element-controls';
        controls.innerHTML = '×';
        controls.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeElement(element);
        });
        element.appendChild(controls);

        // Add click handler for selection
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectElement(element);
        });

        return element;
    }

    selectElement(element) {
        // Remove previous selection
        document.querySelectorAll('.canvas-element').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new element
        element.classList.add('selected');
        this.selectedElement = element;
        this.updatePropertiesPanel();
    }

    updatePropertiesPanel() {
        const panel = document.getElementById('propertiesContent');
        if (!this.selectedElement) {
            panel.innerHTML = '<p>Select an element to edit its properties</p>';
            return;
        }

        const type = this.selectedElement.dataset.type;
        panel.innerHTML = `
            <div class="form-group">
                <label>Element Type:</label>
                <input type="text" value="${type}" readonly>
            </div>
            <div class="form-group">
                <label>Width:</label>
                <input type="text" id="elementWidth" placeholder="e.g., 100px, 50%">
            </div>
            <div class="form-group">
                <label>Height:</label>
                <input type="text" id="elementHeight" placeholder="e.g., 100px, auto">
            </div>
            <div class="form-group">
                <label>Margin:</label>
                <input type="text" id="elementMargin" placeholder="e.g., 10px, 10px 20px">
            </div>
            <div class="form-group">
                <label>Padding:</label>
                <input type="text" id="elementPadding" placeholder="e.g., 10px, 10px 20px">
            </div>
            <div class="form-group">
                <label>Border:</label>
                <input type="text" id="elementBorder" placeholder="e.g., 1px solid #ccc">
            </div>
            <div class="form-group">
                <label>Border Radius:</label>
                <input type="text" id="elementBorderRadius" placeholder="e.g., 5px, 50%">
            </div>
            <div class="form-group">
                <label>Text Align:</label>
                <select id="elementTextAlign">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="builder.applyProperties()">Apply Properties</button>
        `;

        // Add event listeners for property inputs
        this.setupPropertyListeners();
    }

    setupPropertyListeners() {
        const inputs = ['elementWidth', 'elementHeight', 'elementMargin', 'elementPadding', 'elementBorder', 'elementBorderRadius', 'elementTextAlign'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.applyProperties());
            }
        });
    }

    applyProperties() {
        if (!this.selectedElement) return;

        const width = document.getElementById('elementWidth')?.value;
        const height = document.getElementById('elementHeight')?.value;
        const margin = document.getElementById('elementMargin')?.value;
        const padding = document.getElementById('elementPadding')?.value;
        const border = document.getElementById('elementBorder')?.value;
        const borderRadius = document.getElementById('elementBorderRadius')?.value;
        const textAlign = document.getElementById('elementTextAlign')?.value;

        if (width) this.selectedElement.style.width = width;
        if (height) this.selectedElement.style.height = height;
        if (margin) this.selectedElement.style.margin = margin;
        if (padding) this.selectedElement.style.padding = padding;
        if (border) this.selectedElement.style.border = border;
        if (borderRadius) this.selectedElement.style.borderRadius = borderRadius;
        if (textAlign) this.selectedElement.style.textAlign = textAlign;

        this.saveToHistory();
    }

    updateSelectedElement(property, value) {
        if (this.selectedElement) {
            this.selectedElement.style[property] = value;
            this.saveToHistory();
        }
    }

    removeElement(element) {
        element.remove();
        this.elements = this.elements.filter(el => el !== element);
        if (this.selectedElement === element) {
            this.selectedElement = null;
            this.updatePropertiesPanel();
        }
        this.saveToHistory();
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            document.getElementById('canvas').innerHTML = '<div class="canvas-placeholder"><i class="fas fa-mouse-pointer"></i><p>Drag components here to start building your website</p></div>';
            this.elements = [];
            this.selectedElement = null;
            this.updatePropertiesPanel();
            this.saveToHistory();
        }
    }

    saveToHistory() {
        const canvas = document.getElementById('canvas');
        const state = canvas.innerHTML;
        
        // Remove current state if we're not at the end
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new state
        this.history.push(state);
        this.historyIndex++;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            document.getElementById('canvas').innerHTML = this.history[this.historyIndex];
            this.selectedElement = null;
            this.updatePropertiesPanel();
        }
    }

    previewWebsite() {
        const html = this.generateHTML();
        const modal = document.getElementById('previewModal');
        const iframe = document.getElementById('previewFrame');
        
        iframe.srcdoc = html;
        modal.style.display = 'block';
    }

    closePreview() {
        document.getElementById('previewModal').style.display = 'none';
    }

    saveProject() {
        document.getElementById('saveModal').style.display = 'block';
    }

    closeSaveModal() {
        document.getElementById('saveModal').style.display = 'none';
    }

    confirmSave() {
        const projectName = document.getElementById('projectName').value;
        if (!projectName) {
            alert('Please enter a project name');
            return;
        }

        const html = this.generateHTML();
        const css = this.generateCSS();
        const js = this.generateJS();

        fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectName,
                html,
                css,
                js
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Project saved successfully!');
                this.closeSaveModal();
                this.loadProjects();
            } else {
                alert('Error saving project: ' + data.message);
            }
        })
        .catch(error => {
            alert('Error saving project: ' + error.message);
        });
    }

    loadProjects() {
        fetch('/api/projects')
        .then(response => response.json())
        .then(projects => {
            const projectList = document.getElementById('projectList');
            projectList.innerHTML = '';
            
            projects.forEach(project => {
                const projectItem = document.createElement('div');
                projectItem.className = 'project-item';
                projectItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${project}</span>
                        <div>
                            <button class="btn btn-small" onclick="builder.loadProject('${project}')">Load</button>
                            <button class="btn btn-small" onclick="builder.deleteProject('${project}')" style="background: #dc3545;">Delete</button>
                        </div>
                    </div>
                `;
                projectList.appendChild(projectItem);
            });
        });
    }

    loadProject(projectName) {
        fetch(`/api/load/${projectName}`)
        .then(response => response.json())
        .then(data => {
            if (data.html) {
                document.getElementById('canvas').innerHTML = data.html;
                this.elements = Array.from(document.querySelectorAll('.canvas-element'));
                this.selectedElement = null;
                this.updatePropertiesPanel();
                this.saveToHistory();
            }
        });
    }

    deleteProject(projectName) {
        if (confirm(`Are you sure you want to delete project "${projectName}"?`)) {
            // Implementation for deleting project
            alert('Project deletion not implemented yet');
        }
    }

    exportCode() {
        const html = this.generateHTML();
        const css = this.generateCSS();
        const js = this.generateJS();

        const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <style>
${css}
    </style>
</head>
<body>
${html}
    <script>
${js}
    </script>
</body>
</html>`;

        // Download the file
        const blob = new Blob([fullHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'website.html';
        a.click();
        URL.revokeObjectURL(url);
    }

    generateHTML() {
        const canvas = document.getElementById('canvas');
        return canvas.innerHTML;
    }

    generateCSS() {
        return `
/* Generated CSS */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.canvas-element {
    margin: 10px 0;
}

/* Add your custom styles here */
        `;
    }

    generateJS() {
        return `
// Generated JavaScript
console.log('Website loaded successfully!');

// Add your custom JavaScript here
        `;
    }
}

// Global functions for HTML onclick handlers
function allowDrop(e) {
    builder.allowDrop(e);
}

function drop(e) {
    builder.drop(e);
}

function previewWebsite() {
    builder.previewWebsite();
}

function closePreview() {
    builder.closePreview();
}

function saveProject() {
    builder.saveProject();
}

function closeSaveModal() {
    builder.closeSaveModal();
}

function confirmSave() {
    builder.confirmSave();
}

function clearCanvas() {
    builder.clearCanvas();
}

function undo() {
    builder.undo();
}

function loadProjects() {
    builder.loadProjects();
}

function exportCode() {
    builder.exportCode();
}

// Initialize the builder when page loads
let builder;
document.addEventListener('DOMContentLoaded', () => {
    builder = new VisualWebBuilder();
});
