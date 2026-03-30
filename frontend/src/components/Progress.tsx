import React, { useState, useMemo } from 'react';
import { TrendingUp, Target, Award, Calendar, BarChart3, Clock } from 'lucide-react';
// 🛑 Recharts Imports
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
// import type { TooltipProps } from "recharts"
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';


const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper function to get the number of months to display years in the dropdown
const getYears = () => {
  const currentYear = new Date().getFullYear();
  // Return current year and the two previous years
  return Array.from({ length: 3 }, (_, i) => currentYear - i);
};

// 🛑 NEW: Recharts Component for Visualization
interface ChartData {
    name: string;
    accuracy: number;
    score: number;
    total: number;
    completedDate: string;
}

// Define the expected structure of the payload for the Tooltip component
// type ChartTooltipProps = TooltipProps<number, string>;


const PerformanceChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
    // If only one data point exists, Recharts often can't draw the line.
    // We add a fallback element to the start/end to ensure the line is visible.
    const chartRenderData = data.length === 1 
        ? [
            { name: "Start", accuracy: data[0].accuracy, score: data[0].score, total: data[0].total, completedDate: data[0].completedDate },
            ...data
        ]
        : data;
        
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
data={chartRenderData}
margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
<CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
<XAxis dataKey="name" stroke="#64748b" angle={-15} textAnchor="end" height={50} interval={0} />
<YAxis 
    domain={[0, 100]} 
    stroke="#64748b"
    tickFormatter={(value) => `${value}%`}
    label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
/>
{/* 🛑 Tooltip FIX */}
<Tooltip
  formatter={(value: any, _name: any, props: any) => {
    const payloadItem = props?.payload?.[0]?.payload as ChartData;
    return [`${Number(value).toFixed(1)}%`, payloadItem?.name || 'Accuracy'];
  }}
  labelFormatter={(label: any, payload: any) => {
    const payloadItem = payload?.[0]?.payload as ChartData;
    return `${label} - ${payloadItem?.completedDate || ''}`;
  }}
/>
<Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
<Line 
    type="monotone" 
    dataKey="accuracy" 
    stroke="#8b5cf6" // Purple color
    strokeWidth={3}
    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} 
    name="Test Accuracy"
    isAnimationActive={true}
/>
            </LineChart>
        </ResponsiveContainer>
    );
}

const Progress: React.FC = () => {
  const { mockTests, testResults } = useData();
  const { user } = useAuth();
  
  // Get current date details for initial state
  const currentDate = useMemo(() => new Date(), []);
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // 1. 🛑 NEW STATE for Month/Year Selection
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Filter user's test results based on authentication and selected date
  const userResults = useMemo(() => {
    if (!user) return [];

    // Filter by logged-in user's ID
    const initialFilter = testResults.filter(result => 
      (result as any).student_user_no === user.userNo || (result as any).user_id === user.id
    );

    // 2. 🛑 NEW FILTER: Filter by selected month and year
    return initialFilter.filter(r => {
      try {
        // Use a robust date field name (assuming completed_at or completedAt)
        const dateString = (r as any).completed_at || (r as any).completedAt; 
        const resultDate = new Date(dateString);
        
        if (isNaN(resultDate.getTime())) {
          return false;
        }

        return resultDate.getMonth() === selectedMonthIndex && 
               resultDate.getFullYear() === selectedYear;
      } catch (e) {
        return false;
      }
    });
  }, [testResults, user, selectedMonthIndex, selectedYear]);
  
  // --- STATS CALCULATIONS (Based on filtered userResults) ---
  
  const totalTests = userResults.length;
  
  const totalScoreSum = userResults.reduce((sum, result) => sum + result.score, 0);
  const totalQuestionsSum = userResults.reduce((sum, result) => sum + result.total_questions, 0);

  const averageAccuracy = totalQuestionsSum > 0
    ? (totalScoreSum / totalQuestionsSum) * 100
    : 0;
    
  // Prepare data for the graph (Group by Test/Subject/Day for the chart component)
  const chartData = useMemo(() => {
    // Group results by day or test title for the chart axis
    const groupedData: ChartData[] = userResults.map(result => {
      const test = mockTests.find(t => t.id === result.test_id);
      const accuracy = (result.total_questions > 0) ? (result.score / result.total_questions) * 100 : 0;
      
      return {
        name: test?.title || 'Unknown Test',
        accuracy: parseFloat(accuracy.toFixed(1)),
        score: result.score,
        total: result.total_questions,
        completedDate: new Date((result as any).completed_at || (result as any).completedAt).toLocaleDateString(),
      };
  }).sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
  
    return groupedData;
}, [userResults, mockTests]);


  const _getPerformanceColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = [
    {
      icon: Target,
      label: 'Tests Completed',
      value: totalTests,
      color: 'bg-blue-500',
    },
    {
      icon: Award,
      label: 'Monthly Average',
      value: `${averageAccuracy.toFixed(1)}%`,
      color: 'bg-purple-500',
    },
    {
      icon: TrendingUp,
      label: 'Total Accuracy',
      value: `${(totalQuestionsSum > 0 ? (totalScoreSum / totalQuestionsSum) * 100 : 0).toFixed(1)}%`,
      color: 'bg-emerald-500',
    },
    {
      icon: Calendar,
      label: 'Selected Month',
      value: MONTHS[selectedMonthIndex],
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Added general responsive padding */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Monthly Progress Report</h1>
        <p className="text-slate-600">
          View your performance trend filtered by month and year.
        </p>
      </div>
      
      {/* Date Picker (Month/Year Selection) */}
      <div className="flex space-x-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <select
          value={selectedMonthIndex}
          onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
          className="p-2 border border-slate-300 rounded-lg text-slate-700 focus:ring-blue-500 focus:border-blue-500"
        >
          {MONTHS.map((month, index) => (
            <option key={index} value={index}>
              {month}
            </option>
          ))}
        </select>
        
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="p-2 border border-slate-300 rounded-lg text-slate-700 focus:ring-blue-500 focus:border-blue-500"
        >
          {getYears().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {stats.map((stat, index) => (
        <div 
            key={index} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            style={{ width: '100%', height: '100%' }}
        >
            <div className="flex items-center justify-between">
<div>
    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
</div>
<div className={`${stat.color} rounded-lg p-3`}>
    <stat.icon className="w-6 h-6 text-white" />
</div>
            </div>
        </div>
    ))}
</div>

    {/* Performance Chart / Graph Section */}
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    
    <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
            {totalTests > 0 ? `Performance in ${MONTHS[selectedMonthIndex]} ${selectedYear}` : `No Tests Recorded in ${MONTHS[selectedMonthIndex]} ${selectedYear}`}
        </h2>
        <BarChart3 className="w-5 h-5 text-slate-400" />
    </div>

    {totalTests > 0 ? (
        <div className="h-96 w-full">
            <PerformanceChart data={chartData} /> 
        </div>
    ) : (
        <div className="text-center p-8 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3" />
            <p>No test results found for the selected period.</p>
        </div>
    )}
</div>

    {/* Study Tips section (Previously mashed with the test results list) */}
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Study Tips</h2>
        
        {/* FIX: Use a consistent grid layout for the cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Consistent Practice Card (FIXED LAYOUT) */}
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-inner">
<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
    <Target className="w-6 h-6 text-white" />
</div>
<h3 className="font-semibold text-slate-900 mb-2">Consistent Practice</h3>
<p className="text-sm text-slate-600">Take regular mock tests to improve your performance</p>
            </div>
            
            {/* Focus on Weak Areas Card (FIXED LAYOUT) */}
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-inner">
<div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-3">
    <Award className="w-6 h-6 text-white" />
</div>
<h3 className="font-semibold text-slate-900 mb-2">Focus on Weak Areas</h3>
<p className="text-sm text-slate-600">Identify and strengthen your weak subjects</p>
            </div>
            
            {/* Track Progress Card (FIXED LAYOUT) */}
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-inner">
<div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
    <TrendingUp className="w-6 h-6 text-white" />
</div>
<h3 className="font-semibold text-slate-900 mb-2">Track Progress</h3>
<p className="text-sm text-slate-600">Monitor your improvement over time</p>
            </div>
        </div>
    </div>
 </div>
 );
};

export default Progress;