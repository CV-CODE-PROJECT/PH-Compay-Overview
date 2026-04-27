/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SHEET_ID = '14NM9PVywNKksD6waxWj2adzvHIkjHOKI_HCYFFJgAeg';

// GIDs for each sheet - these might need adjustment based on the actual sheet
export const GIDS = {
  employee: '0', // Assuming first sheet
  employeePosition: '74991567', // Provided in URL
  position: '1135402683', // Placeholder
  team: '1764654929', // Placeholder
};

export const getCsvUrl = (gid: string) => 
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

export const getSheetUrl = (gid: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${gid}`;
