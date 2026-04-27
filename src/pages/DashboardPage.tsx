import React from 'react';
import DataTable from '../components/tables/DataTable';
import { TableType } from '../types';

interface DashboardPageProps {
  activeTable: TableType;
  data: any[];
  loading: boolean;
  error: string | null;
  columns: any[];
  onRowClick: (row: any) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
  activeTable,
  data,
  loading,
  error,
  columns,
  onRowClick
}) => {
  return (
    <DataTable
      key={activeTable}
      data={data}
      columns={columns}
      isLoading={loading}
      error={error}
      onRowClick={onRowClick}
      searchPlaceholder={`Search ${activeTable.replace(/([A-Z])/g, ' $1').toLowerCase()} records...`}
    />
  );
};

export default DashboardPage;
