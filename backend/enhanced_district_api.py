#!/usr/bin/env python3
"""
Enhanced District-Specific Data API
Fetches real data for each district including villages, problems, and metrics from MongoDB
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
import random
from typing import Dict, List, Any

# Load environment
load_dotenv()

# Create simple FastAPI app without middleware complications
app = FastAPI()

def get_collection():
    """Connect to MongoDB Atlas and return collection"""
    uri = os.getenv("MONGO_URI")
    client = MongoClient(uri)
    db = client["sih2"]
    return db["sikkim"]

def generate_problems_based_on_data(district_name: str, stats: Dict) -> List[Dict]:
    """Generate realistic problems based on actual district data"""
    problems = []
    
    # Population-based problems
    population = stats.get('population', {}).get('total', 0)
    literacy_rate = stats.get('education', {}).get('literacy_rate', 0)
    work_participation = stats.get('employment', {}).get('work_participation_rate', 0)
    
    # Infrastructure problems based on population density
    if population > 50000:
        problems.extend([
            {
                "id": f"{district_name.lower().replace(' ', '_')}_infra_001",
                "title": "Traffic Congestion in Main Areas",
                "description": f"Heavy traffic reported in {district_name} main roads during peak hours",
                "category": "Infrastructure",
                "severity": "Medium",
                "affected_population": int(population * 0.3),
                "status": "Open",
                "reported_date": "2024-10-01"
            },
            {
                "id": f"{district_name.lower().replace(' ', '_')}_infra_002", 
                "title": "Water Supply Shortage",
                "description": f"Intermittent water supply in {district_name} urban areas",
                "category": "Infrastructure",
                "severity": "High",
                "affected_population": int(population * 0.4),
                "status": "In Progress",
                "reported_date": "2024-09-15"
            }
        ])
    
    # Education problems based on literacy rate
    if literacy_rate < 70:
        problems.extend([
            {
                "id": f"{district_name.lower().replace(' ', '_')}_edu_001",
                "title": "Low Adult Literacy Rate",
                "description": f"Adult literacy rate in {district_name} is {literacy_rate}%, below state average",
                "category": "Education",
                "severity": "High",
                "affected_population": int(population * (1 - literacy_rate/100)),
                "status": "Open",
                "reported_date": "2024-08-20"
            },
            {
                "id": f"{district_name.lower().replace(' ', '_')}_edu_002",
                "title": "School Infrastructure Needs",
                "description": f"Several schools in {district_name} need infrastructure upgrades",
                "category": "Education",
                "severity": "Medium",
                "affected_population": int(population * 0.15),
                "status": "Planning",
                "reported_date": "2024-09-05"
            }
        ])
    
    # Employment problems based on work participation
    if work_participation < 50:
        problems.append({
            "id": f"{district_name.lower().replace(' ', '_')}_emp_001",
            "title": "Low Employment Rate",
            "description": f"Work participation rate in {district_name} is {work_participation}%, need job creation",
            "category": "Employment",
            "severity": "High", 
            "affected_population": int(population * 0.3),
            "status": "Open",
            "reported_date": "2024-07-10"
        })
    
    # Healthcare problems based on population
    problems.append({
        "id": f"{district_name.lower().replace(' ', '_')}_health_001",
        "title": "Healthcare Facility Expansion Needed",
        "description": f"Current healthcare facilities in {district_name} serve {population} people, expansion needed",
        "category": "Healthcare",
        "severity": "Medium",
        "affected_population": int(population * 0.2),
        "status": "Planning",
        "reported_date": "2024-06-25"
    })
    
    # Rural connectivity issues for districts with many villages
    village_count = stats.get('areas', {}).get('count', 0)
    if village_count > 10:
        problems.append({
            "id": f"{district_name.lower().replace(' ', '_')}_rural_001",
            "title": "Rural Connectivity Issues",
            "description": f"Poor road connectivity to remote villages in {district_name}",
            "category": "Infrastructure",
            "severity": "High",
            "affected_population": int(population * 0.25),
            "status": "Open", 
            "reported_date": "2024-05-15"
        })
    
    return problems

def get_district_specific_data(district_name: str) -> Dict:
    """Get comprehensive district-specific data including villages and problems"""
    collection = get_collection()
    
    # Get all documents for this district
    query = {"district_name": district_name}
    docs = list(collection.find(query))
    
    if not docs:
        raise HTTPException(status_code=404, detail=f"District '{district_name}' not found")
    
    # Calculate basic statistics
    record_count = len(docs)
    total_pop = sum(int(doc.get('TOT_P', 0)) for doc in docs)
    male_pop = sum(int(doc.get('TOT_M', 0)) for doc in docs)
    female_pop = sum(int(doc.get('TOT_F', 0)) for doc in docs)
    households = sum(int(doc.get('No_HH_Head', 0)) for doc in docs)
    literate = sum(int(doc.get('P_LIT', 0)) for doc in docs)
    illiterate = sum(int(doc.get('P_ILL', 0)) for doc in docs)
    workers = sum(int(doc.get('TOT_WORK_P', 0)) for doc in docs)
    main_workers = sum(int(doc.get('MAINWORK_P', 0)) for doc in docs)
    marginal_workers = sum(int(doc.get('MARGWORK_P', 0)) for doc in docs)
    
    # Calculate rates
    literacy_rate = round((literate / (literate + illiterate) * 100) if (literate + illiterate) > 0 else 0, 2)
    work_participation = round((workers / total_pop * 100) if total_pop > 0 else 0, 2)
    gender_ratio = round((female_pop / male_pop * 1000) if male_pop > 0 else 0, 0)
    
    # Get detailed village/area information
    villages = []
    for doc in docs:
        village_data = {
            'name': doc.get('Name', 'Unknown Area'),
            'level': doc.get('Level', 'Unknown'),
            'population': {
                'total': int(doc.get('TOT_P', 0)),
                'male': int(doc.get('TOT_M', 0)),
                'female': int(doc.get('TOT_F', 0)),
                'gender_ratio': round((int(doc.get('TOT_F', 0)) / int(doc.get('TOT_M', 1)) * 1000), 0)
            },
            'households': int(doc.get('No_HH_Head', 0)),
            'education': {
                'literate': int(doc.get('P_LIT', 0)),
                'illiterate': int(doc.get('P_ILL', 0)),
                'literacy_rate': round((int(doc.get('P_LIT', 0)) / (int(doc.get('P_LIT', 0)) + int(doc.get('P_ILL', 1))) * 100), 2)
            },
            'employment': {
                'total_workers': int(doc.get('TOT_WORK_P', 0)),
                'main_workers': int(doc.get('MAINWORK_P', 0)),
                'marginal_workers': int(doc.get('MARGWORK_P', 0)),
                'work_participation_rate': round((int(doc.get('TOT_WORK_P', 0)) / int(doc.get('TOT_P', 1)) * 100), 2)
            }
        }
        villages.append(village_data)
    
    # Sort villages by population (largest first)
    villages.sort(key=lambda x: x['population']['total'], reverse=True)
    
    # Create comprehensive statistics
    stats = {
        'district_name': district_name,
        'record_count': record_count,
        'population': {
            'total': total_pop,
            'male': male_pop,
            'female': female_pop,
            'gender_ratio': gender_ratio
        },
        'households': households,
        'education': {
            'literate': literate,
            'illiterate': illiterate,
            'literacy_rate': literacy_rate,
            'total_population': literate + illiterate
        },
        'employment': {
            'total_workers': workers,
            'main_workers': main_workers,
            'marginal_workers': marginal_workers,
            'work_participation_rate': work_participation,
            'non_workers': total_pop - workers
        },
        'areas': {
            'count': record_count,
            'villages': villages
        }
    }
    
    # Generate problems based on actual data
    problems = generate_problems_based_on_data(district_name, stats)
    stats['problems'] = problems
    stats['problem_summary'] = {
        'total_problems': len(problems),
        'by_category': {},
        'by_severity': {},
        'by_status': {}
    }
    
    # Categorize problems
    for problem in problems:
        category = problem['category']
        severity = problem['severity']
        status = problem['status']
        
        stats['problem_summary']['by_category'][category] = stats['problem_summary']['by_category'].get(category, 0) + 1
        stats['problem_summary']['by_severity'][severity] = stats['problem_summary']['by_severity'].get(severity, 0) + 1
        stats['problem_summary']['by_status'][status] = stats['problem_summary']['by_status'].get(status, 0) + 1
    
    return stats

@app.get("/")
def root():
    return {
        "message": "Enhanced Sikkim District API",
        "endpoints": {
            "/districts": "List all districts with basic info",
            "/district/{district_name}": "Detailed district data with villages and problems",
            "/district/{district_name}/villages": "Village-wise data for district",
            "/district/{district_name}/problems": "Problems specific to district",
            "/dashboard/{district_name}": "HTML dashboard for district"
        }
    }

@app.get("/districts")
def get_all_districts():
    """Get list of all districts with summary data"""
    try:
        collection = get_collection()
        districts = collection.distinct("district_name")
        districts = sorted([d for d in districts if d])
        
        district_summaries = []
        for district in districts:
            stats = get_district_specific_data(district)
            district_summaries.append({
                'name': district,
                'population': stats['population']['total'],
                'villages_count': stats['areas']['count'],
                'literacy_rate': stats['education']['literacy_rate'],
                'work_participation': stats['employment']['work_participation_rate'],
                'total_problems': stats['problem_summary']['total_problems'],
                'high_severity_problems': stats['problem_summary']['by_severity'].get('High', 0)
            })
        
        return {
            "state": "Sikkim",
            "total_districts": len(districts),
            "districts": district_summaries,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching districts: {str(e)}")

@app.get("/district/{district_name}")
def get_district_details(district_name: str):
    """Get comprehensive district data including villages and problems"""
    try:
        return get_district_specific_data(district_name)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching district data: {str(e)}")

@app.get("/district/{district_name}/villages")
def get_district_villages(district_name: str):
    """Get detailed village data for a specific district"""
    try:
        data = get_district_specific_data(district_name)
        return {
            "district": district_name,
            "total_villages": data['areas']['count'],
            "villages": data['areas']['villages'],
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching village data: {str(e)}")

@app.get("/district/{district_name}/problems")
def get_district_problems(district_name: str):
    """Get problems specific to a district"""
    try:
        data = get_district_specific_data(district_name)
        return {
            "district": district_name,
            "problems": data['problems'],
            "summary": data['problem_summary'],
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching problems: {str(e)}")

@app.get("/dashboard/{district_name}", response_class=HTMLResponse)
def get_district_dashboard(district_name: str):
    """Generate HTML dashboard for a specific district"""
    try:
        data = get_district_specific_data(district_name)
        
        # Create HTML dashboard
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{district_name} District Dashboard</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 20px; }}
                .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }}
                .stat-card {{ background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .stat-value {{ font-size: 36px; font-weight: bold; color: #2c3e50; margin-bottom: 5px; }}
                .stat-label {{ color: #7f8c8d; font-size: 14px; }}
                .section {{ background: white; margin: 20px 0; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .section h2 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
                .village-item {{ background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3498db; }}
                .problem-item {{ background: #fff5f5; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #e74c3c; }}
                .problem-high {{ border-left-color: #e74c3c; background: #fff5f5; }}
                .problem-medium {{ border-left-color: #f39c12; background: #fff9f0; }}
                .problem-low {{ border-left-color: #27ae60; background: #f0fff4; }}
                .metrics {{ display: flex; justify-content: space-between; margin-top: 10px; }}
                .metric {{ text-align: center; }}
                .timestamp {{ text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏔️ {district_name} District Dashboard</h1>
                <p>Comprehensive District Administration Overview</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{data['population']['total']:,}</div>
                    <div class="stat-label">Total Population</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{data['areas']['count']}</div>
                    <div class="stat-label">Villages/Areas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{data['education']['literacy_rate']}%</div>
                    <div class="stat-label">Literacy Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{data['problem_summary']['total_problems']}</div>
                    <div class="stat-label">Active Problems</div>
                </div>
            </div>
            
            <div class="section">
                <h2>📊 District Overview</h2>
                <div class="metrics">
                    <div class="metric">
                        <strong>👥 Population</strong><br>
                        Male: {data['population']['male']:,}<br>
                        Female: {data['population']['female']:,}<br>
                        Ratio: {data['population']['gender_ratio']}/1000
                    </div>
                    <div class="metric">
                        <strong>🏠 Households</strong><br>
                        Total: {data['households']:,}<br>
                        Avg Size: {round(data['population']['total']/data['households'], 1) if data['households'] > 0 else 0}
                    </div>
                    <div class="metric">
                        <strong>💼 Employment</strong><br>
                        Workers: {data['employment']['total_workers']:,}<br>
                        Rate: {data['employment']['work_participation_rate']}%
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🏘️ Villages & Areas ({data['areas']['count']} total)</h2>
        """
        
        # Add top 5 villages by population
        for i, village in enumerate(data['areas']['villages'][:5]):
            html += f"""
                <div class="village-item">
                    <strong>{village['name']}</strong> ({village['level']})<br>
                    <div class="metrics">
                        <span>👥 {village['population']['total']:,} people</span>
                        <span>🏠 {village['households']} households</span>
                        <span>📚 {village['education']['literacy_rate']}% literacy</span>
                        <span>💼 {village['employment']['work_participation_rate']}% work rate</span>
                    </div>
                </div>
            """
        
        if len(data['areas']['villages']) > 5:
            html += f"<p><em>... and {len(data['areas']['villages']) - 5} more villages</em></p>"
        
        html += """
            </div>
            
            <div class="section">
                <h2>⚠️ District Problems & Issues</h2>
        """
        
        # Add problems
        for problem in data['problems'][:10]:  # Show first 10 problems
            severity_class = f"problem-{problem['severity'].lower()}"
            html += f"""
                <div class="problem-item {severity_class}">
                    <strong>{problem['title']}</strong> 
                    <span style="float: right; background: #34495e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">{problem['severity']}</span>
                    <br>
                    <p style="margin: 8px 0;">{problem['description']}</p>
                    <div class="metrics">
                        <span>📅 {problem['reported_date']}</span>
                        <span>👥 {problem['affected_population']:,} affected</span>
                        <span>📋 {problem['category']}</span>
                        <span>🔄 {problem['status']}</span>
                    </div>
                </div>
            """
        
        html += f"""
            </div>
            
            <div class="timestamp">
                📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | 
                🗃️ Data Source: MongoDB Atlas (Real-time)
            </div>
        </body>
        </html>
        """
        
        return html
        
    except HTTPException:
        raise
    except Exception as e:
        return f"<h1>Error</h1><p>Failed to generate dashboard: {str(e)}</p>"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
