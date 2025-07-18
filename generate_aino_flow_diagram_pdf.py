#!/usr/bin/env python3
"""
AINO Aviation Intelligence Platform - System Flow Diagram PDF Generator
Creates a comprehensive PDF diagram showing the complete system architecture
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.font_manager as fm
import numpy as np
from datetime import datetime

def create_aino_flow_diagram():
    """Create comprehensive AINO system flow diagram as PDF"""
    
    # Create figure with dark background
    fig, ax = plt.subplots(1, 1, figsize=(16, 12))
    fig.patch.set_facecolor('#0F172A')
    ax.set_facecolor('#0F172A')
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    # Title
    ax.text(8, 11.5, 'AINO Aviation Intelligence Platform', 
            fontsize=22, fontweight='bold', color='white', ha='center')
    ax.text(8, 11.1, 'System Architecture & Data Flow', 
            fontsize=16, color='#94A3B8', ha='center')
    
    # Color scheme
    colors = {
        'data_source': '#3B82F6',
        'processing': '#10B981', 
        'ml_engine': '#F59E0B',
        'alerts': '#EF4444',
        'dashboard': '#6366F1',
        'features': '#1E293B',
        'text': '#F1F5F9',
        'subtitle': '#94A3B8'
    }
    
    # Layer 1: Data Sources
    ax.text(0.5, 10.2, '1. DATA SOURCES', fontsize=14, fontweight='bold', color=colors['text'])
    
    # Data source boxes
    sources = [
        ('ADS-B Exchange', '17 Virgin Atlantic\nReal-time positions', 1, 9.5),
        ('AVWX Weather', 'METAR/TAF data\n30-min refresh', 3.5, 9.5),
        ('News API', 'Aviation intelligence\nSentiment analysis', 6, 9.5),
        ('FAA NOTAM', 'Airspace alerts\nTFR/SIGMET', 8.5, 9.5),
        ('EUROCONTROL', 'Flow management\nDelay data', 11, 9.5),
        ('Virgin Atlantic', 'Fleet data\nOperational metrics', 13.5, 9.5)
    ]
    
    for title, desc, x, y in sources:
        rect = patches.Rectangle((x-0.6, y-0.4), 1.2, 0.8, 
                               facecolor=colors['data_source'], 
                               edgecolor='white', linewidth=1)
        ax.add_patch(rect)
        ax.text(x, y+0.1, title, fontsize=9, fontweight='bold', 
                color='white', ha='center')
        ax.text(x, y-0.2, desc, fontsize=7, color='white', ha='center')
    
    # Arrow down
    ax.annotate('', xy=(8, 8.5), xytext=(8, 9.0),
                arrowprops=dict(arrowstyle='->', color='#64748B', lw=2))
    
    # Layer 2: Data Processing
    ax.text(0.5, 8.2, '2. DATA COLLECTION & PROCESSING', fontsize=14, fontweight='bold', color=colors['text'])
    
    processing_modules = [
        ('Flight Data Processor', 'Route detection\nPosition tracking\nProgress calculation', 2, 7.5),
        ('Weather Intelligence', 'Conditions analysis\nImpact assessment\nAlert generation', 5.5, 7.5),
        ('News Analytics', 'Content classification\nSentiment analysis\nEconomic impact', 9, 7.5),
        ('ML Feature Engine', 'Feature extraction\nData normalization\nModel preparation', 12.5, 7.5)
    ]
    
    for title, desc, x, y in processing_modules:
        rect = patches.Rectangle((x-0.8, y-0.4), 1.6, 0.8, 
                               facecolor=colors['processing'], 
                               edgecolor='white', linewidth=1)
        ax.add_patch(rect)
        ax.text(x, y+0.1, title, fontsize=9, fontweight='bold', 
                color='white', ha='center')
        ax.text(x, y-0.2, desc, fontsize=7, color='white', ha='center')
    
    # Arrow down
    ax.annotate('', xy=(8, 6.5), xytext=(8, 7.0),
                arrowprops=dict(arrowstyle='->', color='#64748B', lw=2))
    
    # Layer 3: ML Prediction Engines
    ax.text(0.5, 6.2, '3. ML PREDICTION ENGINES', fontsize=14, fontweight='bold', color=colors['text'])
    
    ml_engines = [
        ('XGBoost Delay', '17 features\n70% confidence\nWeather integration', 2, 5.5),
        ('Random Forest', 'Connection risk\n92% accuracy\n4.23min MAE', 4.5, 5.5),
        ('Digital Twin', 'Performance calc\nFuel optimization\nVirgin Atlantic fleet', 7, 5.5),
        ('Scenario Engine', 'What-if analysis\nFailure modeling\nCost impact', 9.5, 5.5),
        ('Neural Network', 'Deep learning\nPattern recognition\nPredictive analytics', 12, 5.5)
    ]
    
    for title, desc, x, y in ml_engines:
        rect = patches.Rectangle((x-0.7, y-0.4), 1.4, 0.8, 
                               facecolor=colors['ml_engine'], 
                               edgecolor='white', linewidth=1)
        ax.add_patch(rect)
        ax.text(x, y+0.1, title, fontsize=9, fontweight='bold', 
                color='white', ha='center')
        ax.text(x, y-0.2, desc, fontsize=7, color='white', ha='center')
    
    # Arrow down
    ax.annotate('', xy=(8, 4.5), xytext=(8, 5.0),
                arrowprops=dict(arrowstyle='->', color='#64748B', lw=2))
    
    # Layer 4: Alert Generation
    ax.text(0.5, 4.2, '4. ALERT GENERATION & ANALYSIS', fontsize=14, fontweight='bold', color=colors['text'])
    
    alert_types = [
        ('Digital Twin Alerts', 'Weather impact\nPeak hour ops\nFuel efficiency', 2, 3.5),
        ('Operational Alerts', 'Connection risk\nStand conflicts\nSlot compliance', 5, 3.5),
        ('Predictive Alerts', 'Delay probability\nDiversion risk\nNetwork health', 8, 3.5),
        ('Emergency Alerts', 'System failures\nMedical events\nSecurity issues', 11, 3.5)
    ]
    
    for title, desc, x, y in alert_types:
        rect = patches.Rectangle((x-0.8, y-0.4), 1.6, 0.8, 
                               facecolor=colors['alerts'], 
                               edgecolor='white', linewidth=1)
        ax.add_patch(rect)
        ax.text(x, y+0.1, title, fontsize=9, fontweight='bold', 
                color='white', ha='center')
        ax.text(x, y-0.2, desc, fontsize=7, color='white', ha='center')
    
    # Arrow down
    ax.annotate('', xy=(8, 2.5), xytext=(8, 3.0),
                arrowprops=dict(arrowstyle='->', color='#64748B', lw=2))
    
    # Layer 5: Dashboard Visualization
    ax.text(0.5, 2.2, '5. DASHBOARD VISUALIZATION', fontsize=14, fontweight='bold', color=colors['text'])
    
    dashboards = [
        ('AI Ops Dashboard', 'Live flight tracking\n30-second refresh\nReal-time alerts', 2.5, 1.5),
        ('ML Analytics', 'Model performance\nPrediction display\nConfidence scores', 5.5, 1.5),
        ('Operational Tools', 'What-if scenarios\nDiversion planning\nFuel optimization', 8.5, 1.5),
        ('Intelligence Center', 'News analysis\nEconomic impact\nRisk assessment', 11.5, 1.5)
    ]
    
    for title, desc, x, y in dashboards:
        rect = patches.Rectangle((x-0.8, y-0.4), 1.6, 0.8, 
                               facecolor=colors['dashboard'], 
                               edgecolor='white', linewidth=1)
        ax.add_patch(rect)
        ax.text(x, y+0.1, title, fontsize=9, fontweight='bold', 
                color='white', ha='center')
        ax.text(x, y-0.2, desc, fontsize=7, color='white', ha='center')
    
    # Key Performance Metrics Box
    metrics_rect = patches.Rectangle((0.5, 0.2), 13, 0.6, 
                                   facecolor=colors['features'], 
                                   edgecolor='white', linewidth=1)
    ax.add_patch(metrics_rect)
    ax.text(7, 0.7, 'KEY PERFORMANCE METRICS', fontsize=12, fontweight='bold', 
            color='white', ha='center')
    
    metrics_text = [
        '• 17 Virgin Atlantic flights tracked (100% authentic ADS-B data)',
        '• 30-second refresh cycle for real-time operations',
        '• 83,000+ global airport database',
        '• XGBoost: 70% confidence, Random Forest: 92% accuracy',
        '• Authentic aircraft fuel capacities (A350: 156,000kg, B787: 126,372kg)',
        '• Weather-accurate predictive alerts with multi-source integration'
    ]
    
    for i, metric in enumerate(metrics_text):
        ax.text(1, 0.55 - i*0.05, metric, fontsize=8, color='#10B981', ha='left')
    
    plt.tight_layout()
    return fig

def main():
    """Generate AINO flow diagram PDF"""
    print("🔄 Generating AINO Aviation Intelligence Platform Flow Diagram PDF...")
    
    # Create the diagram
    fig = create_aino_flow_diagram()
    
    # Save as PDF
    pdf_filename = 'AINO_Platform_Flow_Diagram.pdf'
    with PdfPages(pdf_filename) as pdf:
        pdf.savefig(fig, facecolor='#0F172A', bbox_inches='tight', dpi=300)
        
        # Add metadata
        d = pdf.infodict()
        d['Title'] = 'AINO Aviation Intelligence Platform - System Flow Diagram'
        d['Author'] = 'AINO Platform'
        d['Subject'] = 'System Architecture and Data Flow'
        d['Keywords'] = 'Aviation, Intelligence, ML, Virgin Atlantic, Real-time'
        d['CreationDate'] = datetime.now()
    
    plt.close(fig)
    
    print(f"✅ PDF generated successfully: {pdf_filename}")
    print(f"📊 Diagram shows complete system architecture with:")
    print(f"   • Data sources (ADS-B Exchange, AVWX, News API, FAA NOTAM)")
    print(f"   • Processing engines (Flight data, Weather, News analytics)")
    print(f"   • ML prediction models (XGBoost, Random Forest, Digital Twin)")
    print(f"   • Alert generation systems (Digital Twin, Operational, Predictive)")
    print(f"   • Dashboard visualization (AI Ops, ML Analytics, Operational Tools)")
    print(f"   • Key performance metrics and authentic data integration")

if __name__ == "__main__":
    main()