import { MSProject, MSProjectTask } from "../types";

export const parseMSProjectXML = (xmlContent: string): MSProject => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

  const getText = (parent: Element, tag: string): string => {
    const el = parent.getElementsByTagName(tag)[0];
    return el ? el.textContent || "" : "";
  };

  // Project Level Info
  const Name = getText(xmlDoc.documentElement, "Name") || getText(xmlDoc.documentElement, "Title") || "Untitled Project";
  const Title = getText(xmlDoc.documentElement, "Title");
  const StartDate = getText(xmlDoc.documentElement, "StartDate");
  const FinishDate = getText(xmlDoc.documentElement, "FinishDate");

  // Tasks
  const taskNodes = xmlDoc.getElementsByTagName("Task");
  const tasks: MSProjectTask[] = [];

  for (let i = 0; i < taskNodes.length; i++) {
    const node = taskNodes[i];
    const uid = getText(node, "UID");
    const name = getText(node, "Name");
    
    // Skip empty or utility tasks
    if (!uid || !name) continue;

    const task: MSProjectTask = {
      UID: uid,
      ID: getText(node, "ID"),
      Name: name,
      Type: getText(node, "Type"),
      Start: getText(node, "Start"),
      Finish: getText(node, "Finish"),
      Duration: getText(node, "Duration"),
      Manual: getText(node, "Manual"),
      Summary: getText(node, "Summary"),
      Milestone: getText(node, "Milestone"),
      PercentComplete: getText(node, "PercentComplete"),
      OutlineNumber: getText(node, "OutlineNumber"),
      OutlineLevel: getText(node, "OutlineLevel"),
      Notes: getText(node, "Notes"),
    };

    // Calculate Dates for easier usage
    if (task.Start) task.parsedStart = new Date(task.Start);
    if (task.Finish) task.parsedFinish = new Date(task.Finish);
    
    // Approximate duration in days based on timestamps, fallback to parsing PT string if needed
    if (task.parsedStart && task.parsedFinish) {
        const diffTime = Math.abs(task.parsedFinish.getTime() - task.parsedStart.getTime());
        task.durationDays = diffTime / (1000 * 60 * 60 * 24); 
    } else {
        task.durationDays = 0;
    }

    tasks.push(task);
  }

  // Sort by ID to ensure correct visual order
  tasks.sort((a, b) => parseInt(a.ID) - parseInt(b.ID));

  return {
    Name,
    Title,
    StartDate,
    FinishDate,
    Tasks: tasks,
  };
};

export const formatDate = (date?: Date): string => {
  if (!date) return "-";
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export const getProjectDateRange = (tasks: MSProjectTask[]) => {
  let min = new Date(8640000000000000);
  let max = new Date(-8640000000000000);

  let hasData = false;
  tasks.forEach(t => {
    if (t.parsedStart) {
      if (t.parsedStart < min) min = t.parsedStart;
      hasData = true;
    }
    if (t.parsedFinish) {
      if (t.parsedFinish > max) max = t.parsedFinish;
      hasData = true;
    }
  });

  if (!hasData) return { start: new Date(), end: new Date() };

  // Add buffer
  min = new Date(min.getTime() - (3 * 24 * 60 * 60 * 1000));
  max = new Date(max.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  return { start: min, end: max };
};
