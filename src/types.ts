/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  'Employee ID': string;
  'Employee': string;
  'Hình': string;
  'Position': string;
  'Team': string;
  'Report to': string;
  'Loại nhân sự': string;
  'Ngày vào làm': string;
  'Trạng thái': string;
  'SĐT': string;
  'Email': string;
  'Ngày Sinh': string;
}

export interface EmployeePosition {
  'Employee_Position_ID': string;
  'Employee ID': string;
  'Employee': string;
  'Position': string;
}

export interface Position {
  'Team': string;
  'Position': string;
  'Cấp bậc': string;
}

export interface Team {
  'Team': string;
  'Parent team': string;
  'Level': string;
  'Manager': string;
}

export type TableType = 'employee' | 'employeePosition' | 'position' | 'team' | 'orgChart' | 'positionProcess' | 'department' | 'reportingLines' | 'workflows' | 'dashboard' | 'overview' | 'projectInfo';
