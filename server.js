const express = require('express');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Serve the main builder page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to save project
app.post('/api/save', (req, res) => {
    try {
        const { projectName, html, css, js } = req.body;
        const projectDir = path.join(__dirname, 'projects', projectName);
        
        // Create project directory
        fs.ensureDirSync(projectDir);
        
        // Save files
        fs.writeFileSync(path.join(projectDir, 'index.html'), html);
        fs.writeFileSync(path.join(projectDir, 'style.css'), css);
        fs.writeFileSync(path.join(projectDir, 'script.js'), js);
        
        res.json({ success: true, message: 'Project saved successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API endpoint to load project
app.get('/api/load/:projectName', (req, res) => {
    try {
        const projectName = req.params.projectName;
        const projectDir = path.join(__dirname, 'projects', projectName);
        
        const html = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');
        const css = fs.readFileSync(path.join(projectDir, 'style.css'), 'utf8');
        const js = fs.readFileSync(path.join(projectDir, 'script.js'), 'utf8');
        
        res.json({ html, css, js });
    } catch (error) {
        res.status(404).json({ success: false, message: 'Project not found' });
    }
});

// API endpoint to list projects
app.get('/api/projects', (req, res) => {
    try {
        const projectsDir = path.join(__dirname, 'projects');
        const projects = fs.readdirSync(projectsDir).filter(item => 
            fs.statSync(path.join(projectsDir, item)).isDirectory()
        );
        res.json(projects);
    } catch (error) {
        res.json([]);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Visual Web Builder is running on http://localhost:${PORT}`);
    console.log(`📁 Projects will be saved in: ${path.join(__dirname, 'projects')}`);
    console.log(`\n💡 To start building, open: http://localhost:${PORT}`);
    console.log(`\n🎯 Commands:`);
    console.log(`   npm start  - Start the builder`);
    console.log(`   npm run    - Start the builder`);
    console.log(`   npm run dev - Start in development mode`);
});
