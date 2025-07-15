import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Serve AINO documentation files for download
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  
  const allowedFiles = [
    'AINO_Operators_Manual.md',
    'AINO_PLATFORM_CAPABILITIES_OVERVIEW.md',
    'enhanced_tri_command_centre.py',
    'streamlit_tri_command_centre.py',
    'tri_risk_engine.py',
    'connection_risk_engine.py',
    'replit.md'
  ];
  
  if (!allowedFiles.includes(filename)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const filePath = path.join(process.cwd(), filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath, filename);
});

// Get documentation package as ZIP
router.get('/package/download', (req, res) => {
  const packagePath = path.join(process.cwd(), 'AINO_Documentation_Package.tar.gz');
  
  if (!fs.existsSync(packagePath)) {
    return res.status(404).json({ error: 'Documentation package not found' });
  }
  
  res.download(packagePath, 'AINO_Documentation_Package.tar.gz');
});

// List available documentation files
router.get('/files', (req, res) => {
  const files = [
    {
      name: 'AINO_Operators_Manual.md',
      description: 'Complete operational manual (Version 2.2)',
      size: '~45 KB'
    },
    {
      name: 'AINO_PLATFORM_CAPABILITIES_OVERVIEW.md', 
      description: 'Executive capabilities overview',
      size: '~20 KB'
    },
    {
      name: 'enhanced_tri_command_centre.py',
      description: 'Production-ready TRI dashboard with live data',
      size: '~25 KB'
    },
    {
      name: 'streamlit_tri_command_centre.py',
      description: 'Basic TRI dashboard with enhanced features', 
      size: '~20 KB'
    },
    {
      name: 'tri_risk_engine.py',
      description: 'Core risk synthesis engine',
      size: '~15 KB'
    },
    {
      name: 'connection_risk_engine.py',
      description: 'Passenger connection risk assessment',
      size: '~12 KB'
    },
    {
      name: 'replit.md',
      description: 'Technical architecture documentation',
      size: '~35 KB'
    }
  ];
  
  res.json({ 
    success: true, 
    files,
    packageDownload: '/api/documentation/package/download'
  });
});

// Get file content as text for viewing
router.get('/view/:filename', (req, res) => {
  const { filename } = req.params;
  
  const allowedFiles = [
    'AINO_Operators_Manual.md',
    'AINO_PLATFORM_CAPABILITIES_OVERVIEW.md',
    'replit.md'
  ];
  
  if (!allowedFiles.includes(filename)) {
    return res.status(404).json({ error: 'File not available for viewing' });
  }
  
  const filePath = path.join(process.cwd(), filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ 
      success: true, 
      filename,
      content,
      size: content.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

export default router;