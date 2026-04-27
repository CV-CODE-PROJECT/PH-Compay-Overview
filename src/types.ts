export interface Employee {
  'Employee ID': string;
  Employee: string;
  Image: string;
  'Image Link': string;
  Position: string;
  Team: string;
  'Report to': string;
  'Employee Type': string;
  'Start Date': string;
  Status: string;
  Phone: string;
  Email: string;
  'Birth Date': string;
}

export interface EmployeePosition {
  Employee_Position_ID: string;
  'Employee ID': string;
  Employee: string;
  Position: string;
}

export interface Position {
  Team: string;
  Position: string;
  Level: string;
}

export interface Team {
  Team: string;
  'Parent team': string;
  Level: string;
  Manager: string;
}

export interface ProjectInfoRow {
  Item: string;
  Detail: string;
}

export type TableType =
  | 'employee'
  | 'employeePosition'
  | 'position'
  | 'team'
  | 'orgChart'
  | 'positionProcess'
  | 'department'
  | 'reportingLines'
  | 'workflows'
  | 'dashboard'
  | 'overview'
  | 'projectInfo';
