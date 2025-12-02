import React, { useMemo, useState } from 'react';
import { MSProject, MSProjectTask } from '../types';
import { getProjectDateRange, formatDate } from '../utils/parser';
import { ChevronRight, ChevronDown, Calendar, Flag, List } from 'lucide-react';

interface GanttChartProps {
  project: MSProject;
}

const PIXELS_PER_DAY = 34;
const HEADER_HEIGHT = 48;
const ROW_HEIGHT = 40;

const GanttChart: React.FC<GanttChartProps> = ({ project }) => {
  const [timelineMode, setTimelineMode] = useState<'day' | 'week'>('week');
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());

  // Calculate timeline dimensions
  const { start: projectStart, end: projectEnd } = useMemo(() => getProjectDateRange(project.Tasks), [project]);
  
  const totalDays = useMemo(() => {
    const diff = projectEnd.getTime() - projectStart.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [projectStart, projectEnd]);

  // Generate timeline headers
  const timelineHeaders = useMemo(() => {
    const headers = [];
    const currentDate = new Date(projectStart);
    
    // Adjust start to monday if viewing weeks
    if (timelineMode === 'week') {
       // logic to align to monday could go here
    }

    for (let i = 0; i < totalDays; i++) {
      headers.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return headers;
  }, [projectStart, totalDays, timelineMode]);

  // Helper to get position relative to start
  const getPosition = (date?: Date) => {
    if (!date) return 0;
    const diff = date.getTime() - projectStart.getTime();
    return (diff / (1000 * 60 * 60 * 24)) * PIXELS_PER_DAY;
  };

  const toggleCollapse = (uid: string) => {
    const newCollapsed = new Set(collapsedTasks);
    if (newCollapsed.has(uid)) {
      newCollapsed.delete(uid);
    } else {
      newCollapsed.add(uid);
    }
    setCollapsedTasks(newCollapsed);
  };

  // Filter tasks based on collapsed state
  const visibleTasks = useMemo(() => {
    const visible: MSProjectTask[] = [];
    let hiddenLevel = -1;

    project.Tasks.forEach(task => {
        const level = parseInt(task.OutlineLevel);
        
        // If we are currently hiding children because a parent is collapsed
        if (hiddenLevel > -1) {
            if (level > hiddenLevel) {
                return; // Skip this task, it's a child of a collapsed parent
            } else {
                hiddenLevel = -1; // We are back to a level equal or higher, stop hiding
            }
        }

        visible.push(task);

        // If this task is collapsed, start hiding subsequent tasks with higher OutlineLevel
        if (collapsedTasks.has(task.UID)) {
            hiddenLevel = level;
        }
    });
    return visible;
  }, [project.Tasks, collapsedTasks]);

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <List className="w-5 h-5" />
            {project.Title || project.Name}
        </h2>
        <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Start: {formatDate(new Date(project.StartDate))}
            </span>
            <span className="flex items-center gap-1">
                <Flag className="w-4 h-4" />
                Finish: {formatDate(new Date(project.FinishDate))}
            </span>
        </div>
      </div>

      {/* Split Pane: Task List | Timeline */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Pane: Task Table */}
        <div className="w-[450px] min-w-[300px] flex-shrink-0 border-r bg-white overflow-y-auto overflow-x-hidden flex flex-col z-10 shadow-lg">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gray-100 border-b flex font-semibold text-xs text-gray-600 h-[48px] items-center">
            <div className="w-12 text-center border-r shrink-0">ID</div>
            <div className="flex-1 px-4 border-r">Task Name</div>
            <div className="w-24 px-2 border-r text-center">Start</div>
            <div className="w-24 px-2 text-center">Finish</div>
          </div>
          
          {/* Body */}
          <div className="flex-1">
            {visibleTasks.map((task) => {
              const isSummary = task.Summary === "1";
              const level = parseInt(task.OutlineLevel);
              const paddingLeft = (level - 1) * 20 + 8;
              const isCollapsed = collapsedTasks.has(task.UID);

              return (
                <div 
                  key={task.UID} 
                  className={`flex items-center border-b text-sm h-[40px] hover:bg-blue-50 transition-colors ${isSummary ? 'bg-gray-50 font-medium' : ''}`}
                >
                    <div className="w-12 text-center text-gray-400 text-xs shrink-0">{task.ID}</div>
                    <div className="flex-1 pr-2 flex items-center border-r h-full overflow-hidden text-ellipsis whitespace-nowrap" style={{ paddingLeft }}>
                        {isSummary && (
                            <button onClick={() => toggleCollapse(task.UID)} className="mr-1 hover:text-blue-600">
                                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            </button>
                        )}
                        <span className="truncate" title={task.Name}>{task.Name}</span>
                    </div>
                    <div className="w-24 px-2 border-r text-xs text-right h-full flex items-center justify-end text-gray-500">
                        {formatDate(task.parsedStart)}
                    </div>
                    <div className="w-24 px-2 text-xs text-right h-full flex items-center justify-end text-gray-500">
                        {formatDate(task.parsedFinish)}
                    </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Timeline */}
        <div className="flex-1 overflow-auto gantt-scroll bg-gray-50 relative">
          <div style={{ width: totalDays * PIXELS_PER_DAY, position: 'relative' }}>
            
            {/* Timeline Header */}
            <div className="sticky top-0 z-10 bg-white border-b h-[48px] flex">
                {timelineHeaders.map((date, i) => {
                    const isMonthStart = date.getDate() === 1 || i === 0;
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    
                    return (
                        <div key={i} className="relative h-full border-r flex flex-col justify-end pb-1 items-center select-none" style={{ width: PIXELS_PER_DAY }}>
                            {isMonthStart && (
                                <span className="absolute top-1 left-1 text-[10px] font-bold text-gray-700 whitespace-nowrap">
                                    {date.toLocaleString('default', { month: 'short', year: '2-digit' })}
                                </span>
                            )}
                            <span className={`text-[10px] ${isWeekend ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                                {date.getDate()}
                            </span>
                            <span className="text-[9px] text-gray-300">
                                {date.toLocaleString('default', { weekday: 'narrow' })}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Grid Background */}
            <div className="absolute top-[48px] bottom-0 left-0 right-0 flex pointer-events-none">
                 {timelineHeaders.map((date, i) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    return (
                        <div 
                            key={`grid-${i}`} 
                            className={`border-r h-full ${isWeekend ? 'bg-slate-50' : 'bg-transparent'}`}
                            style={{ width: PIXELS_PER_DAY }} 
                        />
                    );
                 })}
            </div>

            {/* Bars */}
            <div className="relative pt-[0px]">
                {visibleTasks.map((task) => {
                    const isSummary = task.Summary === "1";
                    const isMilestone = task.Milestone === "1";
                    const left = getPosition(task.parsedStart);
                    const width = Math.max(isMilestone ? 14 : PIXELS_PER_DAY / 4, getPosition(task.parsedFinish) - left);
                    
                    let barColor = "bg-blue-500";
                    if (isSummary) barColor = "bg-slate-800";
                    if (task.PercentComplete === "100") barColor = "bg-green-500";
                    if (isMilestone) barColor = "bg-amber-500";

                    return (
                        <div key={`bar-${task.UID}`} className="h-[40px] relative w-full border-b border-transparent hover:bg-black/5 transition-colors group">
                            
                            {/* The Bar */}
                            <div 
                                className={`absolute top-1/2 -translate-y-1/2 rounded-sm shadow-sm ${isMilestone ? 'rotate-45' : ''} ${barColor}`}
                                style={{
                                    left,
                                    width: isMilestone ? 14 : width,
                                    height: isMilestone ? 14 : (isSummary ? 12 : 20),
                                    opacity: 0.9,
                                }}
                            >
                                {/* Progress Bar Overlay */}
                                {!isMilestone && !isSummary && parseInt(task.PercentComplete) > 0 && (
                                    <div 
                                        className="h-full bg-white/30 rounded-l-sm" 
                                        style={{ width: `${task.PercentComplete}%` }}
                                    />
                                )}

                                {/* End Caps for Summary */}
                                {isSummary && (
                                    <>
                                     <div className="absolute left-0 bottom-[-4px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
                                     <div className="absolute right-0 bottom-[-4px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
                                    </>
                                )}
                            </div>
                            
                            {/* Label on Hover/Always */}
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-600 whitespace-nowrap ml-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 px-1 rounded"
                                style={{ left: left + (isMilestone ? 20 : width) }}
                            >
                                {task.Name} ({task.PercentComplete}%)
                            </div>

                             {/* Dependency Lines - Placeholder simplified representation */}
                             {/* Drawing actual SVG connectors requires calculating exact coordinates relative to the container, omitted for brevity/stability in this iteration */}

                        </div>
                    );
                })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
