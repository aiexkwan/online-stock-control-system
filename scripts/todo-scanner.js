#!/usr/bin/env node

/**
 * TODO Scanner Script
 * 掃描同報告項目中嘅 TODO 標記
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const minimist = require('minimist');

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  string: ['format', 'output'],
  boolean: ['help', 'verbose'],
  default: {
    format: 'markdown',
    verbose: false,
  },
  alias: {
    f: 'format',
    o: 'output',
    v: 'verbose',
    h: 'help',
  },
});

if (argv.help) {
  console.log(`
TODO Scanner - TypeScript Migration and Technical Debt Tracker

Usage: todo-scanner [options]

Options:
  -f, --format <type>    Output format: markdown, json, html (default: markdown)
  -o, --output <file>    Output file path (default: stdout)
  -v, --verbose          Verbose output
  -h, --help            Show help

Examples:
  npm run scan:todo
  npm run scan:todo -- --format=json --output=todos.json
  npm run scan:todo -- --format=html --output=report.html
`);
  process.exit(0);
}

// Load configuration
let config;
try {
  config = require('../.todo-scanner.config.js');
} catch (e) {
  console.error('Error loading config:', e.message);
  process.exit(1);
}

// TODO collection
const todos = [];
const stats = {
  totalFiles: 0,
  totalTodos: 0,
  byCategory: {},
  byPriority: {},
  byFile: {},
  byOwner: {},
};

// Scan files for TODOs
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  if (argv.verbose) {
    console.log(`Scanning: ${relativePath}`);
  }

  let fileHasTodos = false;

  // Check each pattern
  Object.entries(config.patterns).forEach(([key, patternConfig]) => {
    const { pattern, fields, category } = patternConfig;
    const regex = new RegExp(pattern, 'gm');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1].trim();

      // Extract fields
      const todo = {
        file: relativePath,
        line: lineNumber,
        category,
        text: line,
        match: match[0],
      };

      // Map captured groups to fields
      fields.forEach((field, index) => {
        todo[field] = match[index + 1] || null;
      });

      // Determine priority
      if (todo.priority) {
        todo.priorityLabel = config.priorityMap[`P${todo.priority}`]?.label || 'Unknown';
        todo.priorityWeight = config.priorityMap[`P${todo.priority}`]?.weight || 0;
      } else if (todo.type && ['FIXME', 'BUG'].includes(todo.type)) {
        todo.priority = 'P1';
        todo.priorityLabel = 'Critical';
        todo.priorityWeight = 100;
      } else {
        todo.priority = 'P3';
        todo.priorityLabel = 'Nice to have';
        todo.priorityWeight = 10;
      }

      todos.push(todo);
      fileHasTodos = true;

      // Update stats
      stats.totalTodos++;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      stats.byPriority[todo.priority] = (stats.byPriority[todo.priority] || 0) + 1;
      stats.byFile[relativePath] = (stats.byFile[relativePath] || 0) + 1;
      if (todo.owner) {
        stats.byOwner[todo.owner] = (stats.byOwner[todo.owner] || 0) + 1;
      }
    }
  });

  if (fileHasTodos) {
    stats.totalFiles++;
  }
}

// Generate markdown report
function generateMarkdown() {
  const report = [];

  report.push('# TODO Scanner Report\n');
  report.push(`Generated: ${new Date().toISOString()}\n`);

  // Summary stats
  report.push('## Summary\n');
  report.push(`- Total TODOs: ${stats.totalTodos}`);
  report.push(`- Files with TODOs: ${stats.totalFiles}`);
  report.push('');

  // By priority
  report.push('### By Priority\n');
  report.push('| Priority | Count | Percentage |');
  report.push('|----------|-------|------------|');
  Object.entries(stats.byPriority)
    .sort(([a], [b]) => (config.priorityMap[a]?.weight || 0) - (config.priorityMap[b]?.weight || 0))
    .reverse()
    .forEach(([priority, count]) => {
      const percentage = ((count / stats.totalTodos) * 100).toFixed(1);
      const label = config.priorityMap[priority]?.label || priority;
      report.push(`| ${label} (${priority}) | ${count} | ${percentage}% |`);
    });
  report.push('');

  // By category
  report.push('### By Category\n');
  report.push('| Category | Count | Percentage |');
  report.push('|----------|-------|------------|');
  Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      const percentage = ((count / stats.totalTodos) * 100).toFixed(1);
      report.push(`| ${category} | ${count} | ${percentage}% |`);
    });
  report.push('');

  // Detailed list
  report.push('## Detailed TODO List\n');

  // Group by category then priority
  const grouped = {};
  todos.forEach(todo => {
    if (!grouped[todo.category]) {
      grouped[todo.category] = {};
    }
    if (!grouped[todo.category][todo.priority]) {
      grouped[todo.category][todo.priority] = [];
    }
    grouped[todo.category][todo.priority].push(todo);
  });

  Object.entries(grouped).forEach(([category, priorities]) => {
    report.push(`### ${category}\n`);

    Object.entries(priorities)
      .sort(
        ([a], [b]) => (config.priorityMap[b]?.weight || 0) - (config.priorityMap[a]?.weight || 0)
      )
      .forEach(([priority, todoList]) => {
        const label = config.priorityMap[priority]?.label || priority;
        report.push(`#### ${label} (${priority})\n`);

        todoList
          .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
          .forEach(todo => {
            report.push(`- \`${todo.file}:${todo.line}\``);
            if (todo.description) {
              report.push(`  - ${todo.description}`);
            } else {
              report.push(`  - ${todo.text}`);
            }
            if (todo.owner) {
              report.push(`  - Owner: ${todo.owner}`);
            }
            if (todo.target) {
              report.push(`  - Target: ${todo.target}`);
            }
            report.push('');
          });
      });
  });

  // Top files
  report.push('## Top Files with TODOs\n');
  report.push('| File | TODO Count |');
  report.push('|------|------------|');
  Object.entries(stats.byFile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([file, count]) => {
      report.push(`| ${file} | ${count} |`);
    });

  return report.join('\n');
}

// Generate JSON report
function generateJSON() {
  return JSON.stringify(
    {
      metadata: {
        generated: new Date().toISOString(),
        totalTodos: stats.totalTodos,
        totalFiles: stats.totalFiles,
      },
      statistics: stats,
      todos: todos.sort(
        (a, b) => b.priorityWeight - a.priorityWeight || a.file.localeCompare(b.file)
      ),
    },
    null,
    2
  );
}

// Generate HTML report
function generateHTML() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>TODO Scanner Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1, h2, h3 { color: #333; }
    .stats { display: flex; gap: 20px; margin: 20px 0; }
    .stat-card { flex: 1; padding: 15px; background: #f8f9fa; border-radius: 4px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; color: #007bff; }
    .stat-label { color: #666; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f8f9fa; font-weight: bold; }
    tr:hover { background: #f8f9fa; }
    .priority-P1 { color: #dc3545; font-weight: bold; }
    .priority-P2 { color: #ffc107; font-weight: bold; }
    .priority-P3 { color: #28a745; }
    .todo-item { margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #007bff; }
    .file-link { font-family: monospace; color: #007bff; }
    .filters { margin: 20px 0; }
    .filter-btn { padding: 5px 10px; margin: 0 5px; border: 1px solid #ddd; background: white; cursor: pointer; }
    .filter-btn.active { background: #007bff; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📋 TODO Scanner Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${stats.totalTodos}</div>
        <div class="stat-label">Total TODOs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalFiles}</div>
        <div class="stat-label">Files with TODOs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.byPriority.P1 || 0}</div>
        <div class="stat-label">Critical (P1)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.byPriority.P2 || 0}</div>
        <div class="stat-label">Important (P2)</div>
      </div>
    </div>
    
    <h2>TODO Details</h2>
    <div class="filters">
      <button class="filter-btn active" onclick="filterTodos('all')">All</button>
      <button class="filter-btn" onclick="filterTodos('P1')">P1 Critical</button>
      <button class="filter-btn" onclick="filterTodos('P2')">P2 Important</button>
      <button class="filter-btn" onclick="filterTodos('P3')">P3 Nice to have</button>
    </div>
    
    <table id="todoTable">
      <thead>
        <tr>
          <th>File</th>
          <th>Line</th>
          <th>Priority</th>
          <th>Category</th>
          <th>Description</th>
          <th>Owner</th>
          <th>Target</th>
        </tr>
      </thead>
      <tbody>
        ${todos
          .map(
            todo => `
          <tr class="todo-row priority-${todo.priority}" data-priority="${todo.priority}">
            <td><span class="file-link">${todo.file}</span></td>
            <td>${todo.line}</td>
            <td class="priority-${todo.priority}">${todo.priorityLabel}</td>
            <td>${todo.category}</td>
            <td>${todo.description || todo.text}</td>
            <td>${todo.owner || '-'}</td>
            <td>${todo.target || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  
  <script>
    function filterTodos(priority) {
      const rows = document.querySelectorAll('.todo-row');
      const buttons = document.querySelectorAll('.filter-btn');
      
      buttons.forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      rows.forEach(row => {
        if (priority === 'all' || row.dataset.priority === priority) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

  return html;
}

// Main execution
function main() {
  // Get files to scan
  const files = [];
  config.include.forEach(pattern => {
    const matches = glob.sync(pattern, { ignore: config.exclude });
    files.push(...matches);
  });

  if (argv.verbose) {
    console.log(`Found ${files.length} files to scan`);
  }

  // Scan all files
  files.forEach(scanFile);

  // Generate report
  let output;
  switch (argv.format) {
    case 'json':
      output = generateJSON();
      break;
    case 'html':
      output = generateHTML();
      break;
    case 'markdown':
    default:
      output = generateMarkdown();
  }

  // Output result
  if (argv.output) {
    fs.writeFileSync(argv.output, output);
    console.log(`Report written to: ${argv.output}`);
  } else {
    console.log(output);
  }

  // Exit with appropriate code
  if (stats.byPriority.P1 > (config.thresholds?.pullRequest?.maxP1 || 5)) {
    process.exit(1); // Fail if too many P1s
  }
  process.exit(0);
}

// Run scanner
main();
