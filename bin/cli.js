#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');

program
  .name('visual-web-builder')
  .description('Visual Web Builder - Create websites without coding')
  .version('1.0.0');

program
  .command('start')
  .description('Start the Visual Web Builder')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('-h, --host <host>', 'Host to run on', 'localhost')
  .action((options) => {
    console.log(chalk.blue('🚀 Starting Visual Web Builder...'));
    console.log(chalk.green(`📱 Server will run on http://${options.host}:${options.port}`));
    
    const serverPath = path.join(__dirname, '..', 'server.js');
    const server = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: { ...process.env, PORT: options.port, HOST: options.host }
    });
    
    server.on('error', (err) => {
      console.error(chalk.red('❌ Error starting server:'), err);
      process.exit(1);
    });
    
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Stopping server...'));
      server.kill();
      process.exit(0);
    });
  });

program
  .command('init <project-name>')
  .description('Initialize a new project')
  .action((projectName) => {
    console.log(chalk.blue(`🎯 Creating new project: ${projectName}`));
    
    const projectDir = path.join(process.cwd(), projectName);
    
    if (fs.existsSync(projectDir)) {
      console.log(chalk.red(`❌ Directory ${projectName} already exists!`));
      process.exit(1);
    }
    
    // Create project directory
    fs.ensureDirSync(projectDir);
    
    // Copy template files
    const templateDir = path.join(__dirname, '..', 'templates');
    if (fs.existsSync(templateDir)) {
      fs.copySync(templateDir, projectDir);
    }
    
    // Create basic project structure
    const projectFiles = {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        description: 'Project created with Visual Web Builder',
        main: 'index.html',
        scripts: {
          start: 'visual-web-builder start',
          build: 'visual-web-builder build'
        }
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Welcome to ${projectName}</h1>
    <p>This project was created with Visual Web Builder</p>
    <script src="script.js"></script>
</body>
</html>`,
      'style.css': `/* ${projectName} Styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    text-align: center;
}`,
      'script.js': `// ${projectName} JavaScript
console.log('${projectName} loaded successfully!');`
    };
    
    Object.entries(projectFiles).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(projectDir, filename), content);
    });
    
    console.log(chalk.green(`✅ Project ${projectName} created successfully!`));
    console.log(chalk.yellow(`📁 Project location: ${projectDir}`));
    console.log(chalk.blue(`🚀 To start building: cd ${projectName} && visual-web-builder start`));
  });

program
  .command('build')
  .description('Build the project for production')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .action((options) => {
    console.log(chalk.blue('🔨 Building project...'));
    
    const outputDir = path.join(process.cwd(), options.output);
    fs.ensureDirSync(outputDir);
    
    // Copy public files
    const publicDir = path.join(__dirname, '..', 'public');
    if (fs.existsSync(publicDir)) {
      fs.copySync(publicDir, outputDir);
    }
    
    console.log(chalk.green(`✅ Build completed! Output: ${outputDir}`));
  });

program
  .command('serve')
  .description('Serve the built project')
  .option('-p, --port <port>', 'Port to serve on', '8080')
  .action((options) => {
    console.log(chalk.blue(`🌐 Serving project on port ${options.port}...`));
    
    const serve = spawn('npx', ['http-server', 'dist', '-p', options.port], {
      stdio: 'inherit'
    });
    
    serve.on('error', (err) => {
      console.error(chalk.red('❌ Error serving project:'), err);
      process.exit(1);
    });
  });

program.parse();
