// Visual Web Builder - Core Library
class VisualWebBuilder {
    constructor(options = {}) {
        this.options = {
            container: options.container || '#canvas',
            theme: options.theme || 'light',
            language: options.language || 'en',
            ...options
        };
        
        this.elements = [];
        this.selectedElement = null;
        this.history = [];
        this.historyIndex = -1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadProjects();
    }

    setupEventListeners() {
        // Style controls
        const bgColor = document.getElementById('bgColor');
        const textColor = document.getElementById('textColor');
        const fontSize = document.getElementById('fontSize');
        const fontFamily = document.getElementById('fontFamily');

        if (bgColor) {
            bgColor.addEventListener('change', (e) => {
                this.updateSelectedElement('background-color', e.target.value);
            });
        }

        if (textColor) {
            textColor.addEventListener('change', (e) => {
                this.updateSelectedElement('color', e.target.value);
            });
        }

        if (fontSize) {
            fontSize.addEventListener('input', (e) => {
                const fontSizeValue = document.getElementById('fontSizeValue');
                if (fontSizeValue) {
                    fontSizeValue.textContent = e.target.value + 'px';
                }
                this.updateSelectedElement('font-size', e.target.value + 'px');
            });
        }

        if (fontFamily) {
            fontFamily.addEventListener('change', (e) => {
                this.updateSelectedElement('font-family', e.target.value);
            });
        }
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
        const canvas = document.querySelector(this.options.container);
        
        if (!canvas) {
            console.error('Canvas container not found:', this.options.container);
            return;
        }
        
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
        if (!panel) return;
        
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
        const canvas = document.querySelector(this.options.container);
        if (!canvas) return;
        
        if (confirm('Are you sure you want to clear the canvas?')) {
            canvas.innerHTML = '<div class="canvas-placeholder"><i class="fas fa-mouse-pointer"></i><p>Drag components here to start building your website</p></div>';
            this.elements = [];
            this.selectedElement = null;
            this.updatePropertiesPanel();
            this.saveToHistory();
        }
    }

    saveToHistory() {
        const canvas = document.querySelector(this.options.container);
        if (!canvas) return;
        
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
            const canvas = document.querySelector(this.options.container);
            if (canvas) {
                canvas.innerHTML = this.history[this.historyIndex];
                this.selectedElement = null;
                this.updatePropertiesPanel();
            }
        }
    }

    generateHTML() {
        const canvas = document.querySelector(this.options.container);
        return canvas ? canvas.innerHTML : '';
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

    exportHTML() {
        const html = this.generateHTML();
        const css = this.generateCSS();
        const js = this.generateJS();

        return `<!DOCTYPE html>
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
    }

    loadProjects() {
        // Implementation for loading projects
        console.log('Loading projects...');
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualWebBuilder;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.VisualWebBuilder = VisualWebBuilder;
}
