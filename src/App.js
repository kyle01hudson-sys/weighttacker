import React, { useState, useEffect } from 'react';
import {
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    format,
    isSameDay,
    isToday,
    isAfter,
    isBefore,
    addMonths,
    subMonths,
    parseISO,
} from 'date-fns';

// Main App component
const App = () => {
    // Define the start date for the tracking history
    const startDate = new Date(2025, 5, 1); // June 1, 2025

    // State for the main data, using a date-based object for historical tracking
    const [weightData, setWeightData] = useState(() => {
        const savedData = localStorage.getItem('weightTrackerData');
        return savedData ? JSON.parse(savedData) : {};
    });

    // State for the currently selected date in the calendar
    const [selectedDate, setSelectedDate] = useState(new Date());
    // State for the month currently being displayed in the calendar
    const [currentMonth, setCurrentMonth] = useState(new Date());
    // State to toggle the visibility of the weekly averages view
    const [showAverages, setShowAverages] = useState(false);

    // Use a useEffect hook to save data to localStorage whenever weightData changes.
    useEffect(() => {
        localStorage.setItem('weightTrackerData', JSON.stringify(weightData));
    }, [weightData]);

    // Get the weight data for the selected date, or initialize if it doesn't exist
    const dayData = weightData[format(selectedDate, 'yyyy-MM-dd')] || { morning: '', evening: '' };

    // Handles changes to the weight input fields for the selected date
    const handleWeightChange = (e, time) => {
        const { value } = e.target;
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        setWeightData(prevData => ({
            ...prevData,
            [dateKey]: {
                ...prevData[dateKey],
                [time]: value,
            },
        }));
    };

    // Calculates weekly averages from all historical data
    const calculateWeeklyAverages = () => {
        const weeklyAverages = {};
        const allDates = Object.keys(weightData).map(dateStr => parseISO(dateStr));
        if (allDates.length === 0) return [];

        // Sort dates to process them chronologically
        allDates.sort((a, b) => a - b);

        // Group data into weeks (Sunday to Saturday)
        for (const date of allDates) {
            const startOfThisWeek = startOfWeek(date);
            const weekKey = format(startOfThisWeek, 'yyyy-MM-dd');

            if (!weeklyAverages[weekKey]) {
                weeklyAverages[weekKey] = {
                    morning: { total: 0, count: 0 },
                    evening: { total: 0, count: 0 },
                    weekStart: startOfThisWeek,
                    weekEnd: endOfWeek(date),
                };
            }

            const morningWeight = parseFloat(weightData[format(date, 'yyyy-MM-dd')].morning);
            if (!isNaN(morningWeight)) {
                weeklyAverages[weekKey].morning.total += morningWeight;
                weeklyAverages[weekKey].morning.count++;
            }
            const eveningWeight = parseFloat(weightData[format(date, 'yyyy-MM-dd')].evening);
            if (!isNaN(eveningWeight)) {
                weeklyAverages[weekKey].evening.total += eveningWeight;
                weeklyAverages[weekKey].evening.count++;
            }
        }

        // Calculate the final averages and format the output
        let averagesArray = Object.values(weeklyAverages).map(week => ({
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            morningAverage: week.morning.count > 0 ? (week.morning.total / week.morning.count) : 0,
            eveningAverage: week.evening.count > 0 ? (week.evening.total / week.evening.count) : 0,
        }));

        // Now, compare each week's average to the previous one
        for (let i = 1; i < averagesArray.length; i++) {
            const currentWeek = averagesArray[i];
            const previousWeek = averagesArray[i-1];
            currentWeek.morningDiff = currentWeek.morningAverage - previousWeek.morningAverage;
            currentWeek.eveningDiff = currentWeek.eveningAverage - previousWeek.eveningAverage;
        }

        return averagesArray;
    };

    // Correctly get all days for the current month being viewed in the calendar
    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
    });

    const isDayCompleted = (date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const data = weightData[dateKey];
        return data && data.morning !== '' && data.evening !== '';
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8 flex items-center justify-center font-sans">
            <div className="bg-gray-800 p-4 sm:p-8 rounded-2xl shadow-xl w-full max-w-4xl">
                <h1 className="text-4xl font-extrabold text-white text-center mb-6">Weight Tracker</h1>

                {/* Main Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                    <button
                        onClick={() => setShowAverages(false)}
                        className={`w-full sm:w-auto px-6 py-3 font-bold rounded-lg transition-colors shadow-lg ${!showAverages ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        Enter Data
                    </button>
                    <button
                        onClick={() => setShowAverages(true)}
                        className={`w-full sm:w-auto px-6 py-3 font-bold rounded-lg transition-colors shadow-lg ${showAverages ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        View Weekly Averages
                    </button>
                </div>

                {/* Conditional rendering for either data entry or averages view */}
                {!showAverages ? (
                    /* Data Entry View */
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-center text-indigo-400">Select a Day to Track</h2>

                        {/* Calendar Controls */}
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                disabled={isBefore(currentMonth, startDate)}
                                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <h3 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h3>
                            <button
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                disabled={isAfter(currentMonth, new Date())}
                                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 text-center font-bold text-gray-400 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day}>{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2 mt-2">
                            {daysInMonth.map((day, idx) => {
                                const isDisabled = isBefore(day, startDate) || isAfter(day, new Date());
                                const isSelected = isSameDay(day, selectedDate);
                                const isCompleted = isDayCompleted(day);
                                const isCurrentDay = isToday(day);

                                let buttonClasses = "p-2 rounded-lg transition-colors";

                                if (isDisabled) {
                                    buttonClasses += " bg-gray-800 text-gray-600 cursor-not-allowed";
                                } else if (isSelected) {
                                    buttonClasses += " bg-indigo-500 text-white font-bold";
                                } else if (isCompleted) {
                                    buttonClasses += " bg-green-600 text-white hover:bg-green-500";
                                } else if (isCurrentDay) {
                                    buttonClasses += " bg-yellow-500 text-gray-900 font-bold hover:bg-yellow-400";
                                } else {
                                    buttonClasses += " bg-gray-700 text-gray-300 hover:bg-gray-600";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(day)}
                                        disabled={isDisabled}
                                        className={buttonClasses}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Weight Input Fields for Selected Day */}
                        <div className="mt-8">
                            <h3 className="text-2xl font-semibold mb-4 text-center text-indigo-300">
                                Tracking for {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                            </h3>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <div className="w-full">
                                    <label htmlFor="morning-weight" className="block text-sm font-medium text-gray-400">
                                        Morning Weight (lbs)
                                    </label>
                                    <input
                                        type="number"
                                        id="morning-weight"
                                        value={dayData.morning}
                                        onChange={(e) => handleWeightChange(e, 'morning')}
                                        placeholder="e.g., 180.5"
                                        className="mt-1 block w-full p-3 rounded-lg border focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 bg-gray-700 border-gray-600"
                                    />
                                </div>
                                <div className="w-full">
                                    <label htmlFor="evening-weight" className="block text-sm font-medium text-gray-400">
                                        Evening Weight (lbs)
                                    </label>
                                    <input
                                        type="number"
                                        id="evening-weight"
                                        value={dayData.evening}
                                        onChange={(e) => handleWeightChange(e, 'evening')}
                                        placeholder="e.g., 181.2"
                                        className="mt-1 block w-full p-3 rounded-lg border focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 bg-gray-700 border-gray-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Weekly Averages View */
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold mb-4 text-center text-indigo-400">Weekly Averages</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Week</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Morning Avg (lbs)</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Change</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Evening Avg (lbs)</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Change</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {calculateWeeklyAverages().reverse().map((week, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-200">
                                                {format(week.weekStart, 'MMM d')} - {format(week.weekEnd, 'MMM d')}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">
                                                {week.morningAverage.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">
                                                {week.morningDiff !== undefined ? (
                                                    <span className={`${week.morningDiff > 0 ? 'text-red-400' : week.morningDiff < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                                        {week.morningDiff > 0 ? '+' : ''}{week.morningDiff.toFixed(2)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">
                                                {week.eveningAverage.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">
                                                {week.eveningDiff !== undefined ? (
                                                    <span className={`${week.eveningDiff > 0 ? 'text-red-400' : week.eveningDiff < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                                        {week.eveningDiff > 0 ? '+' : ''}{week.eveningDiff.toFixed(2)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
