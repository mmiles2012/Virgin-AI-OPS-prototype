import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Package, Eye } from 'lucide-react';

interface DocumentationFile {
  name: string;
  description: string;
  size: string;
}

interface DocumentationResponse {
  success: boolean;
  files: DocumentationFile[];
  packageDownload: string;
}

const DocumentationDownload: React.FC = () => {
  const [files, setFiles] = useState<DocumentationFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentationFiles();
  }, []);

  const fetchDocumentationFiles = async () => {
    try {
      const response = await fetch('/api/documentation/files');
      const data: DocumentationResponse = await response.json();
      
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch documentation files:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filename: string) => {
    setDownloading(filename);
    try {
      const response = await fetch(`/api/documentation/download/${filename}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloading(null);
    }
  };

  const downloadPackage = async () => {
    setDownloading('package');
    try {
      const response = await fetch('/api/documentation/package/download');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'AINO_Documentation_Package.tar.gz';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download package:', error);
    } finally {
      setDownloading(null);
    }
  };

  const viewFile = (filename: string) => {
    window.open(`/api/documentation/view/${filename}`, '_blank');
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading documentation files...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Package className="w-5 h-5" />
            AINO Documentation Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-aero-blue-primary/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-300 font-medium mb-2">Complete Documentation Package</h3>
              <p className="text-muted-foreground text-sm mb-3">
                Download the complete AINO Documentation Package (43.6 KB) containing all manuals, 
                TRI Command Centre files, and installation guides.
              </p>
              <Button 
                onClick={downloadPackage}
                disabled={downloading === 'package'}
                className="bg-aero-blue-primary hover:bg-aero-blue-light text-foreground"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading === 'package' ? 'Downloading...' : 'Download Complete Package'}
              </Button>
            </div>
            
            <div className="text-muted-foreground text-sm">
              <strong>Package Contents:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>AINO Operators Manual (Version 2.2)</li>
                <li>Platform Capabilities Overview</li>
                <li>Enhanced TRI Command Centre Dashboard</li>
                <li>Risk Assessment Engines</li>
                <li>Installation Guide & README</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Individual Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="text-foreground font-medium">{file.name}</div>
                  <div className="text-muted-foreground text-sm">{file.description}</div>
                  <div className="text-foreground0 text-xs">{file.size}</div>
                </div>
                <div className="flex gap-2">
                  {file.name.endsWith('.md') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewFile(file.name)}
                      className="border-border text-muted-foreground hover:bg-gray-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => downloadFile(file.name)}
                    disabled={downloading === file.name}
                    className="bg-green-600 hover:bg-green-700 text-foreground"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground text-sm">
            <strong>TRI Command Centre Quick Start:</strong><br />
            Extract package → Run "streamlit run enhanced_tri_command_centre.py --server.port 8502"
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentationDownload;