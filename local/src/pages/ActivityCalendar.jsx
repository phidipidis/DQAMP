import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CalendarDays, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, addWeeks, subWeeks, isSameMonth,
  isSameDay, isWithinInterval, parseISO, isValid
} from 'date-fns';

const DIVISION_COLORS = {
  'CID':  { bg: 'bg-red-500',    light: 'bg-red-100 text-red-800',      dot: 'bg-red-500' },
  'SGOD': { bg: 'bg-blue-500',   light: 'bg-blue-100 text-blue-800',    dot: 'bg-blue-500' },
  'OSDS': { bg: 'bg-yellow-500', light: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
};

const getColor = (division) => DIVISION_COLORS[division] || { bg: 'bg-slate-500', light: 'bg-slate-100 text-slate-800', dot: 'bg-slate-500' };

const parseDate = (d) => {
  if (!d) return null;
  const parsed = parseISO(d);
  return isValid(parsed) ? parsed : null;
};

export default function ActivityCalendar() {
  const [view, setView] = useState('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [selectedActivity, setSelectedActivity] = useState(null);

  const { data: activities = [] } = useQuery({
    queryKey: ['activities-calendar'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const divisions = useMemo(() =>
    ['All', ...Object.keys(DIVISION_COLORS)], []);

  const filteredActivities = useMemo(() =>
    activities.filter(a =>
      (divisionFilter === 'All' || a.Functional_Division === divisionFilter) &&
      parseDate(a.Planned_Start_Date)
    ), [activities, divisionFilter]);

  // Get activities for a specific day
  const getActivitiesForDay = (day) =>
    filteredActivities.filter(a => {
      const start = parseDate(a.Planned_Start_Date);
      const end = parseDate(a.Date_Conducted) || start;
      if (!start) return false;
      return isWithinInterval(day, { start, end }) || isSameDay(day, start);
    });

  // --- MONTHLY VIEW ---
  const renderMonthly = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let d = calStart;
    while (d <= calEnd) {
      days.push(d);
      d = addDays(d, 1);
    }

    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayActivities = getActivitiesForDay(day);
            const isToday = isSameDay(day, new Date());
            const inMonth = isSameMonth(day, currentDate);
            return (
              <div
                key={idx}
                className={`min-h-[110px] border-r border-b p-1.5 ${!inMonth ? 'bg-slate-50' : 'bg-white'}`}
              >
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday ? 'bg-[#003DA5] text-white' : inMonth ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayActivities.slice(0, 3).map(a => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedActivity(a)}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer truncate text-white ${getColor(a.Functional_Division).bg} hover:opacity-80`}
                      title={a.Activity_Title}
                    >
                      {a.Activity_Title}
                    </div>
                  ))}
                  {dayActivities.length > 3 && (
                    <div className="text-[10px] text-slate-400 pl-1">+{dayActivities.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- WEEKLY VIEW ---
  const renderWeekly = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div>
        <div className="grid grid-cols-7 border-b">
          {days.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className="py-3 text-center border-r">
                <div className="text-xs text-slate-500 uppercase">{format(day, 'EEE')}</div>
                <div className={`text-lg font-semibold mx-auto w-9 h-9 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-[#003DA5] text-white' : 'text-slate-700'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[500px]">
          {days.map((day, i) => {
            const dayActivities = getActivitiesForDay(day);
            return (
              <div key={i} className="border-r p-2 space-y-1.5">
                {dayActivities.length === 0 ? (
                  <div className="text-xs text-slate-300 text-center mt-8">—</div>
                ) : (
                  dayActivities.map(a => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedActivity(a)}
                      className={`text-xs font-medium px-2 py-1.5 rounded cursor-pointer text-white ${getColor(a.Functional_Division).bg} hover:opacity-80`}
                    >
                      <div className="truncate">{a.Activity_Title}</div>
                      {a.Venue && <div className="text-white/70 truncate text-[10px]">{a.Venue}</div>}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const navPrev = () => view === 'monthly' ? setCurrentDate(subMonths(currentDate, 1)) : setCurrentDate(subWeeks(currentDate, 1));
  const navNext = () => view === 'monthly' ? setCurrentDate(addMonths(currentDate, 1)) : setCurrentDate(addWeeks(currentDate, 1));
  const navToday = () => setCurrentDate(new Date());

  const headerLabel = view === 'monthly'
    ? format(currentDate, 'MMMM yyyy')
    : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}`;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Activity Calendar</h1>
        <p className="text-slate-500 text-sm">View scheduled activities by month or week</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'monthly' ? 'bg-[#003DA5] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'weekly' ? 'bg-[#003DA5] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Weekly
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={navToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={navNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        <span className="text-base font-semibold text-slate-700 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#003DA5]" />{headerLabel}
        </span>

        {/* Division filter */}
        <div className="ml-auto">
          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map(d => (
                <SelectItem key={d} value={d}>{d === 'All' ? 'All Divisions' : d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {view === 'monthly' ? renderMonthly() : renderWeekly()}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(DIVISION_COLORS).map(([division, colors]) => (
          <span key={division} className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${colors.light}`}>
            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
            {division}
          </span>
        ))}
      </div>

      {/* Detail popover */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedActivity(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              onClick={() => setSelectedActivity(null)}
            >
              <X className="h-5 w-5" />
            </button>

            <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full mb-3 ${getColor(selectedActivity.Functional_Division).light}`}>
              <span className={`w-2 h-2 rounded-full ${getColor(selectedActivity.Functional_Division).dot}`} />
              {selectedActivity.Functional_Division || 'Unknown Division'}
            </div>

            <h2 className="text-base font-bold text-slate-800 mb-4 leading-snug">
              {selectedActivity.Activity_Title}
            </h2>

            <div className="space-y-2 text-sm">
              {selectedActivity.Venue && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Venue</span>
                  <span className="font-medium text-slate-700 text-right max-w-[60%]">{selectedActivity.Venue}</span>
                </div>
              )}
              {selectedActivity.Planned_Start_Date && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Date</span>
                  <span className="font-medium text-slate-700">{selectedActivity.Planned_Start_Date}</span>
                </div>
              )}
              {selectedActivity.Date_Conducted && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual End Date</span>
                  <span className="font-medium text-slate-700">{selectedActivity.Date_Conducted}</span>
                </div>
              )}
              {selectedActivity.Status && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge className="text-xs">{selectedActivity.Status}</Badge>
                </div>
              )}
              {selectedActivity.has_partnership && selectedActivity.partner_agency_name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Partner Agency</span>
                  <span className="font-medium text-slate-700 text-right max-w-[60%]">{selectedActivity.partner_agency_name}</span>
                </div>
              )}
            </div>

            <div className="mt-5">
              <Link
                to={`/ActivityForm?id=${selectedActivity.id}`}
                onClick={() => setSelectedActivity(null)}
              >
                <Button className="w-full bg-[#003DA5] hover:bg-[#003DA5]/90 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Edit Activity
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}