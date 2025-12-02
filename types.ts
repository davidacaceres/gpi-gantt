export interface MSProjectTask {
  UID: string;
  ID: string;
  Name: string;
  Type: string; // 0=Fixed Units, 1=Fixed Duration, 2=Fixed Work
  Start: string;
  Finish: string;
  Duration: string; // PT8H0M0S format
  Manual: string; // "0" or "1"
  Summary: string; // "0" or "1"
  Milestone: string; // "0" or "1"
  PercentComplete: string;
  OutlineNumber: string; // "1.1.2"
  OutlineLevel: string;
  Notes?: string;
  // Computed properties for UI
  parsedStart?: Date;
  parsedFinish?: Date;
  durationDays?: number;
}

export interface MSProject {
  Name: string;
  Title: string;
  StartDate: string;
  FinishDate: string;
  Tasks: MSProjectTask[];
}
