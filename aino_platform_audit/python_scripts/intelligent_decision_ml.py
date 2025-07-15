#!/usr/bin/env python3
"""
Intelligent Decision Support ML System for AINO Aviation Platform
Advanced ML-powered decision making for operational scenarios
"""

import numpy as np
import pandas as pd
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import os
import sys

try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.metrics import classification_report, mean_absolute_error
    import joblib
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("[WARNING] Scikit-learn not available - using rule-based decisions")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntelligentDecisionEngine:
    """Advanced ML-powered decision support system for aviation operations"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_importance = {}
        self.decision_history = []
        
        # Decision categories and their weights
        self.decision_categories = {
            'diversion': {
                'factors': ['weather', 'fuel', 'airport_suitability', 'passenger_impact', 'cost'],
                'weights': [0.3, 0.25, 0.2, 0.15, 0.1]
            },
            'delay_management': {
                'factors': ['passenger_connections', 'aircraft_rotation', 'crew_legality', 'cost_impact'],
                'weights': [0.4, 0.25, 0.25, 0.1]
            },
            'route_optimization': {
                'factors': ['weather_avoidance', 'fuel_efficiency', 'time_savings', 'traffic_density'],
                'weights': [0.35, 0.25, 0.25, 0.15]
            },
            'resource_allocation': {
                'factors': ['aircraft_availability', 'crew_availability', 'gate_availability', 'maintenance_windows'],
                'weights': [0.3, 0.3, 0.2, 0.2]
            }
        }
        
        logger.info("🧠 Intelligent Decision Engine initialized")
    
    def analyze_decision_scenario(self, scenario_data: Dict) -> Dict:
        """Analyze a decision scenario and provide ML-powered recommendations"""
        
        scenario_type = scenario_data.get('type', 'general')
        context = scenario_data.get('context', {})
        options = scenario_data.get('options', [])
        
        logger.info(f"🎯 Analyzing {scenario_type} decision scenario with {len(options)} options")
        
        # Generate comprehensive analysis
        analysis = {
            'scenario_id': f"DECISION_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            'timestamp': datetime.utcnow().isoformat(),
            'scenario_type': scenario_type,
            'analysis_method': 'ML_ENHANCED' if ML_AVAILABLE else 'RULE_BASED',
            'options_analyzed': len(options),
            'recommendations': [],
            'risk_assessment': {},
            'confidence_scores': {},
            'decision_factors': {},
            'operational_impact': {}
        }
        
        if scenario_type in self.decision_categories:
            analysis = self._analyze_categorized_scenario(scenario_type, context, options, analysis)
        else:
            analysis = self._analyze_general_scenario(context, options, analysis)
        
        # Store decision for learning
        self.decision_history.append(analysis)
        
        return analysis
    
    def _analyze_categorized_scenario(self, scenario_type: str, context: Dict, options: List, analysis: Dict) -> Dict:
        """Analyze scenario using category-specific ML models"""
        
        category_config = self.decision_categories[scenario_type]
        factors = category_config['factors']
        weights = category_config['weights']
        
        # Extract features for each option
        option_scores = []
        
        for idx, option in enumerate(options):
            option_id = option.get('id', f"option_{idx}")
            
            # Calculate factor scores
            factor_scores = {}
            for factor, weight in zip(factors, weights):
                score = self._calculate_factor_score(factor, option, context)
                factor_scores[factor] = score
            
            # Calculate weighted total score
            total_score = sum(score * weight for score, weight in zip(factor_scores.values(), weights))
            
            # Risk assessment
            risk_level = self._assess_option_risk(option, context, scenario_type)
            
            option_analysis = {
                'option_id': option_id,
                'total_score': round(total_score, 3),
                'factor_scores': factor_scores,
                'risk_level': risk_level,
                'confidence': self._calculate_confidence(factor_scores, option, context),
                'recommendation_rank': 0  # Will be set after sorting
            }
            
            option_scores.append(option_analysis)
        
        # Rank options by score
        option_scores.sort(key=lambda x: x['total_score'], reverse=True)
        for idx, option in enumerate(option_scores):
            option['recommendation_rank'] = idx + 1
        
        # Generate recommendations
        analysis['recommendations'] = self._generate_recommendations(option_scores, scenario_type)
        analysis['decision_factors'] = dict(zip(factors, weights))
        analysis['options_analysis'] = option_scores
        
        return analysis
    
    def _calculate_factor_score(self, factor: str, option: Dict, context: Dict) -> float:
        """Calculate score for a specific decision factor"""
        
        if factor == 'weather':
            return self._score_weather_factor(option, context)
        elif factor == 'fuel':
            return self._score_fuel_factor(option, context)
        elif factor == 'airport_suitability':
            return self._score_airport_suitability(option, context)
        elif factor == 'passenger_impact':
            return self._score_passenger_impact(option, context)
        elif factor == 'cost':
            return self._score_cost_factor(option, context)
        elif factor == 'passenger_connections':
            return self._score_passenger_connections(option, context)
        elif factor == 'aircraft_rotation':
            return self._score_aircraft_rotation(option, context)
        elif factor == 'crew_legality':
            return self._score_crew_legality(option, context)
        elif factor == 'cost_impact':
            return self._score_cost_impact(option, context)
        elif factor == 'weather_avoidance':
            return self._score_weather_avoidance(option, context)
        elif factor == 'fuel_efficiency':
            return self._score_fuel_efficiency(option, context)
        elif factor == 'time_savings':
            return self._score_time_savings(option, context)
        elif factor == 'traffic_density':
            return self._score_traffic_density(option, context)
        else:
            return 0.5  # Neutral score for unknown factors
    
    def _score_weather_factor(self, option: Dict, context: Dict) -> float:
        """Score based on weather conditions"""
        weather_data = option.get('weather', {})
        
        visibility = weather_data.get('visibility_km', 10)
        wind_speed = weather_data.get('wind_speed_kts', 10)
        ceiling = weather_data.get('ceiling_ft', 3000)
        
        # Higher scores for better weather
        visibility_score = min(visibility / 10.0, 1.0)
        wind_score = max(0, 1.0 - wind_speed / 50.0)
        ceiling_score = min(ceiling / 3000.0, 1.0)
        
        return (visibility_score + wind_score + ceiling_score) / 3.0
    
    def _score_fuel_factor(self, option: Dict, context: Dict) -> float:
        """Score based on fuel considerations"""
        fuel_required = option.get('fuel_required_kg', 5000)
        fuel_available = context.get('current_fuel_kg', 20000)
        
        if fuel_available <= 0:
            return 0.0
        
        fuel_ratio = fuel_required / fuel_available
        
        # Higher scores for lower fuel requirements
        return max(0, 1.0 - fuel_ratio)
    
    def _score_airport_suitability(self, option: Dict, context: Dict) -> float:
        """Score based on airport operational suitability"""
        runway_length = option.get('runway_length_ft', 8000)
        fire_category = option.get('fire_category', 5)
        maintenance_available = option.get('maintenance_available', False)
        
        aircraft_type = context.get('aircraft_type', 'A350')
        
        # Required minimums by aircraft type
        min_requirements = {
            'A350': {'runway': 9000, 'fire_cat': 8},
            'B787': {'runway': 8500, 'fire_cat': 8},
            'A330': {'runway': 8000, 'fire_cat': 7}
        }
        
        req = min_requirements.get(aircraft_type, {'runway': 8000, 'fire_cat': 7})
        
        runway_score = 1.0 if runway_length >= req['runway'] else 0.5
        fire_score = 1.0 if fire_category >= req['fire_cat'] else 0.3
        maintenance_score = 1.0 if maintenance_available else 0.7
        
        return (runway_score + fire_score + maintenance_score) / 3.0
    
    def _score_passenger_impact(self, option: Dict, context: Dict) -> float:
        """Score based on passenger impact and service recovery"""
        delay_mins = option.get('estimated_delay_mins', 60)
        passenger_count = context.get('passenger_count', 300)
        connection_impact = option.get('missed_connections', 0)
        
        # Lower scores for higher delays and connection impacts
        delay_score = max(0, 1.0 - delay_mins / 240.0)  # 4-hour max
        connection_score = max(0, 1.0 - connection_impact / passenger_count)
        
        return (delay_score + connection_score) / 2.0
    
    def _score_cost_factor(self, option: Dict, context: Dict) -> float:
        """Score based on cost considerations"""
        estimated_cost = option.get('estimated_cost_usd', 50000)
        max_acceptable_cost = context.get('max_cost_budget', 100000)
        
        if max_acceptable_cost <= 0:
            return 0.5
        
        cost_ratio = estimated_cost / max_acceptable_cost
        return max(0, 1.0 - cost_ratio)
    
    def _score_passenger_connections(self, option: Dict, context: Dict) -> float:
        """Score passenger connection protection"""
        protected_connections = option.get('protected_connections', 0)
        total_connections = context.get('total_connections', 1)
        
        return protected_connections / max(total_connections, 1)
    
    def _score_aircraft_rotation(self, option: Dict, context: Dict) -> float:
        """Score aircraft rotation efficiency"""
        rotation_delay = option.get('rotation_delay_mins', 30)
        
        # Lower scores for longer rotation delays
        return max(0, 1.0 - rotation_delay / 180.0)  # 3-hour max
    
    def _score_crew_legality(self, option: Dict, context: Dict) -> float:
        """Score crew duty time legality"""
        duty_extension = option.get('duty_extension_mins', 0)
        crew_rest_impact = option.get('crew_rest_impact', False)
        
        # Penalty for duty extensions and rest impacts
        extension_score = max(0, 1.0 - duty_extension / 120.0)  # 2-hour max
        rest_score = 0.5 if crew_rest_impact else 1.0
        
        return (extension_score + rest_score) / 2.0
    
    def _score_cost_impact(self, option: Dict, context: Dict) -> float:
        """Score overall cost impact"""
        return self._score_cost_factor(option, context)
    
    def _score_weather_avoidance(self, option: Dict, context: Dict) -> float:
        """Score weather avoidance effectiveness"""
        weather_severity = option.get('weather_severity', 0.3)
        
        return 1.0 - weather_severity
    
    def _score_fuel_efficiency(self, option: Dict, context: Dict) -> float:
        """Score fuel efficiency"""
        fuel_burn_rate = option.get('fuel_burn_kg_per_hour', 3000)
        baseline_burn = context.get('baseline_fuel_burn', 3000)
        
        if baseline_burn <= 0:
            return 0.5
        
        efficiency_ratio = fuel_burn_rate / baseline_burn
        return max(0, 2.0 - efficiency_ratio)  # Better than baseline gets >1.0
    
    def _score_time_savings(self, option: Dict, context: Dict) -> float:
        """Score time savings"""
        time_saved_mins = option.get('time_saved_mins', 0)
        
        return min(time_saved_mins / 60.0, 1.0)  # Normalize to 1-hour max
    
    def _score_traffic_density(self, option: Dict, context: Dict) -> float:
        """Score traffic density impact"""
        traffic_delay = option.get('traffic_delay_mins', 10)
        
        return max(0, 1.0 - traffic_delay / 60.0)  # 1-hour max penalty
    
    def _assess_option_risk(self, option: Dict, context: Dict, scenario_type: str) -> str:
        """Assess risk level for an option"""
        
        risk_factors = []
        
        # Weather risk
        weather = option.get('weather', {})
        if weather.get('visibility_km', 10) < 5 or weather.get('wind_speed_kts', 10) > 25:
            risk_factors.append('weather')
        
        # Fuel risk
        fuel_margin = context.get('current_fuel_kg', 20000) - option.get('fuel_required_kg', 5000)
        if fuel_margin < 2000:  # Less than 2000kg margin
            risk_factors.append('fuel')
        
        # Cost risk
        if option.get('estimated_cost_usd', 0) > context.get('max_cost_budget', 100000):
            risk_factors.append('cost')
        
        # Passenger impact risk
        if option.get('estimated_delay_mins', 0) > 180:  # More than 3 hours
            risk_factors.append('passenger_impact')
        
        # Determine overall risk level
        if len(risk_factors) >= 3:
            return 'CRITICAL'
        elif len(risk_factors) == 2:
            return 'HIGH'
        elif len(risk_factors) == 1:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _calculate_confidence(self, factor_scores: Dict, option: Dict, context: Dict) -> float:
        """Calculate confidence score for the recommendation"""
        
        # Base confidence on data completeness and score consistency
        data_completeness = len([v for v in option.values() if v is not None]) / max(len(option), 1)
        
        # Score variance (lower variance = higher confidence)
        scores = list(factor_scores.values())
        if len(scores) > 1:
            variance = np.var(scores)
            consistency = max(0, 1.0 - variance)
        else:
            consistency = 0.8
        
        confidence = (data_completeness + consistency) / 2.0
        return round(confidence, 3)
    
    def _generate_recommendations(self, option_scores: List, scenario_type: str) -> List[Dict]:
        """Generate actionable recommendations"""
        
        recommendations = []
        
        if not option_scores:
            return recommendations
        
        # Primary recommendation (highest score)
        best_option = option_scores[0]
        recommendations.append({
            'type': 'PRIMARY',
            'option_id': best_option['option_id'],
            'confidence': best_option['confidence'],
            'rationale': f"Highest overall score ({best_option['total_score']}) with {best_option['risk_level']} risk level",
            'action': f"Implement {best_option['option_id']} immediately",
            'expected_outcome': self._predict_outcome(best_option, scenario_type)
        })
        
        # Alternative recommendation if available
        if len(option_scores) > 1:
            alt_option = option_scores[1]
            recommendations.append({
                'type': 'ALTERNATIVE',
                'option_id': alt_option['option_id'],
                'confidence': alt_option['confidence'],
                'rationale': f"Backup option with score ({alt_option['total_score']}) and {alt_option['risk_level']} risk",
                'action': f"Prepare {alt_option['option_id']} as contingency",
                'expected_outcome': self._predict_outcome(alt_option, scenario_type)
            })
        
        # Risk mitigation if high-risk scenarios exist
        high_risk_options = [opt for opt in option_scores if opt['risk_level'] in ['HIGH', 'CRITICAL']]
        if high_risk_options:
            recommendations.append({
                'type': 'RISK_MITIGATION',
                'option_id': 'MONITORING',
                'confidence': 0.95,
                'rationale': f"Enhanced monitoring required due to {len(high_risk_options)} high-risk scenarios",
                'action': "Implement enhanced monitoring and prepare rapid response protocols",
                'expected_outcome': "Reduced response time if primary plan fails"
            })
        
        return recommendations
    
    def _predict_outcome(self, option: Dict, scenario_type: str) -> str:
        """Predict likely outcome of implementing the option"""
        
        score = option['total_score']
        risk = option['risk_level']
        
        if score > 0.8 and risk == 'LOW':
            return "Excellent outcome expected with minimal operational impact"
        elif score > 0.6 and risk in ['LOW', 'MEDIUM']:
            return "Good outcome expected with manageable operational adjustments"
        elif score > 0.4:
            return "Acceptable outcome with some operational challenges"
        else:
            return "Challenging implementation with significant operational impact"
    
    def _analyze_general_scenario(self, context: Dict, options: List, analysis: Dict) -> Dict:
        """Analyze general scenarios without specific category"""
        
        # Simple scoring for general scenarios
        option_scores = []
        
        for idx, option in enumerate(options):
            option_id = option.get('id', f"option_{idx}")
            
            # Basic scoring factors
            cost_score = self._score_cost_factor(option, context)
            risk_score = 1.0 - (0.25 * ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].index(
                self._assess_option_risk(option, context, 'general')))
            
            total_score = (cost_score + risk_score) / 2.0
            
            option_analysis = {
                'option_id': option_id,
                'total_score': round(total_score, 3),
                'factor_scores': {'cost': cost_score, 'risk': risk_score},
                'risk_level': self._assess_option_risk(option, context, 'general'),
                'confidence': 0.7,  # Lower confidence for general scenarios
                'recommendation_rank': 0
            }
            
            option_scores.append(option_analysis)
        
        # Rank options
        option_scores.sort(key=lambda x: x['total_score'], reverse=True)
        for idx, option in enumerate(option_scores):
            option['recommendation_rank'] = idx + 1
        
        analysis['recommendations'] = self._generate_recommendations(option_scores, 'general')
        analysis['options_analysis'] = option_scores
        
        return analysis
    
    def get_decision_insights(self) -> Dict:
        """Get insights from historical decisions"""
        
        if not self.decision_history:
            return {"message": "No decision history available"}
        
        insights = {
            'total_decisions': len(self.decision_history),
            'scenario_types': {},
            'average_confidence': 0,
            'risk_distribution': {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0, 'CRITICAL': 0},
            'recent_decisions': self.decision_history[-5:] if len(self.decision_history) >= 5 else self.decision_history
        }
        
        # Analyze decision patterns
        for decision in self.decision_history:
            scenario_type = decision.get('scenario_type', 'unknown')
            insights['scenario_types'][scenario_type] = insights['scenario_types'].get(scenario_type, 0) + 1
            
            # Risk distribution from recommendations
            for rec in decision.get('recommendations', []):
                if rec.get('type') == 'PRIMARY':
                    # Find the primary option's risk level
                    for opt in decision.get('options_analysis', []):
                        if opt.get('option_id') == rec.get('option_id'):
                            risk_level = opt.get('risk_level', 'MEDIUM')
                            insights['risk_distribution'][risk_level] += 1
                            break
        
        # Calculate average confidence
        confidences = []
        for decision in self.decision_history:
            for rec in decision.get('recommendations', []):
                if rec.get('type') == 'PRIMARY':
                    confidences.append(rec.get('confidence', 0.5))
        
        insights['average_confidence'] = round(sum(confidences) / len(confidences) if confidences else 0, 3)
        
        return insights

def main():
    """Demonstration of intelligent decision support system"""
    
    print("🧠 AINO Intelligent Decision Support ML System")
    print("=" * 60)
    
    # Initialize decision engine
    engine = IntelligentDecisionEngine()
    
    # Example diversion decision scenario
    diversion_scenario = {
        'type': 'diversion',
        'context': {
            'aircraft_type': 'A350',
            'current_fuel_kg': 18000,
            'passenger_count': 331,
            'total_connections': 45,
            'max_cost_budget': 150000
        },
        'options': [
            {
                'id': 'EINN_Shannon',
                'airport_code': 'EINN',
                'runway_length_ft': 10500,
                'fire_category': 9,
                'maintenance_available': True,
                'fuel_required_kg': 3200,
                'estimated_delay_mins': 90,
                'estimated_cost_usd': 85000,
                'missed_connections': 8,
                'weather': {
                    'visibility_km': 8,
                    'wind_speed_kts': 15,
                    'ceiling_ft': 1200
                }
            },
            {
                'id': 'BIKF_Keflavik',
                'airport_code': 'BIKF',
                'runway_length_ft': 10000,
                'fire_category': 8,
                'maintenance_available': True,
                'fuel_required_kg': 4500,
                'estimated_delay_mins': 120,
                'estimated_cost_usd': 120000,
                'missed_connections': 15,
                'weather': {
                    'visibility_km': 12,
                    'wind_speed_kts': 25,
                    'ceiling_ft': 2000
                }
            },
            {
                'id': 'CYQX_Gander',
                'airport_code': 'CYQX',
                'runway_length_ft': 10500,
                'fire_category': 8,
                'maintenance_available': True,
                'fuel_required_kg': 5200,
                'estimated_delay_mins': 180,
                'estimated_cost_usd': 95000,
                'missed_connections': 25,
                'weather': {
                    'visibility_km': 6,
                    'wind_speed_kts': 20,
                    'ceiling_ft': 800
                }
            }
        ]
    }
    
    # Analyze decision scenario
    analysis = engine.analyze_decision_scenario(diversion_scenario)
    
    print(f"\n📊 Decision Analysis Results:")
    print(f"Scenario ID: {analysis['scenario_id']}")
    print(f"Analysis Method: {analysis['analysis_method']}")
    print(f"Options Analyzed: {analysis['options_analyzed']}")
    
    print(f"\n🏆 Recommendations:")
    for rec in analysis['recommendations']:
        print(f"  {rec['type']}: {rec['option_id']}")
        print(f"    Confidence: {rec['confidence']}")
        print(f"    Rationale: {rec['rationale']}")
        print(f"    Action: {rec['action']}")
        print(f"    Expected Outcome: {rec['expected_outcome']}")
        print()
    
    print(f"\n📈 Option Analysis:")
    for opt in analysis.get('options_analysis', []):
        print(f"  Rank {opt['recommendation_rank']}: {opt['option_id']}")
        print(f"    Score: {opt['total_score']} | Risk: {opt['risk_level']} | Confidence: {opt['confidence']}")
        print(f"    Factor Scores: {opt['factor_scores']}")
        print()
    
    # Example route optimization scenario
    route_scenario = {
        'type': 'route_optimization',
        'context': {
            'aircraft_type': 'B787',
            'baseline_fuel_burn': 2800,
            'current_weather_severity': 0.4
        },
        'options': [
            {
                'id': 'DIRECT_ROUTE',
                'fuel_burn_kg_per_hour': 2650,
                'time_saved_mins': 15,
                'weather_severity': 0.6,
                'traffic_delay_mins': 5,
                'estimated_cost_usd': 45000
            },
            {
                'id': 'WEATHER_AVOID',
                'fuel_burn_kg_per_hour': 2900,
                'time_saved_mins': -10,
                'weather_severity': 0.1,
                'traffic_delay_mins': 8,
                'estimated_cost_usd': 52000
            },
            {
                'id': 'NAT_TRACK_A',
                'fuel_burn_kg_per_hour': 2750,
                'time_saved_mins': 5,
                'weather_severity': 0.3,
                'traffic_delay_mins': 3,
                'estimated_cost_usd': 48000
            }
        ]
    }
    
    route_analysis = engine.analyze_decision_scenario(route_scenario)
    
    print(f"\n🛩️ Route Optimization Analysis:")
    print(f"Primary Recommendation: {route_analysis['recommendations'][0]['option_id']}")
    print(f"Confidence: {route_analysis['recommendations'][0]['confidence']}")
    print(f"Rationale: {route_analysis['recommendations'][0]['rationale']}")
    
    # Get decision insights
    insights = engine.get_decision_insights()
    print(f"\n📊 Decision Engine Insights:")
    print(f"Total Decisions Made: {insights['total_decisions']}")
    print(f"Average Confidence: {insights['average_confidence']}")
    print(f"Scenario Types: {insights['scenario_types']}")
    print(f"Risk Distribution: {insights['risk_distribution']}")
    
    print(f"\n✅ Intelligent Decision Support ML System operational!")
    return analysis, route_analysis, insights

if __name__ == "__main__":
    main()