#!/usr/bin/env python3
"""
State Officer Dashboard API
Provides endpoints for state-level and district-level data visualization
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime

# Load environment
load_dotenv()

# Create FastAPI app with minimal configuration
app = FastAPI(
    title="Sikkim State Administration API", 
    description="District-wise data for state officers",
    version="1.0.0"
)

def get_collection():
    """Connect to MongoDB Atlas and return collection"""
    uri = os.getenv("MONGO_URI")
    client = MongoClient(uri)
    db = client["sih2"]
    return db["sikkim"]

def get_district_statistics():
    """Get comprehensive district statistics from MongoDB"""
    collection = get_collection()
    
    # Get all districts
    districts = collection.distinct("district_name")
    districts = sorted([d for d in districts if d])
    
    district_stats = {}
    state_totals = {
        'total_population': 0,
        'total_households': 0,
        'total_literate': 0,
        'total_workers': 0,
        'total_records': 0
    }
    
    for district in districts:
        query = {"district_name": district}
        
        # Get all documents for this district
        docs = list(collection.find(query))
        record_count = len(docs)
        
        # Calculate aggregated statistics
        total_pop = sum(int(doc.get('TOT_P', 0)) for doc in docs)
        male_pop = sum(int(doc.get('TOT_M', 0)) for doc in docs)
        female_pop = sum(int(doc.get('TOT_F', 0)) for doc in docs)
        households = sum(int(doc.get('No_HH_Head', 0)) for doc in docs)
        literate = sum(int(doc.get('P_LIT', 0)) for doc in docs)
        illiterate = sum(int(doc.get('P_ILL', 0)) for doc in docs)
        workers = sum(int(doc.get('TOT_WORK_P', 0)) for doc in docs)
        
        # Calculate rates
        literacy_rate = round((literate / (literate + illiterate) * 100) if (literate + illiterate) > 0 else 0, 2)
        work_participation = round((workers / total_pop * 100) if total_pop > 0 else 0, 2)
        
        # Update state totals
        state_totals['total_population'] += total_pop
        state_totals['total_households'] += households
        state_totals['total_literate'] += literate
        state_totals['total_workers'] += workers
        state_totals['total_records'] += record_count
        
        # Get area names
        areas = [doc.get('Name', f"Area {i+1}") for i, doc in enumerate(docs)]
        
        district_stats[district] = {
            'district_name': district,
            'record_count': record_count,
            'population': {
                'total': total_pop,
                'male': male_pop,
                'female': female_pop,
                'gender_ratio': round((female_pop / male_pop * 1000) if male_pop > 0 else 0, 0)
            },
            'households': households,
            'education': {
                'literate': literate,
                'illiterate': illiterate,
                'literacy_rate': literacy_rate
            },
            'employment': {
                'total_workers': workers,
                'work_participation_rate': work_participation
            },
            'areas': {
                'names': areas,
                'count': len(areas)
            }
        }
    
    # Calculate state-level rates
    state_totals['literacy_rate'] = round((state_totals['total_literate'] / state_totals['total_population'] * 100) if state_totals['total_population'] > 0 else 0, 2)
    state_totals['work_participation_rate'] = round((state_totals['total_workers'] / state_totals['total_population'] * 100) if state_totals['total_population'] > 0 else 0, 2)
    
    return {
        'state': 'Sikkim',
        'districts': district_stats,
        'state_summary': state_totals,
        'timestamp': datetime.now().isoformat(),
        'total_districts': len(districts)
    }

@app.get("/")
def root():
    return {
        "message": "Sikkim State Administration API",
        "endpoints": {
            "/state-dashboard": "Complete state dashboard with all districts",
            "/district/{district_name}": "Detailed data for specific district",
            "/districts": "List of all districts",
            "/dashboard-html": "HTML dashboard for state officers"
        }
    }

@app.get("/state-dashboard")
def get_state_dashboard():
    """Get comprehensive state-level dashboard with all district data"""
    try:
        return get_district_statistics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching state data: {str(e)}")

@app.get("/districts")
def get_districts_list():
    """Get list of all districts with basic statistics"""
    try:
        data = get_district_statistics()
        return {
            "state": "Sikkim",
            "total_districts": data['total_districts'],
            "districts": [
                {
                    "name": district_name,
                    "population": stats['population']['total'],
                    "records": stats['record_count'],
                    "literacy_rate": stats['education']['literacy_rate']
                }
                for district_name, stats in data['districts'].items()
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching districts: {str(e)}")

@app.get("/district/{district_name}")
def get_district_details(district_name: str):
    """Get detailed information for a specific district"""
    try:
        collection = get_collection()
        
        # Check if district exists
        query = {"district_name": district_name}
        docs = list(collection.find(query))
        
        if not docs:
            raise HTTPException(status_code=404, detail=f"District '{district_name}' not found")
        
        # Get statistics for this district only
        all_data = get_district_statistics()
        
        if district_name not in all_data['districts']:
            raise HTTPException(status_code=404, detail=f"District '{district_name}' not found")
        
        district_data = all_data['districts'][district_name]
        
        # Add detailed records
        detailed_records = []
        for doc in docs:
            detailed_records.append({
                'area_name': doc.get('Name', 'Unknown'),
                'level': doc.get('Level', 'Unknown'),
                'population': {
                    'total': doc.get('TOT_P', 0),
                    'male': doc.get('TOT_M', 0),
                    'female': doc.get('TOT_F', 0)
                },
                'households': doc.get('No_HH_Head', 0),
                'education': {
                    'literate': doc.get('P_LIT', 0),
                    'illiterate': doc.get('P_ILL', 0)
                },
                'employment': {
                    'total_workers': doc.get('TOT_WORK_P', 0),
                    'main_workers': doc.get('MAINWORK_P', 0),
                    'marginal_workers': doc.get('MARGWORK_P', 0)
                }
            })
        
        district_data['detailed_records'] = detailed_records
        return district_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching district details: {str(e)}")

@app.get("/dashboard-html", response_class=HTMLResponse)
def get_dashboard_html():
    """Generate HTML dashboard for state officers"""
    try:
        data = get_district_statistics()
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sikkim State Administration Dashboard</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
                .header {{ background-color: #2c3e50; color: white; padding: 20px; text-align: center; }}
                .summary {{ background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                .district {{ background-color: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                .district h3 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
                .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }}
                .stat-item {{ background-color: #ecf0f1; padding: 10px; border-radius: 4px; text-align: center; }}
                .stat-value {{ font-size: 24px; font-weight: bold; color: #2c3e50; }}
                .stat-label {{ font-size: 12px; color: #7f8c8d; }}
                .timestamp {{ text-align: center; color: #7f8c8d; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏛️ Sikkim State Administration Dashboard</h1>
                <p>Comprehensive District-wise Data Overview</p>
            </div>
            
            <div class="summary">
                <h2>📊 State Summary</h2>
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-value">{data['total_districts']}</div>
                        <div class="stat-label">Total Districts</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{data['state_summary']['total_population']:,}</div>
                        <div class="stat-label">Total Population</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{data['state_summary']['total_records']:,}</div>
                        <div class="stat-label">Total Records</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{data['state_summary']['literacy_rate']}%</div>
                        <div class="stat-label">State Literacy Rate</div>
                    </div>
                </div>
            </div>
        """
        
        # Add district details
        for district_name, stats in data['districts'].items():
            html += f"""
            <div class="district">
                <h3>📍 {district_name}</h3>
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-value">{stats['record_count']}</div>
                        <div class="stat-label">Records</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{stats['population']['total']:,}</div>
                        <div class="stat-label">Population</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{stats['households']:,}</div>
                        <div class="stat-label">Households</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{stats['education']['literacy_rate']}%</div>
                        <div class="stat-label">Literacy Rate</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{stats['employment']['work_participation_rate']}%</div>
                        <div class="stat-label">Work Participation</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{stats['areas']['count']}</div>
                        <div class="stat-label">Areas Covered</div>
                    </div>
                </div>
                <p><strong>Sample Areas:</strong> {', '.join(stats['areas']['names'][:5])}</p>
            </div>
            """
        
        html += f"""
            <div class="timestamp">
                <p>📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Data Source: MongoDB Atlas</p>
            </div>
        </body>
        </html>
        """
        
        return html
        
    except Exception as e:
        return f"<h1>Error</h1><p>Failed to generate dashboard: {str(e)}</p>"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)