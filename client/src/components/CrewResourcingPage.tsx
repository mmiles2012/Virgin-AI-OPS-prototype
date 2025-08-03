import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  ArrowLeft,
  Clock,
  Plane,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Crew member interface
interface CrewMember {
  id: string;
  name: string;
  rank: 'Captain' | 'First Officer' | 'Senior Cabin Crew' | 'Cabin Crew';
  employee_id: string;
  base: string;
  current_status: 'available' | 'on_duty' | 'rest_period' | 'off_duty' | 'sick' | 'training';
  current_flight?: string;
  flight_hours_this_month: number;
  flight_hours_remaining: number;
  rest_period_end?: string;
  next_assignment?: {
    flight: string;
    departure: string;
    role: string;
  };
  qualifications: string[];
  languages: string[];
  experience_years: number;
  last_training: string;
  next_training_due: string;
}

export default function CrewResourcingPage() {
  const navigate = useNavigate();
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBase, setSelectedBase] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRank, setSelectedRank] = useState<string>('all');

  // Fetch crew data
  const fetchCrewData = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from crew management API
      const response = await fetch('/api/crew/current-status');
      if (response.ok) {
        const data = await response.json();
        setCrewMembers(data.crew || []);
      } else {
        // Fallback to demo data
        setCrewMembers([
          {
            id: 'VA001',
            name: 'Captain Sarah Thompson',
            rank: 'Captain',
            employee_id: 'VAP001',
            base: 'LHR',
            current_status: 'available',
            flight_hours_this_month: 85,
            flight_hours_remaining: 15,
            qualifications: ['A350-1000', 'A330-300', 'Boeing 787-9'],
            languages: ['English', 'French'],
            experience_years: 12,
            last_training: '2025-06-15',
            next_training_due: '2025-12-15',
            next_assignment: {
              flight: 'VS42',
              departure: '16:30',
              role: 'Captain'
            }
          },
          {
            id: 'VA002',
            name: 'First Officer Marcus Chen',
            rank: 'First Officer',
            employee_id: 'VAP002',
            base: 'LHR',
            current_status: 'on_duty',
            current_flight: 'VS3',
            flight_hours_this_month: 92,
            flight_hours_remaining: 8,
            qualifications: ['A350-1000', 'Boeing 787-9'],
            languages: ['English', 'Mandarin'],
            experience_years: 8,
            last_training: '2025-07-20',
            next_training_due: '2026-01-20'
          },
          {
            id: 'VA003',
            name: 'Captain James Rodriguez',
            rank: 'Captain',
            employee_id: 'VAP003',
            base: 'JFK',
            current_status: 'rest_period',
            rest_period_end: '2025-08-04T08:00:00Z',
            flight_hours_this_month: 98,
            flight_hours_remaining: 2,
            qualifications: ['Boeing 787-9', 'A330-300'],
            languages: ['English', 'Spanish'],
            experience_years: 15,
            last_training: '2025-05-10',
            next_training_due: '2025-11-10'
          },
          {
            id: 'VA004',
            name: 'Senior Cabin Crew Emma Wilson',
            rank: 'Senior Cabin Crew',
            employee_id: 'VAC004',
            base: 'LHR',
            current_status: 'available',
            flight_hours_this_month: 78,
            flight_hours_remaining: 22,
            qualifications: ['Safety Instructor', 'First Aid', 'Service Excellence'],
            languages: ['English', 'German', 'Italian'],
            experience_years: 10,
            last_training: '2025-07-01',
            next_training_due: '2026-01-01',
            next_assignment: {
              flight: 'VS155',
              departure: '20:15',
              role: 'Senior Cabin Crew'
            }
          },
          {
            id: 'VA005',
            name: 'First Officer Lisa Anderson',
            rank: 'First Officer',
            employee_id: 'VAP005',
            base: 'JFK',
            current_status: 'training',
            flight_hours_this_month: 0,
            flight_hours_remaining: 100,
            qualifications: ['A350-1000'],
            languages: ['English'],
            experience_years: 3,
            last_training: '2025-08-01',
            next_training_due: '2025-08-15'
          },
          {
            id: 'VA006',
            name: 'Cabin Crew Michael Park',
            rank: 'Cabin Crew',
            employee_id: 'VAC006',
            base: 'LHR',
            current_status: 'sick',
            flight_hours_this_month: 45,
            flight_hours_remaining: 55,
            qualifications: ['Basic Service', 'Safety'],
            languages: ['English', 'Korean'],
            experience_years: 2,
            last_training: '2025-06-30',
            next_training_due: '2025-12-30'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching crew data:', error);
      setCrewMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrewData();
    // Refresh crew data every 2 minutes
    const interval = setInterval(fetchCrewData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter crew members
  const filteredCrew = crewMembers.filter(member => {
    const matchesBase = selectedBase === 'all' || member.base === selectedBase;
    const matchesStatus = selectedStatus === 'all' || member.current_status === selectedStatus;
    const matchesRank = selectedRank === 'all' || member.rank === selectedRank;
    
    return matchesBase && matchesStatus && matchesRank;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'on_duty': return 'bg-blue-100 text-blue-800';
      case 'rest_period': return 'bg-yellow-100 text-yellow-800';
      case 'off_duty': return 'bg-gray-100 text-gray-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'training': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'on_duty': return <Plane className="h-4 w-4" />;
      case 'rest_period': return <Clock className="h-4 w-4" />;
      case 'sick': return <AlertTriangle className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Statistics
  const stats = {
    total: filteredCrew.length,
    available: filteredCrew.filter(c => c.current_status === 'available').length,
    on_duty: filteredCrew.filter(c => c.current_status === 'on_duty').length,
    rest_period: filteredCrew.filter(c => c.current_status === 'rest_period').length,
    sick: filteredCrew.filter(c => c.current_status === 'sick').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/mission-control')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Mission Control
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                Crew Resourcing
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time crew assignments, availability, and scheduling
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchCrewData}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
            <div className="text-sm text-gray-500">
              Last Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Crew</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.on_duty}</div>
            <div className="text-sm text-gray-600">On Duty</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.rest_period}</div>
            <div className="text-sm text-gray-600">Rest Period</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.sick}</div>
            <div className="text-sm text-gray-600">Sick</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <select
                value={selectedBase}
                onChange={(e) => setSelectedBase(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Bases</option>
                <option value="LHR">London Heathrow (LHR)</option>
                <option value="JFK">John F. Kennedy (JFK)</option>
              </select>
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="on_duty">On Duty</option>
              <option value="rest_period">Rest Period</option>
              <option value="off_duty">Off Duty</option>
              <option value="sick">Sick</option>
              <option value="training">Training</option>
            </select>
            
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Ranks</option>
              <option value="Captain">Captain</option>
              <option value="First Officer">First Officer</option>
              <option value="Senior Cabin Crew">Senior Cabin Crew</option>
              <option value="Cabin Crew">Cabin Crew</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Crew Members Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading crew data...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCrew.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.rank} - {member.base}</p>
                    <p className="text-xs text-gray-500">ID: {member.employee_id}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.current_status)}`}>
                    {getStatusIcon(member.current_status)}
                    {member.current_status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                {member.current_flight && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Currently on: {member.current_flight}
                    </p>
                  </div>
                )}

                {member.rest_period_end && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Rest until: {formatDateTime(member.rest_period_end)}
                    </p>
                  </div>
                )}

                {member.next_assignment && (
                  <div className="mb-3 p-2 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Next: {member.next_assignment.flight} at {member.next_assignment.departure}
                    </p>
                    <p className="text-xs text-green-700">Role: {member.next_assignment.role}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flight Hours (Month):</span>
                    <span className="font-medium">{member.flight_hours_this_month}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hours Remaining:</span>
                    <span className={`font-medium ${member.flight_hours_remaining < 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {member.flight_hours_remaining}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium">{member.experience_years} years</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-1">Qualifications:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.qualifications.slice(0, 3).map((qual, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {qual}
                      </span>
                    ))}
                    {member.qualifications.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{member.qualifications.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Next training: {new Date(member.next_training_due).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredCrew.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Crew Members Found</h3>
          <p className="text-gray-600">
            Try adjusting your filter criteria to see more crew members.
          </p>
        </div>
      )}
    </div>
  );
}